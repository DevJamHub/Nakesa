// Daftar pasien: search, add, edit, delete, WhatsApp.
import { deleteRow, insertRow, run, supabase, updateRow } from '../db.js';
import { age, escapeHtml, todayISO, waLink } from '../format.js';
import { appError, fillForm, formValues, startPage, toast, whileSaving } from '../shell.js';

await startPage('patients');

const list = document.getElementById('list');
const search = document.getElementById('search');
const dialog = document.getElementById('patient-dialog');
const form = document.getElementById('patient-form');
const errorBox = document.getElementById('form-error');
let patients = [];
let editing = null; // patient being edited, or null when adding

form.birth_date.max = todayISO();

try {
  patients = await run(supabase.from('patients').select('*').order('full_name'));
} catch (error) {
  toast(appError(error), 'error');
}
render();

search.addEventListener('input', render);
document.getElementById('add').addEventListener('click', () => openForm(null));
if (new URLSearchParams(location.search).has('new')) openForm(null);

function render() {
  const q = search.value.trim().toLowerCase();
  const shown = patients.filter((p) =>
    !q || p.full_name.toLowerCase().includes(q) || (p.phone ?? '').includes(q));
  document.getElementById('patient-count').textContent = `${patients.length} pasien tersimpan`;

  if (!shown.length) {
    list.innerHTML = `<div class="card empty-state"><p class="empty-icon" aria-hidden="true">👥</p>
      <p class="muted">${q ? 'Tidak ada pasien yang cocok.' : 'Belum ada pasien. Tekan “Tambah Pasien” untuk mulai.'}</p></div>`;
    return;
  }

  list.innerHTML = shown.map((p) => {
    const years = age(p.birth_date);
    const details = [
      p.gender === 'P' ? 'Perempuan' : p.gender === 'L' ? 'Laki-laki' : null,
      years !== null ? `${years} tahun` : null,
      p.phone,
    ].filter(Boolean).join(' · ');
    return `
      <div class="item">
        <div class="item-main">
          <button type="button" class="item-button" data-edit="${p.id}">
            <div class="item-title">${escapeHtml(p.full_name)}</div>
            <div class="item-sub">${escapeHtml(details || 'Tekan untuk melengkapi data')}</div>
            ${p.notes ? `<div class="item-sub">📝 ${escapeHtml(p.notes.slice(0, 90))}${p.notes.length > 90 ? '…' : ''}</div>` : ''}
          </button>
          ${p.phone ? `<a class="btn btn-wa btn-small" href="${waLink(p.phone)}" target="_blank" rel="noopener" aria-label="WhatsApp ${escapeHtml(p.full_name)}">💬 WA</a>` : ''}
        </div>
      </div>`;
  }).join('');
}

list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-edit]');
  if (button) openForm(patients.find((p) => p.id === button.dataset.edit));
});

function openForm(patient) {
  editing = patient;
  fillForm(form, patient ?? {});
  document.getElementById('dialog-title').textContent = patient ? 'Ubah Data Pasien' : 'Tambah Pasien';
  document.getElementById('delete').hidden = !patient;
  errorBox.hidden = true;
  dialog.showModal();
  form.full_name.focus();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = formValues(form);
  if (!values.full_name) {
    errorBox.textContent = 'Nama pasien wajib diisi.';
    errorBox.hidden = false;
    return;
  }
  try {
    await whileSaving(document.getElementById('save'), async () => {
      if (editing) {
        const saved = await updateRow('patients', editing.id, values);
        patients = patients.map((p) => (p.id === saved.id ? saved : p));
      } else {
        patients.push(await insertRow('patients', values));
      }
    });
    patients.sort((a, b) => a.full_name.localeCompare(b.full_name, 'id'));
    dialog.close();
    render();
    toast(editing ? 'Data pasien disimpan' : 'Pasien ditambahkan');
  } catch (error) {
    errorBox.textContent = appError(error);
    errorBox.hidden = false;
  }
});

document.getElementById('delete').addEventListener('click', async () => {
  if (!editing || !confirm(`Hapus data ${editing.full_name}? Data yang dihapus tidak bisa dikembalikan.`)) return;
  try {
    await deleteRow('patients', editing.id);
    patients = patients.filter((p) => p.id !== editing.id);
    dialog.close();
    render();
    toast('Pasien dihapus');
  } catch (error) {
    toast(appError(error), 'error');
  }
});
