// Unit tests for js/format.js — run with: node --test "tests/**/*.test.mjs"
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DAYS, age, escapeHtml, formatDate, friendlyDate, parseRupiah, rupiah, shortTime, toISODate, todayISO,
  waLink, waNumber,
} from '../js/format.js';

describe('rupiah / parseRupiah', () => {
  it('formats whole rupiah with Indonesian thousands separators', () => {
    assert.equal(rupiah(150000), 'Rp 150.000');
    assert.equal(rupiah(0), 'Rp 0');
    assert.equal(rupiah(null), 'Rp 0');
  });

  it('reads the amount back from what a user types', () => {
    assert.equal(parseRupiah('150.000'), 150000);
    assert.equal(parseRupiah('Rp 1.250.000'), 1250000);
    assert.equal(parseRupiah(''), 0);
    assert.equal(parseRupiah('abc'), 0);
  });
});

describe('dates', () => {
  it('toISODate uses the local date, not UTC', () => {
    assert.equal(toISODate(new Date(2026, 0, 5, 23, 30)), '2026-01-05');
  });

  it('todayISO supports an offset in days', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    assert.equal(todayISO(1), toISODate(tomorrow));
  });

  it('formatDate writes Indonesian day and month names', () => {
    assert.equal(formatDate('2026-09-27'), 'Minggu, 27 September');
    assert.equal(formatDate('2026-10-05', { day: 'numeric', month: 'short', year: 'numeric' }), '5 Okt 2026');
  });

  it('friendlyDate says today / tomorrow / yesterday', () => {
    assert.equal(friendlyDate(todayISO()), 'Hari ini');
    assert.equal(friendlyDate(todayISO(1)), 'Besok');
    assert.equal(friendlyDate(todayISO(-1)), 'Kemarin');
    assert.equal(friendlyDate('2026-09-27'), 'Minggu, 27 September');
  });

  it('DAYS starts on Sunday like Date#getDay()', () => {
    assert.equal(DAYS[0], 'Minggu');
    assert.equal(DAYS[new Date(2026, 9, 5).getDay()], 'Senin');
  });

  it('shortTime turns database times into "08.30"', () => {
    assert.equal(shortTime('08:30:00'), '08.30');
    assert.equal(shortTime(null), '');
  });

  it('age counts whole years and waits for the birthday', () => {
    const now = new Date();
    const birthdayPassed = toISODate(new Date(now.getFullYear() - 30, now.getMonth(), now.getDate()));
    const birthdayTomorrow = toISODate(new Date(now.getFullYear() - 30, now.getMonth(), now.getDate() + 1));
    assert.equal(age(birthdayPassed), 30);
    assert.equal(age(birthdayTomorrow), 29);
    assert.equal(age(null), null);
  });
});

describe('WhatsApp links', () => {
  it('normalises Indonesian numbers to 62…', () => {
    assert.equal(waNumber('0812-3456 789'), '628123456789');
    assert.equal(waNumber('8123456789'), '628123456789');
    assert.equal(waNumber('+62 812 3456 789'), '628123456789');
  });

  it('adds an encoded message when given', () => {
    assert.equal(waLink('0812345678'), 'https://wa.me/62812345678');
    assert.equal(waLink('0812345678', 'Halo & terima kasih'), 'https://wa.me/62812345678?text=Halo%20%26%20terima%20kasih');
  });
});

describe('escapeHtml', () => {
  it('escapes characters that could inject HTML', () => {
    assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    assert.equal(escapeHtml("Bu Ani's & co"), 'Bu Ani&#39;s &amp; co');
    assert.equal(escapeHtml(null), '');
  });
});
