// Unit tests for js/holidays.js (Week 4: data from the API Hari Libur) — run with:
// node --test "tests/**/*.test.mjs"
// fetch() is replaced by a fake, so the tests never touch the network.
import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { HOLIDAY_API_URL, fetchHolidays } from '../js/holidays.js';

const realFetch = globalThis.fetch;
let requested = [];

/** Make fetch() answer with `body` and HTTP `status`, and remember what was requested. */
function fakeApi(body, status = 200) {
  requested = [];
  globalThis.fetch = async (url, options) => {
    requested.push({ url, options });
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

// Same shape as the real response (see "Contoh JSON dari API" in Exercise week/Week4.md).
const SAMPLE = {
  '2027-01-05': { description: ['Hari libur nasional'], holiday: true, summary: ['Isra Mikraj Nabi Muhammad (belum pasti)'] },
  '2026-12-31': { description: ['Perayaan'], holiday: false, summary: ['Malam Tahun Baru'] },
  '2026-12-25': { description: ['Hari libur nasional'], holiday: true, summary: ['Hari Raya Natal'] },
  '2026-12-24': { description: ['Hari libur nasional'], holiday: true, summary: ['Cuti Bersama Natal (Malam Natal)'] },
  info: { author: 'guangrei', link: 'https://github.com/guangrei', updated: '20260924 17:05:45' },
};

describe('fetchHolidays', () => {
  it('asks the API Hari Libur endpoint with a timeout', async () => {
    fakeApi(SAMPLE);
    await fetchHolidays();
    assert.equal(requested.length, 1);
    assert.equal(requested[0].url, HOLIDAY_API_URL);
    assert.ok(requested[0].options?.signal, 'request can be aborted after 10 seconds');
  });

  it('keeps only real holidays, sorted by date, and drops the info entry', async () => {
    fakeApi(SAMPLE);
    const holidays = await fetchHolidays();
    assert.deepEqual(holidays.map((h) => h.date), ['2026-12-24', '2026-12-25', '2027-01-05']);
  });

  it('marks joint leave (cuti bersama) and dates that are not final yet', async () => {
    fakeApi(SAMPLE);
    const holidays = await fetchHolidays();
    assert.deepEqual(holidays, [
      { date: '2026-12-24', name: 'Cuti Bersama Natal (Malam Natal)', jointLeave: true, tentative: false },
      { date: '2026-12-25', name: 'Hari Raya Natal', jointLeave: false, tentative: false },
      { date: '2027-01-05', name: 'Isra Mikraj Nabi Muhammad', jointLeave: false, tentative: true },
    ]);
  });

  it('translates English names that sometimes come from the source', async () => {
    fakeApi({
      '2027-03-26': { holiday: true, summary: ['Good Friday'] },
      '2027-03-29': { holiday: true, summary: ['Joint Holiday for Idul Fitri'] },
    });
    const holidays = await fetchHolidays();
    assert.deepEqual(holidays.map((h) => [h.name, h.jointLeave]), [
      ['Wafat Isa Almasih', false],
      ['Cuti Bersama Idul Fitri', true],
    ]);
  });

  it('joins several names of one date, and accepts a plain string summary', async () => {
    fakeApi({
      '2027-03-10': { holiday: true, summary: ['Hari Suci Nyepi', 'Tahun Baru Saka 1949'] },
      '2027-05-01': { holiday: true, summary: 'Hari Buruh Internasional' },
    });
    const holidays = await fetchHolidays();
    assert.deepEqual(holidays.map((h) => h.name), ['Hari Suci Nyepi · Tahun Baru Saka 1949', 'Hari Buruh Internasional']);
  });

  it('returns an empty list when there are no holidays', async () => {
    fakeApi({ info: SAMPLE.info });
    assert.deepEqual(await fetchHolidays(), []);
  });

  it('throws on an HTTP error so the page can show "Coba lagi"', async () => {
    fakeApi({}, 503);
    await assert.rejects(fetchHolidays(), /HTTP 503/);
  });
});
