// Unit tests for js/practice-utils.js — run with: node --test "tests/**/*.test.mjs"
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { todayISO } from '../js/format.js';
import { BOOKING_STATUS, bookingLink, medicineStatus } from '../js/practice-utils.js';

describe('medicineStatus', () => {
  const medicine = (changes) => ({ stock: 20, min_stock: 5, expires_on: null, ...changes });

  it('is safe with enough stock and no expiry soon', () => {
    assert.deepEqual(medicineStatus(medicine()), { label: 'Aman', tone: 'green' });
    assert.deepEqual(medicineStatus(medicine({ expires_on: todayISO(31) })), { label: 'Aman', tone: 'green' });
  });

  it('warns about low and empty stock', () => {
    assert.deepEqual(medicineStatus(medicine({ stock: 5 })), { label: 'Menipis', tone: 'orange' });
    assert.deepEqual(medicineStatus(medicine({ stock: 0 })), { label: 'Habis', tone: 'red' });
  });

  it('warns about expiry: within 30 days, and already expired', () => {
    assert.deepEqual(medicineStatus(medicine({ expires_on: todayISO(30) })), { label: 'Segera kedaluwarsa', tone: 'orange' });
    assert.deepEqual(medicineStatus(medicine({ expires_on: todayISO() })), { label: 'Segera kedaluwarsa', tone: 'orange' });
    assert.deepEqual(medicineStatus(medicine({ expires_on: todayISO(-1) })), { label: 'Kedaluwarsa', tone: 'red' });
  });

  it('puts expired before empty stock (most urgent first)', () => {
    assert.equal(medicineStatus(medicine({ stock: 0, expires_on: todayISO(-1) })).label, 'Kedaluwarsa');
  });
});

describe('BOOKING_STATUS', () => {
  it('has a label and colour for every status in the database', () => {
    assert.deepEqual(Object.keys(BOOKING_STATUS), ['baru', 'dikonfirmasi', 'selesai', 'batal']);
    for (const status of Object.values(BOOKING_STATUS)) {
      assert.ok(status.label && status.tone);
    }
  });
});

describe('bookingLink', () => {
  it('points to the public booking page next to the current page', () => {
    globalThis.window = { location: { href: 'http://127.0.0.1:5501/html/dashboard.html' } };
    try {
      assert.equal(bookingLink({ booking_slug: 'ab12cd34ef' }), 'http://127.0.0.1:5501/html/book.html?p=ab12cd34ef');
    } finally {
      delete globalThis.window;
    }
  });
});
