-- Migration 0005: executives, role assignment, programmes and semesters.
-- Run AFTER 0004. Safe to run twice.
--
-- Rules kept by the database itself (these triggers already exist):
--   * Registrar, Reviewer and Administrator need a current executive profile.
--   * A position that allows only one holder cannot have two current holders.
--   * Ending an executive profile removes their elevated role automatically.
--   * Public display needs the member's consent.
--   * There must always be one Active Super Admin.

-- ---------------------------------------------------------------- fix: ending a profile must be able to switch a role off
-- The existing rule "elevated roles need a current executive profile" also fired when the cleanup
-- trigger deactivated a role after a profile ended, which blocked ending a profile. It now only
-- checks roles that are being switched on.
create or replace function public.enforce_role_requires_exec()
returns trigger
language plpgsql
set search_path = public
as $$
declare role_name text;
begin
  if not new.is_active then
    return new;
  end if;
  select name into role_name from public.roles where id = new.role_id;
  if role_name in ('Registrar', 'Reviewer', 'Administrator') then
    if not exists (select 1 from public.executive_profiles where member_id = new.user_id and end_date is null) then
      raise exception 'Role % requires a current executive profile', role_name;
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------- roles
create or replace function public._top_role(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select r.name from public.user_roles ur join public.roles r on r.id = ur.role_id
     where ur.user_id = p_user and ur.is_active and r.name <> 'Member'
     order by case r.name when 'Super Admin' then 1 when 'Administrator' then 2
                          when 'Reviewer' then 3 when 'Registrar' then 4 else 5 end
     limit 1), 'Member');
$$;
revoke all on function public._top_role(uuid) from public, anon, authenticated;

