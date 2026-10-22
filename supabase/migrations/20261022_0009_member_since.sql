-- Migration 0009: correct a member's "Member since" date. Run AFTER 0008 (and after 0003). Safe to run twice.
alter table public.members add column if not exists member_since date;
update public.members set member_since = created_at::date where member_since is null;
alter table public.members alter column member_since set default current_date;
alter table public.members alter column member_since set not null;

create or replace function public.change_member_since(p_id uuid, p_date date, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare m public.members%rowtype;
begin
  perform public._need('member.edit_details');
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  if p_date is null or p_date > current_date then
    raise exception 'the date cannot be in the future' using errcode = '22023';
  end if;
  select * into m from public.members where id = p_id for update;
  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  update public.members set member_since = p_date where id = p_id;
  perform public._audit('member.since_changed', 'core', 'member', p_id,
                        jsonb_build_object('member_since', m.member_since), jsonb_build_object('member_since', p_date),
                        btrim(p_reason));
end;
$$;

revoke all on function public.change_member_since(uuid, date, text) from public, anon;
grant execute on function public.change_member_since(uuid, date, text) to authenticated;
