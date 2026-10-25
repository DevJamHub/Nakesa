// Monthly money in / out for the trend chart on the Keuangan page.
// Pure functions (no DOM, no Supabase), so they can be unit-tested with `node --test`.

export const TREND_MONTHS = 6;

/** "2026-10-03" or a Date → "2026-10" */
export function monthKey(value) {
  if (typeof value === 'string') return value.slice(0, 7);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
}

/** First day of the month `offset` months after `date` (negative goes back). */
export const addMonths = (date, offset) => new Date(date.getFullYear(), date.getMonth() + offset, 1);

/**
 * The months shown in the chart: `count` months ending at the current month, or ending at
 * the viewed month when that one falls outside this window (older, or in the future).
 * → [Date (first day of each month)], oldest first
 */
export function trendWindow(viewed, today = new Date(), count = TREND_MONTHS) {
  const current = addMonths(today, 0);
  const oldest = addMonths(current, -(count - 1));
  const end = viewed < oldest || viewed > current ? addMonths(viewed, 0) : current;
  return Array.from({ length: count }, (_, i) => addMonths(end, i - (count - 1)));
}

/** Sum `amount` per month and kind. rows: [{ kind: 'masuk'|'keluar', amount, occurred_on }] */
export function monthlyTotals(rows, months) {
  const totals = new Map(months.map((m) => [monthKey(m), { masuk: 0, keluar: 0 }]));
  for (const row of rows) {
    const bucket = totals.get(monthKey(row.occurred_on));
    if (bucket && (row.kind === 'masuk' || row.kind === 'keluar')) bucket[row.kind] += Number(row.amount) || 0;
  }
  return months.map((m) => ({ month: m, key: monthKey(m), ...totals.get(monthKey(m)) }));
}

/** A round axis maximum at or above `value`: 1, 2, 2.5 or 5 × 10^n (0 stays 0). */
export function niceMax(value) {
  if (!(value > 0)) return 0;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value);
  return step * power;
}

const compact = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 2 });

/** Short amounts for the chart axis: 1500000 → "1,5 jt", 1250000 → "1,25 jt", 250000 → "250 rb" */
export const compactAmount = (amount) => compact.format(amount);
