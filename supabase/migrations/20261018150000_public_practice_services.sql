-- Public booking link and PHP practice profile show the practice's own services (issue #45).
--
-- "Layanan & Harga" (services.html, table practice_services) sets the services, prices and
-- durations patients see, but only the Nakesa Patient app used them: get_public_practice(), which
-- feeds html/book.html and php/praktik.php, returned no services, so both pages fell back to the
-- profession's standard list. A service the practice switched off still showed, its own services
-- didn't, and no price was ever shown.
--
-- get_public_practice() now also returns 'services': exactly what Nakesa Patient shows, from
-- private.services_json() (20261005170000_patient_app.sql): the practice's active services in its
-- order, or the profession's standard services (without price) when it has none of its own.
-- Everything else, the signature, security definer and the grants stay as they were.

create or replace function public.get_public_practice(p_slug text)
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
    ), '[]'::json),
    'services', private.services_json(pr.id)
  )
  from public.practices pr
  join public.profiles p on p.id = pr.owner_id
  where pr.booking_slug = p_slug;
$$;
