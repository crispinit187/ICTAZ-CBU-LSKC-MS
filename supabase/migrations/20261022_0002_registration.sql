-- Migration 0002: registration, programmes and Google sign-up.
-- Run in the Supabase SQL Editor AFTER migration 0001. Safe to run twice.
--
-- Adds:
--   1. normalise_program() and resolve_program(): group spelling variations (SRS 8.2) and
--      never delete a programme (new text becomes a new, unreviewed programme).
--   2. handle_new_user() now fills program_id and tolerates a badly formatted phone.
--   3. programs_public(): programme names with member counts, for the Register page.
--   4. student_number_available(): lets the Register page say a number is taken.
--   5. register_google_member(): a person who signed in with Google finishes registering.

-- ---------------------------------------------------------------- 1. programme grouping
create or replace function public.normalise_program(t text)
returns text
language sql
immutable
set search_path = public
as $$
  select coalesce(string_agg(w, ' ' order by ord), '')
    from regexp_split_to_table(
           regexp_replace(replace(lower(coalesce(t, '')), '&', ' and '), '[^a-z0-9]+', ' ', 'g'),
           '\s+'
         ) with ordinality as x(w, ord)
   where w <> ''
     and w not in ('of','in','the','and','programme','program','bachelor','bachelors','bsc',
                   'beng','btech','diploma','degree','honours','hons','masters','msc');
$$;

-- Turns 0971234567, 260971234567, +260 97 123 4567 into +260971234567. Anything else becomes null.
create or replace function public.normalise_phone(t text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when d is null or d = '' then null
    when d ~ '^260[0-9]{9}$' then '+' || d
    when d ~ '^0[0-9]{9}$' then '+260' || substr(d, 2)
    when d ~ '^[0-9]{9}$' then '+260' || d
    else null
  end
  from (select regexp_replace(coalesce(t, ''), '[^0-9]', '', 'g') as d) x;
$$;

create or replace function public.resolve_program(raw text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  k text := public.normalise_program(raw);
  pid uuid;
  nxt uuid;
begin
  if k = '' then
    return null;
  end if;

  select program_id into pid from public.program_spellings where normalised = k;
  if pid is null then
    select id into pid from public.programs where normalised_key = k;
  end if;
  if pid is null then
    insert into public.programs (display_name, normalised_key)
    values (initcap(k), k)
    on conflict (normalised_key) do update set normalised_key = excluded.normalised_key
    returning id into pid;
  end if;

  -- follow merges to the surviving programme
  loop
    select merged_into_id into nxt from public.programs where id = pid;
    exit when nxt is null;
    pid := nxt;
  end loop;

  insert into public.program_spellings (raw_text, normalised, program_id)
  values (btrim(raw), k, pid)
  on conflict (normalised) do nothing;

  return pid;
end;
$$;

revoke all on function public.resolve_program(text) from public, anon, authenticated;

-- ---------------------------------------------------------------- 2. sign-up trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_phone text := public.normalise_phone(meta ->> 'phone');
  v_prog text := nullif(btrim(meta ->> 'program'), '');
begin
  -- Google sign-in must never create or activate an account (GS-02).
  if coalesce(new.raw_app_meta_data ->> 'provider', 'email') <> 'email' then
    return new;
  end if;

  insert into public.members (
    id, name, student_number, email, email_verified_at, phone,
    program_id, program_raw, year_of_study, semester_of_study, status
  ) values (
    new.id,
    coalesce(nullif(btrim(meta ->> 'name'), ''), split_part(new.email, '@', 1)),
    nullif(meta ->> 'student_number', ''),
    new.email,
    new.email_confirmed_at,
    v_phone,
    case when v_prog is null then null else public.resolve_program(v_prog) end,
    v_prog,
    nullif(meta ->> 'year_of_study', '')::smallint,
    nullif(meta ->> 'semester_of_study', '')::smallint,
    'Pending'
  );

  insert into public.user_roles (user_id, role_id)
  select new.id, r.id from public.roles r where r.name = 'Member';

  insert into public.auth_identities (member_id, method, provider_email)
  values (new.id, 'password', new.email);

  return new;
end;
$$;

-- ---------------------------------------------------------------- 3. programme list for the form
create or replace function public.programs_public()
returns table (name text, members bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.display_name, count(m.id)
    from public.programs p
    left join public.members m
           on m.program_id = p.id and m.status in ('Active', 'Pending')
   where p.merged_into_id is null
   group by p.id, p.display_name
   order by count(m.id) desc, p.display_name;
$$;

grant execute on function public.programs_public() to anon, authenticated;

-- ---------------------------------------------------------------- 4. student number check
create or replace function public.student_number_available(p_number text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.members where student_number = p_number);
$$;

grant execute on function public.student_number_available(text) to anon, authenticated;

-- ---------------------------------------------------------------- 5. Google sign-up
create or replace function public.register_google_member(
  p_name text,
  p_student_number text,
  p_phone text,
  p_program text,
  p_year smallint,
  p_semester smallint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_user auth.users%rowtype;
  v_phone text := public.normalise_phone(p_phone);
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  select * into v_user from auth.users where id = v_uid;
  if not found or coalesce(v_user.raw_app_meta_data ->> 'provider', '') <> 'google' then
    raise exception 'only a Google sign-in can finish registration here' using errcode = '42501';
  end if;
  if exists (select 1 from public.members where id = v_uid) then
    raise exception 'already registered' using errcode = '23505';
  end if;
  if nullif(btrim(coalesce(p_phone, '')), '') is not null and v_phone is null then
    raise exception 'phone must look like +260971234567' using errcode = '22023';
  end if;

  insert into public.members (
    id, name, student_number, email, email_verified_at, phone,
    program_id, program_raw, year_of_study, semester_of_study, status
  ) values (
    v_uid, btrim(p_name), btrim(p_student_number), v_user.email, v_user.email_confirmed_at, v_phone,
    public.resolve_program(p_program), btrim(p_program), p_year, p_semester, 'Pending'
  );

  insert into public.user_roles (user_id, role_id)
  select v_uid, r.id from public.roles r where r.name = 'Member';

  insert into public.auth_identities (member_id, method, provider_email)
  values (v_uid, 'google', v_user.email);
end;
$$;

revoke all on function public.register_google_member(text, text, text, text, smallint, smallint) from public, anon;
grant execute on function public.register_google_member(text, text, text, text, smallint, smallint) to authenticated;

-- ---------------------------------------------------------------- 6. Terms text for the public pages
create or replace function public.latest_terms(p_doc_type public.terms_doc_type)
returns table (version text, body text, published_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select t.version, t.body, t.published_at
    from public.terms_versions t
   where t.doc_type = p_doc_type
   order by t.published_at desc
   limit 1;
$$;

grant execute on function public.latest_terms(public.terms_doc_type) to anon, authenticated;
