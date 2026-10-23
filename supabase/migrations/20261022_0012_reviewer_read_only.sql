-- Migration 0012: Reviewers can look at registrations (read only), and members and sessions.
-- Run AFTER 0011. Safe to run again.
--
-- * New permission registration.view: list the registrations waiting for approval, without being
--   able to approve, decline or reopen them. Shows name, student number, programme and year only.
-- * Reviewers get member.view (the short member list: name, student number, programme, status;
--   no email or phone) and registration.view. They get no export and no create or edit rights.
-- * Anyone who already has account.approve (Administrator, Super Admin) sees the full list as before.

insert into public.permissions (code, description)
select 'registration.view', 'See the list of registrations waiting for approval, read only'
 where not exists (select 1 from public.permissions where code = 'registration.view');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
  from public.roles r
  join public.permissions p on p.code in ('member.view', 'registration.view')
 where r.name = 'Reviewer'
   and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id);

-- Reviewers never export.
delete from public.role_permissions rp
 using public.roles r, public.permissions p
 where rp.role_id = r.id and rp.permission_id = p.id
   and r.name = 'Reviewer' and p.code in ('analytics.export');

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
declare v_full boolean := public.has_permission('account.approve');
begin
  if not v_full and not public.has_permission('registration.view') then
    perform public._need('account.approve');
  end if;
  if not public.ok_to_act() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_status not in ('Pending', 'Rejected') then
    raise exception 'status must be Pending or Rejected' using errcode = '22023';
  end if;
  return query
    select m.id, m.name, m.student_number,
           case when v_full then m.email::text end,
           case when v_full then coalesce((select ai.method::text from public.auth_identities ai
                      where ai.member_id = m.id and ai.is_active order by ai.linked_at limit 1), 'password') end,
           coalesce(p.display_name, m.program_raw),
           m.year_of_study, m.semester_of_study,
           case when v_full then m.email_verified_at is not null end,
           m.created_at, m.status::text,
           case when v_full then m.status_reason end
      from public.members m
      left join public.programs p on p.id = m.program_id
     where m.status = p_status::public.account_status
     order by m.created_at;
end;
$$;

create or replace function public.pending_count()
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_permission('account.approve') and not public.has_permission('registration.view') then
    perform public._need('account.approve');
  end if;
  if not public.ok_to_act() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return (select count(*)::integer from public.members where status = 'Pending');
end;
$$;
