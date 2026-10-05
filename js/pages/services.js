// Layanan & Harga: the services patients choose from in Nakesa Patient, with price and
// duration. A practice without services of its own offers its profession's standard ones.
import { run, supabase, updateRow } from '../db.js';
import { bindRupiahInput, escapeHtml, parseRupiah } from '../format.js';
import { DURATIONS, durationLabel, loadServices, priceLabel, serviceCardHtml } from '../patient-preview.js';
import { professionOf } from '../professions.js';
import { canManage, isAdmin, practiceRole } from '../roles.js';
import { appError, closeDialog, confirmDialog, fillForm, formValues, startPage, toast, whileSaving } from '../shell.js';

const { user, profile, practice } = await startPage('services');
const role = await practiceRole(practice, user);
const profession = professionOf(profile.profession);
const manage = canManage(role);
const $ = (id) => document.getElementById(id);
let services = [];

$('add').hidden = !manage;
if (!manage) $('summary').textContent = 'Anda masuk sebagai staf: bisa melihat layanan, tetapi tidak bisa mengubahnya.';
$('add').addEventListener('click', () => openForm());

/* ---------- Is the practice in the patient app? ---------- */
const listing = $('listing');
listing.classList.toggle('is-on', practice.is_listed);
listing.innerHTML = `
  <span class="np-strip-icon" aria-hidden="true">📱</span>
  <span class="min-w-0 flex-1">
    <strong>${practice.is_listed ? 'Praktik Anda tampil di Nakesa Patient' : 'Praktik belum tampil di Nakesa Patient'}</strong>
    <small>${practice.is_listed
    ? 'Pasien memilih salah satu layanan di bawah saat membuat janji temu.'
    : 'Siapkan layanan di sini, lalu nyalakan “Tampil di aplikasi pasien” di menu Praktik.'}</small>
  </span>
  <span class="np-strip-go">${practice.is_listed ? 'Atur' : 'Nyalakan'} →</span>`;

async function load() {
  try {
    services = await loadServices(practice.id);
  } catch (error) {
    toast(appError(error), 'error');
  }
  render();
}

/* ---------- List ---------- */
function render() {
  const content = $('content');
  if (!services.length) {
    content.innerHTML = starter();
    return;
  }
  const visible = services.filter((s) => s.is_active).length;
  content.innerHTML = `
    <p class="mb-3 text-sm text-muted">${services.length} layanan · <strong class="text-ink">${visible}</strong> tampil ke pasien</p>
    <div class="list">${services.map(item).join('')}</div>
    ${manage ? '<p class="field-hint mt-4">Urutan di sini sama dengan urutan yang dilihat pasien. Pakai ↑ ↓ untuk mengatur.</p>' : ''}`;
}

function starter() {
  const names = profession.services;
  return `
    <section class="card svc-starter">
      <div class="empty-state">
        <p class="empty-icon" aria-hidden="true">${profession.icon}</p>
        <h2>Belum ada layanan sendiri</h2>
        <p class="max-w-[520px] text-muted">Sementara ini pasien melihat <strong class="text-ink">layanan standar ${escapeHtml(profession.label)}</strong>
          tanpa harga. Pakai sebagai awal, lalu lengkapi harga dan lama per pasien.</p>
        <div class="flex flex-wrap justify-center gap-1.5">
          ${names.map((n) => `<span class="svc-pill">${escapeHtml(n)}</span>`).join('')}
        </div>
        ${manage ? `
          <div class="mt-2 flex flex-wrap justify-center gap-2.5">
            <button type="button" class="btn btn-primary" data-action="defaults">✨ Pakai ${names.length} layanan standar</button>
            <button type="button" class="btn btn-ghost" data-action="add">＋ Buat sendiri</button>
          </div>` : ''}
        <p class="field-hint">Harga boleh dikosongkan. Pasien akan melihat “Tanya harga ke praktik”.</p>
      </div>
    </section>`;
}

