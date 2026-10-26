-- Only a Super Admin may change a Super Admin's account (status, details, student number).
-- Password resets are already guarded in the admin-reset-password function.

create or replace function public._guard_super_admin(p_target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
     where ur.user_id = p_target and ur.is_active and r.name = 'Super Admin'
  ) and not exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
     where ur.user_id = auth.uid() and ur.is_active and r.name = 'Super Admin'
  ) then
    raise exception 'Only a Super Admin can change a Super Admin''s account.' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public._guard_super_admin(uuid) from public, anon, authenticated;

do $$
declare f text; src text;
begin
  foreach f in array array[
    'set_member_status(uuid,text,text)',
    'update_member_details(uuid,text,text,text,smallint,smallint)',
    'change_student_number(uuid,text,text)'
  ] loop
    src := pg_get_functiondef(f::regprocedure);
    -- insert the guard right after the permission check
    src := regexp_replace(src, '(perform public\._need\([^)]*\);)', E'\\1\n  perform public._guard_super_admin(p_id);', '');
    execute src;
  end loop;
end $$;
