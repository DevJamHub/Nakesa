// Booking: confirm / cancel / finish online bookings, add manual bookings.
// Finishing a booking can record the payment and save the patient in one step.
import { insertRow, run, supabase, updateRow } from '../db.js';
import {
  bindRupiahInput, escapeHtml, formatDate, friendlyDate, parseRupiah, shortTime, todayISO, waLink, waNumber,
} from '../format.js';
import { BOOKING_STATUS } from '../practice-utils.js';
import {
  appError, closeDialog, confirmDialog, fillForm, formValues, refreshNavBadges, startPage, toast, whileSaving,
} from '../shell.js';

const { practice, profession } = await startPage('bookings');
const today = todayISO();
const list = document.getElementById('list');
const statusChips = document.getElementById('status-filter');
let tab = 'upcoming';
let statusFilter = 'all';
let bookings = [];
let patients = [];

/* ---------- Load ---------- */
async function load() {
  let query = supabase.from('bookings').select('*');
  if (tab === 'upcoming') {
    query = query.gte('booking_date', today).in('status', ['baru', 'dikonfirmasi'])
      .order('booking_date').order('booking_time', { nullsFirst: false });
  } else {
    query = query.or(`booking_date.lt.${today},status.in.(selesai,batal)`)
      .order('booking_date', { ascending: false }).limit(100);
  }
  try {
    bookings = await run(query);
  } catch (error) {
    bookings = [];
    toast(appError(error), 'error');
  }
  render();
}

try {
  patients = await run(supabase.from('patients').select('id, full_name, phone').order('full_name'));
  document.getElementById('patient-names').innerHTML =
    patients.map((p) => `<option value="${escapeHtml(p.full_name)}">`).join('');
} catch { /* the list still works without suggestions */ }
await load();

document.querySelectorAll('[data-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    tab = button.dataset.tab;
    statusFilter = 'all';
    document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === button)));
    load();
  });
});

/* ---------- Status filter chips ---------- */

function renderChips() {
  const counts = {};
  for (const b of bookings) counts[b.status] = (counts[b.status] ?? 0) + 1;
  const statuses = Object.keys(BOOKING_STATUS).filter((s) => counts[s]);
  statusChips.hidden = statuses.length < 2; // nothing to choose between
  statusChips.innerHTML = [['all', 'Semua', bookings.length], ...statuses.map((s) => [s, BOOKING_STATUS[s].label, counts[s]])]
    .map(([key, label, count]) => `
      <button type="button" class="chip" data-status="${key}" aria-pressed="${key === statusFilter}">
        ${label} <span class="chip-count">${count}</span>
      </button>`).join('');
}

statusChips.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-status]');
  if (!chip) return;
  statusFilter = chip.dataset.status;
  render();
});

/* ---------- Render ---------- */
function render() {
  if (statusFilter !== 'all' && !bookings.some((b) => b.status === statusFilter)) statusFilter = 'all';
  renderChips();
  const shown = statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);
  if (!shown.length) {
    list.innerHTML = `<div class="card empty-state"><p class="empty-icon" aria-hidden="true">📅</p>
      <p class="muted">${tab === 'upcoming'
        ? 'Belum ada booking. Bagikan link booking di Beranda supaya pasien bisa daftar online.'
        : 'Belum ada riwayat booking.'}</p></div>`;
    return;
  }
  let lastDate = null;
  list.innerHTML = shown.map((b) => {
    const heading = b.booking_date !== lastDate
      ? `<p class="group-label">${friendlyDate(b.booking_date)}${b.booking_date === today ? '' : ` · ${formatDate(b.booking_date, { day: 'numeric', month: 'short' })}`}</p>`
      : '';
    lastDate = b.booking_date;
    return heading + card(b);
  }).join('');
}

function card(b) {
  const status = BOOKING_STATUS[b.status];
  const when = `${friendlyDate(b.booking_date)}${b.booking_time ? `, jam ${shortTime(b.booking_time)}` : ''}`;
  const confirmText = `Halo ${b.patient_name}, booking Anda di ${practice.name} untuk ${when} sudah kami konfirmasi. Sampai jumpa! 🙏`;
  let actions = '';
  if (b.status === 'baru') {
    actions = `
      <button type="button" class="btn btn-success btn-small" data-action="confirm" data-id="${b.id}">✓ Konfirmasi</button>
      <button type="button" class="btn btn-danger-ghost btn-small" data-action="cancel" data-id="${b.id}">Tolak</button>`;
  } else if (b.status === 'dikonfirmasi') {
    actions = `
      <a class="btn btn-wa btn-small" href="${waLink(b.patient_phone, confirmText)}" target="_blank" rel="noopener">💬 Kabari via WA</a>
      <button type="button" class="btn btn-primary btn-small" data-action="done" data-id="${b.id}">Selesai dilayani</button>
      <button type="button" class="btn btn-danger-ghost btn-small" data-action="cancel" data-id="${b.id}">Batal</button>`;
  } else {
    actions = `<a class="btn btn-ghost btn-small" href="${waLink(b.patient_phone)}" target="_blank" rel="noopener">💬 WA</a>`;
  }
  return `
    <div class="item mb-2.5">
      <div class="item-main">
        <div>
          <div class="item-title">${escapeHtml(b.patient_name)}</div>
          <div class="item-sub">${b.booking_time ? `🕒 ${shortTime(b.booking_time)} · ` : ''}${escapeHtml(b.service ?? 'Layanan')}
            ${b.source === 'online' ? ' · 🌐 online' : ''}</div>
          <div class="item-sub">📱 ${escapeHtml(b.patient_phone)}</div>
          ${b.complaint ? `<div class="item-sub">📝 ${escapeHtml(b.complaint)}</div>` : ''}
        </div>
        <span class="badge badge-${status.tone}">${status.label}</span>
      </div>
      <div class="item-actions">${actions}</div>
    </div>`;
}

