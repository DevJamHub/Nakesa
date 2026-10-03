-- Online booking: the chosen time must fall inside the practice hours of that day.
--
-- Before this, create_booking() only checked that the practice works on the chosen
-- day, so a patient could book e.g. 21.00 while the practice closes at 12.00 (issue #17).
-- Same signature, security and grants as the original function in
-- 20260927130131_practice_features.sql; only the time checks are new:
--   * p_time (optional) must be inside one session of that day: opens_at <= p_time < closes_at
--   * for today, p_time must not have passed yet (Asia/Jakarta)
--   * for today, at least one session must still be running
create or replace function public.create_booking(
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
  v_owner     uuid;
  v_enabled   boolean;
  v_now       timestamp := now() at time zone 'Asia/Jakarta';
  v_today     date := v_now::date;
  v_dow       smallint := extract(dow from p_date)::smallint;
  v_has_hours boolean;
  v_id        uuid;
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

  v_has_hours := exists (select 1 from public.practice_hours where owner_id = v_owner);

  -- A practice without a schedule accepts any day and time, as before.
  if v_has_hours then
    if not exists (
      select 1 from public.practice_hours
      where owner_id = v_owner and day_of_week = v_dow
    ) then
      raise exception 'Praktik tutup pada hari yang dipilih.';
    end if;
    if p_date = v_today and not exists (
      select 1 from public.practice_hours
      where owner_id = v_owner and day_of_week = v_dow and closes_at > v_now::time
    ) then
      raise exception 'Jam praktik hari ini sudah selesai. Pilih hari lain.';
    end if;
    if p_time is not null and not exists (
      select 1 from public.practice_hours
      where owner_id = v_owner
        and day_of_week = v_dow
        and p_time >= opens_at
        and p_time < closes_at
    ) then
      raise exception 'Jam yang dipilih di luar jam praktik. Pilih jam lain.';
    end if;
  end if;

  if p_time is not null and p_date = v_today and p_time <= v_now::time then
    raise exception 'Jam yang dipilih sudah lewat. Pilih jam lain.';
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

-- create or replace keeps the existing privileges; restated so this file is self-contained.
revoke all on function public.create_booking(text, text, text, date, time, text, text) from public;
grant execute on function public.create_booking(text, text, text, date, time, text, text) to anon, authenticated;
