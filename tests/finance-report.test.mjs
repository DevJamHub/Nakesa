// Unit tests for js/finance-report.js — run with: node --test "tests/**/*.test.mjs"
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { csvCell, csvDelimiter, monthlyReportCsv, reportFileName, slugify } from '../js/finance-report.js';

const SAMPLE = [
  { occurred_on: '2026-10-02', created_at: '2026-10-02T09:00:00Z', kind: 'keluar', category: 'Beli Obat', note: null, amount: 450000 },
  { occurred_on: '2026-10-01', created_at: '2026-10-01T10:00:00Z', kind: 'masuk', category: 'Periksa Kehamilan', note: 'Bu Ani', amount: 75000 },
  { occurred_on: '2026-10-01', created_at: '2026-10-01T08:00:00Z', kind: 'masuk', category: 'Persalinan', note: 'Bu Sari; anak ke-2', amount: 1500000 },
];

describe('csvDelimiter', () => {
  it('follows the decimal separator of the locale', () => {
    assert.equal(csvDelimiter('id-ID'), ';');
    assert.equal(csvDelimiter('en-US'), ',');
  });
});

describe('csvCell', () => {
  it('quotes text with the separator, quotes or line breaks', () => {
    assert.equal(csvCell('Bu Ani', ';'), 'Bu Ani');
    assert.equal(csvCell('Bu Sari; anak ke-2', ';'), '"Bu Sari; anak ke-2"');
    assert.equal(csvCell('Kata "lunas"', ','), '"Kata ""lunas"""');
    assert.equal(csvCell('baris 1\nbaris 2', ','), '"baris 1\nbaris 2"');
  });

  it('keeps numbers as numbers and neutralises formulas', () => {
    assert.equal(csvCell(-25000, ';'), '-25000');
    assert.equal(csvCell('=HYPERLINK("x")', ','), '"\'=HYPERLINK(""x"")"');
    assert.equal(csvCell('-diskon', ','), "'-diskon");
    assert.equal(csvCell(null, ','), '');
  });
});

describe('file name', () => {
  it('names the practice and month', () => {
    assert.equal(slugify('Praktik Bidan Siti'), 'praktik-bidan-siti');
    assert.equal(slugify('Klinik drg. Ayu & Rekan'), 'klinik-drg-ayu-rekan');
    assert.equal(slugify('***'), 'praktik');
    assert.equal(reportFileName('Praktik Bidan Siti', new Date(2026, 9, 1)), 'laporan-keuangan-praktik-bidan-siti-2026-10.csv');
  });
});

describe('monthlyReportCsv', () => {
  const csv = monthlyReportCsv(SAMPLE, { delimiter: ';', openingBalance: 200000, monthStart: '2026-10-01' });
  const lines = csv.replace(/^﻿/, '').trimEnd().split('\r\n');

  it('starts with a UTF-8 BOM and uses CRLF', () => {
    assert.ok(csv.startsWith('﻿'));
    assert.ok(csv.endsWith('\r\n'));
  });

  it('has the same columns as the cash book on screen, starting from the saldo awal', () => {
    assert.deepEqual(lines.slice(0, 2), [
      'No;Tanggal;Keterangan;Catatan;Masuk (Rp);Keluar (Rp);Saldo (Rp)',
      ';2026-10-01;Saldo awal;Sisa uang dari bulan-bulan sebelumnya;;;200000',
    ]);
  });

  it('lists transactions oldest first with a running saldo', () => {
    assert.deepEqual(lines.slice(2, 5), [
      '1;2026-10-01;Persalinan;"Bu Sari; anak ke-2";1500000;;1700000',
      '2;2026-10-01;Periksa Kehamilan;Bu Ani;75000;;1775000',
      '3;2026-10-02;Beli Obat;;;450000;1325000',
    ]);
  });

  it('ends with the month totals and the saldo akhir', () => {
    assert.deepEqual(lines.slice(5), [
      ';;Jumlah bulan ini;;1575000;450000;',
      ';;Saldo akhir;;;;1325000',
    ]);
  });

  it('shows a negative saldo as a negative number', () => {
    const loss = monthlyReportCsv([{ ...SAMPLE[0] }], { delimiter: ',' });
    assert.ok(loss.trimEnd().endsWith(',,Saldo akhir,,,,-450000'));
  });
});
