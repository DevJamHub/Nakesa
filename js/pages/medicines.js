// Stok obat: quick +/- stock, restock pop-up, add/edit/delete, warnings for low stock and expiry.
import { deleteRow, insertRow, run, supabase, updateRow } from '../db.js';
import { bindRupiahInput, escapeHtml, formatDate, parseRupiah, rupiah } from '../format.js';
import { medicineStatus } from '../practice-utils.js';
import {
  appError, closeDialog, confirmDialog, fillForm, formValues, openPopup, startPage, toast, whileSaving,
} from '../shell.js';

await startPage('medicines');

const list = document.getElementById('list');
const search = document.getElementById('search');
const dialog = document.getElementById('medicine-dialog');
const form = document.getElementById('medicine-form');
const errorBox = document.getElementById('form-error');
let medicines = [];
// ?filter=check (from the Beranda pop-up) opens the "Perlu dicek" tab.
let filter = new URLSearchParams(location.search).get('filter') === 'check' ? 'check' : 'all';
document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.filter === filter)));
let editing = null;

bindRupiahInput(form.price);

try {
  medicines = await run(supabase.from('medicines').select('*').order('name'));
} catch (error) {
  toast(appError(error), 'error');
}
render();

search.addEventListener('input', render);
document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-selected', String(b === button)));
    render();
  });
});
document.getElementById('add').addEventListener('click', () => openForm(null));

