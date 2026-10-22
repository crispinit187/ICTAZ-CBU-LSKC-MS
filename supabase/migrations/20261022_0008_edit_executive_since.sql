-- Migration 0008: correct the "since" date of an executive profile. Run AFTER 0007. Safe to run twice.
-- A real change of position still creates a new profile; this only fixes a wrong start date.
create or replace function public.update_executive_since(p_profile uuid, p_start date, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare ep public.executive_profiles%rowtype;
begin
  perform public._need('executive_profile.manage');
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  select * into ep from public.executive_profiles where id = p_profile for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  if p_start is null or p_start > current_date then
    raise exception 'the date cannot be in the future' using errcode = '22023';
  end if;
  if ep.end_date is not null and p_start > ep.end_date then
    raise exception 'the start date cannot be after the end date' using errcode = '22023';
  end if;
  update public.executive_profiles set start_date = p_start where id = p_profile;
  perform public._audit('executive.since_changed', 'executives', 'executive_profile', ep.member_id,
                        jsonb_build_object('start_date', ep.start_date), jsonb_build_object('start_date', p_start),
                        btrim(p_reason));
end;
$$;

revoke all on function public.update_executive_since(uuid, date, text) from public, anon;
grant execute on function public.update_executive_since(uuid, date, text) to authenticated;
