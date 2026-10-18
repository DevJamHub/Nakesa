// Unit tests for js/practice-utils.js — run with: node --test "tests/**/*.test.mjs"
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { todayISO } from '../js/format.js';
import {
  BOOKING_STATUS, DRUG_CLASS, EXPIRY_STATUS, MOVEMENT_TYPE, STOCK_STATUS,
  batchExpiry, bookingLink, medicineDetail, medicineExpiry, needsAttention,
} from '../js/practice-utils.js';

describe('batchExpiry', () => {
  it('treats a batch without an expiry date as safe', () => {
    assert.equal(batchExpiry(null, 90), 'aman');
    assert.equal(batchExpiry('', 90), 'aman');
  });

  it('is safe beyond the warning window and warns inside it', () => {
    assert.equal(batchExpiry(todayISO(91), 90), 'aman');
    assert.equal(batchExpiry(todayISO(90), 90), 'akan_kedaluwarsa');
    assert.equal(batchExpiry(todayISO(1), 90), 'akan_kedaluwarsa');
  });

  it('counts today as still usable and yesterday as expired (same rule as the medicine_inventory view)', () => {
    assert.equal(batchExpiry(todayISO(), 90), 'akan_kedaluwarsa');
    assert.equal(batchExpiry(todayISO(-1), 90), 'kedaluwarsa');
  });

  it('follows the practice setting for the warning window', () => {
    assert.equal(batchExpiry(todayISO(20), 14), 'aman');
    assert.equal(batchExpiry(todayISO(20), 30), 'akan_kedaluwarsa');
  });
});

describe('medicineExpiry', () => {
  it('says a whole medicine has expired stock when one of its batches is expired', () => {
    assert.deepEqual(medicineExpiry('kedaluwarsa'), { ...EXPIRY_STATUS.kedaluwarsa, label: 'Ada stok kedaluwarsa' });
  });

  it('uses the batch labels as they are for the other statuses', () => {
    assert.equal(medicineExpiry('aman'), EXPIRY_STATUS.aman);
    assert.equal(medicineExpiry('akan_kedaluwarsa'), EXPIRY_STATUS.akan_kedaluwarsa);
  });
});

describe('needsAttention', () => {
  const medicine = (changes) => ({ is_active: true, stock_status: 'aman', expiry_status: 'aman', ...changes });

  it('ignores active medicines that are fine', () => {
    assert.equal(needsAttention(medicine()), false);
  });

  it('flags low or empty stock and (nearly) expired stock', () => {
    assert.equal(needsAttention(medicine({ stock_status: 'menipis' })), true);
    assert.equal(needsAttention(medicine({ stock_status: 'habis' })), true);
    assert.equal(needsAttention(medicine({ expiry_status: 'akan_kedaluwarsa' })), true);
    assert.equal(needsAttention(medicine({ expiry_status: 'kedaluwarsa' })), true);
  });

  it('skips medicines that are switched off', () => {
    assert.equal(needsAttention(medicine({ is_active: false, stock_status: 'habis' })), false);
  });
});

describe('medicineDetail', () => {
  it('joins the brand name with dosage form and strength', () => {
    assert.equal(medicineDetail({ brand_name: 'Sanmol', dosage_form: 'Tablet', strength: '500 mg' }), 'Sanmol · Tablet 500 mg');
  });

  it('leaves out the parts that are empty', () => {
    assert.equal(medicineDetail({ brand_name: null, dosage_form: 'Sirup', strength: null }), 'Sirup');
    assert.equal(medicineDetail({ brand_name: 'Sanmol', dosage_form: null, strength: null }), 'Sanmol');
    assert.equal(medicineDetail({}), '');
  });
});

describe('status labels', () => {
  // The keys must match the values the database uses (medicine_inventory view, check constraints),
  // otherwise a page would show an empty badge.
  it('cover every stock and expiry status of the medicine_inventory view', () => {
    assert.deepEqual(Object.keys(STOCK_STATUS).sort(), ['aman', 'habis', 'menipis']);
    assert.deepEqual(Object.keys(EXPIRY_STATUS).sort(), ['akan_kedaluwarsa', 'aman', 'kedaluwarsa']);
  });

  it('cover every drug class allowed by medicines.drug_class', () => {
    assert.deepEqual(Object.keys(DRUG_CLASS).sort(),
      ['alkes', 'bebas', 'bebas_terbatas', 'keras', 'narkotika_psikotropika']);
  });

  it('cover every booking status in the database', () => {
    assert.deepEqual(Object.keys(BOOKING_STATUS), ['baru', 'dikonfirmasi', 'selesai', 'batal']);
  });

  it('give every status a label and a colour', () => {
    for (const status of [STOCK_STATUS, EXPIRY_STATUS, DRUG_CLASS, MOVEMENT_TYPE, BOOKING_STATUS].flatMap(Object.values)) {
      assert.ok(status.label, JSON.stringify(status));
      assert.ok(status.tone, JSON.stringify(status));
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
