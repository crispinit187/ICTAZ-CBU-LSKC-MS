-- 0011: fix executive picture uploads.
-- The storage insert rule read executive_profiles directly, but the signed-in
-- role has no table access (the app uses secured functions only), so every
-- upload failed with "permission denied". Use a yes/no secured function instead.

create or replace function public.is_active_executive()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.executive_profiles ep
     where ep.member_id = auth.uid() and ep.end_date is null
  );
$$;

revoke all on function public.is_active_executive() from public;
grant execute on function public.is_active_executive() to authenticated;

do $$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists "exec pictures insert own" on storage.objects;
    create policy "exec pictures insert own" on storage.objects for insert to authenticated
      with check (
        bucket_id = 'executive-pictures'
        and (storage.foldername(name))[1] = auth.uid()::text
        and public.ok_to_act()
        and public.is_active_executive()
      );
  end if;
end $$;
