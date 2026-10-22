-- Migration 0006: analytics, exports, audit log, settings, terms, e-mail templates, my own details.
-- Run AFTER 0005. Safe to run twice.

-- ---------------------------------------------------------------- analytics
-- Follows a merged programme to the one it was merged into.
create or replace function public._root_program(p_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare cur uuid := p_id; nxt uuid; n integer := 0;
begin
  while cur is not null and n < 10 loop
    select merged_into_id into nxt from public.programs where id = cur;
    exit when nxt is null;
    cur := nxt;
    n := n + 1;
  end loop;
  return cur;
end;
$$;
revoke all on function public._root_program(uuid) from public, anon, authenticated;

create or replace function public.analytics_overview(p_semester uuid default null)
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
  v_n bigint;
  v_ids uuid[];
  v_sessions jsonb;
  v_programs jsonb;
  v_years jsonb;
  v_bands jsonb;
  v_avg numeric;
begin
  perform public._need('analytics.view');
  if p_semester is not null then
    select * into v_sem from public.semesters where id = p_semester;
  else
    select * into v_sem from public.semesters where is_current order by start_date desc limit 1;
  end if;
  v_from := coalesce(v_sem.start_date, current_date - 120);
  v_to := coalesce(v_sem.end_date, current_date + 120);
  select count(*) into v_active from public.members where status = 'Active';

  select coalesce(array_agg(s.id), '{}') into v_ids from public.attendance_sessions s
   where s.session_date between v_from and v_to and s.status in ('Open', 'Closed') and s.start_at <= now();
  v_n := coalesce(array_length(v_ids, 1), 0);

  select coalesce(jsonb_agg(b order by b.start_at), '[]'::jsonb) into v_sessions from (
    select s.id, s.title, s.start_at, to_char(s.session_date, 'DD Mon') as date_label,
           pc.present, pc.excused,
           case when v_active - pc.excused > 0 then round(100.0 * pc.present / (v_active - pc.excused), 1) else 0 end as rate
      from public.attendance_sessions s
      cross join lateral (
        select count(*) filter (where a.status = 'Present') as present,
               count(*) filter (where a.status = 'Excused') as excused
          from public.attendance_records a where a.session_id = s.id) pc
     where s.id = any(v_ids)) b;
  select avg((x ->> 'rate')::numeric) into v_avg from jsonb_array_elements(v_sessions) x;

  -- by programme: a record counts toward the programme the member was in at the time
  select coalesce(jsonb_agg(g order by g.rate desc, g.name), '[]'::jsonb) into v_programs from (
    with rec as (
      select public._root_program(coalesce(a.program_id_at_time, m.program_id)) as pid, count(*) as present
        from public.attendance_records a
        join public.members m on m.id = a.member_id
       where a.status = 'Present' and a.session_id = any(v_ids)
       group by 1
    ), pop as (
      select public._root_program(m.program_id) as pid, count(*) as members
        from public.members m where m.status = 'Active' and m.program_id is not null group by 1
    )
    select p.display_name as name, pop.members, coalesce(rec.present, 0) as present,
           case when v_n > 0 and pop.members > 0
                then least(100, round(100.0 * coalesce(rec.present, 0) / (v_n * pop.members), 1)) else 0 end as rate
      from pop join public.programs p on p.id = pop.pid left join rec on rec.pid = pop.pid) g;

  select coalesce(jsonb_agg(g order by g.year), '[]'::jsonb) into v_years from (
    with rec as (
      select a.year_at_time as y, count(*) as present
        from public.attendance_records a
       where a.status = 'Present' and a.year_at_time is not null and a.session_id = any(v_ids)
       group by 1
    ), pop as (
      select m.year_of_study as y, count(*) as members
        from public.members m where m.status = 'Active' and m.year_of_study is not null group by 1
    )
    select pop.y as year, pop.members, coalesce(rec.present, 0) as present,
           case when v_n > 0 and pop.members > 0
                then least(100, round(100.0 * coalesce(rec.present, 0) / (v_n * pop.members), 1)) else 0 end as rate
      from pop left join rec on rec.y = pop.y) g;

  with per as (
    select m.id,
           count(*) filter (where a.status = 'Present') as present,
           count(*) filter (where a.status = 'Excused') as excused
      from public.members m
      left join public.attendance_records a on a.member_id = m.id and a.session_id = any(v_ids)
     where m.status = 'Active' group by m.id
  ), rated as (
    select 100.0 * present / (v_n - excused) as r from per where v_n - excused > 0
  )
  select jsonb_build_object('high', count(*) filter (where r >= 80), 'good', count(*) filter (where r >= 60 and r < 80),
                            'fair', count(*) filter (where r >= 40 and r < 60), 'low', count(*) filter (where r < 40))
    into v_bands from rated;

  return jsonb_build_object(
    'semester', case when v_sem.id is null then null else jsonb_build_object('id', v_sem.id, 'name', v_sem.name) end,
    'semesters', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name) order by s.start_date desc), '[]'::jsonb) from public.semesters s),
    'active_members', v_active, 'sessions_count', v_n, 'average_rate', coalesce(round(v_avg, 1), 0),
    'sessions', v_sessions, 'programs', v_programs, 'years', v_years, 'bands', v_bands);