function item(s, index) {
  const tools = manage ? `
    <div class="item-actions">
      <button type="button" class="btn btn-ghost btn-small" data-action="edit" data-id="${s.id}">✏️ Ubah</button>
      <button type="button" class="btn btn-ghost btn-small" data-action="move" data-step="-1" data-id="${s.id}"
        aria-label="Pindah ke atas" ${index === 0 ? 'disabled' : ''}>↑</button>
      <button type="button" class="btn btn-ghost btn-small" data-action="move" data-step="1" data-id="${s.id}"
        aria-label="Pindah ke bawah" ${index === services.length - 1 ? 'disabled' : ''}>↓</button>
      ${isAdmin(role) ? `<button type="button" class="btn btn-danger-ghost btn-small" data-action="delete" data-id="${s.id}">Hapus</button>` : ''}
    </div>` : '';
  return `
    <div class="item svc-item${s.is_active ? '' : ' is-hidden'}">
      <div class="item-main">
        <div class="flex min-w-0 gap-3">
          <span class="svc-index" aria-hidden="true">${index + 1}</span>
          <div class="min-w-0">
            <div class="item-title">${escapeHtml(s.name)}</div>
            ${s.description ? `<div class="item-sub">${escapeHtml(s.description)}</div>` : ''}
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              <span class="badge ${s.price === null ? 'badge-gray' : 'badge-green'}">💰 ${priceLabel(s.price)}</span>
              <span class="badge badge-blue">⏱ ${durationLabel(s.duration_minutes)}</span>
              ${s.is_active ? '' : '<span class="badge badge-orange">Disembunyikan</span>'}
            </div>
          </div>
        </div>
        ${manage ? `
          <label class="switch shrink-0" title="Tampilkan ke pasien">
            <span class="text-sm font-medium text-muted">Tampil</span>
            <input type="checkbox" data-active="${s.id}" ${s.is_active ? 'checked' : ''} aria-label="Tampilkan ${escapeHtml(s.name)} ke pasien">
            <span class="switch-track" aria-hidden="true"></span>
          </label>` : ''}
      </div>
      ${tools}
    </div>`;
}

/* ---------- Actions ---------- */
$('content').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const s = services.find((x) => x.id === button.dataset.id);
  const action = button.dataset.action;
  if (action === 'add') openForm();
  if (action === 'edit') openForm(s);
  if (action === 'defaults') useDefaults(button);
  if (action === 'move') move(s, Number(button.dataset.step));
  if (action === 'delete') remove(s);
});

$('content').addEventListener('change', async (event) => {
  const input = event.target.closest('[data-active]');
  if (!input) return;
  const s = services.find((x) => x.id === input.dataset.active);
  try {
    Object.assign(s, await updateRow('practice_services', s.id, { is_active: input.checked }));
    toast(input.checked ? `${s.name} tampil ke pasien` : `${s.name} disembunyikan dari pasien`);
    render();
  } catch (error) {
    input.checked = !input.checked;
    toast(appError(error), 'error');
  }
});

async function useDefaults(button) {
  try {
    await whileSaving(button, () => run(supabase.from('practice_services').insert(
      profession.services.map((name, i) => ({ practice_id: practice.id, name, duration_minutes: 30, sort_order: (i + 1) * 10 })),
    )));
    toast('Layanan standar ditambahkan. Sekarang lengkapi harganya.');
    await load();
  } catch (error) {
    toast(appError(error), 'error');
  }
}

/** Swap with the neighbour and renumber, so the order is the same for patients. */
async function move(s, step) {
  const from = services.indexOf(s);
  const to = from + step;
  if (to < 0 || to >= services.length) return;
  [services[from], services[to]] = [services[to], services[from]];
  const changed = services
    .map((row, i) => ({ row, order: (i + 1) * 10 }))
    .filter(({ row, order }) => row.sort_order !== order);
  changed.forEach(({ row, order }) => { row.sort_order = order; });
  render();
  try {
    await Promise.all(changed.map(({ row, order }) => updateRow('practice_services', row.id, { sort_order: order })));
  } catch (error) {
    toast(appError(error), 'error');
    await load();
  }
}

async function remove(s) {
  const ok = await confirmDialog({
    icon: '🗑️',
    title: `Hapus “${s.name}”?`,
    message: 'Janji temu yang sudah ada tetap tersimpan. Jika hanya ingin menyembunyikan sementara, matikan “Tampil”.',
    confirmLabel: 'Ya, hapus',
  });
  if (!ok) return;
  try {
    await run(supabase.from('practice_services').delete().eq('id', s.id));
    toast('Layanan dihapus');
    await load();
  } catch (error) {
    toast(appError(error), 'error');
  }
}

/* ---------- Add / edit pop-up ---------- */
let dialog;
let editing = null;