/* ---------- Actions ---------- */
list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const booking = bookings.find((b) => b.id === button.dataset.id);

  if (button.dataset.action === 'done') return openDone(booking);
  if (button.dataset.action === 'cancel') {
    const ok = await confirmDialog({
      icon: '🗓️', title: `Batalkan booking ${booking.patient_name}?`,
      message: booking.status === 'baru' ? 'Booking ini akan ditolak.' : 'Jangan lupa kabari pasien lewat WhatsApp.',
      confirmLabel: 'Ya, batalkan',
    });
    if (!ok) return;
  }

  const status = button.dataset.action === 'confirm' ? 'dikonfirmasi' : 'batal';
  button.disabled = true;
  try {
    await updateRow('bookings', booking.id, { status });
    toast(status === 'dikonfirmasi' ? 'Dikonfirmasi. Tekan “Kabari via WA” untuk memberi tahu pasien.' : 'Booking dibatalkan');
    refreshNavBadges();
    await load();
  } catch (error) {
    button.disabled = false;
    toast(appError(error), 'error');
  }
});

/* ---------- Finish: payment + save patient ---------- */
const doneDialog = document.getElementById('done-dialog');
const doneForm = document.getElementById('done-form');
const doneError = document.getElementById('done-error');
let finishing = null;
bindRupiahInput(doneForm.amount);

function openDone(booking) {
  finishing = booking;
  const known = findPatient(booking);
  doneForm.reset();
  doneError.hidden = true;
  document.getElementById('done-desc').textContent =
    `${booking.patient_name} · ${booking.service ?? 'Layanan'}`;
  doneForm.save_patient.checked = !known;
  doneForm.save_patient.disabled = Boolean(known);
  document.getElementById('save-patient-hint').textContent = known
    ? 'Pasien ini sudah ada di daftar.'
    : 'Supaya data pasien tersimpan untuk kunjungan berikutnya.';
  doneDialog.showModal();
  doneForm.amount.focus();
}

function findPatient(booking) {
  const phone = waNumber(booking.patient_phone);
  return patients.find((p) => (p.phone && waNumber(p.phone) === phone)
    || p.full_name.toLowerCase() === booking.patient_name.toLowerCase());
}

doneForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const amount = parseRupiah(doneForm.amount.value);
  const b = finishing;
  try {
    await whileSaving(document.getElementById('done-save'), async () => {
      await updateRow('bookings', b.id, { status: 'selesai' });
      if (amount > 0) {
        await insertRow('transactions', {
          kind: 'masuk', amount, category: b.service ?? 'Layanan',
          note: `Pasien: ${b.patient_name}`, occurred_on: today,
        });
      }
      if (doneForm.save_patient.checked && !doneForm.save_patient.disabled) {
        patients.push(await insertRow('patients', { full_name: b.patient_name, phone: b.patient_phone }));
      }
    });
    closeDialog(doneDialog);
    toast(amount > 0 ? 'Selesai & pembayaran tercatat' : 'Booking selesai');
    await load();
  } catch (error) {
    doneError.textContent = appError(error);
    doneError.hidden = false;
  }
});

/* ---------- Manual booking ---------- */
const bookingDialog = document.getElementById('booking-dialog');
const bookingForm = document.getElementById('booking-form');
const bookingError = document.getElementById('booking-error');

document.getElementById('service-choices').innerHTML = profession.services.map((s) => `
  <label class="choice"><input type="radio" name="service" value="${escapeHtml(s)}"><span>${escapeHtml(s)}</span></label>`).join('');

// Picking a known patient fills in the phone number.
bookingForm.patient_name.addEventListener('change', () => {
  const p = patients.find((x) => x.full_name === bookingForm.patient_name.value);
  if (p?.phone && !bookingForm.patient_phone.value) bookingForm.patient_phone.value = p.phone;
});

function openBooking(prefill = {}) {
  fillForm(bookingForm, { booking_date: today, ...prefill });
  bookingForm.booking_date.min = today;
  bookingError.hidden = true;
  bookingDialog.showModal();
  bookingForm.patient_name.focus();
}

document.getElementById('add').addEventListener('click', () => openBooking());
// ?new=1&name=…&phone=… (from the patient pop-up) opens the form already filled in.
const params = new URLSearchParams(location.search);
if (params.has('new')) {
  openBooking({ patient_name: params.get('name') ?? '', patient_phone: params.get('phone') ?? '' });
}

bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = formValues(bookingForm);
  if (!values.patient_name || !values.patient_phone || !values.booking_date) {
    bookingError.textContent = 'Nama, nomor HP, dan tanggal wajib diisi.';
    bookingError.hidden = false;
    return;
  }
  try {
    await whileSaving(document.getElementById('booking-save'), () =>
      insertRow('bookings', { ...values, status: 'dikonfirmasi', source: 'manual' }));
    closeDialog(bookingDialog);
    toast('Booking disimpan');
    await load();
  } catch (error) {
    bookingError.textContent = appError(error);
    bookingError.hidden = false;
  }
});
