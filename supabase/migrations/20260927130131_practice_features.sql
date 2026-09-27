-- NAKESA practice features: profession, practice profile, patients, finance,
-- medicine stock, practice hours and online booking.
--
-- Every row belongs to one user (owner_id). RLS lets each user read and write
-- only their own rows. Patients book through two public functions at the
-- bottom, which expose only what the booking page needs.

-- ---------------------------------------------------------------------------
-- Profession (on the user's profile)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column profession text check (profession in (
    'bidan', 'dokter_umum', 'dokter_gigi', 'dokter_spesialis', 'perawat',
    'fisioterapis', 'psikolog', 'ahli_gizi', 'lainnya'
  ));

grant update (profession) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Practices: one per user
-- ---------------------------------------------------------------------------
create table public.practices (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 120),
  specialty       text check (char_length(specialty) <= 120),
  address         text check (char_length(address) <= 300),
  phone           text check (char_length(phone) <= 30),
  is_open         boolean not null default false,
  booking_enabled boolean not null default true,
  booking_slug    text not null unique
                  default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)
                  check (booking_slug ~ '^[a-z0-9-]{4,40}$'),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column public.practices.booking_slug is 'Public id used in the booking link (book.html?p=...).';

-- ---------------------------------------------------------------------------
-- Patients
-- ---------------------------------------------------------------------------
create table public.patients (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  full_name  text not null check (char_length(full_name) between 1 and 120),
  gender     text check (gender in ('L', 'P')),
  birth_date date,
  phone      text check (char_length(phone) <= 30),
  address    text check (char_length(address) <= 300),
  notes      text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patients_owner_name_idx on public.patients (owner_id, full_name);

-- ---------------------------------------------------------------------------
-- Finance: money in (masuk) and out (keluar), whole rupiah
-- ---------------------------------------------------------------------------
create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('masuk', 'keluar')),
  amount      bigint not null check (amount > 0 and amount < 1000000000000),
  category    text not null check (char_length(category) between 1 and 60),
  note        text check (char_length(note) <= 300),
  occurred_on date not null default ((now() at time zone 'Asia/Jakarta')::date),
  created_at  timestamptz not null default now()
);

create index transactions_owner_date_idx on public.transactions (owner_id, occurred_on desc);

-- ---------------------------------------------------------------------------
-- Medicine stock
-- ---------------------------------------------------------------------------
create table public.medicines (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 120),
  unit       text not null default 'pcs' check (char_length(unit) between 1 and 20),
  stock      integer not null default 0 check (stock >= 0),
  min_stock  integer not null default 5 check (min_stock >= 0),
  price      bigint check (price >= 0),
  expires_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index medicines_owner_name_idx on public.medicines (owner_id, name);

-- ---------------------------------------------------------------------------
-- Practice hours: one row per session (e.g. Monday 07:00–12:00 and 16:00–20:00)
-- day_of_week: 0 = Sunday … 6 = Saturday
-- ---------------------------------------------------------------------------
create table public.practice_hours (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at    time not null,
  closes_at   time not null,
  check (closes_at > opens_at),
  unique (owner_id, day_of_week, opens_at)
);

