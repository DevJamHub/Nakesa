// Time choices for the public booking page, built from the practice schedule.
// Pure functions (no DOM, no Supabase), so they can be unit-tested with `node --test`.
//
// `hours` is the list from get_public_practice(): [{ day, opens: 'HH:MM', closes: 'HH:MM' }],
// day 0 = Minggu … 6 = Sabtu. A session runs from `opens` up to (not including) `closes`.
// Slots follow the same rule as private.practice_slots() in the database (also used by the
// Nakesa Patient app): blocks of 30 minutes from the opening time, each ending by closing time.

export const SLOT_MINUTES = 30;

/** "07:30" → 450 */
export function toMinutes(time) {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
}

/** 450 → "07:30" */
export const toTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Minutes since midnight of a Date (device clock). */
export const minutesOfDay = (date) => date.getHours() * 60 + date.getMinutes();

/** Sessions of one weekday, earliest first. */
export const sessionsOn = (hours, day) =>
  hours.filter((h) => h.day === day).sort((a, b) => toMinutes(a.opens) - toMinutes(b.opens));

/** "Pagi" / "Siang" / "Sore" / "Malam" for a session that starts at `time`. */
export function partOfDay(time) {
  const hour = Math.floor(toMinutes(time) / 60);
  if (hour < 11) return 'Pagi';
  if (hour < 15) return 'Siang';
  if (hour < 18) return 'Sore';
  return 'Malam';
}

/**
 * Bookable start times per session of `day`, every `step` minutes; a slot must end by closing time.
 * With `now` (minutes since midnight, only for today) earlier times are marked `past`.
 * → [{ label, opens, closes, slots: [{ time, past, taken: false }] }]
 */
export function slotsOn(hours, day, { now = null, step = SLOT_MINUTES } = {}) {
  return sessionsOn(hours, day).map((session) => {
    const slots = [];
    for (let t = toMinutes(session.opens); t + step <= toMinutes(session.closes); t += step) {
      slots.push({ time: toTime(t), past: now !== null && t <= now, taken: false });
    }
    return { label: partOfDay(session.opens), opens: session.opens, closes: session.closes, slots };
  });
}

/**
 * Mark the slots another patient already has, using get_public_slots():
 * [{ start: 'HH:MM', end: 'HH:MM', available }]. Times that have passed stay `past`, not `taken`.
 * Without that list (null: the function is not available) the slots are returned unchanged.
 */
export function markTaken(sessions, freeSlots) {
  if (!Array.isArray(freeSlots)) return sessions;
  const unavailable = new Set(freeSlots.filter((s) => !s.available).map((s) => s.start));
  return sessions.map((session) => ({
    ...session,
    slots: session.slots.map((slot) => ({ ...slot, taken: !slot.past && unavailable.has(slot.time) })),
  }));
}

/** True when an appointment of `step` minutes starting at `time` fits inside one session of `day`. */
export function isWithinHours(hours, day, time, step = SLOT_MINUTES) {
  const t = toMinutes(time);
  return sessionsOn(hours, day).some((s) => t >= toMinutes(s.opens) && t + step <= toMinutes(s.closes));
}

/** True when the practice works on `day` but every session has already ended at `now`. */
export function isDayOver(hours, day, now) {
  const sessions = sessionsOn(hours, day);
  return sessions.length > 0 && sessions.every((s) => toMinutes(s.closes) <= now);
}
