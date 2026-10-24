-- Migration 0013: roles for any member, and Registrar privileges on top of another role.
-- Run AFTER 0012. Safe to run again.
--
-- * Any Active member can be given any role (no executive profile needed). Only people who hold
--   role.assign (Super Admin) can assign or remove roles.
-- * A person has one main role (Super Admin, Administrator, Reviewer, or a future one such as
--   Finance or Auditor) and may also hold Registrar privileges on top of it. Super Admin and
--   Administrator already include everything a Registrar can do.
-- * Roles are no longer removed automatically when an executive profile ends.
-- * Registrar privileges now include the QR display.

-- One active role of each kind, one active main role (Registrar is the add-on, so it is excluded).
drop index if exists public.one_active_staff_role;
create unique index if not exists one_active_role_each
  on public.user_roles (user_id, role_id) where is_active and role_id <> 1;
create unique index if not exists one_active_main_role
  on public.user_roles (user_id) where is_active and role_id not in (1, 2);

-- Roles no longer depend on executive profiles.
create or replace function public.enforce_role_requires_exec()
returns trigger language plpgsql set search_path = public as $$
begin
  return new;
end;
$$;

create or replace function public.cleanup_role_on_exec_end()
returns trigger language plpgsql set search_path = public as $$
begin
  return new;
end;
$$;

-- Registrar privileges include the QR display.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.code = 'session.qr_display'
 where r.name = 'Registrar'
   and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id);

-- A person's active roles, strongest first (Member left out).
create or replace function public._role_names(p_user uuid)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(x.name order by x.o), '{}'::text[]) from (
    select r.name,
           case r.name when 'Super Admin' then 1 when 'Administrator' then 2
                       when 'Reviewer' then 3 when 'Registrar' then 4 else 5 end as o
      from public.user_roles ur join public.roles r on r.id = ur.role_id
     where ur.user_id = p_user and ur.is_active and r.name <> 'Member') x;
$$;
revoke all on function public._role_names(uuid) from public, anon, authenticated;

create or replace function public.list_assignable_roles()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._need('role.assign');
  return (select coalesce(jsonb_agg(r.name order by r.id), '[]'::jsonb) from public.roles r where r.name <> 'Member');
end;
$$;

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
           to_jsonb(public._role_names(m.id)) as roles,
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
  v_role_id smallint;
  v_before text[];
  v_after text[];
begin
  perform public._need('role.assign');
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  if p_member = auth.uid() then
    raise exception 'you cannot change your own role' using errcode = '42501';
  end if;
  select id into v_role_id from public.roles where name = p_role and name <> 'Member';
  if v_role_id is null then
    raise exception 'choose a role from the list' using errcode = '22023';
  end if;
  select * into m from public.members where id = p_member;
  if not found or m.status <> 'Active' then
    raise exception 'only an Active member can be given a role' using errcode = '23514';
  end if;
  v_before := public._role_names(p_member);
  if p_role = any (v_before) then
    raise exception 'they already have that role' using errcode = '23505';
  end if;

  if p_role = 'Registrar' then
    if v_before && array['Super Admin', 'Administrator'] then
      raise exception '% already has Registrar duties through their role', m.name using errcode = '23514';
    end if;
    insert into public.user_roles (user_id, role_id, assigned_by) values (p_member, v_role_id, auth.uid());
  else
    -- a new main role replaces the old main role; Registrar privileges stay unless the new role includes them
    update public.user_roles set is_active = false
     where user_id = p_member and is_active
       and role_id in (select id from public.roles where name not in ('Member', 'Registrar'));
    if p_role in ('Super Admin', 'Administrator') then
      update public.user_roles set is_active = false
       where user_id = p_member and is_active and role_id = (select id from public.roles where name = 'Registrar');
    end if;
    insert into public.user_roles (user_id, role_id, assigned_by) values (p_member, v_role_id, auth.uid());
  end if;

  v_after := public._role_names(p_member);
  insert into public.role_assignment_history (user_id, previous_role, new_role, actor_id, reason)
  values (p_member, coalesce(nullif(array_to_string(v_before, ' + '), ''), 'Member'),
          array_to_string(v_after, ' + '), auth.uid(), btrim(p_reason));
  perform public._audit('role.assigned', 'core', 'member', p_member,
                        jsonb_build_object('roles', to_jsonb(v_before)), jsonb_build_object('roles', to_jsonb(v_after)), btrim(p_reason));
  perform public._queue_email('role_changed', m.email::text,
                              jsonb_build_object('name', m.name, 'role', array_to_string(v_after, ' + ')));
end;
$$;

drop function if exists public.remove_role(uuid, text);
create or replace function public.remove_role(p_member uuid, p_reason text, p_role text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.members%rowtype;
  v_before text[];
  v_after text[];
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
  v_before := public._role_names(p_member);
  if coalesce(array_length(v_before, 1), 0) = 0 then
    raise exception 'they have no role to remove' using errcode = 'P0002';
  end if;
  if p_role is not null and not (p_role = any (v_before)) then
    raise exception 'they do not have that role' using errcode = 'P0002';
  end if;
  update public.user_roles set is_active = false
   where user_id = p_member and is_active
     and role_id <> (select id from public.roles where name = 'Member')
     and (p_role is null or role_id = (select id from public.roles where name = p_role));
  v_after := public._role_names(p_member);
  insert into public.role_assignment_history (user_id, previous_role, new_role, actor_id, reason)
  values (p_member, array_to_string(v_before, ' + '), coalesce(nullif(array_to_string(v_after, ' + '), ''), 'Member'),
          auth.uid(), btrim(p_reason));
  perform public._audit('role.removed', 'core', 'member', p_member,
                        jsonb_build_object('roles', to_jsonb(v_before)), jsonb_build_object('roles', to_jsonb(v_after)), btrim(p_reason));
  perform public._queue_email('role_changed', m.email::text,
                              jsonb_build_object('name', m.name, 'role', coalesce(nullif(array_to_string(v_after, ' + '), ''), 'Member')));
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['list_assignable_roles()', 'list_role_people(text)', 'assign_role(uuid, text, text)', 'remove_role(uuid, text, text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