end;
$$;

-- ---------------------------------------------------------------- exports (each one is recorded in the audit log)
create or replace function public.export_attendance(p_semester uuid default null, p_session uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from date;
  v_to date;
  v_rows jsonb;
begin
  perform public._need('analytics.export');
  if p_semester is not null then
    select start_date, end_date into v_from, v_to from public.semesters where id = p_semester;
  end if;
  select coalesce(jsonb_agg(x order by x.session_date, x.title, x.name), '[]'::jsonb) into v_rows from (
    select s.title, s.session_date, s.venue, m.student_number, m.name,
           (select display_name from public.programs where id = public._root_program(coalesce(a.program_id_at_time, m.program_id))) as program,
           a.year_at_time as year, a.semester_at_time as semester,
           a.status::text as status, a.method::text as method, a.marked_at,
           coalesce(a.excuse_reason, a.void_reason) as reason
      from public.attendance_records a
      join public.attendance_sessions s on s.id = a.session_id
      join public.members m on m.id = a.member_id
     where (p_session is null or a.session_id = p_session)
       and (v_from is null or s.session_date between v_from and v_to)
     limit 50000) x;
  perform public._audit('export.attendance', 'reports', 'export', null, null,
                        jsonb_build_object('rows', jsonb_array_length(v_rows), 'semester', p_semester, 'session', p_session), null);
  return v_rows;
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
     where p_status is null or m.status = p_status::public.account_status
     limit 50000) x;
  perform public._audit('export.members', 'reports', 'export', null, null,
                        jsonb_build_object('rows', jsonb_array_length(v_rows), 'status', p_status), null);
  return v_rows;
end;
$$;

