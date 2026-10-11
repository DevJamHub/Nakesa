-- Online booking link (book.html): the chosen time must be a free slot inside the practice hours.
--
-- Before this, create_booking() only checked that the practice works on the chosen day, so a
-- patient could book e.g. 21.00 while the practice closes at 12.00 (issue #17), or a time that
-- another patient already has.
--
-- The booking link now follows the same rule as the Nakesa Patient app: private.practice_slots()
-- from 20261005170000_patient_app.sql cuts the practice hours of a day into 30-minute slots; a slot
-- can be booked when it has not started yet (WIB) and no active booking overlaps it. Bookings from
-- either channel therefore block each other's slots.
--
-- create_booking() keeps its signature, security and grants (20260927130131_practice_features.sql).
-- What changes:
--   * p_time (optional) must be the start of a free slot of that day; the booking then gets an
--     end_time 30 minutes later, like a booking from the patient app.
--   * p_time must not have passed yet (today, WIB); without p_time ("kapan saja") the practice must
--     still be open later today.
--   * Bookings for one practice and day wait for each other (same advisory lock as
--     patient_book_appointment()), so two patients can't take the same slot at the same moment.
-- A practice without any practice hours accepts every day and time, as before.

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
  v_practice  uuid;
  v_owner     uuid;
  v_enabled   boolean;
  v_now       timestamp := now() at time zone 'Asia/Jakarta';
  v_today     date := v_now::date;
  v_dow       smallint := extract(dow from p_date)::smallint;
  v_has_hours boolean;
  v_available boolean;
  v_end       time;
  v_id        uuid;
begin
  select id, owner_id, booking_enabled into v_practice, v_owner, v_enabled
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
  end if;

  if p_time is not null then
    if p_date = v_today and p_time <= v_now::time then
      raise exception 'Jam yang dipilih sudah lewat. Pilih jam lain.';
    end if;

    if v_has_hours then
      perform pg_advisory_xact_lock(hashtextextended(v_practice::text || p_date::text, 0));

      select s.available, s.ends_at into v_available, v_end
      from private.practice_slots(v_practice, p_date, 30) s
      where s.starts_at = p_time;

      if not found then
        raise exception 'Jam yang dipilih di luar jam praktik. Pilih jam lain.';
      end if;
      if not v_available then
        raise exception 'Jam ini sudah dipesan pasien lain. Pilih jam lain.';
      end if;
    end if;
  end if;

  -- Simple spam guard: at most 3 bookings per phone number per day.
  if (select count(*) from public.bookings
      where owner_id = v_owner
        and patient_phone = trim(p_phone)
        and created_at > now() - interval '1 day') >= 3 then
    raise exception 'Terlalu banyak booking dari nomor ini. Silakan hubungi praktik langsung.';
  end if;

  insert into public.bookings (owner_id, patient_name, patient_phone, booking_date,
                               booking_time, end_time, service, complaint, status, source)
  values (v_owner, trim(p_name), trim(p_phone), p_date, p_time, v_end,
          nullif(trim(p_service), ''), nullif(trim(p_complaint), ''), 'baru', 'online')
  returning id into v_id;

  return v_id;
end;
$$;

-- create or replace keeps the existing privileges; restated so this file is self-contained.
revoke all on function public.create_booking(text, text, text, date, time, text, text) from public;
grant execute on function public.create_booking(text, text, text, date, time, text, text) to anon, authenticated;

-- Slots of one day for the booking link (no login): times only, never who booked them.
-- [{ "start": "07:00", "end": "07:30", "available": true }, …]; an empty list when the link is
-- unknown, online booking is off, the date is outside today … today + 60, or the practice is closed.
create function public.get_public_slots(p_slug text, p_date date)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(json_agg(json_build_object(
           'start', to_char(s.starts_at, 'HH24:MI'),
           'end', to_char(s.ends_at, 'HH24:MI'),
           'available', s.available)
         order by s.starts_at), '[]'::json)
  from public.practices pr
  cross join lateral private.practice_slots(pr.id, p_date, 30) s
  where pr.booking_slug = p_slug
    and pr.booking_enabled
    and p_date between (now() at time zone 'Asia/Jakarta')::date
                   and (now() at time zone 'Asia/Jakarta')::date + 60;
$$;

revoke all on function public.get_public_slots(text, date) from public;
grant execute on function public.get_public_slots(text, date) to anon, authenticated;
