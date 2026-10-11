// Resep: prescriptions per patient. A prescription is saved as a draft; "Selesaikan"
// calls complete_prescription(), which checks every medicine and takes the stock
// (earliest expiry first) in one go — or nothing at all when something is missing.
import { PAGES } from '../config.js';
import { deleteRow, insertRow, run, supabase, updateRow } from '../db.js';
import { escapeHtml, formatDate, waLink } from '../format.js';
import { DRUG_CLASS, STOCK_STATUS, medicineDetail } from '../practice-utils.js';
import { canManage, practiceRole } from '../roles.js';
import {
  appError, closeDialog, confirmDialog, fillForm, formValues, openPopup, refreshNavBadges, startPage, toast,
} from '../shell.js';

const { user, practice } = await startPage('prescriptions');
const role = await practiceRole(practice, user);
const $ = (id) => document.getElementById(id);
const list = $('list');
const STATUS = {
  draft: { label: 'Draf', tone: 'gray' },
  selesai: { label: 'Selesai', tone: 'green' },
  batal: { label: 'Batal', tone: 'red' },
};

let prescriptions = [];
let inventory = []; // active medicines from medicine_inventory
let patients = [];
let statusFilter = 'all';

if (!canManage(role)) {
  list.innerHTML = `<div class="empty-state"><p class="empty-icon" aria-hidden="true">🔒</p>
    <p class="muted">Resep adalah data klinis. Hanya admin dan tenaga kesehatan yang bisa melihat dan membuatnya.</p></div>`;
} else {
  $('add').hidden = false;
}

async function load() {
  try {
    [prescriptions, inventory, patients] = await Promise.all([
      run(supabase.from('prescriptions')
        .select(`id, patient_id, patient_name, booking_id, status, notes, created_at, completed_at,
          prescription_items(id, medicine_id, dose, frequency, duration, quantity, route, instructions, created_at,
            medicines(generic_name, unit))`)
        .order('created_at', { ascending: false }).limit(200)),
      run(supabase.from('medicine_inventory')
        .select('id, generic_name, brand_name, dosage_form, strength, unit, route, stock, stock_status, drug_class, use_in_service')
        .eq('is_active', true).order('generic_name')),
      run(supabase.from('patients').select('id, full_name, phone').order('full_name')),
    ]);
  } catch (error) {
    toast(appError(error), 'error');
  }
  $('rx-patients').innerHTML = patients.map((p) => `<option value="${escapeHtml(p.full_name)}">`).join('');
  render();
}

/* ---------- List ---------- */
$('search').addEventListener('input', render);
$('status-filter').addEventListener('click', (event) => {
  const chip = event.target.closest('[data-status]');
  if (!chip) return;
  statusFilter = chip.dataset.status;
  render();
});