-- ---------------------------------------------------------------- audit log
create or replace function public.list_audit(
  p_search text default null, p_module text default null, p_from date default null, p_to date default null,
  p_limit integer default 50, p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_q text := nullif(btrim(coalesce(p_search, '')), '');
  v_total bigint;
  v_rows jsonb;
begin
  perform public._need('audit.view');
  if p_limit is null or p_limit < 1 or p_limit > 200 then p_limit := 50; end if;
  if p_offset is null or p_offset < 0 then p_offset := 0; end if;
  select count(*) into v_total
    from public.audit_log l
    left join public.members am on am.id = l.actor_id
    left join public.members tm on tm.id = l.target_id and l.target_type = 'member'
   where (p_module is null or l.module = p_module)
     and (p_from is null or l.at >= p_from) and (p_to is null or l.at < p_to + 1)
     and (v_q is null or l.action ilike '%' || v_q || '%' or am.name ilike '%' || v_q || '%'
          or tm.name ilike '%' || v_q || '%' or l.reason ilike '%' || v_q || '%');
  select coalesce(jsonb_agg(x order by x.at desc, x.id desc), '[]'::jsonb) into v_rows from (
    select l.id, l.at, l.action, l.module, l.actor_role, am.name as actor, l.target_type,
           case when l.target_type = 'member' then tm.name end as target, l.reason, l.before, l.after
      from public.audit_log l
      left join public.members am on am.id = l.actor_id
      left join public.members tm on tm.id = l.target_id and l.target_type = 'member'
     where (p_module is null or l.module = p_module)
       and (p_from is null or l.at >= p_from) and (p_to is null or l.at < p_to + 1)
       and (v_q is null or l.action ilike '%' || v_q || '%' or am.name ilike '%' || v_q || '%'
            or tm.name ilike '%' || v_q || '%' or l.reason ilike '%' || v_q || '%')
     order by l.at desc, l.id desc
     limit p_limit offset p_offset) x;
  return jsonb_build_object('total', v_total, 'rows', v_rows,
    'modules', (select coalesce(jsonb_agg(distinct module), '[]'::jsonb) from public.audit_log));
end;
$$;

-- ---------------------------------------------------------------- settings, terms, e-mail templates (Super Admin)
create or replace function public.get_settings()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._need('settings.manage');
  return jsonb_build_object(
    'qr_rotation_seconds', public._setting_int('qr_rotation_seconds', 45, 30, 60),
    'qr_grace_seconds', public._setting_int('qr_grace_seconds', 10, 0, 30));
end;
$$;

create or replace function public.save_setting(p_key text, p_value integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._need('settings.manage');
  if p_key = 'qr_rotation_seconds' then
    if p_value < 30 or p_value > 60 then
      raise exception 'rotation must be between 30 and 60 seconds' using errcode = '22023';
    end if;
  elsif p_key = 'qr_grace_seconds' then
    if p_value < 0 or p_value > 30 then
      raise exception 'grace must be between 0 and 30 seconds' using errcode = '22023';
    end if;
  else
    raise exception 'unknown setting' using errcode = '22023';
  end if;
  insert into public.settings (key, value, updated_by) values (p_key, to_jsonb(p_value), auth.uid())
  on conflict (key) do update set value = excluded.value, updated_by = auth.uid(), updated_at = now();
  perform public._audit('settings.changed', 'settings', 'setting', null, null, jsonb_build_object(p_key, p_value), null);
end;
$$;

create or replace function public.list_terms()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._need('terms.publish');
  return (select coalesce(jsonb_agg(x order by x.doc_type, x.published_at desc), '[]'::jsonb) from (
    select t.id, t.doc_type::text as doc_type, t.version, t.body, t.published_at,
           (select count(*) from public.terms_acceptances a where a.terms_version_id = t.id) as accepted
      from public.terms_versions t) x);
end;
$$;

create or replace function public.publish_terms(p_doc_type text, p_body text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_next text;
begin
  perform public._need('terms.publish');
  if p_doc_type not in ('terms', 'privacy', 'staff_confidentiality') then
    raise exception 'unknown document' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_body, ''))) < 20 then
    raise exception 'the text is too short' using errcode = '22023';
  end if;
  select (coalesce(max(case when version ~ '^[0-9]+$' then version::integer end), 0) + 1)::text
    into v_next from public.terms_versions where doc_type = p_doc_type::public.terms_doc_type;
  insert into public.terms_versions (doc_type, version, body, published_by)
  values (p_doc_type::public.terms_doc_type, v_next, btrim(p_body), auth.uid());
  perform public._audit('terms.published', 'settings', 'terms', null, null,
                        jsonb_build_object('doc_type', p_doc_type, 'version', v_next), null);
  return v_next;
end;
$$;

create or replace function public.list_email_templates()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._need('email_templates.manage');
  return (select coalesce(jsonb_agg(to_jsonb(t) order by t.code), '[]'::jsonb) from (
    select code, subject, body, sender_name, reply_to::text as reply_to, signature, allowed_placeholders from public.email_templates) t);
end;
$$;

