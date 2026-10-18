// Keuangan: money in / out per month, with a monthly summary, a 6-month trend and the cash
// book (buku kas): every record as a row with a running balance, like the paper book.
import { deleteRow, fetchAll, insertRow, run, supabase, updateRow } from '../db.js';
import { bindRupiahInput, escapeHtml, formatDate, parseRupiah, rupiah, toISODate, todayISO } from '../format.js';
import { compactAmount, monthKey, monthlyTotals, niceMax, trendWindow } from '../finance-trend.js';
import { financeCategories } from '../professions.js';
import {
  appError, closeDialog, confirmDialog, fillForm, formValues, startPage, toast, whileSaving,
} from '../shell.js';
import { csvDelimiter, monthlyReportCsv, reportFileName } from '../finance-report.js';

const { profile, practice } = await startPage('finance');

/* ---------- Task 01: Select & Change ---------- */
// Selector tag: ambil <h1> pertama di halaman, lalu ganti teksnya.
const title = document.querySelector('h1');
title.textContent = `Keuangan ${practice.name}`;

// Selector ID: ambil elemen dengan id="subjudul".
const subtitle = document.querySelector('#subjudul');
subtitle.textContent = 'Catat setiap uang masuk dan keluar supaya untung praktik terlihat jelas.';

// Selector class: ambil elemen PERTAMA yang punya class="btn-success".
const incomeButton = document.querySelector('.btn-success');
incomeButton.textContent = '＋ Catat Uang Masuk';

const list = document.getElementById('list');
const dialog = document.getElementById('tx-dialog');
const form = document.getElementById('tx-form');
const errorBox = document.getElementById('form-error');
const search = document.querySelector('#search');
const month = new Date();
month.setDate(1);
let transactions = []; // this month, oldest first (the order of the book)
let openingBalance = 0; // saldo awal: what was left from all earlier months
let loadedMonth = null; // the month `transactions` belongs to (first day, set by load())
let editing = null;
let kindFilter = 'all';

// Tailwind classes for money amounts (green = masuk, red = keluar).
const moneyClass = (kind) => `font-semibold whitespace-nowrap ${kind === 'masuk' ? 'text-green' : 'text-red'}`;

bindRupiahInput(form.amount);

