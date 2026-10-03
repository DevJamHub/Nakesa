// Monthly finance report as a CSV file that opens cleanly in Excel, Google Sheets or WPS.
// Pure functions (no DOM, no Supabase), so they can be unit-tested with `node --test`.

/**
 * Column separator that spreadsheet apps on this device expect: ';' where decimals are
 * written with a comma (Indonesian settings), ',' elsewhere.
 */
export const csvDelimiter = (locale) => ((1.5).toLocaleString(locale).includes(',') ? ';' : ',');

/** One cell. Text that starts like a formula gets a leading ' (CSV injection); quotes when needed. */
export function csvCell(value, delimiter = ',') {
  if (typeof value === 'number') return String(value);
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  const needsQuotes = text.includes(delimiter) || /["\r\n]/.test(text);
  return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text;
}

/** "Praktik Bidan Siti" → "praktik-bidan-siti" */
export function slugify(text) {
  const slug = String(text ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'praktik';
}

/** laporan-keuangan-praktik-bidan-siti-2026-10.csv */
export function reportFileName(practiceName, month) {
  const yearMonth = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  return `laporan-keuangan-${slugify(practiceName)}-${yearMonth}.csv`;
}

/**
 * The month's transactions, oldest first, with totals at the bottom.
 * transactions: [{ occurred_on, created_at, kind: 'masuk'|'keluar', category, note, amount }]
 * Starts with a UTF-8 BOM and uses CRLF line endings, which Excel needs to read the file correctly.
 */
export function monthlyReportCsv(transactions, { delimiter = ',' } = {}) {
  const sorted = [...transactions].sort((a, b) => a.occurred_on.localeCompare(b.occurred_on)
    || String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')));
  const total = (kind) => transactions.filter((t) => t.kind === kind).reduce((sum, t) => sum + t.amount, 0);
  const rows = [
    ['Tanggal', 'Jenis', 'Kategori', 'Catatan', 'Jumlah (Rp)'],
    ...sorted.map((t) => [t.occurred_on, t.kind === 'masuk' ? 'Masuk' : 'Keluar', t.category, t.note ?? '', t.amount]),
    [],
    ['Total uang masuk', '', '', '', total('masuk')],
    ['Total uang keluar', '', '', '', total('keluar')],
    ['Sisa (untung)', '', '', '', total('masuk') - total('keluar')],
  ];
  return `﻿${rows.map((row) => row.map((cell) => csvCell(cell, delimiter)).join(delimiter)).join('\r\n')}\r\n`;
}
