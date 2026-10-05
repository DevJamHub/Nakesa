// Keuangan: money in / out per month, with a monthly summary and the cash book
// (buku kas): every record as a row with a running balance, like the paper book.
import { deleteRow, insertRow, run, supabase, updateRow } from '../db.js';
import { bindRupiahInput, escapeHtml, formatDate, parseRupiah, rupiah, toISODate, todayISO } from '../format.js';
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
let transactions = []; // this month, oldest first (the order of the book)
let openingBalance = 0; // saldo awal: what was left from all earlier months
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
  try {
    [transactions, openingBalance] = await Promise.all([
      run(supabase.from('transactions').select('*')
        .gte('occurred_on', first).lte('occurred_on', last)
        .order('occurred_on').order('created_at')),
      balanceBefore(first),
    ]);
  } catch (error) {
    transactions = [];
    openingBalance = 0;
    toast(appError(error), 'error');
  }
  render();
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
  balance.className = `stat-value whitespace-nowrap ${income - expense < 0 ? '!text-red' : ''}`;
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

await load();
const startKind = new URLSearchParams(location.search).get('new');
if (startKind === 'masuk' || startKind === 'keluar') openForm(null, startKind);
