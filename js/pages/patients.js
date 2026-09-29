// Daftar pasien: search, detail pop-up with visit history, add, edit, delete, WhatsApp.
import { PAGES } from '../config.js';
import { deleteRow, insertRow, run, supabase, updateRow } from '../db.js';
import { age, escapeHtml, formatDate, friendlyDate, todayISO, waLink } from '../format.js';
import { BOOKING_STATUS } from '../practice-utils.js';
import {
  appError, closeDialog, confirmDialog, fillForm, formValues, openPopup, startPage, toast, whileSaving,
} from '../shell.js';

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
          <button type="button" class="item-button" data-open="${p.id}" aria-haspopup="dialog">
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
  const button = event.target.closest('[data-open]');
  if (button) openDetail(patients.find((p) => p.id === button.dataset.open));
});

/* ---------- Detail pop-up ---------- */
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

function openDetail(p) {
  const years = age(p.birth_date);
  const rows = [
    ['Jenis kelamin', p.gender === 'P' ? 'Perempuan' : p.gender === 'L' ? 'Laki-laki' : null],
    ['Umur', years !== null ? `${years} tahun` : null],
    ['Tanggal lahir', p.birth_date ? formatDate(p.birth_date, { day: 'numeric', month: 'long', year: 'numeric' }) : null],
    ['No. HP / WA', p.phone],
    ['Alamat', p.address],
  ].filter(([, value]) => value);
  const bookingUrl = `${PAGES.bookings}?${new URLSearchParams({ new: '1', name: p.full_name, phone: p.phone ?? '' })}`;

  const popup = openPopup({
    title: 'Data Pasien',
    body: `
      <div class="profile-head">
        <span class="avatar" aria-hidden="true">${escapeHtml(initials(p.full_name))}</span>
        <div>
          <div class="item-title">${escapeHtml(p.full_name)}</div>
          <div class="item-sub">${rows.length ? '' : 'Data belum lengkap'}</div>
        </div>
      </div>
      ${rows.length ? `<dl class="detail-list">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}</dl>` : ''}
      ${p.notes ? `<div class="note-box">📝 ${escapeHtml(p.notes)}</div>` : ''}
      <div>
        <h3 class="detail-heading">Riwayat kunjungan</h3>
        <div id="visit-history"><p class="muted small">Memuat…</p></div>
      </div>`,
    footer: `
      <div class="${p.phone ? 'two-cols' : 'popup-actions'}">
        ${p.phone ? `<a class="btn btn-wa" href="${waLink(p.phone)}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ''}
        <a class="btn btn-ghost" href="${escapeHtml(bookingUrl)}">📅 Buat Booking</a>
      </div>
      <button type="button" class="btn btn-primary" id="popup-edit">✏️ Ubah Data</button>`,
  });
  popup.querySelector('#popup-edit').addEventListener('click', () => {
    closeDialog(popup);
    openForm(p);
  });
  loadHistory(p, popup.querySelector('#visit-history'));
}

// Bookings with the same phone number or name, newest first.
async function loadHistory(p, box) {
  const escapeLike = (text) => text.replace(/[\\%_]/g, (c) => `\\${c}`);
  const byName = supabase.from('bookings').select('*').ilike('patient_name', escapeLike(p.full_name))
    .order('booking_date', { ascending: false }).limit(10);
  const byPhone = p.phone
    ? supabase.from('bookings').select('*').eq('patient_phone', p.phone).order('booking_date', { ascending: false }).limit(10)
    : null;
  try {
    const results = await Promise.all([run(byName), byPhone ? run(byPhone) : []]);
    const visits = [...new Map(results.flat().map((b) => [b.id, b])).values()]
      .sort((a, b) => b.booking_date.localeCompare(a.booking_date)).slice(0, 10);
    box.innerHTML = visits.length
      ? visits.map((b) => {
        const status = BOOKING_STATUS[b.status];
        return `
          <div class="mini-row">
            <div>
              <div><strong>${friendlyDate(b.booking_date)}</strong></div>
              <div class="item-sub">${escapeHtml(b.service ?? 'Layanan')}</div>
            </div>
            <span class="badge badge-${status.tone}">${status.label}</span>
          </div>`;
      }).join('')
      : '<p class="muted small">Belum ada kunjungan tercatat.</p>';
  } catch {
    box.innerHTML = '<p class="muted small">Riwayat tidak bisa dimuat.</p>';
  }
}

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
    closeDialog(dialog);
    render();
    toast(editing ? 'Data pasien disimpan' : 'Pasien ditambahkan');
  } catch (error) {
    errorBox.textContent = appError(error);
    errorBox.hidden = false;
  }
});

document.getElementById('delete').addEventListener('click', async () => {
  if (!editing) return;
  const ok = await confirmDialog({
    icon: '🗑️', title: `Hapus data ${editing.full_name}?`,
    message: 'Data yang dihapus tidak bisa dikembalikan.', confirmLabel: 'Ya, hapus',
  });
  if (!ok) return;
  try {
    await deleteRow('patients', editing.id);
    patients = patients.filter((p) => p.id !== editing.id);
    closeDialog(dialog);
    render();
    toast('Pasien dihapus');
  } catch (error) {
    toast(appError(error), 'error');
  }
});