/* ---------- Month ---------- */
async function load() {
  const monthName = month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  document.getElementById('month-label').textContent = monthName;
  document.getElementById('ledger-sub').textContent = `${monthName} · ${practice.name}`;
  const first = toISODate(month);
  const last = toISODate(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const trendLoaded = loadTrend(); // the chart loads alongside this month's list
  try {
    [transactions, openingBalance] = await Promise.all([
      run(supabase.from('transactions').select('*')
        .gte('occurred_on', first).lte('occurred_on', last)
        .order('occurred_on').order('created_at')),
      balanceBefore(first),
    ]);
    loadedMonth = first;
  } catch (error) {
    transactions = [];
    openingBalance = 0;
    toast(appError(error), 'error');
  }
  render();
  await trendLoaded;
}

/** Money in minus money out before `date`. Read in pages: the API returns at most 1000 rows at once. */
async function balanceBefore(date) {
  const PAGE = 1000;
  let balance = 0;
  for (let from = 0; ; from += PAGE) {
    const rows = await run(supabase.from('transactions').select('kind, amount')
      .lt('occurred_on', date).order('id').range(from, from + PAGE - 1));
    for (const t of rows) balance += t.kind === 'masuk' ? t.amount : -t.amount;
    if (rows.length < PAGE) return balance;
  }
}

/* ---------- US 6.4: Trend of the last 6 months ---------- */
// One query for the whole window (only kind, amount, date), summed per month in the browser.
// Each month is a button: hover/focus shows its numbers below the chart, a tap opens that month.
const trendChart = document.getElementById('trend-chart');
const trendReadout = document.getElementById('trend-readout');
const longMonth = (date) => date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
let trendRequest = 0; // only the newest answer is drawn when months are clicked quickly
let trend = []; // [{ month, key, masuk, keluar }], oldest first
let trendShape = ''; // months currently drawn; same months → bars move, others → redraw

async function loadTrend() {
  const request = ++trendRequest;
  const months = trendWindow(month);
  const end = months.at(-1);
  trendChart.classList.add('opacity-60'); // keep the old chart visible while loading
  try {
    const rows = await fetchAll(() => supabase.from('transactions').select('kind, amount, occurred_on')
      .gte('occurred_on', toISODate(months[0]))
      .lte('occurred_on', toISODate(new Date(end.getFullYear(), end.getMonth() + 1, 0)))
      .order('id'));
    if (request !== trendRequest) return; // a newer month was opened meanwhile
    trend = monthlyTotals(rows, months);
    renderTrend();
  } catch (error) {
    if (request !== trendRequest) return;
    trend = [];
    trendShape = '';
    trendChart.innerHTML = `<p class="py-6 text-center text-sm text-muted">${escapeHtml(appError(error))}</p>`;
    trendReadout.textContent = '';
  }
  trendChart.classList.remove('opacity-60');
}

function renderTrend() {
  const top = niceMax(Math.max(...trend.flatMap((m) => [m.masuk, m.keluar])));
  if (!top) {
    trendShape = '';
    trendChart.innerHTML = '<p class="py-6 text-center text-sm text-muted">Belum ada catatan dalam 6 bulan ini.</p>';
    trendReadout.textContent = '';
    return;
  }
  const shape = trend.map((m) => m.key).join();
  if (shape !== trendShape) {
    trendShape = shape;
    drawTrend();
    requestAnimationFrame(() => updateTrend(top)); // bars grow from the baseline
  } else {
    updateTrend(top);
  }
}

/** Chart frame: axis labels, two hairline gridlines, one button per month, and a table for screen readers. */
function drawTrend() {
  const bar = (kind) => `<span class="w-3 rounded-t transition-[height] duration-500 ease-out sm:w-4 ${
    kind === 'masuk' ? 'bg-chart-in' : 'bg-chart-out'}" data-bar="${kind}" style="height:0"></span>`;
  trendChart.innerHTML = `
    <div class="flex gap-2 pt-2">
      <div class="relative h-40 w-10 shrink-0 text-right text-[11px] leading-none text-muted" aria-hidden="true">
        <span class="absolute right-0 top-0 -translate-y-1/2" data-tick="top"></span>
        <span class="absolute right-0 top-1/2 -translate-y-1/2" data-tick="half"></span>
        <span class="absolute bottom-0 right-0 translate-y-1/2">0</span>
      </div>
      <div class="relative h-40 min-w-0 flex-1">
        <div class="absolute inset-x-0 top-0 border-t border-line"></div>
        <div class="absolute inset-x-0 top-1/2 border-t border-line"></div>
        <div class="absolute inset-0 grid grid-cols-6 gap-1 border-b border-line-strong">
          ${trend.map((m) => `
            <button type="button" class="flex h-full items-end justify-center gap-0.5 rounded-t-md pt-1 transition-colors hover:bg-raised/70 aria-pressed:bg-raised"
              data-trend="${m.key}">${bar('masuk')}${bar('keluar')}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="mt-1.5 flex gap-2" aria-hidden="true">
      <div class="w-10 shrink-0"></div>
      <div class="grid min-w-0 flex-1 grid-cols-6 gap-1 text-center text-xs text-muted">
        ${trend.map((m) => `<span data-trend-label="${m.key}">${m.month.toLocaleDateString('id-ID', { month: 'short' })}</span>`).join('')}
      </div>
    </div>
    <table class="sr-only">
      <caption>Uang masuk dan keluar per bulan</caption>
      <thead><tr><th scope="col">Bulan</th><th scope="col">Uang masuk</th><th scope="col">Uang keluar</th><th scope="col">Sisa</th></tr></thead>
      <tbody></tbody>
    </table>`;
}

const signedRupiah = (amount) => `${amount < 0 ? '−' : ''}${rupiah(Math.abs(amount))}`;

function updateTrend(top) {
  const height = (value) => (value > 0 ? `max(2px, ${(value / top) * 100}%)` : '0');
  const viewed = monthKey(month);
  trendChart.querySelector('[data-tick="top"]').textContent = compactAmount(top);
  trendChart.querySelector('[data-tick="half"]').textContent = compactAmount(top / 2);
  for (const m of trend) {
    const button = trendChart.querySelector(`[data-trend="${m.key}"]`);
    button.querySelector('[data-bar="masuk"]').style.height = height(m.masuk);
    button.querySelector('[data-bar="keluar"]').style.height = height(m.keluar);
    button.setAttribute('aria-pressed', String(m.key === viewed));
    button.setAttribute('aria-label',
      `${longMonth(m.month)}: uang masuk ${rupiah(m.masuk)}, uang keluar ${rupiah(m.keluar)}. Buka bulan ini`);
    const label = trendChart.querySelector(`[data-trend-label="${m.key}"]`);
    label.classList.toggle('font-semibold', m.key === viewed);
    label.classList.toggle('text-ink', m.key === viewed);
  }
  trendChart.querySelector('tbody').innerHTML = trend.map((m) => `
    <tr><th scope="row">${longMonth(m.month)}</th><td>${rupiah(m.masuk)}</td><td>${rupiah(m.keluar)}</td>
    <td>${signedRupiah(m.masuk - m.keluar)}</td></tr>`).join('');
  showTrendMonth(viewed);
}

/** Numbers of one month under the chart (values in text colours; the small line keys carry identity). */
function showTrendMonth(key) {
  const m = trend.find((x) => x.key === key);
  if (!m) {
    trendReadout.textContent = '';
    return;
  }
  // Each part stays on one line, so a colour key never ends up apart from its value.
  const part = (label, amount, keyClass = '') => `<span class="inline-flex items-center gap-1.5 whitespace-nowrap">${
    keyClass ? `<span class="h-0.5 w-3 rounded-full ${keyClass}" aria-hidden="true"></span>` : ''}${label}
    <strong class="font-semibold text-ink">${amount}</strong></span>`;
  trendReadout.innerHTML = `<span class="font-semibold text-ink">${longMonth(m.month)}</span>
    ${part('masuk', rupiah(m.masuk), 'bg-chart-in')}
    ${part('keluar', rupiah(m.keluar), 'bg-chart-out')}
    ${part('sisa', signedRupiah(m.masuk - m.keluar))}`;
}

trendChart.addEventListener('click', (event) => {
  const button = event.target.closest('[data-trend]');
  if (!button) return;
  const [year, monthNumber] = button.dataset.trend.split('-').map(Number);
  month.setFullYear(year, monthNumber - 1, 1);
  load();
});
const previewMonth = (event) => {
  const button = event.target.closest('[data-trend]');
  if (button) showTrendMonth(button.dataset.trend);
};
trendChart.addEventListener('pointerover', previewMonth);
trendChart.addEventListener('focusin', previewMonth);
trendChart.addEventListener('pointerleave', () => showTrendMonth(monthKey(month)));
trendChart.addEventListener('focusout', () => showTrendMonth(monthKey(month)));

document.getElementById('prev-month').addEventListener('click', () => { month.setMonth(month.getMonth() - 1); load(); });
document.getElementById('next-month').addEventListener('click', () => { month.setMonth(month.getMonth() + 1); load(); });

/* ---------- Task 02: Handle User Event ---------- */
// Event "input" fires on every keystroke, so the list filters while the user types.
search.addEventListener('input', render);

// Chips: show all records, only money in, or only money out.
document.getElementById('kind-filter').addEventListener('click', (event) => {
  const chip = event.target.closest('[data-kind]');
  if (!chip) return;
  kindFilter = chip.dataset.kind;
  document.querySelectorAll('[data-kind]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  render();
});

/* ---------- Task 03: Build One Complete Interaction ---------- */
// Click "Lihat Rincian" → sum this month's transactions per category → show the detail.
const breakdown = document.querySelector('#breakdown');
const breakdownButton = document.querySelector('#toggle-breakdown');

breakdownButton.addEventListener('click', () => {
  const opening = breakdown.hidden;
  breakdown.hidden = !opening;
  breakdownButton.setAttribute('aria-expanded', String(opening));
  breakdownButton.textContent = opening ? '📊 Tutup Rincian' : '📊 Lihat Rincian per Kategori';
  renderBreakdown();
});

function renderBreakdown() {
  if (breakdown.hidden) return;
  breakdown.innerHTML = breakdownSection('masuk', 'Uang masuk dari') + breakdownSection('keluar', 'Uang keluar untuk');
}

function breakdownSection(kind, heading) {
  const totals = {};
  for (const t of transactions) {
    if (t.kind === kind) totals[t.category] = (totals[t.category] ?? 0) + t.amount;
  }
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const title = `<h2 class="text-base mt-2">${heading}</h2>`;
  if (!rows.length) return `${title}<p class="muted">Belum ada catatan.</p>`;

  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);
  return title + rows.map(([category, amount]) => {
    const percent = Math.round((amount / total) * 100);
    // The bar width is computed at runtime, so it stays an inline style (Tailwind can't know it in advance).
    return `
      <div class="grid gap-1 py-1.5">
        <div class="flex justify-between gap-2.5 font-semibold">
          <span>${escapeHtml(category)}</span>
          <span class="${moneyClass(kind)}">${rupiah(amount)} · ${percent}%</span>
        </div>
        <div class="h-2 rounded-full bg-line overflow-hidden"><span class="block h-full rounded-full ${kind === 'masuk' ? 'bg-green' : 'bg-red'}" style="width:${percent}%"></span></div>
      </div>`;
  }).join('');
}

/* ---------- Render ---------- */
function render() {
  const sum = (kind) => transactions.filter((t) => t.kind === kind).reduce((total, t) => total + t.amount, 0);
  const income = sum('masuk');
  const expense = sum('keluar');
  document.getElementById('sum-in').textContent = rupiah(income);
  document.getElementById('sum-out').textContent = rupiah(expense);
  const balance = document.getElementById('sum-balance');
  balance.textContent = `${income - expense < 0 ? '−' : ''}${rupiah(Math.abs(income - expense))}`;
  balance.classList.toggle('!text-red', income - expense < 0);
  renderBreakdown(); // keep an open breakdown in sync when the month or data changes

  // Totals always cover the whole month; the search only narrows the list below.
  // The running balance (saldo) is worked out over the whole month first, so a row keeps
  // its real saldo even when the search or a chip hides the rows around it.
  let saldo = openingBalance;
  const rows = transactions.map((t, i) => {
    saldo += t.kind === 'masuk' ? t.amount : -t.amount;
    return { t, no: i + 1, saldo };
  });
  const q = search.value.trim().toLowerCase();
  const shown = rows.filter(({ t }) => (kindFilter === 'all' || t.kind === kindFilter)
    && (!q || t.category.toLowerCase().includes(q) || (t.note ?? '').toLowerCase().includes(q)));

  const filtered = shown.length !== rows.length;
  const note = document.getElementById('ledger-note');
  note.hidden = !filtered || !shown.length;
  note.textContent = `Menampilkan ${shown.length} dari ${rows.length} catatan. Saldo tetap dihitung dari semua catatan.`;
  list.innerHTML = ledgerTable(shown, filtered, q, saldo);
}

/* ---------- Buku kas ---------- */
const plain = (amount) => amount.toLocaleString('id-ID'); // the column header already says "Rp"
const signed = (amount) => `${amount < 0 ? '−' : ''}${plain(Math.abs(amount))}`;
const saldoCell = (amount) => `<td class="ledger-num ledger-saldo${amount < 0 ? ' is-minus' : ''}">${signed(amount)}</td>`;
const shortDate = (iso) => formatDate(iso, { day: 'numeric', month: 'short' });
const money = (t) => `<span class="${moneyClass(t.kind)}">${plain(t.amount)}</span>`;
// Wide screens show No, Masuk and Keluar columns (.ledger-wide); phones show one Jumlah column
// with + / − instead (.ledger-narrow). Every row has both kinds of cells so the columns line up.
const noCell = '<td class="ledger-no ledger-wide"></td>';
const blankCells = '<td class="ledger-wide"></td><td class="ledger-wide"></td><td class="ledger-narrow"></td>';

function ledgerTable(shown, filtered, q, closingBalance) {
  const sumOf = (kind) => shown.filter(({ t }) => t.kind === kind).reduce((total, { t }) => total + t.amount, 0);
  let lastDate = null;
  let dayIndex = 0;
  const body = shown.map(({ t, no, saldo }) => {
    const newDay = t.occurred_on !== lastDate;
    if (newDay) dayIndex += 1;
    lastDate = t.occurred_on;
    return `
      <tr class="ledger-row${dayIndex % 2 === 0 ? ' is-even-day' : ''}" data-edit="${t.id}">
        <td class="ledger-no ledger-wide">${no}</td>
        <td class="ledger-date">${newDay ? shortDate(t.occurred_on) : ''}</td>
        <td>
          <button type="button" class="ledger-edit" data-edit="${t.id}">
            <strong>${escapeHtml(t.category)}</strong>
            ${t.note ? `<small>${escapeHtml(t.note)}</small>` : ''}
          </button>
        </td>
        <td class="ledger-num ledger-wide">${t.kind === 'masuk' ? money(t) : ''}</td>
        <td class="ledger-num ledger-wide">${t.kind === 'keluar' ? money(t) : ''}</td>
        <td class="ledger-num ledger-narrow"><span class="${moneyClass(t.kind)}">${t.kind === 'masuk' ? '+' : '−'}${plain(t.amount)}</span></td>
        ${saldoCell(saldo)}
      </tr>`;
  }).join('');

  const message = `<span class="mb-1 block text-3xl" aria-hidden="true">📒</span>${emptyText(q)}`;
  const empty = `<tr>${noCell}
    <td colspan="5" class="ledger-wide py-8 text-center text-muted">${message}</td>
    <td colspan="4" class="ledger-narrow py-8 text-center text-muted">${message}</td></tr>`;
  const income = sumOf('masuk');
  const expense = sumOf('keluar');

  return `
    <table class="ledger-table">
      <thead>
        <tr>
          <th class="ledger-no ledger-wide" scope="col">No</th>
          <th scope="col">Tgl</th>
          <th scope="col">Keterangan</th>
          <th class="ledger-num ledger-wide" scope="col">Masuk (Rp)</th>
          <th class="ledger-num ledger-wide" scope="col">Keluar (Rp)</th>
          <th class="ledger-num ledger-narrow" scope="col">Jumlah (Rp)</th>
          <th class="ledger-num" scope="col">Saldo (Rp)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="ledger-opening">
          ${noCell}
          <td class="ledger-date">${shortDate(toISODate(month))}</td>
          <td><strong class="font-semibold">Saldo awal</strong><small class="block text-[12.5px] text-muted">Sisa uang dari bulan-bulan sebelumnya</small></td>
          ${blankCells}
          ${saldoCell(openingBalance)}
        </tr>
        ${shown.length ? body : empty}
      </tbody>
      <tfoot>
        <tr class="ledger-foot ledger-wide-row">
          ${noCell}
          <td colspan="2">${filtered ? 'Jumlah yang ditampilkan' : 'Jumlah bulan ini'}</td>
          <td class="ledger-num text-green">${plain(income)}</td>
          <td class="ledger-num text-red">${plain(expense)}</td>
          <td></td>
        </tr>
        <tr class="ledger-foot ledger-narrow-row">
          <td colspan="2">Total masuk${filtered ? ' (ditampilkan)' : ''}</td>
          <td class="ledger-num text-green">${income ? '+' : ''}${plain(income)}</td>
          <td></td>
        </tr>
        <tr class="ledger-foot ledger-narrow-row">
          <td colspan="2">Total keluar${filtered ? ' (ditampilkan)' : ''}</td>
          <td class="ledger-num text-red">${expense ? '−' : ''}${plain(expense)}</td>
          <td></td>
        </tr>
        <tr class="ledger-foot ledger-final">
          ${noCell}
          <td colspan="2">Saldo akhir</td>
          ${blankCells}
          ${saldoCell(closingBalance)}
        </tr>
      </tfoot>
    </table>`;
}

function emptyText(q) {
  if (!transactions.length) return 'Belum ada catatan di bulan ini.';
  if (q) return `Tidak ada catatan yang cocok dengan “${escapeHtml(search.value.trim())}”.`;
  return kindFilter === 'masuk' ? 'Belum ada uang masuk di bulan ini.' : 'Belum ada uang keluar di bulan ini.';
}

// Print the month's cash book, or save it as PDF from the print window.
document.getElementById('print').addEventListener('click', () => {
  document.getElementById('printed-on').textContent =
    `Dicetak dari NAKESA pada ${formatDate(todayISO(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;
  window.print();
});

/* ---------- Add / edit ---------- */
function renderCategories(kind, selected) {
  const options = financeCategories(profile.profession, kind);
  if (selected && !options.includes(selected)) options.unshift(selected);
  document.getElementById('category-choices').innerHTML = options.map((c) => `
    <label class="choice"><input type="radio" name="category" value="${escapeHtml(c)}" ${c === selected ? 'checked' : ''}>
    <span>${escapeHtml(c)}</span></label>`).join('');
}

// "Lainnya" opens a text box to write what the money was for.
const OTHER = 'Lainnya';
const otherInput = document.getElementById('category-other');

function showOtherInput(focus = false) {
  const show = form.querySelector('input[name="category"]:checked')?.value === OTHER;
  otherInput.hidden = !show;
  if (show && focus) otherInput.focus();
}

form.addEventListener('change', (event) => {
  if (event.target.name === 'kind') renderCategories(event.target.value);
  if (event.target.name === 'kind' || event.target.name === 'category') showOtherInput(event.target.name === 'category');
});
// An old error message goes away as soon as the user fixes something.
form.addEventListener('input', () => { errorBox.hidden = true; });

function openForm(tx, kind = 'masuk') {
  editing = tx;
  fillForm(form, tx ?? { kind, occurred_on: todayISO() });
  form.amount.value = tx ? tx.amount.toLocaleString('id-ID') : '';
  renderCategories(tx?.kind ?? kind, tx?.category);
  otherInput.value = '';
  showOtherInput();
  document.getElementById('dialog-title').textContent = tx ? 'Ubah Catatan' : 'Catat Uang';
  document.getElementById('delete').hidden = !tx;
  errorBox.hidden = true;
  dialog.showModal();
  form.amount.focus();
}

document.querySelectorAll('[data-new]').forEach((b) => b.addEventListener('click', () => openForm(null, b.dataset.new)));
list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-edit]');
  if (button) openForm(transactions.find((t) => t.id === button.dataset.edit));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = formValues(form);
  const row = { ...values, amount: parseRupiah(values.amount ?? ''), occurred_on: values.occurred_on ?? todayISO() };
  if (!row.amount) return fail('Isi jumlah uangnya.');
  if (!row.category) return fail('Pilih “Untuk apa?”.');
  if (row.category === OTHER) {
    const typed = otherInput.value.trim();
    // Records saved as plain "Lainnya" before this text box existed can still be saved as they are.
    if (!typed && editing?.category !== OTHER) {
      otherInput.focus();
      return fail('Tulis dulu untuk apa uangnya.');
    }
    if (typed) row.category = typed;
  }

  try {
    await whileSaving(document.getElementById('save'), () =>
      (editing ? updateRow('transactions', editing.id, row) : insertRow('transactions', row)));
    closeDialog(dialog);
    toast('Catatan disimpan');
    // Jump to the month of the saved entry so it is visible.
    const saved = new Date(`${row.occurred_on}T00:00:00`);
    month.setFullYear(saved.getFullYear(), saved.getMonth(), 1);
    await load();
  } catch (error) {
    fail(appError(error));
  }
});

