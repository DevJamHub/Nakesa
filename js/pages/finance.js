// Keuangan: money in / out per month, with a monthly summary.
import { deleteRow, insertRow, run, supabase, updateRow } from '../db.js';
import { bindRupiahInput, escapeHtml, friendlyDate, parseRupiah, rupiah, toISODate, todayISO } from '../format.js';
import { financeCategories } from '../professions.js';
import { appError, fillForm, formValues, startPage, toast, whileSaving } from '../shell.js';

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

bindRupiahInput(form.amount);

/* ---------- Month ---------- */
async function load() {
  document.getElementById('month-label').textContent =
    month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const first = toISODate(month);
  const last = toISODate(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  try {
    transactions = await run(supabase.from('transactions').select('*')
      .gte('occurred_on', first).lte('occurred_on', last)
      .order('occurred_on', { ascending: false }).order('created_at', { ascending: false }));
  } catch (error) {
    transactions = [];
    toast(appError(error), 'error');
  }
  render();
}

document.getElementById('prev-month').addEventListener('click', () => { month.setMonth(month.getMonth() - 1); load(); });
document.getElementById('next-month').addEventListener('click', () => { month.setMonth(month.getMonth() + 1); load(); });

/* ---------- Task 02: Handle User Event ---------- */
// Event "input" fires on every keystroke, so the list filters while the user types.
search.addEventListener('input', render);

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
  if (!rows.length) return `<h2>${heading}</h2><p class="muted">Belum ada catatan.</p>`;

  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);
  return `<h2>${heading}</h2>` + rows.map(([category, amount]) => {
    const percent = Math.round((amount / total) * 100);
    return `
      <div class="breakdown-row">
        <div class="breakdown-row-head">
          <span>${escapeHtml(category)}</span>
          <span class="${kind === 'masuk' ? 'money-in' : 'money-out'}">${rupiah(amount)} · ${percent}%</span>
        </div>
        <div class="breakdown-bar"><span class="${kind === 'masuk' ? 'bar-in' : 'bar-out'}" style="width:${percent}%"></span></div>
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
  balance.className = `stat-value ${income - expense < 0 ? 'money-out' : ''}`;
  renderBreakdown(); // keep an open breakdown in sync when the month or data changes

  // Totals always cover the whole month; the search only narrows the list below.
  const q = search.value.trim().toLowerCase();
  const shown = transactions.filter((t) =>
    !q || t.category.toLowerCase().includes(q) || (t.note ?? '').toLowerCase().includes(q));

  if (!shown.length) {
    list.innerHTML = `<div class="card empty-state" style="margin-top:14px"><p class="empty-icon" aria-hidden="true">💰</p>
      <p class="muted">${transactions.length ? `Tidak ada catatan yang cocok dengan “${escapeHtml(search.value.trim())}”.` : 'Belum ada catatan di bulan ini.'}</p></div>`;
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
          <span class="${t.kind === 'masuk' ? 'money-in' : 'money-out'}">${t.kind === 'masuk' ? '+' : '−'} ${rupiah(t.amount)}</span>
        </div>
      </button>`;
  }).join('');
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
    dialog.close();
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
  if (!editing || !confirm('Hapus catatan ini?')) return;
  try {
    await deleteRow('transactions', editing.id);
    dialog.close();
    toast('Catatan dihapus');
    await load();
  } catch (error) {
    toast(appError(error), 'error');
  }
});

await load();
const startKind = new URLSearchParams(location.search).get('new');
if (startKind === 'masuk' || startKind === 'keluar') openForm(null, startKind);
