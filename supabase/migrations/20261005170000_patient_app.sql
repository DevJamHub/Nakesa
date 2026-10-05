-- Nakesa Patient: patient accounts for the patient mobile app (sibling repo NAKESAPATIENT).
--
-- Patients sign up in the app and get the role PATIENT. They search practices that
-- chose to be listed, look at services and free times, book, and cancel their own
-- appointments. Practices keep seeing every booking in Nakesa Pro, as before.
--
-- How the patient app maps onto the existing schema (nothing is duplicated):
--   appointments    → public.bookings (new columns link a booking to the patient's account)
--   health workers  → public.profiles + public.practice_members (role admin / nakes)
--   practice staff  → public.practice_members
--   services        → public.practice_services (new); a practice without its own services
--                     offers its profession's default services, as the booking page does
--   professions     → public.professions (new reference table; same keys as profiles.profession)
--   public.patients stays the practice's own patient records. Patient accounts live in
--   public.patient_profiles.
--
-- Access model
--   Patients read and edit their own patient_profiles row and read their own bookings (RLS).
--   Practice data reaches patients only through the patient_* functions at the bottom.
--   Like get_public_practice they return public columns only, and only for listed practices.
--   Booking and cancelling also go through functions, so their rules cannot be skipped.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column role text not null default 'HEALTH_WORKER'
    check (role in ('PATIENT', 'HEALTH_WORKER', 'PRACTICE_ADMIN', 'ADMIN'));

comment on column public.profiles.role is
  'PATIENT (Nakesa Patient), HEALTH_WORKER / PRACTICE_ADMIN (Nakesa Pro) or ADMIN. Set by the system; users cannot change it.';

update public.profiles p set role = 'PRACTICE_ADMIN'
where exists (select 1 from public.practices pr where pr.owner_id = p.id);

-- Users may only update the columns granted in earlier migrations, so role stays system-managed.

create function private.my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

-- Raises unless the caller is a signed-in patient; returns their user id.
create function private.require_patient()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or not exists (select 1 from public.profiles where id = v_uid and role = 'PATIENT') then
    raise exception 'Fitur ini khusus untuk akun pasien Nakesa Patient.';
  end if;
  return v_uid;
end;
$$;

-- A patient account cannot open a practice in Nakesa Pro.
create policy "Patients cannot open a practice" on public.practices
  as restrictive
  for insert to authenticated
  with check (private.my_role() is distinct from 'PATIENT');

-- The owner of a practice is its admin, and a practice admin in Nakesa Pro.
create or replace function private.add_owner_as_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.practice_members (practice_id, user_id, role)
  values (new.id, new.owner_id, 'admin')
  on conflict (practice_id, user_id) do update set role = 'admin';

  update public.profiles set role = 'PRACTICE_ADMIN'
  where id = new.owner_id and role = 'HEALTH_WORKER';
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Professions: reference list behind profiles.profession (same values as js/professions.js)
-- ---------------------------------------------------------------------------
create table public.professions (
  key              text primary key check (key ~ '^[a-z_]{2,40}$'),
  label            text not null check (char_length(label) between 1 and 60),
  title            text not null default '' check (char_length(title) <= 20),
  icon             text not null default '' check (char_length(icon) <= 16),
  color            text not null check (color ~ '^#[0-9a-f]{6}$'),
  default_services text[] not null default '{}',
  sort_order       smallint not null default 100,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.professions is
  'Professions of health workers. default_services is what a practice offers until it adds its own services.';

insert into public.professions (key, label, title, icon, color, default_services, sort_order) values
  ('bidan',            'Bidan',            'Bidan', '🤰',   '#b8456e',
   array['Periksa Kehamilan', 'KB', 'Imunisasi Anak', 'Periksa Bayi & Balita', 'Persalinan', 'Nifas', 'Konsultasi'], 10),
  ('dokter_umum',      'Dokter Umum',      'dr.',  '🩺',    '#236f9f',
   array['Konsultasi Umum', 'Cek Kesehatan', 'Surat Keterangan Sehat', 'Rawat Luka', 'Suntik / Injeksi'], 20),
  ('dokter_gigi',      'Dokter Gigi',      'drg.', '🦷',    '#12839a',
   array['Periksa Gigi', 'Tambal Gigi', 'Cabut Gigi', 'Scaling', 'Konsultasi'], 30),
  ('dokter_spesialis', 'Dokter Spesialis', 'dr.',  '👨‍⚕️', '#4c5fd5',
   array['Konsultasi', 'Kontrol', 'Tindakan'], 40),
  ('perawat',          'Perawat',          'Ns.',  '💉',    '#1f8a6a',
   array['Rawat Luka', 'Suntik / Injeksi', 'Cek Tensi & Gula Darah', 'Home Care', 'Pasang Infus'], 50),
  ('fisioterapis',     'Fisioterapis',     '',     '🦴',    '#b8661a',
   array['Terapi', 'Konsultasi', 'Home Visit'], 60),
  ('psikolog',         'Psikolog',         '',     '🧠',    '#7159c0',
   array['Konseling', 'Asesmen', 'Konsultasi Online'], 70),
  ('ahli_gizi',        'Ahli Gizi',        '',     '🥗',    '#4a8a2a',
   array['Konsultasi Gizi', 'Program Diet', 'Kontrol Berat Badan'], 80),
  ('lainnya',          'Lainnya',          '',     '➕',    '#236f9f',
   array['Konsultasi', 'Pemeriksaan', 'Tindakan'], 90);

alter table public.profiles
  add constraint profiles_profession_fkey foreign key (profession) references public.professions (key);

create index profiles_profession_idx on public.profiles (profession);

alter table public.professions enable row level security;

create policy "Everyone reads professions" on public.professions
  for select to anon, authenticated
  using (true);

revoke all on public.professions from anon, authenticated;
grant select on public.professions to anon, authenticated;

create trigger professions_set_updated_at before update on public.professions
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Practices: public profile for the patient app
-- ---------------------------------------------------------------------------
alter table public.practices
  add column description text check (char_length(description) <= 1000),
  add column city        text check (char_length(city) <= 80),
  add column province    text check (char_length(province) <= 80),
  add column latitude    numeric(9, 6) check (latitude between -90 and 90),
  add column longitude   numeric(9, 6) check (longitude between -180 and 180),
  add column is_listed   boolean not null default false,
  add constraint practices_location_pair check ((latitude is null) = (longitude is null));

comment on column public.practices.is_listed is
  'Shown in Nakesa Patient search. Off until the practice turns it on.';
comment on column public.practices.description is '"Tentang praktik" in Nakesa Patient.';

grant insert (description, city, province, latitude, longitude, is_listed),
      update (description, city, province, latitude, longitude, is_listed)
  on public.practices to authenticated;

create index practices_listed_city_idx on public.practices (city) where is_listed;

create function private.listed_practices()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.practices where is_listed;
$$;

-- ---------------------------------------------------------------------------
-- Practice services
-- ---------------------------------------------------------------------------
create table public.practice_services (
  id               uuid primary key default gen_random_uuid(),
  practice_id      uuid not null default private.current_practice_id()
                   references public.practices (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 80),
  description      text check (char_length(description) <= 500),
  price            bigint check (price >= 0 and price < 1000000000000),
  duration_minutes smallint not null default 30 check (duration_minutes between 5 and 480),
  is_active        boolean not null default true,
  sort_order       smallint not null default 100,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (practice_id, name)
);

comment on table public.practice_services is
  'Services a practice offers. Once a practice has any row here, its profession defaults are no longer offered.';
comment on column public.practice_services.price is
  'Whole rupiah. Null = no price shown ("tanya ke praktik"); never fill in made-up prices.';

alter table public.practice_services enable row level security;

create policy "Members read their services" on public.practice_services
  for select to authenticated
  using (practice_id in (select private.my_practices()));
create policy "Signed-in users read services of listed practices" on public.practice_services
  for select to authenticated
  using (is_active and practice_id in (select private.listed_practices()));
create policy "Health workers add services" on public.practice_services
  for insert to authenticated
  with check (practice_id in (select private.my_clinical_practices()));
create policy "Health workers edit services" on public.practice_services
  for update to authenticated
  using (practice_id in (select private.my_clinical_practices()))
  with check (practice_id in (select private.my_clinical_practices()));
create policy "Admins delete services" on public.practice_services
  for delete to authenticated
  using (practice_id in (select private.my_admin_practices()));

revoke all on public.practice_services from anon, authenticated;
grant select, delete on public.practice_services to authenticated;
grant insert (practice_id, name, description, price, duration_minutes, is_active, sort_order),
      update (name, description, price, duration_minutes, is_active, sort_order)
  on public.practice_services to authenticated;

create trigger practice_services_set_updated_at before update on public.practice_services
  for each row execute function private.set_updated_at();
create trigger practice_services_audit after insert or update or delete on public.practice_services
  for each row execute function private.write_audit_log();

-- ---------------------------------------------------------------------------
-- Patient profiles: personal data of a Nakesa Patient account (1:1 with profiles)
-- Name, email and photo stay in profiles; this holds what only patients have.
-- ---------------------------------------------------------------------------
create table public.patient_profiles (
  id           uuid primary key references public.profiles (id) on delete cascade,
  phone        text check (char_length(phone) <= 30),
  birth_date   date check (birth_date >= date '1900-01-01'),
  gender       text check (gender in ('L', 'P')),
  address      text check (char_length(address) <= 300),
  city         text check (char_length(city) <= 80),
  province     text check (char_length(province) <= 80),
  avatar_path  text check (char_length(avatar_path) <= 300),
  onboarded_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- The photo must be in the patient's own folder of the patient-avatars bucket.
  check (avatar_path is null or starts_with(avatar_path, id::text || '/'))
);

comment on table public.patient_profiles is
  'Only the patient can read this row. A practice sees the name and phone copied into each booking.';

alter table public.patient_profiles enable row level security;

create policy "Patients read their own profile" on public.patient_profiles
  for select to authenticated
  using ((select auth.uid()) = id);
create policy "Patients create their own profile" on public.patient_profiles
  for insert to authenticated
  with check ((select auth.uid()) = id and private.my_role() = 'PATIENT');
create policy "Patients update their own profile" on public.patient_profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No DELETE: the row goes when the account is deleted (cascade).
revoke all on public.patient_profiles from anon, authenticated;
grant select on public.patient_profiles to authenticated;
grant insert (id, phone, birth_date, gender, address, city, province, avatar_path, onboarded_at),
      update (phone, birth_date, gender, address, city, province, avatar_path, onboarded_at)
  on public.patient_profiles to authenticated;

create trigger patient_profiles_set_updated_at before update on public.patient_profiles
  for each row execute function private.set_updated_at();

-- Sign-up: the patient app sends app = 'nakesa_patient' in the user metadata. That can
-- only ever give the least-privileged role; every other sign-up is a health worker.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient boolean := coalesce(new.raw_user_meta_data ->> 'app' = 'nakesa_patient', false);
begin
  insert into public.profiles (id, full_name, email, avatar_url, role)
  values (
    new.id,
    left(nullif(trim(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )), ''), 120),
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    case when v_patient then 'PATIENT' else 'HEALTH_WORKER' end
  )
  on conflict (id) do nothing;

  if v_patient then
    insert into public.patient_profiles (id, phone)
    values (new.id, left(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 30))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profile photos: private bucket, one folder per patient (<user id>/...)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('patient-avatars', 'patient-avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Patients read their own photo" on storage.objects
  for select to authenticated
  using (bucket_id = 'patient-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Patients upload their own photo" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'patient-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Patients replace their own photo" on storage.objects
  for update to authenticated
  using (bucket_id = 'patient-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'patient-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Patients delete their own photo" on storage.objects
  for delete to authenticated
  using (bucket_id = 'patient-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Bookings made from the patient app
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column patient_user_id  uuid references public.profiles (id) on delete set null,
  add column service_id       uuid references public.practice_services (id) on delete set null,
  add column health_worker_id uuid references public.profiles (id) on delete set null,
  add column end_time         time,
  add constraint bookings_end_after_start
    check (end_time is null or (booking_time is not null and end_time > booking_time));

comment on column public.bookings.patient_user_id is
  'Nakesa Patient account that made the booking. Set only by patient_book_appointment().';

create index bookings_patient_date_idx on public.bookings (patient_user_id, booking_date)
  where patient_user_id is not null;
create index bookings_service_idx on public.bookings (service_id);
create index bookings_health_worker_idx on public.bookings (health_worker_id);

create policy "Patients read their own bookings" on public.bookings
  for select to authenticated
  using ((select auth.uid()) = patient_user_id);

-- Only patient_book_appointment() (which runs as the table owner) links a booking to a
-- patient account. Without this a practice could make bookings show up in a patient's app.
create function private.guard_booking_patient()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
     and new.patient_user_id is distinct from (case when tg_op = 'UPDATE' then old.patient_user_id end) then
    raise exception 'Booking tidak bisa dihubungkan ke akun pasien secara langsung.';
  end if;
  return new;
end;
$$;

create trigger bookings_guard_patient
  before insert or update of patient_user_id on public.bookings
  for each row execute function private.guard_booking_patient();

-- ---------------------------------------------------------------------------
-- Building blocks for the patient functions (not callable through the API)
-- ---------------------------------------------------------------------------
create function private.profession_json(p_key text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('key', f.key, 'label', f.label, 'title', f.title, 'icon', f.icon, 'color', f.color)
  from public.professions f
  where f.key = p_key;
$$;

-- Public facts about a practice (no slug, no settings, no patient or finance data).
create function private.practice_summary(p_practice_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', pr.id,
    'name', pr.name,
    'specialty', pr.specialty,
    'address', pr.address,
    'city', pr.city,
    'province', pr.province,
    'phone', pr.phone,
    'is_open', pr.is_open,
    'booking_enabled', pr.booking_enabled,
    'latitude', pr.latitude,
    'longitude', pr.longitude,
    'profession', private.profession_json(o.profession),
    'practitioner', jsonb_build_object('id', o.id, 'full_name', o.full_name, 'avatar_url', o.avatar_url)
  )
  from public.practices pr
  join public.profiles o on o.id = pr.owner_id
  where pr.id = p_practice_id;
$$;

create function private.practice_hours_json(p_practice_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'day', h.day_of_week,
           'opens', to_char(h.opens_at, 'HH24:MI'),
           'closes', to_char(h.closes_at, 'HH24:MI'))
         order by h.day_of_week, h.opens_at), '[]'::jsonb)
  from public.practices pr
  join public.practice_hours h on h.owner_id = pr.owner_id
  where pr.id = p_practice_id;
$$;

-- What a practice offers: its active services, or its profession's defaults (id null,
-- no price, 30 minutes) when it has not added any services of its own.
create function private.practice_offer(p_practice_id uuid)
returns table (id uuid, name text, description text, price bigint, duration_minutes integer, sort_key integer)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.name, s.description, s.price, s.duration_minutes::integer,
         (row_number() over (order by s.sort_order, s.name))::integer
  from public.practice_services s
  where s.practice_id = p_practice_id and s.is_active
  union all
  select null::uuid, d.name, null::text, null::bigint, 30, d.ord::integer
  from public.practices pr
  join public.profiles o on o.id = pr.owner_id
  join public.professions f on f.key = o.profession
  cross join lateral unnest(f.default_services) with ordinality as d (name, ord)
  where pr.id = p_practice_id
    and not exists (select 1 from public.practice_services s where s.practice_id = p_practice_id);
$$;

create function private.services_json(p_practice_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', o.id,
           'name', o.name,
           'description', o.description,
           'price', o.price,
           'duration_minutes', o.duration_minutes)
         order by o.sort_key), '[]'::jsonb)
  from private.practice_offer(p_practice_id) o;
$$;

-- Health workers of a practice: members with role admin (the owner) or nakes.
create function private.health_workers_json(p_practice_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', p.id,
           'full_name', p.full_name,
           'avatar_url', p.avatar_url,
           'profession', private.profession_json(p.profession))
         order by (m.role = 'admin') desc, p.full_name), '[]'::jsonb)
  from public.practice_members m
  join public.profiles p on p.id = m.user_id
  where m.practice_id = p_practice_id
    and m.role in ('admin', 'nakes')
    and p.full_name is not null;