create or replace function public.list_role_people(p_search text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_q text := nullif(btrim(coalesce(p_search, '')), '');
begin
  perform public._need('role.assign');
  return (select coalesce(jsonb_agg(x order by x.name), '[]'::jsonb) from (
    select m.id, m.name, m.student_number,
           public._top_role(m.id) as role,
           (select pos.name from public.executive_profiles ep
              join public.executive_positions pos on pos.id = ep.position_id
             where ep.member_id = m.id and ep.end_date is null
             order by ep.start_date desc limit 1) as position,
           (select ep.id from public.executive_profiles ep
             where ep.member_id = m.id and ep.end_date is null order by ep.start_date desc limit 1) as profile_id
      from public.members m
     where m.status = 'Active'
       and (public._top_role(m.id) <> 'Member'
            or exists (select 1 from public.executive_profiles ep where ep.member_id = m.id and ep.end_date is null)
            or (v_q is not null and (m.name ilike '%' || v_q || '%' or m.student_number like v_q || '%')))
     order by m.name
     limit 80) x);
end;
$$;

create or replace function public.assign_role(p_member uuid, p_role text, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.members%rowtype;
  v_prev text;
  v_role_id smallint;
  v_profile uuid;
begin
  perform public._need('role.assign');
  if p_role not in ('Registrar', 'Reviewer', 'Administrator', 'Super Admin') then
    raise exception 'choose Registrar, Reviewer, Administrator or Super Admin' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  if p_member = auth.uid() then
    raise exception 'you cannot change your own role' using errcode = '42501';
  end if;
  select * into m from public.members where id = p_member;
  if not found or m.status <> 'Active' then
    raise exception 'only an Active member can be given a role' using errcode = '23514';
  end if;
  v_prev := public._top_role(p_member);
  if v_prev = p_role then
    raise exception 'they already have that role' using errcode = '23505';
  end if;
  select id into v_role_id from public.roles where name = p_role;
  if p_role <> 'Super Admin' then
    select id into v_profile from public.executive_profiles
     where member_id = p_member and end_date is null order by start_date desc limit 1;
    if v_profile is null then
      raise exception '% has no current executive profile. Add one first.', m.name using errcode = '23514';
    end if;
  end if;

  update public.user_roles set is_active = false
   where user_id = p_member and is_active and role_id <> (select id from public.roles where name = 'Member');
  insert into public.user_roles (user_id, role_id, executive_profile_id, assigned_by)
  values (p_member, v_role_id, v_profile, auth.uid());

  insert into public.role_assignment_history (user_id, previous_role, new_role, actor_id, reason)
  values (p_member, v_prev, p_role, auth.uid(), btrim(p_reason));
  perform public._audit('role.assigned', 'core', 'member', p_member,
                        jsonb_build_object('role', v_prev), jsonb_build_object('role', p_role), btrim(p_reason));
  perform public._queue_email('role_changed', m.email::text, jsonb_build_object('name', m.name, 'role', p_role));
end;
$$;

create or replace function public.remove_role(p_member uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.members%rowtype;
  v_prev text;
begin
  perform public._need('role.assign');
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  if p_member = auth.uid() then
    raise exception 'you cannot change your own role' using errcode = '42501';
  end if;
  select * into m from public.members where id = p_member;
  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  v_prev := public._top_role(p_member);
  if v_prev = 'Member' then
    raise exception 'they have no role to remove' using errcode = 'P0002';
  end if;
  update public.user_roles set is_active = false
   where user_id = p_member and is_active and role_id <> (select id from public.roles where name = 'Member');
  insert into public.role_assignment_history (user_id, previous_role, new_role, actor_id, reason)
  values (p_member, v_prev, 'Member', auth.uid(), btrim(p_reason));
  perform public._audit('role.removed', 'core', 'member', p_member,
                        jsonb_build_object('role', v_prev), jsonb_build_object('role', 'Member'), btrim(p_reason));
  perform public._queue_email('role_changed', m.email::text, jsonb_build_object('name', m.name, 'role', 'Member'));
end;
$$;

-- ---------------------------------------------------------------- executive positions and profiles
create or replace function public._can_see_execs()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.ok_to_act() and (public.has_permission('executive.view_full')
      or public.has_permission('executive_profile.manage') or public.has_permission('executive_position.manage')
      or public.has_permission('role.assign'));
$$;
revoke all on function public._can_see_execs() from public, anon, authenticated;

create or replace function public.list_executive_positions()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public._can_see_execs() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return (select coalesce(jsonb_agg(x order by x.display_order, x.name), '[]'::jsonb) from (
    select p.id, p.name, p.allows_multiple, p.display_order, p.is_retired,
           (select count(*) from public.executive_profiles ep where ep.position_id = p.id and ep.end_date is null) as holders
      from public.executive_positions p) x);
end;
$$;

create or replace function public.save_executive_position(
  p_id uuid, p_name text, p_allows_multiple boolean, p_display_order integer, p_retired boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid := p_id;
begin
  perform public._need('executive_position.manage');
  if length(btrim(coalesce(p_name, ''))) < 2 then
    raise exception 'a position name is required' using errcode = '22023';
  end if;
  if v_id is null then
    insert into public.executive_positions (name, allows_multiple, display_order, is_retired)
    values (btrim(p_name), coalesce(p_allows_multiple, false), coalesce(p_display_order, 0), coalesce(p_retired, false))
    returning id into v_id;
    perform public._audit('executive_position.created', 'core', 'executive_position', v_id, null, jsonb_build_object('name', btrim(p_name)), null);
  else
    update public.executive_positions
       set name = btrim(p_name), allows_multiple = coalesce(p_allows_multiple, allows_multiple),
           display_order = coalesce(p_display_order, display_order), is_retired = coalesce(p_retired, is_retired)
     where id = v_id;
    if not found then
      raise exception 'position not found' using errcode = 'P0002';
    end if;
    perform public._audit('executive_position.updated', 'core', 'executive_position', v_id, null, jsonb_build_object('name', btrim(p_name)), null);
  end if;
  return v_id;
exception when unique_violation then
  raise exception 'a position with that name already exists' using errcode = '23505';
end;
$$;

create or replace function public.list_executives(p_include_past boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public._can_see_execs() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return (select coalesce(jsonb_agg(x order by x.display_order, x.name), '[]'::jsonb) from (
    select ep.id as profile_id, m.id as member_id, m.name, m.student_number, pos.name as position, pos.display_order,
           ep.start_date, ep.end_date, ep.ended_reason, ep.public_display, m.exec_public_consent as consent,
           coalesce(pr.display_name, m.program_raw) as program, ep.year_at_time,
           public._top_role(m.id) as role
      from public.executive_profiles ep
      join public.members m on m.id = ep.member_id
      join public.executive_positions pos on pos.id = ep.position_id
      left join public.programs pr on pr.id = ep.program_id_at_time
     where p_include_past or ep.end_date is null) x);
end;
$$;

create or replace function public.add_executive(p_member uuid, p_position uuid, p_start date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.members%rowtype;
  pos public.executive_positions%rowtype;
  v_id uuid;
begin
  perform public._need('executive_profile.manage');
  select * into m from public.members where id = p_member;
  if not found or m.status <> 'Active' then
    raise exception 'only an Active member can be an executive' using errcode = '23514';
  end if;
  select * into pos from public.executive_positions where id = p_position;
  if not found or pos.is_retired then
    raise exception 'choose a position that is still in use' using errcode = '22023';
  end if;
  if exists (select 1 from public.executive_profiles where member_id = p_member and position_id = p_position and end_date is null) then
    raise exception '% already holds that position', m.name using errcode = '23505';
  end if;
  begin
    insert into public.executive_profiles (member_id, position_id, start_date, year_at_time, program_id_at_time, created_by)
    values (p_member, p_position, coalesce(p_start, current_date), m.year_of_study, m.program_id, auth.uid())
    returning id into v_id;
  exception when raise_exception then
    -- the one-holder rule is a database trigger; say it in plain words
    raise exception '% already has a current holder. End that profile first, or allow several holders.', pos.name using errcode = '23514';
  end;
  perform public._audit('executive.added', 'core', 'member', p_member, null,
                        jsonb_build_object('position', pos.name), null);
  return v_id;
end;
$$;

create or replace function public.end_executive(p_profile uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ep public.executive_profiles%rowtype;
begin
  perform public._need('executive_profile.manage');
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  select * into ep from public.executive_profiles where id = p_profile for update;
  if not found or ep.end_date is not null then
    raise exception 'that profile has already ended' using errcode = 'P0002';
  end if;
  -- the trigger ends elevated roles; a Super Admin keeps theirs (it needs no profile)
  update public.executive_profiles
     set end_date = greatest(current_date, start_date), ended_reason = btrim(p_reason), public_display = false
   where id = p_profile;
  perform public._audit('executive.ended', 'core', 'member', ep.member_id, null, jsonb_build_object('profile_id', p_profile), btrim(p_reason));
end;
$$;

create or replace function public.set_executive_display(p_profile uuid, p_on boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare ep public.executive_profiles%rowtype;
begin
  perform public._need('executive_profile.manage');
  select * into ep from public.executive_profiles where id = p_profile for update;
  if not found or ep.end_date is not null then
    raise exception 'that profile has ended' using errcode = 'P0002';
  end if;
  if p_on and not coalesce((select exec_public_consent from public.members where id = ep.member_id), false) then
    raise exception 'this person has not given consent to be shown publicly' using errcode = '23514';
  end if;
  update public.executive_profiles set public_display = coalesce(p_on, false) where id = p_profile;
  perform public._audit('executive.display_changed', 'core', 'member', ep.member_id, null, jsonb_build_object('public_display', coalesce(p_on, false)), null);
end;
$$;

-- ---------------------------------------------------------------- my own profile and consent
create or replace function public.my_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  m public.members%rowtype;
  ep record;
begin
  select * into m from public.members where id = auth.uid();
  if not found then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  select e.id, pos.name as position, e.start_date, e.public_display, e.picture_path
    into ep
    from public.executive_profiles e join public.executive_positions pos on pos.id = e.position_id
   where e.member_id = m.id and e.end_date is null order by e.start_date desc limit 1;
  return jsonb_build_object(
    'id', m.id, 'name', m.name, 'student_number', m.student_number, 'email', m.email,
    'phone', m.phone, 'status', m.status, 'role', public._top_role(m.id),
    'program', coalesce((select display_name from public.programs where id = m.program_id), m.program_raw),
    'year_of_study', m.year_of_study, 'semester_of_study', m.semester_of_study,
    'consent', m.exec_public_consent, 'consent_changed_at', m.exec_consent_changed_at,
    'executive', case when ep.id is null then null else jsonb_build_object(
        'profile_id', ep.id, 'position', ep.position, 'since', ep.start_date,
        'public_display', ep.public_display, 'picture_path', ep.picture_path) end);
end;
$$;

create or replace function public.set_my_consent(p_consent boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.ok_to_act() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not coalesce(p_consent, false) then
    -- withdrawing consent takes the person off the public page at once
    update public.executive_profiles set public_display = false where member_id = auth.uid() and public_display;
  end if;
  update public.members
     set exec_public_consent = coalesce(p_consent, false), exec_consent_changed_at = now()
   where id = auth.uid();
  perform public._audit('executive.consent_changed', 'core', 'member', auth.uid(), null,
                        jsonb_build_object('consent', coalesce(p_consent, false)), null);
end;
$$;

-- ---------------------------------------------------------------- programmes
create or replace function public.list_programs(p_only_unreviewed boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._need('program.manage');
  return (select coalesce(jsonb_agg(x order by x.is_reviewed, x.name), '[]'::jsonb) from (
    select p.id, p.display_name as name, p.is_reviewed, p.merged_into_id,
           (select t.display_name from public.programs t where t.id = p.merged_into_id) as merged_into,
           (select count(*) from public.members m where m.program_id = p.id and m.status in ('Active', 'Pending')) as members,
           (select coalesce(jsonb_agg(s.raw_text order by s.raw_text), '[]'::jsonb)
              from (select distinct raw_text from public.program_spellings where program_id = p.id limit 8) s) as spellings
      from public.programs p
     where (not p_only_unreviewed or not p.is_reviewed) and p.merged_into_id is null) x);
end;
$$;

create or replace function public.rename_program(p_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare old text;
begin
  perform public._need('program.manage');
  if length(btrim(coalesce(p_name, ''))) < 2 then
    raise exception 'a name is required' using errcode = '22023';
  end if;
  select display_name into old from public.programs where id = p_id;
  if not found then
    raise exception 'programme not found' using errcode = 'P0002';
  end if;
  update public.programs set display_name = btrim(p_name), is_reviewed = true where id = p_id;
  perform public._audit('program.renamed', 'core', 'program', p_id, jsonb_build_object('name', old), jsonb_build_object('name', btrim(p_name)), null);
end;
$$;

create or replace function public.mark_program_reviewed(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._need('program.manage');
  update public.programs set is_reviewed = true where id = p_id;
  if not found then
    raise exception 'programme not found' using errcode = 'P0002';
  end if;
  perform public._audit('program.reviewed', 'core', 'program', p_id, null, null, null);
end;
$$;

-- Joins a spelling variant to the programme it really is. Nothing is deleted: the old row stays,
-- marked as merged, and old attendance keeps the programme name it had at the time.
create or replace function public.merge_programs(p_source uuid, p_target uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.programs%rowtype;
  t public.programs%rowtype;
begin
  perform public._need('program.manage');
  if p_source = p_target then
    raise exception 'choose two different programmes' using errcode = '22023';
  end if;
  select * into s from public.programs where id = p_source for update;
  select * into t from public.programs where id = p_target for update;
  if s.id is null or t.id is null then
    raise exception 'programme not found' using errcode = 'P0002';
  end if;
  if s.merged_into_id is not null or t.merged_into_id is not null then
    raise exception 'one of these has already been merged' using errcode = '23514';
  end if;
  update public.programs set merged_into_id = p_target, is_reviewed = true where id = p_source;
  update public.program_spellings set program_id = p_target where program_id = p_source;
  update public.members set program_id = p_target where program_id = p_source;
  perform public._audit('program.merged', 'core', 'program', p_source,
                        jsonb_build_object('name', s.display_name), jsonb_build_object('into', t.display_name), nullif(btrim(coalesce(p_reason, '')), ''));
end;
$$;

-- ---------------------------------------------------------------- semesters
create or replace function public.list_semesters()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._need('semester.manage');
  return (select coalesce(jsonb_agg(to_jsonb(s) order by s.start_date desc), '[]'::jsonb)
            from (select id, name, start_date, end_date, is_current from public.semesters) s);
end;
$$;

create or replace function public.save_semester(p_id uuid, p_name text, p_start date, p_end date, p_current boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid := p_id;
begin
  perform public._need('semester.manage');
  if length(btrim(coalesce(p_name, ''))) < 2 or p_start is null or p_end is null or p_end < p_start then
    raise exception 'give a name and a start date before the end date' using errcode = '22023';
  end if;
  if coalesce(p_current, false) then
    update public.semesters set is_current = false where is_current and id is distinct from v_id;
  end if;
  if v_id is null then
    insert into public.semesters (name, start_date, end_date, is_current)
    values (btrim(p_name), p_start, p_end, coalesce(p_current, false)) returning id into v_id;
  else
    update public.semesters set name = btrim(p_name), start_date = p_start, end_date = p_end, is_current = coalesce(p_current, false)
     where id = v_id;
    if not found then
      raise exception 'semester not found' using errcode = 'P0002';
    end if;
  end if;
  perform public._audit('semester.saved', 'core', 'semester', v_id, null,
                        jsonb_build_object('name', btrim(p_name), 'start', p_start, 'end', p_end, 'current', coalesce(p_current, false)), null);
  return v_id;
end;
$$;

-- ---------------------------------------------------------------- who may call what
do $$
declare f text;
begin
  foreach f in array array[
    'list_role_people(text)', 'assign_role(uuid, text, text)', 'remove_role(uuid, text)',
    'list_executive_positions()', 'save_executive_position(uuid, text, boolean, integer, boolean)',
    'list_executives(boolean)', 'add_executive(uuid, uuid, date)', 'end_executive(uuid, text)',
    'set_executive_display(uuid, boolean)', 'my_profile()', 'set_my_consent(boolean)',
    'list_programs(boolean)', 'rename_program(uuid, text)', 'mark_program_reviewed(uuid)',
    'merge_programs(uuid, uuid, text)', 'list_semesters()', 'save_semester(uuid, text, date, date, boolean)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
