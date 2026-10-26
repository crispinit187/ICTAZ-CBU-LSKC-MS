-- Migration 0016: session posters, upcoming sessions for members, attendance history.
--   * a poster can be attached to a session (stored in the session-posters storage area)
--   * every signed-in member can see the sessions that are coming up
--   * a member can see their own attended / excused / missed sessions; Reviewers, Administrators and
--     Super Admins (who can see full member details) can see the same for any member
-- "This term" is the current semester (Programmes page). With no current semester it is the last 120 days.

alter table public.attendance_sessions add column if not exists poster_path text;

-- ---------------------------------------------------------------- permission
insert into public.permissions (code, description)
select 'member.view_attendance', 'See any member''s attended and missed sessions'
 where not exists (select 1 from public.permissions where code = 'member.view_attendance');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
  from public.roles r
  join public.permissions p on p.code = 'member.view_attendance'
 where r.name in ('Reviewer', 'Administrator', 'Super Admin')
   and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id);

-- ---------------------------------------------------------------- storage area and rules
do $$
begin
  if to_regclass('storage.objects') is null then
    raise notice 'storage schema not found: skipping the storage area (only expected on a test database)';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('session-posters', 'session-posters', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update
    set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

  drop policy if exists "session posters insert" on storage.objects;
  create policy "session posters insert" on storage.objects for insert to authenticated
    with check (bucket_id = 'session-posters' and public.ok_to_act() and public.has_permission('session.create'));

  drop policy if exists "session posters delete" on storage.objects;
  create policy "session posters delete" on storage.objects for delete to authenticated
    using (bucket_id = 'session-posters' and public.ok_to_act() and public.has_permission('session.create'));
end $$;

-- ---------------------------------------------------------------- save or remove a poster
-- Returns the previous file name so the browser can delete the old file.
create or replace function public.set_session_poster(p_session uuid, p_path text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare s public.attendance_sessions%rowtype;
begin
  perform public._need('session.create');
  select * into s from public.attendance_sessions where id = p_session for update;
  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;
  if p_path is not null and (p_path !~ '^[0-9a-f-]{36}/[0-9a-f]{24}\.jpg$' or split_part(p_path, '/', 1) <> p_session::text) then
    raise exception 'that poster file name is not valid' using errcode = '22023';
  end if;
  update public.attendance_sessions set poster_path = p_path where id = p_session;
  perform public._audit(case when p_path is null then 'session.poster_removed' else 'session.poster_set' end,
                        'attendance', 'session', p_session, null, null, null);
  return s.poster_path;
end;
$$;

-- the staff session detail now carries the poster
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
    'poster_path', s.poster_path,
    'facilitators', public._facilitators_json(s.id),
    'present', (select count(*) from public.attendance_records a where a.session_id = s.id and a.status = 'Present'),
    'excused', (select count(*) from public.attendance_records a where a.session_id = s.id and a.status = 'Excused')
  );
end;
$$;

-- ---------------------------------------------------------------- sessions coming up (any signed-in member)
-- Names only for facilitators. No QR secrets, no attendance lists.
create or replace function public.upcoming_sessions()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.ok_to_act() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', s.id, 'title', s.title, 'description', s.description, 'venue', s.venue,
             'status', s.status, 'session_date', s.session_date, 'start_at', s.start_at, 'end_at', s.end_at,
             'poster_path', s.poster_path,
             'facilitators', (select coalesce(jsonb_agg(coalesce(m.name, f.guest_name) order by f.kind, coalesce(m.name, f.guest_name)), '[]'::jsonb)
                                from public.attendance_session_facilitators f
                                left join public.members m on m.id = f.member_id
                               where f.session_id = s.id)
           ) order by s.start_at)
      from public.attendance_sessions s
     where s.status = 'Open' or (s.status = 'Scheduled' and s.end_at > now())
  ), '[]'::jsonb);
end;
$$;

-- ---------------------------------------------------------------- attendance history
create or replace function public._attendance_for(p_member uuid, p_scope text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_joined timestamptz;
  v_from date;
  v_to date;
  v_term jsonb := null;
  v_rows jsonb;
  v_present int; v_excused int; v_absent int;
  sem public.semesters%rowtype;
begin
  select coalesce(m.member_since::timestamptz, m.created_at) into v_joined from public.members m where m.id = p_member;
  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  if coalesce(p_scope, 'term') = 'term' then
    select * into sem from public.semesters where is_current order by start_date desc limit 1;
    if found then
      v_from := sem.start_date; v_to := sem.end_date;
      v_term := jsonb_build_object('name', sem.name, 'start', sem.start_date, 'end', sem.end_date);
    else
      v_from := current_date - 120; v_to := null;
    end if;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'venue', x.venue, 'session_date', x.session_date,
                                               'start_at', x.start_at, 'status', x.status, 'method', x.method, 'marked_at', x.marked_at)
                            order by x.start_at desc), '[]'::jsonb),
         count(*) filter (where x.status = 'Present'), count(*) filter (where x.status = 'Excused'), count(*) filter (where x.status = 'Absent')
    into v_rows, v_present, v_excused, v_absent
    from (
      select s.id, s.title, s.venue, s.session_date, s.start_at,
             case when r.status = 'Present' then 'Present' when r.status = 'Excused' then 'Excused' else 'Absent' end as status,
             r.method::text as method, r.marked_at
        from public.attendance_sessions s
        left join lateral (
          select a.status, a.method, a.marked_at from public.attendance_records a
           where a.session_id = s.id and a.member_id = p_member and a.status in ('Present', 'Excused') and a.voided_at is null
           order by a.marked_at desc limit 1) r on true
       where s.status <> 'Cancelled'
         and s.start_at >= v_joined
         and (s.status = 'Closed' or r.status is not null)
         and (v_from is null or s.session_date >= v_from)
         and (v_to is null or s.session_date <= v_to)
    ) x;
  return jsonb_build_object(
    'scope', coalesce(p_scope, 'term'), 'term', v_term,
    'present', v_present, 'excused', v_excused, 'absent', v_absent,
    'percent', case when v_present + v_absent = 0 then null else round(100.0 * v_present / (v_present + v_absent)) end,
    'rows', v_rows);
end;
$$;
revoke all on function public._attendance_for(uuid, text) from public, anon, authenticated;

create or replace function public.my_attendance(p_scope text default 'term')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.ok_to_act() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return public._attendance_for(auth.uid(), p_scope);
end;
$$;

create or replace function public.member_attendance(p_member uuid, p_scope text default 'term')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._need('member.view_attendance');
  perform public._audit('member.attendance_viewed', 'core', 'member', p_member, null, null, null);
  return public._attendance_for(p_member, p_scope);
end;
$$;
