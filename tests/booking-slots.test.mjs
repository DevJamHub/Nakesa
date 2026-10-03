// Unit tests for js/booking-slots.js — run with: node --test "tests/**/*.test.mjs"
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isDayOver, isWithinHours, minutesOfDay, partOfDay, slotsOn, toMinutes, toTime,
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
});

describe('isWithinHours', () => {
  it('accepts times inside a session, not the closing time', () => {
    assert.equal(isWithinHours(HOURS, 1, '07:00'), true);
    assert.equal(isWithinHours(HOURS, 1, '11:59'), true);
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