function buildDialog() {
  dialog = document.createElement('dialog');
  dialog.className = 'dialog-wide';
  dialog.setAttribute('aria-labelledby', 'svc-title');
  dialog.innerHTML = `
    <form class="dialog-form" id="svc-form" novalidate>
      <div class="dialog-head">
        <h2 id="svc-title">Tambah Layanan</h2>
        <button type="button" class="dialog-close" data-close aria-label="Tutup">✕</button>
      </div>
      <div class="form-error" id="svc-error" role="alert" hidden></div>
      <div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
        <div class="grid content-start gap-4">
          <div class="field">
            <label for="svc-name">Nama layanan *</label>
            <input class="input" id="svc-name" name="name" maxlength="80" list="svc-suggestions"
              placeholder="Contoh: ${escapeHtml(profession.services[0])}" required>
            <datalist id="svc-suggestions">
              ${profession.services.map((n) => `<option value="${escapeHtml(n)}"></option>`).join('')}
            </datalist>
          </div>
          <div class="field">
            <label for="svc-desc">Keterangan singkat</label>
            <textarea class="input" id="svc-desc" name="description" maxlength="500" rows="2"
              placeholder="Apa yang didapat pasien? Contoh: termasuk cek tekanan darah"></textarea>
          </div>
          <div class="field">
            <label for="svc-price">Harga (Rp)</label>
            <input class="input" id="svc-price" name="price" inputmode="numeric" autocomplete="off" placeholder="Kosongkan jika tergantung kondisi">
            <p class="field-hint">Kosong = pasien melihat “Tanya harga ke praktik”. Jangan isi harga perkiraan.</p>
          </div>
          <div class="field">
            <span class="field-label">Lama per pasien</span>
            <div class="choices" id="svc-durations"></div>
            <p class="field-hint">Jam praktik dibagi per durasi ini menjadi pilihan jam janji temu.</p>
          </div>
          <label class="check-row">
            <input type="checkbox" name="is_active">
            <span><strong class="text-ink">Tampilkan ke pasien</strong>
              <span class="block text-sm text-muted">Matikan untuk menyembunyikan sementara tanpa menghapus.</span></span>
          </label>
        </div>
        <aside class="grid content-start gap-2">
          <p class="form-section-title">Dilihat pasien seperti ini</p>
          <div class="pp-mini" id="svc-preview"></div>
        </aside>
      </div>
      <div class="dialog-actions">
        <button type="submit" class="btn btn-primary btn-big" id="svc-save">Simpan Layanan</button>
      </div>
    </form>`;
  document.body.append(dialog);

  const form = dialog.querySelector('#svc-form');
  bindRupiahInput(form.price);
  form.addEventListener('input', renderPreview);
  form.addEventListener('change', renderPreview);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = formValues(form);
    const error = dialog.querySelector('#svc-error');
    if (!values.name) {
      error.textContent = 'Nama layanan wajib diisi.';
      error.hidden = false;
      return;
    }
    error.hidden = true;
    const row = {
      name: values.name,
      description: values.description,
      price: values.price === null ? null : parseRupiah(values.price),
      duration_minutes: Number(values.duration_minutes) || 30,
      is_active: form.is_active.checked,
    };
    try {
      await whileSaving(dialog.querySelector('#svc-save'), () => (editing
        ? updateRow('practice_services', editing.id, row)
        : run(supabase.from('practice_services').insert({
          ...row,
          practice_id: practice.id,
          sort_order: (Math.max(0, ...services.map((s) => s.sort_order)) || 0) + 10,
        }))));
      closeDialog(dialog);
      toast(editing ? 'Layanan disimpan' : 'Layanan ditambahkan');
      await load();
    } catch (err) {
      error.textContent = err?.code === '23505' ? 'Layanan dengan nama ini sudah ada.' : appError(err);
      error.hidden = false;
    }
  });
}

function renderPreview() {
  const form = dialog.querySelector('#svc-form');
  const values = formValues(form);
  dialog.querySelector('#svc-preview').innerHTML = serviceCardHtml({
    name: values.name,
    description: values.description,
    price: values.price === null ? null : parseRupiah(values.price),
    duration_minutes: Number(values.duration_minutes) || 30,
  }) + (form.is_active.checked ? '' : '<p class="pp-hidden-note">🙈 Disembunyikan dari pasien</p>');
}

function openForm(service = null) {
  if (!dialog) buildDialog();
  editing = service;
  const form = dialog.querySelector('#svc-form');
  const minutes = service?.duration_minutes ?? 30;
  const choices = DURATIONS.includes(minutes) ? DURATIONS : [...DURATIONS, minutes].sort((a, b) => a - b);
  dialog.querySelector('#svc-durations').innerHTML = choices.map((m) => `
    <label class="choice"><input type="radio" name="duration_minutes" value="${m}"><span>${durationLabel(m)}</span></label>`).join('');
  dialog.querySelector('#svc-title').textContent = service ? 'Ubah Layanan' : 'Tambah Layanan';
  dialog.querySelector('#svc-error').hidden = true;
  fillForm(form, {
    name: service?.name,
    description: service?.description,
    price: service?.price === null || service?.price === undefined ? '' : service.price.toLocaleString('id-ID'),
    duration_minutes: String(minutes),
    is_active: service ? service.is_active : true,
  });
  renderPreview();
  dialog.showModal();
  form.name.focus();
}

load();
