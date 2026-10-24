-- Migration 0014: delete an account but keep the records.
-- Run AFTER 0013. Safe to run again.
--
-- A member can ask for their account to be deleted. A Super Admin approves or declines.
-- A Super Admin can also delete a Deactivated account directly, with a reason.
-- Deleting erases the person (sign-in, name, email, student number, phone, programme, picture)
-- and keeps what the system needs: attendance records, session totals, terms acceptances, the audit log
-- and role history. Old rows show "Deleted member". The same student number and email can register again.
--
-- The Edge Function admin-delete-account removes the sign-in and the picture files after this runs.

-- ---------------------------------------------------------------- members
alter table public.members add column if not exists erased_at timestamptz;

-- The members row has to outlive the sign-in, so it no longer follows the auth user when that is removed.
alter table public.members drop constraint if exists members_id_fkey;

alter table public.members drop constraint if exists student_number_required;
alter table public.members add constraint student_number_required
  check (is_bootstrap or erased_at is not null or student_number is not null);

-- ---------------------------------------------------------------- permission
insert into public.permissions (code, description)
select 'member.delete', 'Approve or decline account deletion requests and delete accounts'
 where not exists (select 1 from public.permissions where code = 'member.delete');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
  from public.roles r
  join public.permissions p on p.code = 'member.delete'
 where r.name = 'Super Admin'
   and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id);

-- ---------------------------------------------------------------- requests
create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id),
  reason text,
  status text not null default 'Pending' check (status in ('Pending', 'Withdrawn', 'Approved', 'Declined')),
  decided_by uuid references public.members (id),
  decided_reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index if not exists one_pending_deletion on public.deletion_requests (member_id) where status = 'Pending';
alter table public.deletion_requests enable row level security;
revoke all on public.deletion_requests from anon, authenticated;

-- ---------------------------------------------------------------- e-mail wording (editable on the Settings page)
insert into public.email_templates (code, subject, body, sender_name, allowed_placeholders)
select t.code, t.subject, t.body, 'ICTAZ CBU LSKC', t.ph
  from (values
    ('account_deleted', 'Your account was deleted', 'Hello {{name}}, your account has been deleted and your personal details were erased. Attendance totals are kept without your name. You are welcome to register again at any time.', array['name']),
    ('deletion_declined', 'About your deletion request', 'Hello {{name}}, your request to delete your account was not approved. Reason: {{reason}}. Your account stays as it is.', array['name','reason'])
  ) as t(code, subject, body, ph)
 where not exists (select 1 from public.email_templates e where e.code = t.code);

