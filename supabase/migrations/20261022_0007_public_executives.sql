-- Migration 0007: the public executives page. Run AFTER 0006. Safe to run twice.
-- Anyone, signed in or not, may call public_executives(). It returns only a name and a position,
-- and only for an executive who has given consent AND whom an Administrator has switched on.
create or replace function public.public_executives()
returns table (name text, title text)
language sql
stable
security definer
set search_path = public
as $$
  select m.name, pos.name
    from public.executive_profiles ep
    join public.members m on m.id = ep.member_id
    join public.executive_positions pos on pos.id = ep.position_id
   where ep.end_date is null
     and ep.public_display
     and m.exec_public_consent
     and m.status = 'Active'
   order by pos.display_order, pos.name, m.name;
$$;

revoke all on function public.public_executives() from public;
grant execute on function public.public_executives() to anon, authenticated;