const itemsOf = (rx) => [...(rx.prescription_items ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
const when = (rx) => new Date(rx.completed_at ?? rx.created_at)
  .toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function render() {
  if (!canManage(role)) return;
  const counts = { all: prescriptions.length };
  for (const rx of prescriptions) counts[rx.status] = (counts[rx.status] ?? 0) + 1;
  $('status-filter').innerHTML = [['all', 'Semua'], ...Object.entries(STATUS).map(([k, v]) => [k, v.label])]
    .map(([key, label]) => `<button type="button" class="chip" data-status="${key}" aria-pressed="${key === statusFilter}">
      ${label} <span class="chip-count">${counts[key] ?? 0}</span></button>`).join('');

  const q = $('search').value.trim().toLowerCase();
  const shown = prescriptions.filter((rx) => (statusFilter === 'all' || rx.status === statusFilter)
    && (!q || rx.patient_name.toLowerCase().includes(q)));
  if (!shown.length) {
    list.innerHTML = `<div class="empty-state"><p class="empty-icon" aria-hidden="true">📝</p>
      <p class="muted">${prescriptions.length ? 'Tidak ada resep yang cocok.' : 'Belum ada resep. Tekan “Buat Resep” untuk mencatat obat yang diberikan ke pasien.'}</p></div>`;
    return;
  }
  list.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th scope="col">Waktu</th><th scope="col">Pasien</th><th scope="col">Obat</th>
        <th scope="col">Status</th><th scope="col" class="num">Aksi</th>
      </tr></thead>
      <tbody>${shown.map((rx) => `
        <tr>
          <td><span class="whitespace-nowrap">${when(rx)}</span></td>
          <td data-label="Pasien"><span class="font-semibold text-ink">${escapeHtml(rx.patient_name)}</span>
            ${rx.notes ? `<span class="cell-sub">${escapeHtml(rx.notes)}</span>` : ''}</td>
          <td data-label="Obat">${itemsOf(rx).map((i) => `${escapeHtml(i.medicines?.generic_name ?? 'Obat')} <span class="text-muted">${i.quantity} ${escapeHtml(i.medicines?.unit ?? '')}</span>`).join('<br>') || '<span class="text-muted">—</span>'}</td>
          <td data-label="Status"><span class="badge badge-${STATUS[rx.status].tone}">${STATUS[rx.status].label}</span></td>
          <td class="cell-actions"><div class="row-actions">
            <button type="button" class="btn btn-ghost btn-small" data-open="${rx.id}">Detail</button>
            ${rx.status === 'draft' ? `<button type="button" class="btn btn-ghost btn-small" data-edit="${rx.id}">✏️ Lanjutkan</button>` : ''}
          </div></td>
        </tr>`).join('')}</tbody>
    </table>`;
}

list.addEventListener('click', (event) => {
  const open = event.target.closest('[data-open]');
  if (open) return showDetail(prescriptions.find((rx) => rx.id === open.dataset.open));
  const edit = event.target.closest('[data-edit]');
  if (edit) openForm(prescriptions.find((rx) => rx.id === edit.dataset.edit));
});

/* ---------- Detail pop-up ---------- */
function showDetail(rx) {
  const items = itemsOf(rx);
  const patient = patients.find((p) => p.id === rx.patient_id);
  const instructions = items.map((i) => `• ${i.medicines?.generic_name}: ${[i.dose, i.frequency, i.duration].filter(Boolean).join(', ')}`
    + `${i.instructions ? ` (${i.instructions})` : ''}`).join('\n');
  let footer = '';
  if (rx.status === 'draft') {
    footer = `
      <button type="button" class="btn btn-success" data-act="complete">✓ Selesaikan &amp; kurangi stok</button>
      <button type="button" class="btn btn-ghost" data-act="edit">✏️ Lanjutkan mengisi</button>
      <div class="two-cols">
        <button type="button" class="btn btn-danger-ghost" data-act="cancel">Batalkan</button>
        <button type="button" class="btn btn-danger-ghost" data-act="delete">Hapus draf</button>
      </div>`;
  } else if (rx.status === 'selesai' && patient?.phone) {
    footer = `<a class="btn btn-wa" target="_blank" rel="noopener"
      href="${waLink(patient.phone, `Halo ${rx.patient_name}, berikut aturan pakai obat dari ${practice.name}:\n${instructions}\nSemoga lekas sehat 🙏`)}">
      💬 Kirim aturan pakai ke WhatsApp pasien</a>`;
  }
  const popup = openPopup({
    title: rx.patient_name,
    body: `
      <div class="flex flex-wrap items-center gap-2">
        <span class="badge badge-${STATUS[rx.status].tone}">${STATUS[rx.status].label}</span>
        <span class="text-sm text-muted">${when(rx)}</span>
      </div>
      ${rx.notes ? `<div class="note-box">📋 ${escapeHtml(rx.notes)}</div>` : ''}
      <div class="grid gap-2">${items.map((i) => `
        <div class="rx-item">
          <div class="rx-item-head">
            <strong class="text-ink">${escapeHtml(i.medicines?.generic_name ?? 'Obat')}</strong>
            <span class="whitespace-nowrap font-semibold">${i.quantity} ${escapeHtml(i.medicines?.unit ?? '')}</span>
          </div>
          <p class="text-sm">${escapeHtml([i.dose, i.frequency, i.duration, i.route].filter(Boolean).join(' · '))}</p>
          ${i.instructions ? `<p class="text-sm text-muted">${escapeHtml(i.instructions)}</p>` : ''}
        </div>`).join('') || '<p class="muted">Belum ada obat.</p>'}</div>`,
    footer,
  });
  popup.querySelector('.popup-actions')?.addEventListener('click', async (event) => {
    const act = event.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'edit') {
      closeDialog(popup);
      return openForm(rx);
    }
    if (act === 'complete') {
      if (await complete(rx.id)) closeDialog(popup);
      return;
    }
    const ok = await confirmDialog(act === 'delete'
      ? { icon: '🗑️', title: 'Hapus draf resep ini?', message: 'Draf dihapus permanen. Stok tidak berubah.', confirmLabel: 'Ya, hapus' }
      : { icon: '⛔', title: 'Batalkan resep ini?', message: 'Resep ditandai batal dan tidak bisa diselesaikan. Stok tidak berubah.', confirmLabel: 'Ya, batalkan' });
    if (!ok) return;
    try {
      if (act === 'delete') await deleteRow('prescriptions', rx.id);
      else await updateRow('prescriptions', rx.id, { status: 'batal' });
      toast(act === 'delete' ? 'Draf dihapus' : 'Resep dibatalkan');
      await load();
    } catch (error) {
      toast(appError(error), 'error');
    }
  });
}

/** Ask, then complete a saved prescription. Resolves true when the stock was taken. */
async function complete(prescriptionId) {
  const ok = await confirmDialog({
    icon: '💊', title: 'Selesaikan resep & kurangi stok?',
    message: 'Stok berkurang otomatis, mulai dari batch dengan tanggal kedaluwarsa terdekat. Resep yang selesai tidak bisa diubah lagi. '
      + 'Pastikan pemberian obat sesuai kewenangan, SOP, dan indikasi klinis.',
    confirmLabel: 'Ya, selesaikan', tone: 'success',
  });
  if (!ok) return false;
  try {
    await run(supabase.rpc('complete_prescription', { p_prescription_id: prescriptionId }));
    toast('Resep selesai. Stok obat sudah berkurang.');
    refreshNavBadges();
    await load();
    return true;
  } catch (error) {
    toast(appError(error), 'error');
    return false;
  }
}

/* ---------- Write a prescription ---------- */
const dialog = $('rx-dialog');
const form = $('rx-form');
const errorBox = $('rx-error');
const picker = $('rx-picker');
const itemsBox = $('rx-items');
let editing = null; // the draft being continued
let bookingId = null;

function openForm(rx = null, prefill = {}) {
  editing = rx;
  bookingId = rx?.booking_id ?? prefill.booking_id ?? null;
  fillForm(form, rx ?? prefill);
  itemsBox.innerHTML = '';
  for (const item of rx ? itemsOf(rx) : []) addItem(inventory.find((m) => m.id === item.medicine_id), item);
  syncEmpty();
  errorBox.hidden = true;
  $('rx-search').value = '';
  picker.hidden = true;
  $('rx-title').textContent = rx ? 'Lanjutkan Resep' : 'Buat Resep';
  dialog.showModal();
  form.patient_name.focus();
}

$('add').addEventListener('click', () => openForm());

const syncEmpty = () => { $('rx-empty').hidden = itemsBox.children.length > 0; };

// Search → pick a medicine. Only active medicines approved by the admin, with stock, can be chosen.
function renderPicker() {
  const q = $('rx-search').value.trim().toLowerCase();
  const added = new Set([...itemsBox.querySelectorAll('[data-item]')].map((el) => el.dataset.medicine));
  const matches = inventory.filter((m) => !q || m.generic_name.toLowerCase().includes(q)
    || (m.brand_name ?? '').toLowerCase().includes(q)).slice(0, 8);
  picker.hidden = false;
  if (!matches.length) {
    picker.innerHTML = `<p class="px-3 py-2 text-sm text-muted">Obat tidak ditemukan. Tambahkan dulu di
      <a href="${PAGES.medicines}">Database Obat</a>.</p>`;
    return;
  }
  picker.innerHTML = matches.map((m) => {
    let reason = '';
    if (!m.use_in_service) reason = 'Belum diizinkan admin';
    else if (m.stock <= 0) reason = 'Stok habis';
    else if (added.has(m.id)) reason = 'Sudah ditambahkan';
    const stock = STOCK_STATUS[m.stock_status];
    return `
      <button type="button" class="picker-item" data-pick="${m.id}" ${reason ? 'disabled' : ''}>
        <span class="min-w-0">
          <span class="block font-semibold text-ink">${escapeHtml(m.generic_name)}</span>
          <span class="block truncate text-[13px] text-muted">${escapeHtml(medicineDetail(m) || m.unit)}</span>
        </span>
        <span class="shrink-0 text-right text-[13px]">
          ${reason ? `<span class="badge badge-gray">${reason}</span>`
    : `<span class="font-semibold text-ink">${m.stock} ${escapeHtml(m.unit)}</span><span class="badge badge-${stock.tone} ml-1">${stock.label}</span>`}
        </span>
      </button>`;
  }).join('');
}

$('rx-search').addEventListener('input', renderPicker);
$('rx-search').addEventListener('focus', renderPicker);
$('rx-search').addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !picker.hidden) {
    event.preventDefault(); // close the list, not the whole form
    picker.hidden = true;
  }
});
dialog.addEventListener('click', (event) => {
  if (!event.target.closest('#rx-search, #rx-picker')) picker.hidden = true;
});
picker.addEventListener('click', (event) => {
  const pick = event.target.closest('[data-pick]');
  if (!pick || pick.disabled) return;
  const item = addItem(inventory.find((m) => m.id === pick.dataset.pick));
  $('rx-search').value = '';
  picker.hidden = true;
  syncEmpty();
  item.querySelector('[data-field="dose"]').focus();
});

/** One medicine row in the form. `values` fills it when continuing a draft. */
function addItem(medicine, values = {}) {
  if (!medicine) return null; // a medicine switched off since the draft was saved
  const drugClass = DRUG_CLASS[medicine.drug_class];
  const field = (name, label, attrs = '', value = values[name] ?? '') => `
    <div class="field ${name === 'instructions' ? 'sm:col-span-3' : ''}">
      <label>${label}</label>
      <input class="input" data-field="${name}" value="${escapeHtml(value)}" ${attrs}>
    </div>`;
  const wrapper = document.createElement('div');
  wrapper.className = 'rx-item';
  wrapper.dataset.item = '';
  wrapper.dataset.medicine = medicine.id;
  wrapper.innerHTML = `
    <div class="rx-item-head">
      <div class="min-w-0">
        <strong class="text-ink">${escapeHtml(medicine.generic_name)}</strong>
        ${drugClass ? `<span class="badge badge-${drugClass.tone} ml-1">${drugClass.label}</span>` : ''}
        <span class="cell-sub">${escapeHtml(medicineDetail(medicine) || medicine.unit)} · stok ${medicine.stock} ${escapeHtml(medicine.unit)}</span>
      </div>
      <button type="button" class="dialog-close" data-remove aria-label="Hapus ${escapeHtml(medicine.generic_name)} dari resep">✕</button>
    </div>
    <div class="grid gap-3 sm:grid-cols-3">
      ${field('dose', 'Dosis *', 'maxlength="60" placeholder="Contoh: 1 tablet"')}
      ${field('frequency', 'Frekuensi *', 'maxlength="60" list="rx-frequencies" placeholder="Contoh: 3x sehari"')}
      ${field('duration', 'Durasi', 'maxlength="60" list="rx-durations" placeholder="Contoh: 5 hari"')}
      ${field('quantity', `Jumlah diberikan (${escapeHtml(medicine.unit)}) *`, 'type="number" min="1" step="1" inputmode="numeric"')}
      ${field('route', 'Rute pemberian', 'maxlength="60"', values.route ?? medicine.route ?? '')}
      ${field('instructions', 'Instruksi penggunaan', 'maxlength="300" placeholder="Contoh: sesudah makan"')}
    </div>
    <p class="field-error" data-warning hidden></p>`;
  itemsBox.append(wrapper);
  return wrapper;
}

itemsBox.addEventListener('click', (event) => {
  const remove = event.target.closest('[data-remove]');
  if (!remove) return;
  remove.closest('[data-item]').remove();
  syncEmpty();
});

// Warn while typing when the amount is more than the stock.
itemsBox.addEventListener('input', (event) => {
  errorBox.hidden = true;
  const item = event.target.closest('[data-item]');
  if (!item || event.target.dataset.field !== 'quantity') return;
  const medicine = inventory.find((m) => m.id === item.dataset.medicine);
  const warning = item.querySelector('[data-warning]');
  const quantity = Number(event.target.value);
  warning.hidden = !(quantity > medicine.stock);
  warning.textContent = `Stok hanya ${medicine.stock} ${medicine.unit}.`;
});

function readItems() {
  return [...itemsBox.querySelectorAll('[data-item]')].map((el) => {
    const value = (name) => el.querySelector(`[data-field="${name}"]`).value.trim() || null;
    return {
      medicine_id: el.dataset.medicine,
      dose: value('dose'),
      frequency: value('frequency'),
      duration: value('duration'),
      quantity: Number(value('quantity')),
      route: value('route'),
      instructions: value('instructions'),
    };
  });
}

function fail(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  errorBox.scrollIntoView({ block: 'nearest' });
  return null;
}

/** Save the draft (new or continued). Returns its id, or null when something is missing. */
async function saveDraft() {
  const values = formValues(form);
  const items = readItems();
  if (!values.patient_name) return fail('Isi nama pasien.');
  if (!items.length) return fail('Tambahkan minimal satu obat.');
  const missing = items.findIndex((i) => !i.dose || !i.frequency || !Number.isInteger(i.quantity) || i.quantity <= 0);
  if (missing !== -1) {
    const name = inventory.find((m) => m.id === items[missing].medicine_id)?.generic_name ?? 'obat';
    return fail(`Lengkapi dosis, frekuensi, dan jumlah untuk ${name}.`);
  }
  const patient = patients.find((p) => p.full_name.toLowerCase() === values.patient_name.toLowerCase());
  const row = { patient_name: values.patient_name, notes: values.notes, patient_id: patient?.id ?? null, booking_id: bookingId };

  let id = editing?.id;
  if (id) {
    await updateRow('prescriptions', id, row);
    await run(supabase.from('prescription_items').delete().eq('prescription_id', id));
  } else {
    id = (await insertRow('prescriptions', row)).id;
    editing = { id, booking_id: bookingId }; // a second save updates this draft instead of making another
  }
  await run(supabase.from('prescription_items').insert(items.map((i) => ({ ...i, prescription_id: id }))));
  return id;
}

async function submit(completeIt) {
  const buttons = [$('rx-draft'), $('rx-complete')];
  buttons.forEach((b) => (b.disabled = true));
  try {
    const id = await saveDraft();
    if (!id) return;
    if (!completeIt) {
      closeDialog(dialog);
      toast('Draf resep disimpan');
      await load();
      return;
    }
    if (await complete(id)) {
      closeDialog(dialog);
    } else {
      fail('Draf sudah tersimpan, tetapi resep belum diselesaikan. Periksa pesan di bawah layar, lalu coba lagi.');
      await load();
    }
  } catch (error) {
    fail(appError(error));
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  submit(true);
});
$('rx-draft').addEventListener('click', () => submit(false));
form.addEventListener('input', (event) => {
  if (event.target.id !== 'rx-search') errorBox.hidden = true;
});

await load();
// ?new=1&patient=…&booking=… (from a booking) opens the form already filled in.
const params = new URLSearchParams(location.search);
if (params.has('new') && canManage(role)) {
  openForm(null, { patient_name: params.get('patient') ?? '', booking_id: params.get('booking') });
}
