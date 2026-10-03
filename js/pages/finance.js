// Keuangan: money in / out per month, with a monthly summary and a 6-month trend.
import { deleteRow, fetchAll, insertRow, run, supabase, updateRow } from '../db.js';
import { bindRupiahInput, escapeHtml, friendlyDate, parseRupiah, rupiah, toISODate, todayISO } from '../format.js';
import { compactAmount, monthKey, monthlyTotals, niceMax, trendWindow } from '../finance-trend.js';
import { financeCategories } from '../professions.js';
import {
  appError, closeDialog, confirmDialog, fillForm, formValues, startPage, toast, whileSaving,
} from '../shell.js';

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
let transactions = [];
let editing = null;
let kindFilter = 'all';

// Tailwind classes for money amounts (green = masuk, red = keluar).
const moneyClass = (kind) => `font-semibold whitespace-nowrap ${kind === 'masuk' ? 'text-green' : 'text-red'}`;

bindRupiahInput(form.amount);

/* ---------- Month ---------- */
async function load() {
  document.getElementById('month-label').textContent =
    month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const first = toISODate(month);
  const last = toISODate(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const trendLoaded = loadTrend(); // the chart loads alongside this month's list
  try {
    transactions = await run(supabase.from('transactions').select('*')
      .gte('occurred_on', first).lte('occurred_on', last)
      .order('occurred_on', { ascending: false }).order('created_at', { ascending: false }));
  } catch (error) {
    transactions = [];
    toast(appError(error), 'error');
  }
  render();
  await trendLoaded;
}

/* ---------- US 6.4: Trend of the last 6 months ---------- */
// One query for the whole window (only kind, amount, date), summed per month in the browser.
// Each month is a button: hover/focus shows its numbers below the chart, a tap opens that month.
const trendChart = document.getElementById('trend-chart');
const trendReadout = document.getElementById('trend-readout');
const monthName = (date) => date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
let trend = []; // [{ month, key, masuk, keluar }], oldest first
let trendShape = ''; // months currently drawn; same months → bars move, others → redraw

async function loadTrend() {
  const months = trendWindow(month);
  const end = months.at(-1);
  trendChart.classList.add('opacity-60'); // keep the old chart visible while loading
  try {
    const rows = await fetchAll(() => supabase.from('transactions').select('kind, amount, occurred_on')
      .gte('occurred_on', toISODate(months[0]))
      .lte('occurred_on', toISODate(new Date(end.getFullYear(), end.getMonth() + 1, 0)))
      .order('id'));
    trend = monthlyTotals(rows, months);
    renderTrend();
  } catch (error) {
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
      `${monthName(m.month)}: uang masuk ${rupiah(m.masuk)}, uang keluar ${rupiah(m.keluar)}. Buka bulan ini`);
    const label = trendChart.querySelector(`[data-trend-label="${m.key}"]`);
    label.classList.toggle('font-semibold', m.key === viewed);
    label.classList.toggle('text-ink', m.key === viewed);
  }
  trendChart.querySelector('tbody').innerHTML = trend.map((m) => `
    <tr><th scope="row">${monthName(m.month)}</th><td>${rupiah(m.masuk)}</td><td>${rupiah(m.keluar)}</td>
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
  trendReadout.innerHTML = `<span class="font-semibold text-ink">${monthName(m.month)}</span>
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
  const q = search.value.trim().toLowerCase();
  const shown = transactions.filter((t) => (kindFilter === 'all' || t.kind === kindFilter)
    && (!q || t.category.toLowerCase().includes(q) || (t.note ?? '').toLowerCase().includes(q)));

  if (!shown.length) {
    list.innerHTML = `<div class="card empty-state mt-3.5"><p class="empty-icon" aria-hidden="true">💰</p>
      <p class="muted">${emptyText(q)}</p></div>`;
    return;
  }
  let lastDate = null;
  list.innerHTML = shown.map((t) => {
    const heading = t.occurred_on !== lastDate ? `<p class="group-label">${friendlyDate(t.occurred_on)}</p>` : '';
    lastDate = t.occurred_on;
    return `${heading}
      <button type="button" class="item item-clickable" data-edit="${t.id}">
        <div class="item-main">
          <div>
            <div class="item-title">${escapeHtml(t.category)}</div>
            ${t.note ? `<div class="item-sub">${escapeHtml(t.note)}</div>` : ''}
          </div>
          <span class="${moneyClass(t.kind)}">${t.kind === 'masuk' ? '+' : '−'} ${rupiah(t.amount)}</span>
        </div>
      </button>`;
  }).join('');
}

function emptyText(q) {
  if (!transactions.length) return 'Belum ada catatan di bulan ini.';
  if (q) return `Tidak ada catatan yang cocok dengan “${escapeHtml(search.value.trim())}”.`;
  return kindFilter === 'masuk' ? 'Belum ada uang masuk di bulan ini.' : 'Belum ada uang keluar di bulan ini.';
}

/* ---------- Add / edit ---------- */
function renderCategories(kind, selected) {
  const options = financeCategories(profile.profession, kind);
  if (selected && !options.includes(selected)) options.unshift(selected);
  document.getElementById('category-choices').innerHTML = options.map((c) => `
    <label class="choice"><input type="radio" name="category" value="${escapeHtml(c)}" ${c === selected ? 'checked' : ''}>
    <span>${escapeHtml(c)}</span></label>`).join('');
}

form.addEventListener('change', (event) => {
  if (event.target.name === 'kind') renderCategories(event.target.value);
});

function openForm(tx, kind = 'masuk') {
  editing = tx;
  fillForm(form, tx ?? { kind, occurred_on: todayISO() });
  form.amount.value = tx ? tx.amount.toLocaleString('id-ID') : '';
  renderCategories(tx?.kind ?? kind, tx?.category);
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

await load();
const startKind = new URLSearchParams(location.search).get('new');
if (startKind === 'masuk' || startKind === 'keluar') openForm(null, startKind);