-- ---------------------------------------------------------------- a member asks
create or replace function public.request_account_deletion(p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.members%rowtype;
  v_sa smallint;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  select * into m from public.members where id = auth.uid() for update;
  if not found or m.erased_at is not null or m.status <> 'Active' then
    raise exception 'only an Active member can ask for deletion' using errcode = '42501';
  end if;
  select id into v_sa from public.roles where name = 'Super Admin';
  if exists (select 1 from public.user_roles where user_id = m.id and role_id = v_sa and is_active) then
    raise exception 'A Super Admin cannot ask for deletion. Ask another Super Admin to remove your Super Admin role first.' using errcode = '23514';
  end if;
  if exists (select 1 from public.deletion_requests where member_id = m.id and status = 'Pending') then
    raise exception 'you already have a request waiting' using errcode = '23505';
  end if;
  insert into public.deletion_requests (member_id, reason) values (m.id, nullif(btrim(coalesce(p_reason, '')), ''));
  perform public._audit('member.deletion_requested', 'core', 'member', m.id, null, null, nullif(btrim(coalesce(p_reason, '')), ''));
end;
$$;

create or replace function public.withdraw_deletion_request()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  update public.deletion_requests set status = 'Withdrawn', decided_at = now()
   where member_id = auth.uid() and status = 'Pending'
  returning id into v_id;
  if v_id is null then
    raise exception 'you have no request waiting' using errcode = 'P0002';
  end if;
  perform public._audit('member.deletion_withdrawn', 'core', 'member', auth.uid(), null, null, null);
end;
$$;

create or replace function public.my_deletion_request()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(x) from (
    select status, reason, created_at, decided_reason, decided_at
      from public.deletion_requests
     where member_id = auth.uid() and status in ('Pending', 'Declined')
     order by created_at desc limit 1) x;
$$;

-- ---------------------------------------------------------------- a Super Admin decides
create or replace function public.list_deletion_requests()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._need('member.delete');
  return (select coalesce(jsonb_agg(x order by x.created_at), '[]'::jsonb) from (
    select r.id, r.member_id, m.name, m.student_number,
           coalesce(p.display_name, m.program_raw) as program, r.reason, r.created_at
      from public.deletion_requests r
      join public.members m on m.id = r.member_id
      left join public.programs p on p.id = m.program_id
     where r.status = 'Pending' and m.erased_at is null) x);
end;
$$;

create or replace function public.decline_deletion_request(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.deletion_requests%rowtype;
  m public.members%rowtype;
begin
  perform public._need('member.delete');
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  select * into r from public.deletion_requests where id = p_id and status = 'Pending' for update;
  if not found then
    raise exception 'that request is not waiting' using errcode = 'P0002';
  end if;
  select * into m from public.members where id = r.member_id;
  update public.deletion_requests
     set status = 'Declined', decided_by = auth.uid(), decided_reason = btrim(p_reason), decided_at = now()
   where id = p_id;
  perform public._audit('member.deletion_declined', 'core', 'member', r.member_id, null, null, btrim(p_reason));
  perform public._queue_email('deletion_declined', m.email::text, jsonb_build_object('name', m.name, 'reason', btrim(p_reason)));
end;
$$;

-- ---------------------------------------------------------------- the erase itself
-- Returns the picture paths so the Edge Function can remove the files. The Edge Function then removes the sign-in.
create or replace function public.erase_member(p_member uuid, p_reason text, p_request uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.members%rowtype;
  v_sa smallint;
  v_roles text[];
  v_paths jsonb;
begin
  perform public._need('member.delete');
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  if p_member = auth.uid() then
    raise exception 'you cannot delete your own account' using errcode = '42501';
  end if;
  select * into m from public.members where id = p_member for update;
  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  if m.erased_at is not null then
    return jsonb_build_object('paths', '[]'::jsonb, 'already', true);
  end if;
  if m.status in ('Pending', 'Rejected') then
    raise exception 'a registration is declined, not deleted' using errcode = '23514';
  end if;
  select id into v_sa from public.roles where name = 'Super Admin';
  if exists (select 1 from public.user_roles where user_id = p_member and role_id = v_sa and is_active) then
    raise exception 'Remove their Super Admin role first' using errcode = '23514';
  end if;
  if p_request is null then
    if m.status <> 'Deactivated' then
      raise exception 'Deactivate the account first' using errcode = '23514';
    end if;
  elsif not exists (select 1 from public.deletion_requests where id = p_request and member_id = p_member and status = 'Pending') then
    raise exception 'that request is not waiting' using errcode = 'P0002';
  end if;

  -- roles and executive profiles end first
  v_roles := public._role_names(p_member);
  update public.user_roles set is_active = false where user_id = p_member and is_active;
  if coalesce(array_length(v_roles, 1), 0) > 0 then
    insert into public.role_assignment_history (user_id, previous_role, new_role, actor_id, reason)
    values (p_member, array_to_string(v_roles, ' + '), 'Member', auth.uid(), 'Account deleted');
  end if;
  select coalesce(jsonb_agg(picture_path) filter (where picture_path is not null), '[]'::jsonb)
    into v_paths from public.executive_profiles where member_id = p_member;
  update public.executive_profiles
     set public_display = false, picture_path = null,
         end_date = coalesce(end_date, current_date), ended_reason = coalesce(ended_reason, 'Account deleted')
   where member_id = p_member;

  -- emails to this person: drop everything waiting or sent, then queue the one final notice
  delete from public.email_queue where lower(to_email::text) = lower(m.email::text);
  perform public._queue_email('account_deleted', m.email::text, jsonb_build_object('name', m.name));

  -- personal details inside older audit entries about this person
  alter table public.audit_log disable trigger audit_no_change;
  update public.audit_log
     set before = before - 'email' - 'name' - 'phone' - 'student_number' - 'pending_email',
         after = after - 'email' - 'name' - 'phone' - 'student_number' - 'pending_email'
   where target_id = p_member;
  alter table public.audit_log enable trigger audit_no_change;

  update public.members
     set name = 'Deleted member', email = ('erased-' || p_member::text || '@erased.invalid')::citext,
         email_verified_at = null, pending_email = null, phone = null, student_number = null,
         program_id = null, program_raw = null, year_of_study = null, semester_of_study = null,
         status = 'Deactivated', status_reason = 'Account deleted', must_change_password = false,
         exec_public_consent = false, erased_at = now()
   where id = p_member;
  delete from public.auth_identities where member_id = p_member;

  update public.deletion_requests
     set status = 'Approved', decided_by = auth.uid(), decided_reason = btrim(p_reason), decided_at = now()
   where member_id = p_member and status = 'Pending';
  update public.deletion_requests set reason = null where member_id = p_member;

  perform public._audit('member.erased', 'core', 'member', p_member,
                        jsonb_build_object('status', m.status), null, btrim(p_reason));
  return jsonb_build_object('paths', v_paths, 'already', false);
end;
$$;

-- ---------------------------------------------------------------- lists skip deleted people
create or replace function public.list_members(p_search text default null, p_status text default null, p_limit integer default 25, p_offset integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_full boolean;
  v_total bigint;
  v_rows jsonb;
  v_q text := nullif(btrim(coalesce(p_search, '')), '');
begin
  perform public._need('member.view');
  v_full := public.has_permission('member.edit_details');
  if p_limit is null or p_limit < 1 or p_limit > 200 then p_limit := 25; end if;
  if p_offset is null or p_offset < 0 then p_offset := 0; end if;

  select count(*) into v_total
    from public.members m
   where m.status not in ('Pending', 'Rejected') and m.erased_at is null
     and (p_status is null or m.status = p_status::public.account_status)
     and (v_q is null or m.name ilike '%' || v_q || '%' or m.student_number like v_q || '%'
          or (v_full and m.email::text ilike '%' || v_q || '%'));

  select coalesce(jsonb_agg(x order by x.name), '[]'::jsonb) into v_rows
    from (
      select m.id, m.name, m.student_number, m.status::text as status,
             coalesce(p.display_name, m.program_raw) as program,
             m.year_of_study, m.semester_of_study,
             case when v_full then m.email::text end as email,
             case when v_full then m.phone end as phone,
             (select coalesce(jsonb_agg(r.name order by r.name), '[]'::jsonb)
                from public.user_roles ur join public.roles r on r.id = ur.role_id
               where ur.user_id = m.id and ur.is_active) as roles
        from public.members m
        left join public.programs p on p.id = m.program_id
       where m.status not in ('Pending', 'Rejected') and m.erased_at is null
         and (p_status is null or m.status = p_status::public.account_status)
         and (v_q is null or m.name ilike '%' || v_q || '%' or m.student_number like v_q || '%'
              or (v_full and m.email::text ilike '%' || v_q || '%'))
       order by m.name
       limit p_limit offset p_offset
    ) x;

  return jsonb_build_object('total', v_total, 'full', v_full, 'rows', v_rows);
end;
$$;

create or replace function public.export_members(p_status text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_rows jsonb;
begin
  perform public._need('analytics.export');
  if not public.has_permission('member.edit_details') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(x order by x.name), '[]'::jsonb) into v_rows from (
    select m.name, m.student_number, m.email::text as email, m.phone,
           coalesce(p.display_name, m.program_raw) as program,
           m.year_of_study as year, m.semester_of_study as semester, m.status::text as status,
           public._top_role(m.id) as role, m.created_at
      from public.members m left join public.programs p on p.id = public._root_program(m.program_id)
     where m.erased_at is null and (p_status is null or m.status = p_status::public.account_status)
     limit 50000) x;
  perform public._audit('export.members', 'reports', 'export', null, null,
                        jsonb_build_object('rows', jsonb_array_length(v_rows), 'status', p_status), null);
  return v_rows;
end;
$$;

-- ---------------------------------------------------------------- grants
do $$
declare f text;
begin
  foreach f in array array[
    'request_account_deletion(text)', 'withdraw_deletion_request()', 'my_deletion_request()',
    'list_deletion_requests()', 'decline_deletion_request(uuid, text)', 'erase_member(uuid, text, uuid)',
    'list_members(text, text, integer, integer)', 'export_members(text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