-- ---------------------------------------------------------------------------
-- Bookings: made online by patients (via create_booking) or manually by the owner
-- ---------------------------------------------------------------------------
create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  patient_name  text not null check (char_length(patient_name) between 1 and 120),
  patient_phone text not null check (char_length(patient_phone) between 1 and 30),
  booking_date  date not null,
  booking_time  time,
  service       text check (char_length(service) <= 80),
  complaint     text check (char_length(complaint) <= 500),
  status        text not null default 'baru' check (status in ('baru', 'dikonfirmasi', 'selesai', 'batal')),
  source        text not null default 'manual' check (source in ('online', 'manual')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index bookings_owner_date_idx on public.bookings (owner_id, booking_date);

-- ---------------------------------------------------------------------------
-- Row Level Security: owners only
-- ---------------------------------------------------------------------------
alter table public.practices      enable row level security;
alter table public.patients       enable row level security;
alter table public.transactions   enable row level security;
alter table public.medicines      enable row level security;
alter table public.practice_hours enable row level security;
alter table public.bookings       enable row level security;

create policy "Owners manage their practice" on public.practices
  for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "Owners manage their patients" on public.patients
  for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "Owners manage their transactions" on public.transactions
  for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "Owners manage their medicines" on public.medicines
  for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "Owners manage their practice hours" on public.practice_hours
  for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "Owners manage their bookings" on public.bookings
  for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- Data API privileges: anon gets nothing; owner_id always comes from auth.uid().
revoke all on public.practices, public.patients, public.transactions,
              public.medicines, public.practice_hours, public.bookings
  from anon, authenticated;

grant select on public.practices to authenticated;
grant insert (name, specialty, address, phone, is_open, booking_enabled) on public.practices to authenticated;
grant update (name, specialty, address, phone, is_open, booking_enabled) on public.practices to authenticated;

grant select, insert, update, delete on public.patients, public.transactions,
      public.medicines, public.practice_hours, public.bookings to authenticated;

-- updated_at (function from the create_profiles migration)
create trigger practices_set_updated_at before update on public.practices
  for each row execute function private.set_updated_at();
create trigger patients_set_updated_at before update on public.patients
  for each row execute function private.set_updated_at();
create trigger medicines_set_updated_at before update on public.medicines
  for each row execute function private.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Public booking page (callable without login)
-- ---------------------------------------------------------------------------

-- What a patient may see about a practice: no patient data, no finance.
create function public.get_public_practice(p_slug text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'name', pr.name,
    'practitioner', p.full_name,
    'profession', p.profession,
    'specialty', pr.specialty,
    'address', pr.address,
    'phone', pr.phone,
    'is_open', pr.is_open,
    'booking_enabled', pr.booking_enabled,
    'hours', coalesce((
      select json_agg(json_build_object(
               'day', h.day_of_week,
               'opens', to_char(h.opens_at, 'HH24:MI'),
               'closes', to_char(h.closes_at, 'HH24:MI'))
             order by h.day_of_week, h.opens_at)
      from public.practice_hours h
      where h.owner_id = pr.owner_id
    ), '[]'::json)
  )
  from public.practices pr
  join public.profiles p on p.id = pr.owner_id
  where pr.booking_slug = p_slug;
$$;

-- Create a booking for a practice. Messages are shown to the patient as-is.
create function public.create_booking(
  p_slug      text,
  p_name      text,
  p_phone     text,
  p_date      date,
  p_time      time default null,
  p_service   text default null,
  p_complaint text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner   uuid;
  v_enabled boolean;
  v_today   date := (now() at time zone 'Asia/Jakarta')::date;
  v_id      uuid;
begin
  select owner_id, booking_enabled into v_owner, v_enabled
  from public.practices
  where booking_slug = p_slug;

  if v_owner is null then
    raise exception 'Praktik tidak ditemukan.';
  end if;
  if not v_enabled then
    raise exception 'Booking online sedang ditutup. Silakan hubungi praktik langsung.';
  end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_phone), '') = '' then
    raise exception 'Nama dan nomor WhatsApp wajib diisi.';
  end if;
  if p_date is null or p_date < v_today or p_date > v_today + 60 then
    raise exception 'Pilih tanggal antara hari ini dan 60 hari ke depan.';
  end if;
  if exists (select 1 from public.practice_hours where owner_id = v_owner)
     and not exists (
       select 1 from public.practice_hours
       where owner_id = v_owner and day_of_week = extract(dow from p_date)::smallint
     ) then
    raise exception 'Praktik tutup pada hari yang dipilih.';
  end if;
  -- Simple spam guard: at most 3 bookings per phone number per day.
  if (select count(*) from public.bookings
      where owner_id = v_owner
        and patient_phone = trim(p_phone)
        and created_at > now() - interval '1 day') >= 3 then
    raise exception 'Terlalu banyak booking dari nomor ini. Silakan hubungi praktik langsung.';
  end if;

  insert into public.bookings (owner_id, patient_name, patient_phone, booking_date,
                               booking_time, service, complaint, status, source)
  values (v_owner, trim(p_name), trim(p_phone), p_date, p_time,
          nullif(trim(p_service), ''), nullif(trim(p_complaint), ''), 'baru', 'online')
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.get_public_practice(text) from public;
revoke all on function public.create_booking(text, text, text, date, time, text, text) from public;
grant execute on function public.get_public_practice(text) to anon, authenticated;
grant execute on function public.create_booking(text, text, text, date, time, text, text) to anon, authenticated;
