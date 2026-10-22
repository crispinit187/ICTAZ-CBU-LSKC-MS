-- ICTAZ CBU LSKC Management System
-- Migration 0001: what the front end needs before anyone can sign in.
-- FOR REVIEW BY PRINCE. Not applied by the front end developer.
--
-- Adds:
--   1. A member record (status Pending) and a Member role row whenever someone registers with email.
--   2. Read access so a signed-in person can see their own record, and everyone can read the Terms.
--   3. my_context(): one call that tells the front end who the person is, their roles, their
--      permissions, and what they must do before continuing (change password, accept Terms).
--   4. accept_terms(): records Terms acceptance with version and time (TC-03).
--   5. A trigger that clears must_change_password only when the password really changed (AU-23).
--   6. Version 1 of the Terms, Privacy Notice and staff confidentiality statement (sample wording).
--   7. Fixes for the mutable search_path warnings.
--
-- Not changed on purpose: anon-executable SECURITY DEFINER helpers (has_permission, is_active,
-- ok_to_act). Several policies are TO public and call them, so revoking from anon would break
-- reads such as programs. Revisit by scoping those policies TO authenticated first.

-- ---------------------------------------------------------------- 1. new registrations
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  -- Google sign-in must never create or activate an account (GS-02). Only email sign-ups
  -- and accounts created by an Administrator through Supabase Auth get a member record.
  if coalesce(new.raw_app_meta_data ->> 'provider', 'email') <> 'email' then
    return new;
  end if;

  insert into public.members (
    id, name, student_number, email, email_verified_at, phone,
    program_raw, year_of_study, semester_of_study, status
  ) values (
    new.id,
    coalesce(nullif(trim(meta ->> 'name'), ''), split_part(new.email, '@', 1)),
    nullif(meta ->> 'student_number', ''),
    new.email,
    new.email_confirmed_at,
    nullif(meta ->> 'phone', ''),
    nullif(meta ->> 'program', ''),
    nullif(meta ->> 'year_of_study', '')::smallint,
    nullif(meta ->> 'semester_of_study', '')::smallint,
    'Pending'
  );

  insert into public.user_roles (user_id, role_id)
  select new.id, r.id from public.roles r where r.name = 'Member';

  insert into public.auth_identities (member_id, method, provider_email)
  values (new.id, 'password', new.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the email-confirmed time on the member record in step with Supabase Auth (AU-02).
create or replace function public.sync_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is distinct from new.email_confirmed_at then
    update public.members
       set email_verified_at = new.email_confirmed_at
     where id = new.id and email_verified_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_email_confirmed on auth.users;
create trigger on_auth_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.sync_email_confirmed();

-- ---------------------------------------------------------------- 5. password change clears the flag
-- The flag is cleared only when the stored password hash changes, so the front end cannot
-- skip the change by calling an endpoint. Administrator resets must set the flag AFTER
-- they change the password (or this trigger will clear it again).
create or replace function public.clear_must_change_on_password_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    update public.members
       set must_change_password = false
     where id = new.id and must_change_password;
    if found then
      insert into public.audit_log (actor_id, action, module, target_type, target_id)
      values (new.id, 'password.changed_first_sign_in', 'core', 'member', new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_password_changed on auth.users;
create trigger on_auth_password_changed
  after update of encrypted_password on auth.users
  for each row execute function public.clear_must_change_on_password_change();

-- ---------------------------------------------------------------- 2. read access
drop policy if exists members_read_own on public.members;
create policy members_read_own on public.members
  for select to authenticated
  using (id = auth.uid());

drop policy if exists members_read_staff on public.members;
create policy members_read_staff on public.members
  for select to authenticated
  using (has_permission('member.view') and ok_to_act());

-- Members may edit only their own name, phone, program and year (AU-36). Student number,
-- status, email and the flags are changed through Administrator functions.
revoke update on public.members from authenticated;
grant update (name, phone, program_raw, year_of_study, semester_of_study) on public.members to authenticated;

drop policy if exists members_update_own on public.members;
create policy members_update_own on public.members
  for update to authenticated
  using (id = auth.uid() and ok_to_act())
  with check (id = auth.uid());

drop policy if exists terms_versions_read on public.terms_versions;
create policy terms_versions_read on public.terms_versions
  for select to anon, authenticated
  using (true);

drop policy if exists terms_versions_publish on public.terms_versions;
create policy terms_versions_publish on public.terms_versions
  for insert to authenticated
  with check (has_permission('terms.publish') and ok_to_act());

drop policy if exists terms_acceptances_read_own on public.terms_acceptances;
create policy terms_acceptances_read_own on public.terms_acceptances
  for select to authenticated
  using (member_id = auth.uid());

drop policy if exists settings_manage on public.settings;
create policy settings_manage on public.settings
  for all to authenticated
  using (has_permission('settings.manage') and ok_to_act())
  with check (has_permission('settings.manage') and ok_to_act());

drop policy if exists email_templates_manage on public.email_templates;
create policy email_templates_manage on public.email_templates
  for all to authenticated
  using (has_permission('email_templates.manage') and ok_to_act())
  with check (has_permission('email_templates.manage') and ok_to_act());

-- attendance_qr_secrets, email_queue and rate_limit_counters deliberately keep NO policy:
-- only server code with the service key may touch them.

-- ---------------------------------------------------------------- 3. my_context()
create or replace function public.my_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  m public.members%rowtype;
  v_staff boolean;
  v_roles jsonb;
  v_perms jsonb;
  v_docs jsonb;
begin
  select * into m from public.members where id = auth.uid();
  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(r.name order by r.name), '[]'::jsonb)
    into v_roles
    from public.user_roles ur join public.roles r on r.id = ur.role_id
   where ur.user_id = m.id and ur.is_active;

  -- Permissions count only while the account is Active.
  select coalesce(jsonb_agg(distinct p.code), '[]'::jsonb)
    into v_perms
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
   where ur.user_id = m.id and ur.is_active and m.status = 'Active';

  v_staff := exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
     where ur.user_id = m.id and ur.is_active and r.name <> 'Member'
  );

  select coalesce(jsonb_agg(jsonb_build_object('id', v.id, 'doc_type', v.doc_type, 'version', v.version)), '[]'::jsonb)
    into v_docs
    from (
      select distinct on (t.doc_type) t.id, t.doc_type, t.version
        from public.terms_versions t
       where t.doc_type in ('terms', 'privacy')
          or (v_staff and t.doc_type = 'staff_confidentiality')
       order by t.doc_type, t.published_at desc
    ) v
   where not exists (
     select 1 from public.terms_acceptances a
      where a.member_id = m.id and a.terms_version_id = v.id
   );

  return jsonb_build_object(
    'id', m.id,
    'name', m.name,
    'student_number', m.student_number,
    'email', m.email,
    'status', m.status,
    'status_reason', m.status_reason,
    'must_change_password', m.must_change_password,
    'is_bootstrap', m.is_bootstrap,
    'email_verified', m.email_verified_at is not null,
    'roles', v_roles,
    'permissions', v_perms,
    'pending_docs', v_docs
  );