function fail(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

document.getElementById('delete').addEventListener('click', async () => {
  if (!editing) return;
  const ok = await confirmDialog({
    icon: '🗑️', title: 'Hapus catatan ini?',
    message: `${editing.category} · ${rupiah(editing.amount)}`, confirmLabel: 'Ya, hapus',
  });
  if (!ok) return;
  try {
    await deleteRow('transactions', editing.id);
    closeDialog(dialog);
    toast('Catatan dihapus');
    await load();
  } catch (error) {
    toast(appError(error), 'error');
  }
});

/* ---------- US 6.5: Download the month as a spreadsheet (CSV) ---------- */
// Built in the browser from the month that is already loaded, so it always matches the cash book
// on screen: same columns, same saldo awal, running saldo and saldo akhir.
document.getElementById('download-report').addEventListener('click', () => {
  const label = month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  if (loadedMonth !== toISODate(month)) {
    toast(`Data ${label} masih dimuat. Coba lagi sebentar.`, 'error');
    return;
  }
  if (!transactions.length && !openingBalance) {
    toast(`Belum ada catatan di ${label}.`, 'error');
    return;
  }
  const csv = monthlyReportCsv(transactions, { delimiter: csvDelimiter(), openingBalance, monthStart: toISODate(month) });
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: reportFileName(practice.name, month) });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Laporan ${label} diunduh`);
});

await load();
const startKind = new URLSearchParams(location.search).get('new');
if (startKind === 'masuk' || startKind === 'keluar') openForm(null, startKind);
