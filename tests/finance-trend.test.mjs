// Unit tests for js/finance-trend.js — run with: node --test "tests/**/*.test.mjs"
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addMonths, compactAmount, monthKey, monthlyTotals, niceMax, trendWindow,
} from '../js/finance-trend.js';

const keys = (months) => months.map(monthKey);

describe('monthKey / addMonths', () => {
  it('works with ISO dates and Date objects', () => {
    assert.equal(monthKey('2026-10-03'), '2026-10');
    assert.equal(monthKey(new Date(2026, 0, 31)), '2026-01');
  });

  it('crosses year boundaries', () => {
    assert.equal(monthKey(addMonths(new Date(2026, 1, 28), -2)), '2025-12');
    assert.equal(monthKey(addMonths(new Date(2026, 10, 30), 3)), '2027-02');
  });
});

describe('trendWindow', () => {
  const today = new Date(2026, 9, 20); // 20 Oktober 2026

  it('shows the 6 months up to this month', () => {
    assert.deepEqual(keys(trendWindow(new Date(2026, 9, 1), today)),
      ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
  });

  it('stays put while the viewed month is inside the window', () => {
    assert.deepEqual(keys(trendWindow(new Date(2026, 4, 1), today)),
      ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
  });

  it('follows the viewed month when it is older or in the future', () => {
    assert.deepEqual(keys(trendWindow(new Date(2026, 3, 1), today)),
      ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04']);
    assert.equal(keys(trendWindow(new Date(2026, 11, 1), today)).at(-1), '2026-12');
  });
});

describe('monthlyTotals', () => {
  it('sums money in and out per month, ignoring rows outside the window', () => {
    const months = [new Date(2026, 8, 1), new Date(2026, 9, 1)];
    const rows = [
      { kind: 'masuk', amount: 75000, occurred_on: '2026-09-02' },
      { kind: 'masuk', amount: 25000, occurred_on: '2026-09-30' },
      { kind: 'keluar', amount: 40000, occurred_on: '2026-09-15' },
      { kind: 'masuk', amount: 1500000, occurred_on: '2026-10-01' },
      { kind: 'masuk', amount: 999, occurred_on: '2026-08-31' }, // outside
    ];
    assert.deepEqual(monthlyTotals(rows, months).map(({ key, masuk, keluar }) => ({ key, masuk, keluar })), [
      { key: '2026-09', masuk: 100000, keluar: 40000 },
      { key: '2026-10', masuk: 1500000, keluar: 0 },
    ]);
  });

  it('returns zeroes for months without records', () => {
    const [only] = monthlyTotals([], [new Date(2026, 9, 1)]);
    assert.equal(only.masuk + only.keluar, 0);
  });
});

describe('niceMax', () => {
  it('rounds up to 1, 2, 2.5 or 5 times a power of ten', () => {
    assert.equal(niceMax(0), 0);
    assert.equal(niceMax(3200000), 5000000);
    assert.equal(niceMax(2100000), 2500000);
    assert.equal(niceMax(1800000), 2000000);
    assert.equal(niceMax(1000000), 1000000);
    assert.equal(niceMax(85000), 100000);
  });
});

describe('compactAmount', () => {
  // Intl puts a non-breaking space between the number and the unit, so "5 jt" never wraps.
  const plain = (text) => text.replace(/ /g, ' ');

  it('uses Indonesian short units for the axis', () => {
    assert.equal(plain(compactAmount(5000000)), '5 jt');
    assert.equal(plain(compactAmount(1250000)), '1,25 jt');
    assert.equal(plain(compactAmount(250000)), '250 rb');
  });
});
