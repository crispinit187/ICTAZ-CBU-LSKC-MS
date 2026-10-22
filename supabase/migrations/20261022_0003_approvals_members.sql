-- Migration 0003: shared helpers, e-mail templates, approvals, members and the dashboard.
-- Run AFTER 0001 and 0002. Safe to run twice.
--
-- Every screen reads and writes through functions like these. Each function checks the caller's
-- permission itself (SECURITY DEFINER), writes an audit row, and refuses anyone who is not
-- Active or who still has to change their password.

-- ---------------------------------------------------------------- helpers (not callable from the browser)
create or replace function public._need(p_code text)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.has_permission(p_code) and public.ok_to_act()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
end;
$$;

create or replace function public._actor_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.name
    from public.user_roles ur join public.roles r on r.id = ur.role_id
   where ur.user_id = auth.uid() and ur.is_active
   order by case r.name when 'Super Admin' then 1 when 'Administrator' then 2
                        when 'Reviewer' then 3 when 'Registrar' then 4 else 5 end
   limit 1;
$$;

create or replace function public._audit(
  p_action text, p_module text, p_target_type text, p_target uuid,
  p_before jsonb, p_after jsonb, p_reason text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_log (actor_id, actor_role, action, module, target_type, target_id, before, after, reason)
  values (auth.uid(), public._actor_role(), p_action, coalesce(p_module, 'core'), p_target_type, p_target, p_before, p_after, p_reason);
$$;

-- Queues an e-mail when the template exists. A separate sender (Edge Function) delivers the queue.
create or replace function public._queue_email(p_code text, p_to text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_to is not null and exists (select 1 from public.email_templates where code = p_code) then
    insert into public.email_queue (template_code, to_email, payload) values (p_code, p_to, coalesce(p_payload, '{}'::jsonb));
  end if;
end;
$$;

revoke all on function public._need(text) from public, anon, authenticated;
revoke all on function public._actor_role() from public, anon, authenticated;
revoke all on function public._audit(text, text, text, uuid, jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public._queue_email(text, text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------- e-mail templates (sample wording)
insert into public.email_templates (code, subject, body, sender_name, allowed_placeholders)
select t.code, t.subject, t.body, 'ICTAZ CBU LSKC', t.ph
  from (values
    ('registration_approved', 'Your account is approved', 'Hello {{name}}, your registration has been approved. You can sign in now.', array['name']),
    ('registration_declined', 'About your registration', 'Hello {{name}}, your registration could not be approved. Reason: {{reason}}', array['name','reason']),
    ('account_suspended', 'Your account was suspended', 'Hello {{name}}, your account has been suspended. Reason: {{reason}}', array['name','reason']),
    ('account_reactivated', 'Your account is active again', 'Hello {{name}}, your account is active again.', array['name']),
    ('account_created', 'An account was created for you', 'Hello {{name}}, an Administrator created an account for you. Sign in with your student number and the temporary password you were given, then choose your own password.', array['name']),
    ('password_reset_admin', 'Your password was reset', 'Hello {{name}}, an Administrator reset your password. Sign in with the temporary password you were given, then choose your own.', array['name']),
    ('password_changed', 'Your password was changed', 'Hello {{name}}, your password was just changed. If this was not you, contact an Administrator.', array['name']),
    ('role_changed', 'Your role changed', 'Hello {{name}}, your role is now {{role}}.', array['name','role'])
  ) as t(code, subject, body, ph)
 where not exists (select 1 from public.email_templates e where e.code = t.code);

-- ---------------------------------------------------------------- approvals
create or replace function public.list_pending_registrations(p_status text default 'Pending')
returns table (
  id uuid, name text, student_number text, email text, method text, program text,
  year_of_study smallint, semester_of_study smallint, email_verified boolean,
  created_at timestamptz, status text, status_reason text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._need('account.approve');
  if p_status not in ('Pending', 'Rejected') then
    raise exception 'status must be Pending or Rejected' using errcode = '22023';
  end if;
  return query
    select m.id, m.name, m.student_number, m.email::text,
           coalesce((select ai.method::text from public.auth_identities ai
                      where ai.member_id = m.id and ai.is_active order by ai.linked_at limit 1), 'password'),
           coalesce(p.display_name, m.program_raw),
           m.year_of_study, m.semester_of_study, m.email_verified_at is not null,
           m.created_at, m.status::text, m.status_reason
      from public.members m
      left join public.programs p on p.id = m.program_id
     where m.status = p_status::public.account_status
     order by m.created_at;
end;
$$;

create or replace function public.approve_registration(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare m public.members%rowtype;
begin
  perform public._need('account.approve');
  select * into m from public.members where id = p_id for update;
  if not found or m.status <> 'Pending' then
    raise exception 'that registration is not waiting for approval' using errcode = 'P0002';
  end if;
  if m.email_verified_at is null then
    raise exception 'the email address has not been confirmed yet' using errcode = '22023';
  end if;
  update public.members set status = 'Active', status_reason = null where id = p_id;
  perform public._audit('registration.approved', 'core', 'member', p_id,
                        jsonb_build_object('status', m.status), jsonb_build_object('status', 'Active'), null);
  perform public._queue_email('registration_approved', m.email::text, jsonb_build_object('name', m.name));
end;
$$;

create or replace function public.decline_registration(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare m public.members%rowtype;
begin
  perform public._need('account.approve');
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  select * into m from public.members where id = p_id for update;
  if not found or m.status <> 'Pending' then
    raise exception 'that registration is not waiting for approval' using errcode = 'P0002';
  end if;
  update public.members set status = 'Rejected', status_reason = btrim(p_reason) where id = p_id;
  perform public._audit('registration.declined', 'core', 'member', p_id,
                        jsonb_build_object('status', m.status), jsonb_build_object('status', 'Rejected'), btrim(p_reason));
  perform public._queue_email('registration_declined', m.email::text, jsonb_build_object('name', m.name, 'reason', btrim(p_reason)));
end;
$$;

create or replace function public.reopen_registration(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare m public.members%rowtype;
begin
  perform public._need('account.approve');
  select * into m from public.members where id = p_id for update;
  if not found or m.status <> 'Rejected' then
    raise exception 'that registration is not declined' using errcode = 'P0002';
  end if;
  update public.members set status = 'Pending', status_reason = null where id = p_id;
  perform public._audit('registration.reopened', 'core', 'member', p_id,
                        jsonb_build_object('status', 'Rejected'), jsonb_build_object('status', 'Pending'), null);
end;
$$;

-- ---------------------------------------------------------------- members
-- Registrars see a short view (no e-mail or phone). Anyone who can edit details sees everything.
create or replace function public.list_members(
  p_search text default null,
  p_status text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
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
   where m.status not in ('Pending', 'Rejected')
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
       where m.status not in ('Pending', 'Rejected')
         and (p_status is null or m.status = p_status::public.account_status)
         and (v_q is null or m.name ilike '%' || v_q || '%' or m.student_number like v_q || '%'
              or (v_full and m.email::text ilike '%' || v_q || '%'))
       order by m.name
       limit p_limit offset p_offset
    ) x;

  return jsonb_build_object('total', v_total, 'full', v_full, 'rows', v_rows);
end;
$$;

create or replace function public.get_member(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_full boolean;
  m public.members%rowtype;
  v_out jsonb;
begin
  perform public._need('member.view');
  v_full := public.has_permission('member.edit_details');
  select * into m from public.members where id = p_id;
  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  v_out := jsonb_build_object(
    'id', m.id, 'name', m.name, 'student_number', m.student_number, 'status', m.status,
    'status_reason', case when v_full then m.status_reason end,
    'program', (select p.display_name from public.programs p where p.id = m.program_id),
    'program_raw', m.program_raw,
    'year_of_study', m.year_of_study, 'semester_of_study', m.semester_of_study,
    'email', case when v_full then m.email::text end,
    'phone', case when v_full then m.phone end,
    'email_verified', m.email_verified_at is not null,
    'is_bootstrap', m.is_bootstrap,
    'created_at', m.created_at,
    'roles', (select coalesce(jsonb_agg(r.name order by r.name), '[]'::jsonb)
                from public.user_roles ur join public.roles r on r.id = ur.role_id
               where ur.user_id = m.id and ur.is_active),
    'present', (select count(*) from public.attendance_records a where a.member_id = m.id and a.status = 'Present'),
    'excused', (select count(*) from public.attendance_records a where a.member_id = m.id and a.status = 'Excused')
  );
  if v_full then
    v_out := v_out || jsonb_build_object('history', (
      select coalesce(jsonb_agg(h order by h.at desc), '[]'::jsonb)
        from (select al.at, al.action, al.actor_role, al.reason, al.before, al.after
                from public.audit_log al
               where al.target_type = 'member' and al.target_id = m.id
               order by al.at desc limit 50) h));
  end if;
  return v_out;
end;
$$;

create or replace function public.set_member_status(p_id uuid, p_status text, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.members%rowtype;
  v_new public.account_status;
  v_sa smallint;
begin
  perform public._need('account.suspend');
  if p_id = auth.uid() then
    raise exception 'you cannot change your own status' using errcode = '42501';
  end if;
  if p_status not in ('Active', 'Suspended', 'Deactivated') then
    raise exception 'status must be Active, Suspended or Deactivated' using errcode = '22023';
  end if;
  v_new := p_status::public.account_status;
  select * into m from public.members where id = p_id for update;
  if not found or m.status not in ('Active', 'Suspended', 'Deactivated') then
    raise exception 'that member cannot be changed here' using errcode = 'P0002';
  end if;
  if m.status = v_new then
    return;
  end if;
  if v_new in ('Suspended', 'Deactivated') and length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;

  -- never leave the system without an Active Super Admin
  select id into v_sa from public.roles where name = 'Super Admin';
  if v_new <> 'Active' and exists (select 1 from public.user_roles where user_id = p_id and role_id = v_sa and is_active) then
    if not exists (
      select 1 from public.user_roles ur join public.members mm on mm.id = ur.user_id
       where ur.role_id = v_sa and ur.is_active and mm.status = 'Active' and ur.user_id <> p_id
         and mm.must_change_password = false
    ) then
      raise exception 'there must stay at least one Active Super Admin who has finished first sign-in' using errcode = '23514';
    end if;
  end if;

  update public.members
     set status = v_new,
         status_reason = case when v_new = 'Active' then null else btrim(p_reason) end
   where id = p_id;
  perform public._audit('member.status_changed', 'core', 'member', p_id,
                        jsonb_build_object('status', m.status), jsonb_build_object('status', v_new), nullif(btrim(coalesce(p_reason, '')), ''));
  if v_new = 'Suspended' then
    perform public._queue_email('account_suspended', m.email::text, jsonb_build_object('name', m.name, 'reason', btrim(p_reason)));
  elsif v_new = 'Active' then
    perform public._queue_email('account_reactivated', m.email::text, jsonb_build_object('name', m.name));
  end if;
end;
$$;

create or replace function public.update_member_details(
  p_id uuid, p_name text, p_phone text, p_program text, p_year smallint, p_semester smallint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.members%rowtype;
  v_phone text := public.normalise_phone(p_phone);
begin
  perform public._need('member.edit_details');
  select * into m from public.members where id = p_id for update;
  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  if length(btrim(coalesce(p_name, ''))) < 2 then
    raise exception 'name is required' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_phone, '')), '') is not null and v_phone is null then
    raise exception 'phone must look like +260971234567' using errcode = '22023';
  end if;
  update public.members
     set name = btrim(p_name), phone = v_phone,
         program_raw = nullif(btrim(coalesce(p_program, '')), ''),
         program_id = case when nullif(btrim(coalesce(p_program, '')), '') is null then null else public.resolve_program(p_program) end,
         year_of_study = p_year, semester_of_study = p_semester
   where id = p_id;
  perform public._audit('member.details_changed', 'core', 'member', p_id,
    jsonb_build_object('name', m.name, 'phone', m.phone, 'program', m.program_raw, 'year', m.year_of_study, 'semester', m.semester_of_study),
    jsonb_build_object('name', btrim(p_name), 'phone', v_phone, 'program', btrim(p_program), 'year', p_year, 'semester', p_semester), null);
end;
$$;

create or replace function public.change_student_number(p_id uuid, p_new text, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare m public.members%rowtype;
begin
  perform public._need('member.change_student_number');
  if p_new !~ '^[0-9]{8}$' then
    raise exception 'a student number is exactly 8 digits' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  select * into m from public.members where id = p_id for update;
  if not found or m.is_bootstrap then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.members where student_number = p_new and id <> p_id) then
    raise exception 'that student number belongs to someone else' using errcode = '23505';
  end if;
  update public.members set student_number = p_new where id = p_id;
  perform public._audit('member.student_number_changed', 'core', 'member', p_id,
                        jsonb_build_object('student_number', m.student_number), jsonb_build_object('student_number', p_new), btrim(p_reason));
end;
$$;

-- ---------------------------------------------------------------- dashboard
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_sem public.semesters%rowtype;
  v_from date;
  v_to date;
  v_active bigint;
  v_n_sessions bigint;
  v_bars jsonb;
  v_open jsonb;
  v_bands jsonb;
  v_prog jsonb;
  v_act jsonb;
  v_avg numeric;
begin
  perform public._need('analytics.view');
  select * into v_sem from public.semesters where is_current order by start_date desc limit 1;
  v_from := coalesce(v_sem.start_date, current_date - 120);
  v_to := coalesce(v_sem.end_date, current_date + 120);
  select count(*) into v_active from public.members where status = 'Active';
  select count(*) into v_n_sessions from public.attendance_sessions
   where session_date between v_from and v_to and status <> 'Cancelled';

  -- last ten sessions that have started
  select coalesce(jsonb_agg(b order by b.start_at), '[]'::jsonb) into v_bars
    from (
      select s.id, s.title, s.start_at, to_char(s.session_date, 'DD Mon') as date_label,
             pc.present,
             case when v_active - pc.excused > 0 then round(100.0 * pc.present / (v_active - pc.excused)) else 0 end as rate
        from public.attendance_sessions s
        cross join lateral (
          select count(*) filter (where a.status = 'Present') as present,
                 count(*) filter (where a.status = 'Excused') as excused
            from public.attendance_records a where a.session_id = s.id) pc
       where s.status in ('Open', 'Closed') and s.start_at <= now()
       order by s.start_at desc limit 10
    ) b;

  select avg((x->>'rate')::numeric) into v_avg from jsonb_array_elements(v_bars) x;

  select to_jsonb(o) into v_open
    from (
      select s.id, s.title, s.start_at, s.end_at, s.venue, s.status,
             (select count(*) from public.attendance_records a where a.session_id = s.id and a.status = 'Present') as present,
             (select count(*) filter (where kind = 'member') from public.attendance_session_facilitators f where f.session_id = s.id) as facilitator_members,
             (select count(*) filter (where kind = 'guest') from public.attendance_session_facilitators f where f.session_id = s.id) as facilitator_guests
        from public.attendance_sessions s
       where s.status = 'Open'
       order by s.start_at desc limit 1
    ) o;

  -- consistency bands: Active members by attendance rate across this semester's sessions
  with ses as (
    select s.id from public.attendance_sessions s
     where s.session_date between v_from and v_to and s.status in ('Open', 'Closed') and s.start_at <= now()
  ), per as (
    select m.id,
           count(*) filter (where a.status = 'Present') as present,
           count(*) filter (where a.status = 'Excused') as excused
      from public.members m
      left join public.attendance_records a on a.member_id = m.id and a.session_id in (select id from ses)
     where m.status = 'Active'
     group by m.id
  ), rated as (
    select case when (select count(*) from ses) - excused > 0
                then 100.0 * present / ((select count(*) from ses) - excused) else 0 end as r
      from per
  )
  select jsonb_build_object(
           'high', count(*) filter (where r >= 80),
           'good', count(*) filter (where r >= 60 and r < 80),
           'fair', count(*) filter (where r >= 40 and r < 60),
           'low',  count(*) filter (where r < 40))
    into v_bands from rated;

  select coalesce(jsonb_agg(g order by g.rate desc, g.name), '[]'::jsonb) into v_prog
    from (
      select p.display_name as name,
             case when v_n_sessions > 0 and count(distinct m.id) > 0
                  then round(100.0 * count(a.id) filter (where a.status = 'Present')
                             / (v_n_sessions * count(distinct m.id))) else 0 end as rate
        from public.programs p
        join public.members m on m.program_id = p.id and m.status = 'Active'
        left join public.attendance_records a on a.member_id = m.id
             and a.session_id in (select id from public.attendance_sessions where session_date between v_from and v_to)
       where p.merged_into_id is null
       group by p.id, p.display_name
       order by 2 desc, 1
       limit 8
    ) g;

  select coalesce(jsonb_agg(r order by r.at desc), '[]'::jsonb) into v_act
    from (select al.at, al.action, coalesce(al.actor_role, 'System') as who
            from public.audit_log al order by al.at desc limit 6) r;

  return jsonb_build_object(
    'semester', case when v_sem.id is null then null else jsonb_build_object('id', v_sem.id, 'name', v_sem.name) end,
    'semesters', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name) order by s.start_date desc), '[]'::jsonb) from public.semesters s),
    'active_members', v_active,
    'joined_this_semester', (select count(*) from public.members where status = 'Active' and created_at::date >= v_from),
    'pending_count', (select count(*) from public.members where status = 'Pending'),
    'sessions_count', v_n_sessions,
    'sessions_open', (select count(*) from public.attendance_sessions where status = 'Open'),
    'sessions_scheduled', (select count(*) from public.attendance_sessions where status = 'Scheduled' and end_at > now()),
    'average_rate', coalesce(round(v_avg, 1), 0),
    'bars', v_bars,
    'open', v_open,
    'bands', v_bands,
    'programs', v_prog,
    'review_programs', (select count(*) from public.programs where not is_reviewed and merged_into_id is null),
    'activity', v_act
  );
end;
$$;

-- ---------------------------------------------------------------- permissions to call
do $$
declare f text;
begin
  foreach f in array array[
    'list_pending_registrations(text)', 'approve_registration(uuid)', 'decline_registration(uuid, text)',
    'reopen_registration(uuid)', 'list_members(text, text, integer, integer)', 'get_member(uuid)',
    'set_member_status(uuid, text, text)',
    'update_member_details(uuid, text, text, text, smallint, smallint)',
    'change_student_number(uuid, text, text)', 'admin_dashboard()'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
