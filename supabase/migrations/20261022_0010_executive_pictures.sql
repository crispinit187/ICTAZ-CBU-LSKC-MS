-- Migration 0010: executive profile pictures. Run AFTER 0009 (and re-run 0005 once: it now lists pictures).
-- Pictures live in a storage area called executive-pictures. Each file is named <member id>/<random>.jpg,
-- so an address cannot be guessed. Only the executive can write to their own folder.
-- The public page shows a picture only for an executive who has consented AND been switched on.

-- ---------------------------------------------------------------- storage area and rules
do $$
begin
  if to_regclass('storage.objects') is null then
    raise notice 'storage schema not found: skipping the storage area (only expected on a test database)';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('executive-pictures', 'executive-pictures', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update
    set public = true, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

  drop policy if exists "exec pictures insert own" on storage.objects;
  create policy "exec pictures insert own" on storage.objects for insert to authenticated
    with check (
      bucket_id = 'executive-pictures'
      and (storage.foldername(name))[1] = auth.uid()::text
      and public.ok_to_act()
      and exists (select 1 from public.executive_profiles ep where ep.member_id = auth.uid() and ep.end_date is null)
    );

  drop policy if exists "exec pictures delete own" on storage.objects;
  create policy "exec pictures delete own" on storage.objects for delete to authenticated
    using (bucket_id = 'executive-pictures' and (storage.foldername(name))[1] = auth.uid()::text);
end $$;

-- ---------------------------------------------------------------- save or remove my picture
-- Both return the previous file name so the browser can delete the old file.
create or replace function public.set_my_picture(p_path text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  ep public.executive_profiles%rowtype;
begin
  if auth.uid() is null or not public.ok_to_act() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into ep from public.executive_profiles
   where member_id = auth.uid() and end_date is null order by start_date desc limit 1 for update;
  if not found then
    raise exception 'only an executive can add a picture' using errcode = '42501';
  end if;
  if p_path is null or p_path !~ ('^' || auth.uid()::text || '/[A-Za-z0-9._-]{8,80}$') then
    raise exception 'invalid picture' using errcode = '22023';
  end if;
  update public.executive_profiles set picture_path = p_path where id = ep.id;
  perform public._audit('executive.picture_changed', 'executives', 'executive_profile', auth.uid(), null, null, null);
  return ep.picture_path;
end;
$$;

create or replace function public.clear_my_picture()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  ep public.executive_profiles%rowtype;
begin
  if auth.uid() is null or not public.ok_to_act() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into ep from public.executive_profiles
   where member_id = auth.uid() and end_date is null order by start_date desc limit 1 for update;
  if not found then
    raise exception 'only an executive can change a picture' using errcode = '42501';
  end if;
  update public.executive_profiles set picture_path = null where id = ep.id;
  perform public._audit('executive.picture_removed', 'executives', 'executive_profile', auth.uid(), null, null, null);
  return ep.picture_path;
end;
$$;

revoke all on function public.set_my_picture(text) from public, anon;
revoke all on function public.clear_my_picture() from public, anon;
grant execute on function public.set_my_picture(text) to authenticated;
grant execute on function public.clear_my_picture() to authenticated;

-- ---------------------------------------------------------------- the public page now also gets the picture
drop function if exists public.public_executives();
create function public.public_executives()
returns table (name text, title text, picture text)
language sql
stable
security definer
set search_path = public
as $$
  select m.name, pos.name, ep.picture_path
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
