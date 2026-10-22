-- Migration 0004: sessions, rotating QR codes, member scans and Registrar marking.
-- Run AFTER 0003. Safe to run twice.
--
-- The QR code holds  LSKC1.<session id>.<time window>.<signature>.  The signature is made with a
-- secret that never leaves the database, and the time window changes every 45 seconds. An old
-- window still works for 10 seconds, so a scan during the change is not lost.

-- Reads a whole-number setting (Super Admin > Settings), kept inside its allowed range.
create or replace function public._setting_int(p_key text, p_default integer, p_min integer, p_max integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select least(p_max, greatest(p_min, coalesce(
    (select case when jsonb_typeof(value) = 'number' then (value #>> '{}')::numeric::integer end
       from public.settings where key = p_key), p_default)));
$$;
revoke all on function public._setting_int(text, integer, integer, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------- sessions
create or replace function public._facilitators_json(p_session uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'kind', f.kind, 'member_id', f.member_id,
           'name', coalesce(m.name, f.guest_name)) order by f.kind, coalesce(m.name, f.guest_name)), '[]'::jsonb)
    from public.attendance_session_facilitators f
    left join public.members m on m.id = f.member_id
   where f.session_id = p_session;
$$;
revoke all on function public._facilitators_json(uuid) from public, anon, authenticated;

create or replace function public._set_facilitators(p_session uuid, p_list jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare e jsonb;
begin
  delete from public.attendance_session_facilitators where session_id = p_session;
  for e in select * from jsonb_array_elements(coalesce(p_list, '[]'::jsonb)) loop
    if e ->> 'kind' = 'member' and nullif(e ->> 'member_id', '') is not null then
      insert into public.attendance_session_facilitators (session_id, kind, member_id)
      values (p_session, 'member', (e ->> 'member_id')::uuid);
    elsif e ->> 'kind' = 'guest' and length(btrim(coalesce(e ->> 'guest_name', ''))) > 0 then
      insert into public.attendance_session_facilitators (session_id, kind, guest_name)
      values (p_session, 'guest', btrim(e ->> 'guest_name'));
    end if;
  end loop;
end;
$$;
revoke all on function public._set_facilitators(uuid, jsonb) from public, anon, authenticated;

create or replace function public.create_session(
  p_title text, p_description text, p_date date, p_start timestamptz, p_end timestamptz,
  p_venue text, p_facilitators jsonb default '[]'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  perform public._need('session.create');
  if length(btrim(coalesce(p_title, ''))) < 2 then
    raise exception 'a title is required' using errcode = '22023';
  end if;
  if p_start is null or p_end is null or p_end <= p_start then
    raise exception 'the end time must be after the start time' using errcode = '22023';
  end if;
  insert into public.attendance_sessions (title, description, session_date, start_at, end_at, venue, created_by)
  values (btrim(p_title), nullif(btrim(coalesce(p_description, '')), ''), coalesce(p_date, p_start::date),
          p_start, p_end, nullif(btrim(coalesce(p_venue, '')), ''), auth.uid())
  returning id into v_id;
  insert into public.attendance_qr_secrets (session_id, rotation_seconds) values (v_id, public._setting_int('qr_rotation_seconds', 45, 30, 60));
  perform public._set_facilitators(v_id, p_facilitators);
  perform public._audit('session.created', 'attendance', 'session', v_id, null, jsonb_build_object('title', btrim(p_title)), null);
  return v_id;
end;
$$;

create or replace function public.update_session(
  p_id uuid, p_title text, p_description text, p_date date, p_start timestamptz, p_end timestamptz,
  p_venue text, p_facilitators jsonb default '[]'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare s public.attendance_sessions%rowtype;
begin
  perform public._need('session.create');
  select * into s from public.attendance_sessions where id = p_id for update;
  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;
  if s.status in ('Closed', 'Cancelled') then
    raise exception 'a % session cannot be edited', lower(s.status::text) using errcode = '23514';
  end if;
  if length(btrim(coalesce(p_title, ''))) < 2 then
    raise exception 'a title is required' using errcode = '22023';
  end if;
  if p_start is null or p_end is null or p_end <= p_start then
    raise exception 'the end time must be after the start time' using errcode = '22023';
  end if;
  update public.attendance_sessions
     set title = btrim(p_title), description = nullif(btrim(coalesce(p_description, '')), ''),
         session_date = coalesce(p_date, p_start::date), start_at = p_start, end_at = p_end,
         venue = nullif(btrim(coalesce(p_venue, '')), '')
   where id = p_id;
  perform public._set_facilitators(p_id, p_facilitators);
  perform public._audit('session.updated', 'attendance', 'session', p_id,
                        jsonb_build_object('title', s.title, 'start_at', s.start_at, 'end_at', s.end_at),
                        jsonb_build_object('title', btrim(p_title), 'start_at', p_start, 'end_at', p_end), null);
end;
$$;

create or replace function public._can_see_sessions()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.ok_to_act() and (public.has_permission('session.create')
      or public.has_permission('attendance.view_list') or public.has_permission('analytics.view'));
$$;
revoke all on function public._can_see_sessions() from public, anon, authenticated;

create or replace function public.list_sessions(
  p_status text default null, p_limit integer default 25, p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_total bigint; v_rows jsonb;
begin
  if not public._can_see_sessions() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 200 then p_limit := 25; end if;
  if p_offset is null or p_offset < 0 then p_offset := 0; end if;
  select count(*) into v_total from public.attendance_sessions s
   where p_status is null or s.status = p_status::public.session_status;
  select coalesce(jsonb_agg(x order by x.start_at desc), '[]'::jsonb) into v_rows
    from (
      select s.id, s.title, s.venue, s.status::text as status, s.start_at, s.end_at, s.session_date,
             (select count(*) from public.attendance_records a where a.session_id = s.id and a.status = 'Present') as present,
             (select count(*) from public.attendance_records a where a.session_id = s.id and a.status = 'Excused') as excused
        from public.attendance_sessions s
       where p_status is null or s.status = p_status::public.session_status
       order by s.start_at desc
       limit p_limit offset p_offset
    ) x;
  return jsonb_build_object('total', v_total, 'rows', v_rows);
end;
$$;

create or replace function public.get_session(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare s public.attendance_sessions%rowtype;
begin
  if not public._can_see_sessions() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into s from public.attendance_sessions where id = p_id;
  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'id', s.id, 'title', s.title, 'description', s.description, 'venue', s.venue,
    'status', s.status, 'session_date', s.session_date, 'start_at', s.start_at, 'end_at', s.end_at,
    'opened_at', s.opened_at, 'closed_at', s.closed_at, 'cancelled_reason', s.cancelled_reason,
    'facilitators', public._facilitators_json(s.id),
    'present', (select count(*) from public.attendance_records a where a.session_id = s.id and a.status = 'Present'),
    'excused', (select count(*) from public.attendance_records a where a.session_id = s.id and a.status = 'Excused')
  );
end;
$$;

create or replace function public.open_session(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare s public.attendance_sessions%rowtype;
begin
  perform public._need('session.create');
  select * into s from public.attendance_sessions where id = p_id for update;
  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;
  if s.status not in ('Scheduled', 'Closed') then
    raise exception 'only a scheduled or closed session can be opened' using errcode = '23514';
  end if;
  update public.attendance_sessions
     set status = 'Open', opened_at = coalesce(opened_at, now()), closed_at = null
   where id = p_id;
  insert into public.attendance_qr_secrets (session_id, rotation_seconds) values (p_id, public._setting_int('qr_rotation_seconds', 45, 30, 60)) on conflict (session_id) do nothing;
  perform public._audit(case when s.status = 'Closed' then 'session.reopened' else 'session.opened' end,
                        'attendance', 'session', p_id, jsonb_build_object('status', s.status), jsonb_build_object('status', 'Open'), null);
end;
$$;

create or replace function public.close_session(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare s public.attendance_sessions%rowtype;
begin
  perform public._need('session.create');
  select * into s from public.attendance_sessions where id = p_id for update;
  if not found or s.status <> 'Open' then
    raise exception 'that session is not open' using errcode = 'P0002';
  end if;
  update public.attendance_sessions set status = 'Closed', closed_at = now() where id = p_id;
  perform public._audit('session.closed', 'attendance', 'session', p_id,
                        jsonb_build_object('status', 'Open'), jsonb_build_object('status', 'Closed'), null);
end;
$$;

create or replace function public.cancel_session(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare s public.attendance_sessions%rowtype;
begin
  perform public._need('session.create');
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  select * into s from public.attendance_sessions where id = p_id for update;
  if not found or s.status not in ('Scheduled', 'Open') then
    raise exception 'only a scheduled or open session can be cancelled' using errcode = 'P0002';
  end if;
  update public.attendance_sessions set status = 'Cancelled', cancelled_reason = btrim(p_reason) where id = p_id;
  perform public._audit('session.cancelled', 'attendance', 'session', p_id,
                        jsonb_build_object('status', s.status), jsonb_build_object('status', 'Cancelled'), btrim(p_reason));
end;
$$;

-- ---------------------------------------------------------------- QR codes
create or replace function public._qr_sig(p_session uuid, p_window bigint)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare k bytea;
begin
  select secret into k from public.attendance_qr_secrets where session_id = p_session;
  if k is null then
    return null;
  end if;
  return substr(encode(hmac((p_session::text || ':' || p_window::text)::bytea, k, 'sha256'), 'hex'), 1, 32);
end;
$$;
revoke all on function public._qr_sig(uuid, bigint) from public, anon, authenticated;

create or replace function public.session_qr_token(p_session uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.attendance_sessions%rowtype;
  v_rot integer;
  v_now double precision := extract(epoch from clock_timestamp());
  v_win bigint;
begin
  perform public._need('session.qr_display');
  select * into s from public.attendance_sessions where id = p_session;
  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;
  if s.status <> 'Open' then
    raise exception 'this session is not open' using errcode = '23514';
  end if;
  insert into public.attendance_qr_secrets (session_id, rotation_seconds) values (p_session, public._setting_int('qr_rotation_seconds', 45, 30, 60)) on conflict (session_id) do nothing;
  select rotation_seconds into v_rot from public.attendance_qr_secrets where session_id = p_session;
  v_win := floor(v_now / v_rot);
  return jsonb_build_object(
    'token', 'LSKC1.' || p_session::text || '.' || v_win::text || '.' || public._qr_sig(p_session, v_win),
    'rotation_seconds', v_rot,
    'grace_seconds', public._setting_int('qr_grace_seconds', 10, 0, 30),
    'seconds_left', greatest(1, ceil((v_win + 1) * v_rot - v_now))::integer,
    'title', s.title, 'venue', s.venue, 'start_at', s.start_at, 'end_at', s.end_at,
    'present', (select count(*) from public.attendance_records a where a.session_id = p_session and a.status = 'Present')
  );
end;
$$;

create or replace function public.regenerate_qr(p_session uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public._need('session.qr_invalidate');
  if not exists (select 1 from public.attendance_sessions where id = p_session) then
    raise exception 'session not found' using errcode = 'P0002';
  end if;
  insert into public.attendance_qr_secrets (session_id, regenerated_by, rotation_seconds) values (p_session, auth.uid(), public._setting_int('qr_rotation_seconds', 45, 30, 60))
  on conflict (session_id) do update
    set secret = gen_random_bytes(32), regenerated_at = now(), regenerated_by = auth.uid();
  perform public._audit('session.qr_regenerated', 'attendance', 'session', p_session, null, null, null);
end;
$$;

create or replace function public.session_live(p_session uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare s public.attendance_sessions%rowtype;
begin
  if not (public.ok_to_act() and (public.has_permission('session.qr_display')
       or public.has_permission('attendance.view_list') or public.has_permission('analytics.view'))) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into s from public.attendance_sessions where id = p_session;
  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'status', s.status, 'title', s.title,
    'present', (select count(*) from public.attendance_records a where a.session_id = p_session and a.status = 'Present'),
    'excused', (select count(*) from public.attendance_records a where a.session_id = p_session and a.status = 'Excused'),
    'active_members', (select count(*) from public.members where status = 'Active'));
end;
$$;

-- ---------------------------------------------------------------- member scan
create or replace function public.scan_attendance(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  parts text[];
  v_sid uuid;
  v_win bigint;
  s public.attendance_sessions%rowtype;
  m public.members%rowtype;
  rec public.attendance_records%rowtype;
  v_rot integer;
  v_now double precision := extract(epoch from clock_timestamp());
  v_cur bigint;
  v_ok boolean := false;
  v_out jsonb;
begin
  perform public._need('attendance.scan');
  select * into m from public.members where id = auth.uid();

  parts := string_to_array(btrim(coalesce(p_token, '')), '.');
  if array_length(parts, 1) is distinct from 4 or parts[1] <> 'LSKC1' then
    return jsonb_build_object('result', 'invalid');
  end if;
  begin
    v_sid := parts[2]::uuid;
    v_win := parts[3]::bigint;
  exception when others then
    return jsonb_build_object('result', 'invalid');
  end;

  select * into s from public.attendance_sessions where id = v_sid;
  if not found then
    return jsonb_build_object('result', 'invalid');
  end if;
  -- the signature must match whatever window the code claims
  if public._qr_sig(v_sid, v_win) is distinct from parts[4] then
    return jsonb_build_object('result', 'invalid');
  end if;

  v_out := jsonb_build_object('session_title', s.title, 'venue', s.venue, 'at', now());
  if s.status <> 'Open' then
    return v_out || jsonb_build_object('result', 'closed');
  end if;

  select rotation_seconds into v_rot from public.attendance_qr_secrets where session_id = v_sid;
  v_cur := floor(v_now / v_rot);
  if v_win = v_cur then
    v_ok := true;
  elsif v_win = v_cur - 1 and v_now - (v_win + 1) * v_rot <= public._setting_int('qr_grace_seconds', 10, 0, 30) then
    v_ok := true; -- the previous code stays valid for a short grace period
  end if;
  if not v_ok then
    return v_out || jsonb_build_object('result', 'expired');
  end if;

  select * into rec from public.attendance_records where session_id = v_sid and member_id = m.id for update;
  if found then
    if rec.status = 'Present' then
      return v_out || jsonb_build_object('result', 'already', 'at', rec.marked_at);
    elsif rec.status = 'Excused' then
      return v_out || jsonb_build_object('result', 'blocked');
    else
      -- a Registrar removed an earlier mark; a scan does not undo that decision
      return v_out || jsonb_build_object('result', 'blocked');
    end if;
  end if;

  insert into public.attendance_records (session_id, member_id, status, method, program_id_at_time, year_at_time, semester_at_time)
  values (v_sid, m.id, 'Present', 'QR', m.program_id, m.year_of_study, m.semester_of_study);
  return v_out || jsonb_build_object('result', 'success');
end;
$$;

-- ---------------------------------------------------------------- Registrar tools
create or replace function public.open_sessions_for_marking()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._need('attendance.view_list');
  return (select coalesce(jsonb_agg(jsonb_build_object(
            'id', s.id, 'title', s.title, 'venue', s.venue, 'start_at', s.start_at, 'end_at', s.end_at,
            'status', s.status) order by s.start_at desc), '[]'::jsonb)
            from public.attendance_sessions s
           where s.status = 'Open' or (s.status = 'Closed' and s.closed_at > now() - interval '12 hours'));
end;
$$;

create or replace function public.roster_search(p_session uuid, p_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_q text := btrim(coalesce(p_query, ''));
begin
  perform public._need('attendance.view_list');
  if length(v_q) < 2 then
    return '[]'::jsonb;
  end if;
  return (select coalesce(jsonb_agg(x order by x.name), '[]'::jsonb) from (
    select m.id, m.name, m.student_number,
           coalesce(p.display_name, m.program_raw) as program, m.year_of_study, m.semester_of_study,
           case when a.status = 'Present' then 'present' when a.status = 'Excused' then 'excused' else 'none' end as status
      from public.members m
      left join public.programs p on p.id = m.program_id
      left join public.attendance_records a on a.session_id = p_session and a.member_id = m.id
     where m.status = 'Active'
       and (m.name ilike '%' || v_q || '%' or m.student_number like v_q || '%')
     order by m.name
     limit 8) x);
end;
$$;

create or replace function public._session_markable(p_session uuid)
returns public.attendance_sessions
language plpgsql
security definer
set search_path = public
as $$
declare s public.attendance_sessions%rowtype;
begin
  select * into s from public.attendance_sessions where id = p_session;
  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;
  if s.status not in ('Open', 'Closed') then
    raise exception 'attendance can only be changed for an open or closed session' using errcode = '23514';
  end if;
  return s;
end;
$$;
revoke all on function public._session_markable(uuid) from public, anon, authenticated;

create or replace function public.mark_present(p_session uuid, p_member uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.attendance_sessions%rowtype;
  m public.members%rowtype;
  rec public.attendance_records%rowtype;
begin
  perform public._need('attendance.mark_manual');
  s := public._session_markable(p_session);
  select * into m from public.members where id = p_member;
  if not found or m.status <> 'Active' then
    raise exception 'only an Active member can be marked present' using errcode = '23514';
  end if;
  select * into rec from public.attendance_records where session_id = p_session and member_id = p_member for update;
  if found and rec.status = 'Present' then
    return;
  end if;
  if found and rec.status = 'Excused' then
    raise exception 'remove the excuse first' using errcode = '23514';
  end if;
  if found then
    update public.attendance_records
       set status = 'Present', method = 'Manual', marked_by = auth.uid(), marked_at = now(),
           excuse_reason = null, voided_by = null, voided_at = null, void_reason = null,
           program_id_at_time = m.program_id, year_at_time = m.year_of_study, semester_at_time = m.semester_of_study
     where id = rec.id;
  else
    insert into public.attendance_records (session_id, member_id, status, method, marked_by, program_id_at_time, year_at_time, semester_at_time)
    values (p_session, p_member, 'Present', 'Manual', auth.uid(), m.program_id, m.year_of_study, m.semester_of_study);
  end if;
  perform public._audit('attendance.marked_manual', 'attendance', 'attendance', p_member,
                        null, jsonb_build_object('session_id', p_session, 'session', s.title), null);
end;
$$;

create or replace function public.excuse_member(p_session uuid, p_member uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.attendance_sessions%rowtype;
  m public.members%rowtype;
  rec public.attendance_records%rowtype;
begin
  perform public._need('attendance.excuse');
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  s := public._session_markable(p_session);
  select * into m from public.members where id = p_member;
  if not found or m.status <> 'Active' then
    raise exception 'only an Active member can be excused' using errcode = '23514';
  end if;
  select * into rec from public.attendance_records where session_id = p_session and member_id = p_member for update;
  if found and rec.status = 'Present' then
    raise exception 'unmark the member first' using errcode = '23514';
  end if;
  if found then
    update public.attendance_records
       set status = 'Excused', method = null, marked_by = auth.uid(), marked_at = now(),
           excuse_reason = btrim(p_reason), voided_by = null, voided_at = null, void_reason = null,
           program_id_at_time = m.program_id, year_at_time = m.year_of_study, semester_at_time = m.semester_of_study
     where id = rec.id;
  else
    insert into public.attendance_records (session_id, member_id, status, marked_by, excuse_reason, program_id_at_time, year_at_time, semester_at_time)
    values (p_session, p_member, 'Excused', auth.uid(), btrim(p_reason), m.program_id, m.year_of_study, m.semester_of_study);
  end if;
  perform public._audit('attendance.excused', 'attendance', 'attendance', p_member,
                        null, jsonb_build_object('session_id', p_session, 'session', s.title), btrim(p_reason));
end;
$$;

-- Unmarks a Present record, or removes an excuse. The row is voided, never deleted.
create or replace function public.void_attendance(p_session uuid, p_member uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.attendance_sessions%rowtype;
  rec public.attendance_records%rowtype;
begin
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  s := public._session_markable(p_session);
  select * into rec from public.attendance_records where session_id = p_session and member_id = p_member for update;
  if not found or rec.status not in ('Present', 'Excused') then
    raise exception 'there is nothing to remove' using errcode = 'P0002';
  end if;
  perform public._need(case when rec.status = 'Present' then 'attendance.unmark' else 'attendance.excuse' end);
  update public.attendance_records
     set status = 'Voided', voided_by = auth.uid(), voided_at = now(), void_reason = btrim(p_reason)
   where id = rec.id;
  perform public._audit(case when rec.status = 'Present' then 'attendance.unmarked' else 'attendance.excuse_removed' end,
                        'attendance', 'attendance', p_member,
                        jsonb_build_object('status', rec.status), jsonb_build_object('session_id', p_session, 'session', s.title),
                        btrim(p_reason));
end;
$$;

create or replace function public.session_attendance(p_session uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._need('attendance.view_list');
  return (select coalesce(jsonb_agg(x order by x.marked_at desc), '[]'::jsonb) from (
    select m.name, m.student_number, a.status::text as status, a.method::text as method, a.marked_at,
           a.excuse_reason, a.void_reason
      from public.attendance_records a join public.members m on m.id = a.member_id
     where a.session_id = p_session
     limit 1000) x);
end;
$$;

-- ---------------------------------------------------------------- who may call what
do $$
declare f text;
begin
  foreach f in array array[
    'create_session(text, text, date, timestamptz, timestamptz, text, jsonb)',
    'update_session(uuid, text, text, date, timestamptz, timestamptz, text, jsonb)',
    'list_sessions(text, integer, integer)', 'get_session(uuid)', 'open_session(uuid)',
    'close_session(uuid)', 'cancel_session(uuid, text)', 'session_qr_token(uuid)', 'regenerate_qr(uuid)',
    'session_live(uuid)', 'scan_attendance(text)', 'open_sessions_for_marking()', 'roster_search(uuid, text)',
    'mark_present(uuid, uuid)', 'excuse_member(uuid, uuid, text)', 'void_attendance(uuid, uuid, text)',
    'session_attendance(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