create or replace function public.save_email_template(
  p_code text, p_subject text, p_body text, p_sender_name text, p_reply_to text, p_signature text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.email_templates%rowtype;
  v_bad text;
begin
  perform public._need('email_templates.manage');
  select * into t from public.email_templates where code = p_code;
  if not found then
    raise exception 'template not found' using errcode = 'P0002';
  end if;
  if length(btrim(coalesce(p_subject, ''))) < 2 or length(btrim(coalesce(p_body, ''))) < 5 then
    raise exception 'subject and message are required' using errcode = '22023';
  end if;
  -- only the placeholders this e-mail knows about may be used
  select m[1] into v_bad
    from regexp_matches(coalesce(p_subject, '') || ' ' || coalesce(p_body, '') || ' ' || coalesce(p_signature, ''), '\{\{\s*([a-z_]+)\s*\}\}', 'g') as m
   where m[1] <> all (t.allowed_placeholders) limit 1;
  if v_bad is not null then
    raise exception 'unknown placeholder {{%}}. Allowed: %', v_bad, array_to_string(t.allowed_placeholders, ', ') using errcode = '22023';
  end if;
  update public.email_templates
     set subject = btrim(p_subject), body = btrim(p_body), sender_name = nullif(btrim(coalesce(p_sender_name, '')), ''),
         reply_to = nullif(btrim(coalesce(p_reply_to, '')), ''), signature = nullif(btrim(coalesce(p_signature, '')), ''),
         updated_by = auth.uid(), updated_at = now()
   where code = p_code;
  perform public._audit('email_template.changed', 'settings', 'email_template', null,
                        jsonb_build_object('subject', t.subject), jsonb_build_object('code', p_code, 'subject', btrim(p_subject)), null);
end;
$$;

create or replace function public.email_queue_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._need('settings.manage');
  return jsonb_build_object(
    'queued', (select count(*) from public.email_queue where status = 'queued'),
    'sent', (select count(*) from public.email_queue where status = 'sent'),
    'failed', (select count(*) from public.email_queue where status = 'failed'),
    'recent_failures', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select template_code, to_email::text as to_email, last_error, scheduled_at
          from public.email_queue where status = 'failed' order by scheduled_at desc limit 5) x));
end;
$$;

-- ---------------------------------------------------------------- my own details
create or replace function public.update_my_details(p_phone text, p_program text, p_year smallint, p_semester smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.members%rowtype;
  v_phone text := public.normalise_phone(p_phone);
  v_prog text := nullif(btrim(coalesce(p_program, '')), '');
begin
  if auth.uid() is null or not public.ok_to_act() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if nullif(btrim(coalesce(p_phone, '')), '') is not null and v_phone is null then
    raise exception 'phone must look like +260971234567' using errcode = '22023';
  end if;
  if v_prog is null or p_year is null or p_semester is null then
    raise exception 'programme, year and semester are required' using errcode = '22023';
  end if;
  select * into m from public.members where id = auth.uid() for update;
  update public.members
     set phone = v_phone, program_raw = v_prog, program_id = public.resolve_program(v_prog),
         year_of_study = p_year, semester_of_study = p_semester
   where id = auth.uid();
  perform public._audit('member.self_details_changed', 'core', 'member', auth.uid(),
    jsonb_build_object('phone', m.phone, 'program', m.program_raw, 'year', m.year_of_study, 'semester', m.semester_of_study),
    jsonb_build_object('phone', v_phone, 'program', v_prog, 'year', p_year, 'semester', p_semester), null);
end;
$$;

create or replace function public.set_my_pending_email(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.ok_to_act() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'enter a valid email address' using errcode = '22023';
  end if;
  if exists (select 1 from public.members where email = p_email and id <> auth.uid()) then
    raise exception 'that email address already has an account' using errcode = '23505';
  end if;
  update public.members set pending_email = p_email where id = auth.uid();
end;
$$;

-- recorded after the browser changes the password (the password itself never reaches these functions)
create or replace function public.note_password_changed()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare m public.members%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into m from public.members where id = auth.uid();
  perform public._audit('member.password_changed', 'core', 'member', auth.uid(), null, null, null);
  perform public._queue_email('password_changed', m.email::text, jsonb_build_object('name', m.name));
end;
$$;

-- when Supabase Auth confirms a new address, the member record follows
create or replace function public.sync_email_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.members set email = new.email, pending_email = null where id = new.id;
    update public.auth_identities set provider_email = new.email
     where member_id = new.id and method = 'password' and is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_email_changed on auth.users;
create trigger on_auth_email_changed
  after update of email on auth.users
  for each row execute function public.sync_email_changed();

-- ---------------------------------------------------------------- who may call what
do $$
declare f text;
begin
  foreach f in array array[
    'analytics_overview(uuid)', 'export_attendance(uuid, uuid)', 'export_members(text)',
    'list_audit(text, text, date, date, integer, integer)', 'get_settings()', 'save_setting(text, integer)',
    'list_terms()', 'publish_terms(text, text)', 'list_email_templates()',
    'save_email_template(text, text, text, text, text, text)', 'email_queue_summary()',
    'update_my_details(text, text, smallint, smallint)', 'set_my_pending_email(text)', 'note_password_changed()'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