end;
$$;

revoke all on function public.my_context() from public, anon;
grant execute on function public.my_context() to authenticated;

-- ---------------------------------------------------------------- 4. accept_terms()
create or replace function public.accept_terms(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_need uuid[];
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select array_agg((d ->> 'id')::uuid)
    into v_need
    from jsonb_array_elements(public.my_context() -> 'pending_docs') d;

  if v_need is null then
    return;
  end if;

  if not (v_need <@ coalesce(p_ids, '{}'::uuid[])) then
    raise exception 'every pending document must be accepted' using errcode = '22023';
  end if;

  insert into public.terms_acceptances (member_id, terms_version_id)
  select auth.uid(), unnest(v_need);

  insert into public.audit_log (actor_id, action, module, target_type, target_id, after)
  values (auth.uid(), 'terms.accepted', 'core', 'member', auth.uid(), jsonb_build_object('terms_version_ids', v_need));
end;
$$;

revoke all on function public.accept_terms(uuid[]) from public, anon;
grant execute on function public.accept_terms(uuid[]) to authenticated;

-- ---------------------------------------------------------------- 6. Terms, version 1 (sample wording)
insert into public.terms_versions (doc_type, version, body)
select 'terms', '1',
       'Sample Terms of Use for the design phase. Use your own account only. Do not share your password or the attendance QR code, and do not mark another person present. Accounts that break these rules may be suspended. Chapter leadership will replace this wording before launch.'
 where not exists (select 1 from public.terms_versions where doc_type = 'terms' and version = '1');

insert into public.terms_versions (doc_type, version, body)
select 'privacy', '1',
       'Sample Privacy Notice for the design phase. We collect your name, student number, email, programme, year of study, optional phone number and attendance records to run chapter membership and attendance. Members and Registrars see limited details. Reviewers and Administrators see full details. Executives appear publicly only with their consent. Chapter leadership will replace this wording before launch.'
 where not exists (select 1 from public.terms_versions where doc_type = 'privacy' and version = '1');

insert into public.terms_versions (doc_type, version, body)
select 'staff_confidentiality', '1',
       'Sample staff confidentiality statement for the design phase. I will use member data only for chapter business and will not share it. Chapter leadership will replace this wording before launch.'
 where not exists (select 1 from public.terms_versions where doc_type = 'staff_confidentiality' and version = '1');

-- ---------------------------------------------------------------- 7. search_path fixes
alter function public.audit_log_immutable()        set search_path = public;
alter function public.cleanup_role_on_exec_end()   set search_path = public;
alter function public.consent_withdrawn()          set search_path = public;
alter function public.enforce_public_display()     set search_path = public;
alter function public.enforce_role_requires_exec() set search_path = public;
alter function public.enforce_single_holder()      set search_path = public;
alter function public.is_super_admin()             set search_path = public;
alter function public.programs_no_delete()         set search_path = public;
alter function public.protect_last_super_admin()   set search_path = public;
alter function public.touch_updated_at()           set search_path = public;