$$;

-- Lower-case text a search looks through: names, profession, place, health workers, services.
create function private.practice_search_text(p_practice_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(concat_ws(' ',
    pr.name, pr.specialty, pr.address, pr.city, pr.province, f.label,
    (select string_agg(concat_ws(' ', pf.label, pf.title, p.full_name), ' ')
     from public.practice_members m
     join public.profiles p on p.id = m.user_id
     left join public.professions pf on pf.key = p.profession
     where m.practice_id = pr.id and m.role in ('admin', 'nakes')),
    (select string_agg(o.name, ' ') from private.practice_offer(pr.id) o)))
  from public.practices pr
  join public.profiles ow on ow.id = pr.owner_id
  left join public.professions f on f.key = ow.profession
  where pr.id = p_practice_id;
$$;

-- Time slots of one day: the practice hours cut into blocks of p_minutes. A slot is
-- available when it has not started yet (WIB) and no active booking overlaps it.
create function private.practice_slots(p_practice_id uuid, p_date date, p_minutes integer)
returns table (starts_at time, ends_at time, available boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with practice as (
    select owner_id from public.practices where id = p_practice_id
  ),
  slots as (
    select distinct s.ts
    from practice pr
    join public.practice_hours h
      on h.owner_id = pr.owner_id and h.day_of_week = extract(dow from p_date)::smallint
    cross join lateral generate_series(
      p_date + h.opens_at,
      p_date + h.closes_at - make_interval(mins => p_minutes),
      make_interval(mins => p_minutes)) as s (ts)
  )
  select s.ts::time,
         (s.ts + make_interval(mins => p_minutes))::time,
         s.ts > (now() at time zone 'Asia/Jakarta')
         and not exists (
           select 1
           from public.bookings b
           join practice pr on pr.owner_id = b.owner_id
           where b.booking_date = p_date
             and b.status in ('baru', 'dikonfirmasi')
             and b.booking_time is not null
             and p_date + b.booking_time < s.ts + make_interval(mins => p_minutes)
             and p_date + b.booking_time + coalesce(b.end_time - b.booking_time, interval '30 minutes') > s.ts)
  from slots s
  order by s.ts;
$$;

-- One appointment as the patient app shows it. can_cancel: still waiting or confirmed,
-- and the start time has not passed yet (WIB).
create function private.appointment_json(p_booking_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', b.id,
    'status', b.status,
    'date', b.booking_date,
    'start_time', to_char(b.booking_time, 'HH24:MI'),
    'end_time', to_char(b.end_time, 'HH24:MI'),
    'service', b.service,
    'service_id', b.service_id,
    'notes', b.complaint,
    'created_at', b.created_at,
    'updated_at', b.updated_at,
    'can_cancel', b.status in ('baru', 'dikonfirmasi')
                  and b.booking_date + coalesce(b.booking_time, time '23:59') > (now() at time zone 'Asia/Jakarta'),
    'practice', private.practice_summary(pr.id),
    'health_worker', (
      select jsonb_build_object('id', p.id, 'full_name', p.full_name, 'profession', private.profession_json(p.profession))
      from public.profiles p where p.id = b.health_worker_id)
  )
  from public.bookings b
  left join public.practices pr on pr.owner_id = b.owner_id
  where b.id = p_booking_id;
$$;

revoke all on function
  private.my_role(), private.require_patient(), private.listed_practices(),
  private.guard_booking_patient(), private.profession_json(text), private.practice_summary(uuid),
  private.practice_hours_json(uuid), private.practice_offer(uuid), private.services_json(uuid),
  private.health_workers_json(uuid), private.practice_search_text(uuid),
  private.practice_slots(uuid, date, integer), private.appointment_json(uuid)
  from public, anon, authenticated;

-- RLS policies run as the signed-in user, so these two must stay callable.
grant execute on function private.my_role(), private.listed_practices() to authenticated;

-- ---------------------------------------------------------------------------
-- Patient app functions (signed-in patients only; messages are shown as-is)
-- ---------------------------------------------------------------------------

-- Search listed practices. Every word must appear somewhere (name, profession, health
-- worker, service, place). p_city puts practices in the patient's city first.
create function public.patient_search_practices(
  p_query      text default null,
  p_profession text default null,
  p_city       text default null,
  p_limit      integer default 20,
  p_offset     integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_words text[] := array_remove(regexp_split_to_array(lower(trim(coalesce(p_query, ''))), '\s+'), '');
  v_city  text := lower(nullif(trim(p_city), ''));
begin
  perform private.require_patient();

  return coalesce((
    select jsonb_agg(private.practice_summary(hit.id) order by hit.pos)
    from (
      select pr.id,
             row_number() over (order by (lower(pr.city) = v_city) is true desc, pr.is_open desc, pr.name) as pos
      from public.practices pr
      join public.profiles ow on ow.id = pr.owner_id
      where pr.is_listed
        and (p_profession is null or ow.profession = p_profession)
        and not exists (
          select 1 from unnest(v_words) w
          where position(w in private.practice_search_text(pr.id)) = 0)
      order by pos
      limit least(greatest(coalesce(p_limit, 20), 1), 50)
      offset greatest(coalesce(p_offset, 0), 0)
    ) hit
  ), '[]'::jsonb);
end;
$$;

create function public.patient_get_practice(p_practice_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_description text;
begin
  perform private.require_patient();

  select description into v_description from public.practices where id = p_practice_id and is_listed;
  if not found then
    raise exception 'Praktik tidak ditemukan.';
  end if;

  return private.practice_summary(p_practice_id) || jsonb_build_object(
    'description', v_description,
    'hours', private.practice_hours_json(p_practice_id),
    'services', private.services_json(p_practice_id),
    'health_workers', private.health_workers_json(p_practice_id));
end;
$$;

-- A health worker's public profile: name, photo, profession and the listed practices
-- they work in (with hours and services). No email, no documents.
create function public.patient_get_health_worker(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  perform private.require_patient();

  select jsonb_build_object(
           'id', p.id,
           'full_name', p.full_name,
           'avatar_url', p.avatar_url,
           'profession', private.profession_json(p.profession),
           'practices', jsonb_agg(
             private.practice_summary(pr.id) || jsonb_build_object(
               'hours', private.practice_hours_json(pr.id),
               'services', private.services_json(pr.id))
             order by pr.name))
  into v_result
  from public.profiles p
  join public.practice_members m on m.user_id = p.id and m.role in ('admin', 'nakes')
  join public.practices pr on pr.id = m.practice_id and pr.is_listed
  where p.id = p_user_id and p.full_name is not null
  group by p.id;

  if v_result is null then
    raise exception 'Tenaga kesehatan tidak ditemukan.';
  end if;
  return v_result;
end;
$$;

-- Free times of one day. The slot length is the service's duration (30 minutes otherwise).
create function public.patient_available_slots(
  p_practice_id uuid,
  p_date        date,
  p_service_id  uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_minutes integer := 30;
  v_today   date := (now() at time zone 'Asia/Jakarta')::date;
begin
  perform private.require_patient();

  if not exists (select 1 from public.practices where id = p_practice_id and is_listed) then
    raise exception 'Praktik tidak ditemukan.';
  end if;
  if p_date is null or p_date < v_today or p_date > v_today + 60 then
    raise exception 'Pilih tanggal antara hari ini dan 60 hari ke depan.';
  end if;
  if p_service_id is not null then
    select duration_minutes into v_minutes
    from public.practice_services
    where id = p_service_id and practice_id = p_practice_id and is_active;
    if not found then
      raise exception 'Layanan tidak ditemukan.';
    end if;
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'start', to_char(s.starts_at, 'HH24:MI'),
             'end', to_char(s.ends_at, 'HH24:MI'),
             'available', s.available)
           order by s.starts_at)
    from private.practice_slots(p_practice_id, p_date, v_minutes) s
  ), '[]'::jsonb);
end;
$$;

-- Book an appointment. The practice receives it in Nakesa Pro as a new online booking
-- with the patient's name and phone from their profile.
create function public.patient_book_appointment(
  p_practice_id      uuid,
  p_date             date,
  p_time             time,
  p_service_id       uuid default null,
  p_service_name     text default null,
  p_health_worker_id uuid default null,
  p_notes            text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid          uuid := private.require_patient();
  v_today        date := (now() at time zone 'Asia/Jakarta')::date;
  v_owner        uuid;
  v_enabled      boolean;
  v_name         text;
  v_phone        text;
  v_service_id   uuid;
  v_service_name text;
  v_minutes      integer := 30;
  v_id           uuid;
begin
  select owner_id, booking_enabled into v_owner, v_enabled
  from public.practices
  where id = p_practice_id and is_listed;

  if v_owner is null then
    raise exception 'Praktik tidak ditemukan.';
  end if;
  if not v_enabled then
    raise exception 'Booking online sedang ditutup. Silakan hubungi praktik langsung.';
  end if;

  select nullif(trim(p.full_name), ''), nullif(trim(pp.phone), '') into v_name, v_phone
  from public.profiles p
  left join public.patient_profiles pp on pp.id = p.id
  where p.id = v_uid;
  if v_name is null or v_phone is null then
    raise exception 'Lengkapi nama dan nomor HP di profil Anda dulu.';
  end if;

  if p_date is null or p_date < v_today or p_date > v_today + 60 then
    raise exception 'Pilih tanggal antara hari ini dan 60 hari ke depan.';
  end if;
  if p_time is null then
    raise exception 'Pilih jam janji temu.';
  end if;

  -- The service must be one the practice offers: by id, or by name (profession defaults have no id).
  if p_service_id is not null or nullif(trim(p_service_name), '') is not null then
    select o.id, o.name, o.duration_minutes into v_service_id, v_service_name, v_minutes
    from private.practice_offer(p_practice_id) o
    where (p_service_id is not null and o.id = p_service_id)
       or (p_service_id is null and o.name = trim(p_service_name))
    limit 1;
    if v_service_name is null then
      raise exception 'Layanan tidak ditemukan. Pilih layanan lain.';
    end if;
  elsif exists (select 1 from private.practice_offer(p_practice_id)) then
    raise exception 'Pilih layanan dulu.';
  end if;

  if p_health_worker_id is not null and not exists (
    select 1 from public.practice_members
    where practice_id = p_practice_id and user_id = p_health_worker_id and role in ('admin', 'nakes')
  ) then
    raise exception 'Tenaga kesehatan tidak ditemukan di praktik ini.';
  end if;

  -- One booking per time slot: bookings for the same practice and day wait for each other.
  perform pg_advisory_xact_lock(hashtextextended(p_practice_id::text || p_date::text, 0));

  if not exists (
    select 1 from private.practice_slots(p_practice_id, p_date, v_minutes) s
    where s.starts_at = p_time and s.available
  ) then
    raise exception 'Jam ini sudah tidak tersedia. Pilih jam lain.';
  end if;

  if (select count(*) from public.bookings
      where patient_user_id = v_uid
        and owner_id = v_owner
        and status in ('baru', 'dikonfirmasi')
        and booking_date >= v_today) >= 3 then
    raise exception 'Anda sudah punya 3 janji temu aktif di praktik ini. Batalkan salah satu atau hubungi praktik.';
  end if;

  insert into public.bookings (owner_id, patient_name, patient_phone, booking_date, booking_time, end_time,
                               service, service_id, health_worker_id, complaint, status, source, patient_user_id)
  values (v_owner, left(v_name, 120), left(v_phone, 30), p_date, p_time, p_time + make_interval(mins => v_minutes),
          v_service_name, v_service_id, p_health_worker_id, left(nullif(trim(p_notes), ''), 500),
          'baru', 'online', v_uid)
  returning id into v_id;

  return v_id;
end;
$$;

-- The patient's appointments (newest 200), oldest first.
create function public.patient_list_appointments()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_patient();
begin
  return coalesce((
    select jsonb_agg(private.appointment_json(b.id) order by b.booking_date, b.booking_time nulls last)
    from (
      select id, booking_date, booking_time
      from public.bookings
      where patient_user_id = v_uid
      order by booking_date desc, booking_time desc nulls first
      limit 200
    ) b
  ), '[]'::jsonb);
end;
$$;

create function public.patient_get_appointment(p_booking_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_patient();
begin
  if not exists (select 1 from public.bookings where id = p_booking_id and patient_user_id = v_uid) then
    raise exception 'Janji temu tidak ditemukan.';
  end if;
  return private.appointment_json(p_booking_id);
end;
$$;

-- Cancel: the booking is kept (status batal) so both sides keep the history.
create function public.patient_cancel_appointment(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := private.require_patient();
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings
  where id = p_booking_id and patient_user_id = v_uid
  for update;

  if not found then
    raise exception 'Janji temu tidak ditemukan.';
  end if;
  if v_booking.status not in ('baru', 'dikonfirmasi') then
    raise exception 'Janji temu ini sudah tidak bisa dibatalkan.';
  end if;
  if v_booking.booking_date + coalesce(v_booking.booking_time, time '23:59') <= (now() at time zone 'Asia/Jakarta') then
    raise exception 'Janji temu yang sudah lewat tidak bisa dibatalkan.';
  end if;

  update public.bookings set status = 'batal' where id = p_booking_id;
end;
$$;

revoke all on function
  public.patient_search_practices(text, text, text, integer, integer),
  public.patient_get_practice(uuid),
  public.patient_get_health_worker(uuid),
  public.patient_available_slots(uuid, date, uuid),
  public.patient_book_appointment(uuid, date, time, uuid, text, uuid, text),
  public.patient_list_appointments(),
  public.patient_get_appointment(uuid),
  public.patient_cancel_appointment(uuid)
  from public, anon;
grant execute on function
  public.patient_search_practices(text, text, text, integer, integer),
  public.patient_get_practice(uuid),
  public.patient_get_health_worker(uuid),
  public.patient_available_slots(uuid, date, uuid),
  public.patient_book_appointment(uuid, date, time, uuid, text, uuid, text),
  public.patient_list_appointments(),
  public.patient_get_appointment(uuid),
  public.patient_cancel_appointment(uuid)
  to authenticated;
