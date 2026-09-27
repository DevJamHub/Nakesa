// Booking: confirm / cancel / finish online bookings, add manual bookings.
// Finishing a booking can record the payment and save the patient in one step.
import { insertRow, run, supabase, updateRow } from '../db.js';
import {
  bindRupiahInput, escapeHtml, formatDate, friendlyDate, parseRupiah, shortTime, todayISO, waLink, waNumber,
} from '../format.js';
import { BOOKING_STATUS } from '../practice-utils.js';
import { appError, fillForm, formValues, startPage, toast, whileSaving } from '../shell.js';

const { practice, profession } = await startPage('bookings');
const today = todayISO();
const list = document.getElementById('list');
let tab = 'upcoming';
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
    document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === button)));
    load();
  });
});

/* ---------- Render ---------- */
function render() {
  if (!bookings.length) {
    list.innerHTML = `<div class="card empty-state"><p class="empty-icon" aria-hidden="true">📅</p>
      <p class="muted">${tab === 'upcoming'
        ? 'Belum ada booking. Bagikan link booking di Beranda supaya pasien bisa daftar online.'
        : 'Belum ada riwayat booking.'}</p></div>`;
    return;
  }
  let lastDate = null;
  list.innerHTML = bookings.map((b) => {
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
    <div class="item" style="margin-bottom:10px">
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
  if (button.dataset.action === 'cancel' && !confirm(`Batalkan booking ${booking.patient_name}?`)) return;

  const status = button.dataset.action === 'confirm' ? 'dikonfirmasi' : 'batal';
  button.disabled = true;
  try {
    await updateRow('bookings', booking.id, { status });
    toast(status === 'dikonfirmasi' ? 'Dikonfirmasi. Tekan “Kabari via WA” untuk memberi tahu pasien.' : 'Booking dibatalkan');
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
    doneDialog.close();
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

function openBooking() {
  fillForm(bookingForm, { booking_date: today });
  bookingForm.booking_date.min = today;
  bookingError.hidden = true;
  bookingDialog.showModal();
  bookingForm.patient_name.focus();
}

document.getElementById('add').addEventListener('click', openBooking);
if (new URLSearchParams(location.search).has('new')) openBooking();

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
    bookingDialog.close();
    toast('Booking disimpan');
    await load();
  } catch (error) {
    bookingError.textContent = appError(error);
    bookingError.hidden = false;
  }
});
