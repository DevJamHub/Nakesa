// Unit tests for js/booking-slots.js — run with: node --test "tests/**/*.test.mjs"
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addDaysISO, isDayOver, isWithinHours, markTaken, minutesOfDay, partOfDay, slotsOn, toMinutes, toTime, wibClock,
} from '../js/booking-slots.js';

// Monday: two sessions (listed out of order on purpose), Tuesday: mornings only.
const HOURS = [
  { day: 1, opens: '16:00', closes: '20:00' },
  { day: 1, opens: '07:00', closes: '12:00' },
  { day: 2, opens: '07:00', closes: '09:00' },
];

describe('toMinutes / toTime', () => {
  it('converts both ways', () => {
    assert.equal(toMinutes('07:30'), 450);
    assert.equal(toMinutes('00:00'), 0);
    assert.equal(toTime(450), '07:30');
    assert.equal(toTime(1195), '19:55');
  });

  it('reads the minutes of a Date', () => {
    assert.equal(minutesOfDay(new Date(2026, 9, 5, 10, 10)), 610);
  });
});

describe('partOfDay', () => {
  it('names the part of the day a session starts in', () => {
    assert.equal(partOfDay('07:00'), 'Pagi');
    assert.equal(partOfDay('13:00'), 'Siang');
    assert.equal(partOfDay('16:00'), 'Sore');
    assert.equal(partOfDay('18:30'), 'Malam');
  });
});

describe('slotsOn', () => {
  it('lists every 30 minutes per session, earliest session first', () => {
    const sessions = slotsOn(HOURS, 1);
    assert.deepEqual(sessions.map((s) => s.label), ['Pagi', 'Sore']);
    assert.equal(sessions[0].slots[0].time, '07:00');
    assert.equal(sessions[0].slots.at(-1).time, '11:30'); // closing time itself is not bookable
    assert.equal(sessions[0].slots.length, 10);
    assert.equal(sessions[1].slots.length, 8);
  });

  it('marks times up to now as past, only when now is given', () => {
    const today = slotsOn(HOURS, 2, { now: toMinutes('08:00') })[0].slots;
    assert.deepEqual(today.map((s) => [s.time, s.past]), [
      ['07:00', true], ['07:30', true], ['08:00', true], ['08:30', false],
    ]);
    assert.ok(slotsOn(HOURS, 2)[0].slots.every((s) => !s.past));
  });

  it('supports another step and returns nothing on a closed day', () => {
    assert.equal(slotsOn(HOURS, 2, { step: 60 })[0].slots.length, 2);
    assert.deepEqual(slotsOn(HOURS, 0), []);
  });

  it('only offers slots that end by closing time (same rule as private.practice_slots)', () => {
    const odd = [{ day: 3, opens: '07:15', closes: '09:00' }];
    assert.deepEqual(slotsOn(odd, 3)[0].slots.map((s) => s.time), ['07:15', '07:45', '08:15']);
    assert.deepEqual(slotsOn([{ day: 3, opens: '07:00', closes: '07:20' }], 3)[0].slots, []);
  });
});

describe('markTaken', () => {
  // Tuesday 07:00-09:00, now 07:10: 07:00 has passed.
  const tuesday = () => slotsOn(HOURS, 2, { now: toMinutes('07:10') });
  const fromDatabase = [
    { start: '07:00', end: '07:30', available: false }, // passed (the database marks it unavailable too)
    { start: '07:30', end: '08:00', available: false }, // booked by another patient
    { start: '08:00', end: '08:30', available: true },
    { start: '08:30', end: '09:00', available: true },
  ];

  it('marks slots another patient already has, but keeps passed times as passed', () => {
    const slots = markTaken(tuesday(), fromDatabase)[0].slots;
    assert.deepEqual(slots.map((s) => [s.time, s.past, s.taken]), [
      ['07:00', true, false], ['07:30', false, true], ['08:00', false, false], ['08:30', false, false],
    ]);
  });

  it('leaves the slots as they are when the database list is not available', () => {
    assert.deepEqual(markTaken(tuesday(), null), tuesday());
  });

  it('does not change the sessions it was given', () => {
    const sessions = tuesday();
    markTaken(sessions, fromDatabase);
    assert.ok(sessions[0].slots.every((s) => !s.taken));
  });
});

describe('isWithinHours', () => {
  it('accepts a 30-minute appointment that fits inside a session', () => {
    assert.equal(isWithinHours(HOURS, 1, '07:00'), true);
    assert.equal(isWithinHours(HOURS, 1, '11:30'), true);
    assert.equal(isWithinHours(HOURS, 1, '16:00'), true);
  });

  it('rejects times outside the sessions or too close to closing time', () => {
    assert.equal(isWithinHours(HOURS, 1, '11:45'), false); // would end after 12:00
    assert.equal(isWithinHours(HOURS, 1, '12:00'), false);
    assert.equal(isWithinHours(HOURS, 1, '21:00'), false); // issue #17
    assert.equal(isWithinHours(HOURS, 0, '08:00'), false);
  });
});

describe('isDayOver', () => {
  it('is true only when every session of the day has ended', () => {
    assert.equal(isDayOver(HOURS, 1, toMinutes('13:00')), false); // evening session still ahead
    assert.equal(isDayOver(HOURS, 1, toMinutes('20:00')), true);
    assert.equal(isDayOver(HOURS, 2, toMinutes('08:59')), false);
    assert.equal(isDayOver(HOURS, 0, toMinutes('23:00')), false); // closed day is handled elsewhere
  });
});

describe('wibClock / addDaysISO', () => {
  it('reads the date and time in WIB, whatever the device time zone', () => {
    // 17:30 UTC = 00:30 WIB the next day
    assert.deepEqual(wibClock(new Date('2026-10-11T17:30:00Z')), { iso: '2026-10-12', minutes: 30 });
    assert.deepEqual(wibClock(new Date('2026-10-12T01:15:00Z')), { iso: '2026-10-12', minutes: 8 * 60 + 15 });
  });

  it('moves calendar dates across month and year ends', () => {
    assert.equal(addDaysISO('2026-10-31', 1), '2026-11-01');
    assert.equal(addDaysISO('2026-12-31', 1), '2027-01-01');
    assert.equal(addDaysISO('2026-10-12', 60), '2026-12-11');
  });
});