function render() {
  const needCheck = medicines.filter((m) => medicineStatus(m).tone !== 'green');
  document.getElementById('summary').textContent =
    `${medicines.length} jenis obat${needCheck.length ? ` · ${needCheck.length} perlu dicek` : ''}`;

  const q = search.value.trim().toLowerCase();
  const shown = (filter === 'check' ? needCheck : medicines).filter((m) => !q || m.name.toLowerCase().includes(q));

  if (!shown.length) {
    list.innerHTML = `<div class="card empty-state"><p class="empty-icon" aria-hidden="true">💊</p>
      <p class="muted">${medicines.length ? 'Tidak ada obat yang cocok.' : 'Belum ada obat. Tekan “Tambah Obat” untuk mulai mencatat stok.'}</p></div>`;
    return;
  }

  list.innerHTML = shown.map((m) => {
    const status = medicineStatus(m);
    const details = [
      m.price ? `${rupiah(m.price)} / ${m.unit}` : null,
      m.expires_on ? `ED ${formatDate(m.expires_on, { day: 'numeric', month: 'short', year: 'numeric' })}` : null,
    ].filter(Boolean).join(' · ');
    return `
      <div class="item">
        <div class="item-main">
          <button type="button" class="item-button" data-edit="${m.id}">
            <div class="item-title">${escapeHtml(m.name)}</div>
            <div class="item-sub">${escapeHtml(details || 'Tekan untuk mengubah')}</div>
          </button>
          <span class="badge badge-${status.tone}">${status.label}</span>
        </div>
        <div class="row-between">
          <button type="button" class="btn btn-ghost btn-small" data-restock="${m.id}" aria-haspopup="dialog">📦 Stok masuk</button>
          <div class="stepper" role="group" aria-label="Ubah stok ${escapeHtml(m.name)}">
            <button type="button" data-step="-1" data-id="${m.id}" aria-label="Kurangi" ${m.stock <= 0 ? 'disabled' : ''}>−</button>
            <strong data-stock="${m.id}">${m.stock} <span class="small muted">${escapeHtml(m.unit)}</span></strong>
            <button type="button" data-step="1" data-id="${m.id}" aria-label="Tambah">＋</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

list.addEventListener('click', async (event) => {
  const edit = event.target.closest('[data-edit]');
  if (edit) return openForm(medicines.find((m) => m.id === edit.dataset.edit));
  const restock = event.target.closest('[data-restock]');
  if (restock) return openRestock(medicines.find((m) => m.id === restock.dataset.restock));

  const step = event.target.closest('[data-step]');
  if (!step) return;
  const medicine = medicines.find((m) => m.id === step.dataset.id);
  const stock = Math.max(0, medicine.stock + Number(step.dataset.step));
  step.disabled = true;
  try {
    const saved = await updateRow('medicines', medicine.id, { stock });
    medicines = medicines.map((m) => (m.id === saved.id ? saved : m));
    render();
    bumpStock(saved.id);
  } catch (error) {
    step.disabled = false;
    toast(appError(error), 'error');
  }
});

/** Short "pop" on the stock number so the change is noticed. */
function bumpStock(id) {
  list.querySelector(`[data-stock="${id}"]`)?.classList.add('bump');
}

/* ---------- Restock pop-up: add many at once instead of tapping ＋ many times ---------- */
function openRestock(m) {
  const popup = openPopup({
    title: `Stok masuk: ${m.name}`,
    body: `
      <p class="muted">Sisa sekarang: <strong>${m.stock} ${escapeHtml(m.unit)}</strong></p>
      <div class="field">
        <label for="restock-amount">Jumlah yang masuk (${escapeHtml(m.unit)})</label>
        <input class="input input-money" id="restock-amount" type="number" inputmode="numeric" min="1" step="1" placeholder="0">
      </div>
      <div class="filter-chips !mb-0" id="restock-quick">
        ${[10, 50, 100].map((n) => `<button type="button" class="chip" data-add="${n}">＋ ${n}</button>`).join('')}
      </div>
      <p class="preview-line" id="restock-preview" aria-live="polite"></p>
      <div id="restock-error" class="form-error" role="alert" hidden></div>`,
    footer: '<button type="button" class="btn btn-primary btn-big" id="restock-save">Simpan Stok</button>',
  });
  const input = popup.querySelector('#restock-amount');
  const preview = popup.querySelector('#restock-preview');
  const errorText = popup.querySelector('#restock-error');
  const save = popup.querySelector('#restock-save');
  const amount = () => Math.max(0, Math.floor(Number(input.value) || 0));
  const update = () => {
    preview.textContent = amount() ? `Stok baru: ${m.stock + amount()} ${m.unit}` : '';
  };

  input.addEventListener('input', update);
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter') save.click(); });
  popup.querySelector('#restock-quick').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-add]');
    if (!chip) return;
    input.value = amount() + Number(chip.dataset.add);
    update();
  });
  save.addEventListener('click', async () => {
    if (!amount()) {
      errorText.textContent = 'Isi jumlah obat yang masuk.';
      errorText.hidden = false;
      return input.focus();
    }
    try {
      const saved = await whileSaving(save, () => updateRow('medicines', m.id, { stock: m.stock + amount() }));
      medicines = medicines.map((x) => (x.id === saved.id ? saved : x));
      closeDialog(popup);
      render();
      bumpStock(saved.id);
      toast(`Stok ${saved.name} sekarang ${saved.stock} ${saved.unit}`);
    } catch (error) {
      errorText.textContent = appError(error);
      errorText.hidden = false;
    }
  });
  input.focus();
}

function openForm(medicine) {
  editing = medicine;
  fillForm(form, medicine ?? { unit: 'tablet', stock: 0, min_stock: 5 });
  form.price.value = medicine?.price ? medicine.price.toLocaleString('id-ID') : '';
  document.getElementById('dialog-title').textContent = medicine ? 'Ubah Obat' : 'Tambah Obat';
  document.getElementById('delete').hidden = !medicine;
  errorBox.hidden = true;
  dialog.showModal();
  form.elements.name.focus(); // form.name would be the form's own name attribute
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = formValues(form);
  if (!values.name) {
    errorBox.textContent = 'Nama obat wajib diisi.';
    errorBox.hidden = false;
    return;
  }
  const row = {
    ...values,
    stock: Math.max(0, Number(values.stock) || 0),
    min_stock: Math.max(0, Number(values.min_stock) || 0),
    price: values.price ? parseRupiah(values.price) : null,
  };
  try {
    await whileSaving(document.getElementById('save'), async () => {
      if (editing) {
        const saved = await updateRow('medicines', editing.id, row);
        medicines = medicines.map((m) => (m.id === saved.id ? saved : m));
      } else {
        medicines.push(await insertRow('medicines', row));
      }
    });
    medicines.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    closeDialog(dialog);
    render();
    toast('Obat disimpan');
  } catch (error) {
    errorBox.textContent = appError(error);
    errorBox.hidden = false;
  }
});

document.getElementById('delete').addEventListener('click', async () => {
  if (!editing) return;
  const ok = await confirmDialog({
    icon: '🗑️', title: `Hapus ${editing.name}?`, message: 'Obat ini akan dihapus dari daftar stok.', confirmLabel: 'Ya, hapus',
  });
  if (!ok) return;
  try {
    await deleteRow('medicines', editing.id);
    medicines = medicines.filter((m) => m.id !== editing.id);
    closeDialog(dialog);
    render();
    toast('Obat dihapus');
  } catch (error) {
    toast(appError(error), 'error');
  }
});
