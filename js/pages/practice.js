// Praktik: open/closed, weekly hours, online booking, practice details and the
// practice's page in the Nakesa Patient app.
import { PAGES } from '../config.js';
import { run, supabase, updateRow } from '../db.js';
import { DAYS, escapeHtml } from '../format.js';
import { loadServices, offeredServices, phonePreviewHtml } from '../patient-preview.js';
import { bookingLink } from '../practice-utils.js';
import { PROFESSIONS, professionOf } from '../professions.js';
import { updateProfile } from '../profile.js';
import { PROVINCES } from '../regions.js';
import {
  appError, closeDialog, confirmDialog, formValues, openPopup, setOpenBadge, startPage, toast, whileSaving,
} from '../shell.js';

let { user, profile, practice } = await startPage('practice');

/* ---------- Open / closed ---------- */
const openToggle = document.getElementById('open-toggle');
const showOpen = (isOpen) => {
  document.getElementById('status-title').textContent = isOpen ? '🟢 Praktik BUKA' : '🔴 Praktik TUTUP';
};
openToggle.checked = practice.is_open;
showOpen(practice.is_open);
openToggle.addEventListener('change', () => saveSwitch(openToggle, 'is_open', (on) => {
  showOpen(on);
  setOpenBadge(on);
  return on ? 'Praktik sekarang BUKA' : 'Praktik sekarang TUTUP';
}));

/* ---------- Online booking ---------- */
const bookingToggle = document.getElementById('booking-toggle');
const link = bookingLink(practice);
bookingToggle.checked = practice.booking_enabled;
document.getElementById('booking-link').textContent = link;
document.getElementById('booking-link').title = link;
document.getElementById('open-link').href = link;

// QR code to print or show to patients (library from a CDN, so the page works without it).
const qr = import('../qr.js');
qr.then(({ qrSvg }) => {
  document.getElementById('booking-qr').innerHTML = qrSvg(link, `QR code booking ${practice.name}`);
}).catch(() => {
  document.getElementById('booking-qr').innerHTML = '<span class="p-3 text-center text-xs text-muted">QR belum bisa dimuat.</span>';
});
document.getElementById('download-qr').addEventListener('click', async () => {
  try {
    await (await qr).downloadQrPoster(link, { title: practice.name, fileName: `QR booking ${practice.name}.png` });
    toast('QR code diunduh. Cetak dan tempel di ruang praktik.');
  } catch {
    toast('QR code belum bisa diunduh. Periksa internet lalu coba lagi.', 'error');
  }
});
bookingToggle.addEventListener('change', () => saveSwitch(bookingToggle, 'booking_enabled',
  (on) => (on ? 'Booking online dibuka' : 'Booking online ditutup')));
document.getElementById('copy-link').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(link);
    toast('Link disalin');
  } catch {
    toast('Tidak bisa menyalin otomatis. Tekan lama link untuk menyalin.', 'error');
  }
});

async function saveSwitch(input, column, message) {
  const on = input.checked;
  try {
    practice = await updateRow('practices', practice.id, { [column]: on });
    toast(message(on));
  } catch (error) {
    input.checked = !on;
    toast(appError(error), 'error');
  }
}

/* ---------- Weekly hours ---------- */
// Monday first, as people in Indonesia usually read a week.
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const days = document.getElementById('days');
const hoursError = document.getElementById('hours-error');

let hours = [];
try {
  hours = await run(supabase.from('practice_hours').select('*').order('opens_at'));
} catch (error) {
  toast(appError(error), 'error');
}

days.innerHTML = WEEK.map((day) => `
  <div class="day-row" data-day="${day}">
    <label class="switch">
      <strong>${DAYS[day]}</strong>
      <input type="checkbox" class="day-open" aria-label="Praktik hari ${DAYS[day]}">
      <span class="switch-track" aria-hidden="true"></span>
    </label>
    <div class="stack-sm sessions"></div>
    <div class="row day-tools" hidden>
      <button type="button" class="btn btn-ghost btn-small add-session">＋ Tambah sesi</button>
      <button type="button" class="btn btn-ghost btn-small copy-day" aria-haspopup="dialog">📋 Salin ke hari lain</button>
    </div>
  </div>`).join('');

function sessionHtml(opens = '08:00', closes = '12:00') {
  return `
    <div class="session">
      <input class="input" type="time" value="${opens}" aria-label="Jam buka">
      <span aria-hidden="true">–</span>
      <input class="input" type="time" value="${closes}" aria-label="Jam tutup">
      <button type="button" class="session-remove" aria-label="Hapus sesi">✕</button>
    </div>`;
}

function setDayOpen(row, open) {
  row.querySelector('.day-open').checked = open;
  row.querySelector('.day-tools').hidden = !open;
  const sessions = row.querySelector('.sessions');
  if (!open) sessions.innerHTML = '';
  else if (!sessions.children.length) sessions.insertAdjacentHTML('beforeend', sessionHtml());
}

for (const row of days.querySelectorAll('.day-row')) {
  const own = hours.filter((h) => h.day_of_week === Number(row.dataset.day));
  row.querySelector('.sessions').innerHTML =
    own.map((h) => sessionHtml(h.opens_at.slice(0, 5), h.closes_at.slice(0, 5))).join('');
  setDayOpen(row, own.length > 0);
}

/* Unsaved changes: show a note and warn before leaving the page. */
let dirty = false;
function setDirty(value) {
  dirty = value;
  document.getElementById('hours-dirty').hidden = !value;
}
window.addEventListener('beforeunload', (event) => {
  if (dirty) event.preventDefault();
});

days.addEventListener('change', (event) => {
  if (event.target.classList.contains('day-open')) setDayOpen(event.target.closest('.day-row'), event.target.checked);
  setDirty(true);
});
days.addEventListener('click', (event) => {
  const row = event.target.closest('.day-row');
  if (event.target.closest('.add-session')) {
    row.querySelector('.sessions').insertAdjacentHTML('beforeend', sessionHtml('16:00', '20:00'));
    setDirty(true);
  }
  if (event.target.closest('.session-remove')) {
    event.target.closest('.session').remove();
    if (!row.querySelector('.session')) setDayOpen(row, false);
    setDirty(true);
  }
  if (event.target.closest('.copy-day')) openCopyDay(row);
});

/* Copy one day's sessions to other days (e.g. Senin → Selasa–Jumat). */
const sessionsOf = (row) => [...row.querySelectorAll('.session')]
  .map((session) => [...session.querySelectorAll('input')].map((input) => input.value));

function openCopyDay(source) {
  const from = Number(source.dataset.day);
  const popup = openPopup({
    title: `Salin jadwal ${DAYS[from]}`,
    body: `
      <p class="muted">${sessionsOf(source).map(([o, c]) => `${o}–${c}`).join(', ')}</p>
      <div class="field">
        <span class="field-label">Salin ke hari:</span>
        <div class="choices" id="copy-days">
          ${WEEK.filter((d) => d !== from).map((d) => `
            <label class="choice"><input type="checkbox" value="${d}"><span>${DAYS[d]}</span></label>`).join('')}
        </div>
      </div>
      <button type="button" class="btn btn-ghost btn-small justify-self-start" id="copy-weekdays">Pilih Senin–Jumat</button>`,
    footer: '<button type="button" class="btn btn-primary btn-big" id="copy-apply">Salin Jadwal</button>',
  });
  const boxes = [...popup.querySelectorAll('#copy-days input')];
  popup.querySelector('#copy-weekdays').addEventListener('click', () => {
    boxes.forEach((box) => { box.checked = Number(box.value) >= 1 && Number(box.value) <= 5; });
  });
  popup.querySelector('#copy-apply').addEventListener('click', () => {
    const targets = boxes.filter((box) => box.checked).map((box) => Number(box.value));
    if (!targets.length) return toast('Pilih minimal satu hari', 'error');
    const sessions = sessionsOf(source);
    for (const day of targets) {
      const row = days.querySelector(`.day-row[data-day="${day}"]`);
      row.querySelector('.sessions').innerHTML = sessions.map(([o, c]) => sessionHtml(o, c)).join('');
      setDayOpen(row, true);
    }
    setDirty(true);
    closeDialog(popup);
    toast(`Jadwal ${DAYS[from]} disalin ke ${targets.length} hari. Tekan “Simpan Jadwal”.`);
  });
}

document.getElementById('save-hours').addEventListener('click', async (event) => {
  hoursError.hidden = true;
  const rows = [];
  for (const row of days.querySelectorAll('.day-row')) {
    for (const session of row.querySelectorAll('.session')) {
      const [opens, closes] = [...session.querySelectorAll('input')].map((i) => i.value);
      if (!opens || !closes || closes <= opens) {
        hoursError.textContent = `Jam di hari ${DAYS[row.dataset.day]} belum benar: jam tutup harus setelah jam buka.`;
        hoursError.hidden = false;
        return;
      }
      rows.push({ day_of_week: Number(row.dataset.day), opens_at: opens, closes_at: closes });
    }
  }
  try {
    // Replace the whole weekly schedule with what is on screen.
    await whileSaving(event.currentTarget, async () => {
      await run(supabase.from('practice_hours').delete().eq('owner_id', user.id));
      if (rows.length) await run(supabase.from('practice_hours').insert(rows));
    });
    setDirty(false);
    toast('Jadwal disimpan');
  } catch (error) {
    hoursError.textContent = appError(error);
    hoursError.hidden = false;
  }
});

/* ---------- Practice details ---------- */
const infoForm = document.getElementById('info-form');
const infoError = document.getElementById('info-error');
const professionSelect = document.getElementById('profession');

professionSelect.innerHTML = Object.entries(PROFESSIONS)
  .map(([key, p]) => `<option value="${key}">${p.icon} ${escapeHtml(p.label)}</option>`).join('');
professionSelect.value = profile.profession;
infoForm.elements.name.value = practice.name;
infoForm.phone.value = practice.phone ?? '';
infoForm.address.value = practice.address ?? '';
infoForm.specialty.value = practice.specialty ?? '';

function showSpecialty() {
  const p = professionOf(professionSelect.value);
  document.getElementById('specialty-field').hidden = !p.specialtyLabel;
  document.getElementById('specialty-label').textContent = p.specialtyLabel ?? '';
  infoForm.specialty.placeholder = p.specialtyHint ?? '';
}
showSpecialty();
professionSelect.addEventListener('change', showSpecialty);

infoForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = formValues(infoForm);
  if (!values.name) {
    infoError.textContent = 'Nama praktik wajib diisi.';
    infoError.hidden = false;
    return;
  }
  infoError.hidden = true;
  try {
    await whileSaving(document.getElementById('save-info'), async () => {
      practice = await updateRow('practices', practice.id, {
        name: values.name,
        phone: values.phone,
        address: values.address,
        specialty: professionOf(values.profession).specialtyLabel ? values.specialty : null,
      });
      if (values.profession !== profile.profession) {
        profile = await updateProfile(user.id, { profession: values.profession });
      }
    });
    toast('Data praktik disimpan');
    setTimeout(() => location.reload(), 800); // refresh header name and profession colour
  } catch (error) {
    infoError.textContent = appError(error);
    infoError.hidden = false;
  }
});

/* ---------- Nakesa Patient: the practice in the patient app ---------- */
// A switch to be found in the app, a checklist of what patients look at, the public
// profile (city, about, map point) and a live phone preview of what patients see.
const npForm = document.getElementById('np-form');
const npError = document.getElementById('np-error');
const listedToggle = document.getElementById('listed-toggle');
const RING = 2 * Math.PI * 38; // circumference of the progress ring (r = 38)

let ownServices = [];
try {
  ownServices = await loadServices(practice.id);
} catch { /* the preview then shows the profession's standard services */ }

npForm.province.innerHTML = `<option value="">Pilih provinsi</option>${
  PROVINCES.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}`;
npForm.city.value = practice.city ?? '';
npForm.province.value = practice.province ?? '';
npForm.description.value = practice.description ?? '';

const focusField = (field) => {
  field.scrollIntoView({ behavior: 'smooth', block: 'center' });
  field.focus({ preventScroll: true });
};

// What patients look at before booking. `go` takes the user to the place to fill it in.
const CHECKS = [
  { label: 'Alamat', done: () => !!infoForm.address.value.trim(), go: () => focusField(infoForm.address) },
  { label: 'Kota/Kabupaten', done: () => !!npForm.city.value.trim(), go: () => focusField(npForm.city) },
  { label: 'No. WhatsApp', done: () => !!infoForm.phone.value.trim(), go: () => focusField(infoForm.phone) },
  {
    label: 'Jam praktik',
    done: () => !!days.querySelector('.session'),
    go: () => document.getElementById('hours-title').scrollIntoView({ behavior: 'smooth', block: 'start' }),
  },
  { label: 'Layanan & harga', done: () => ownServices.some((s) => s.is_active), go: () => { window.location.href = PAGES.services; } },
  { label: 'Tentang praktik', done: () => !!npForm.description.value.trim(), go: () => focusField(npForm.description) },
  { label: 'Booking online aktif', done: () => bookingToggle.checked, go: () => focusField(bookingToggle) },
];

const readyChecks = document.getElementById('ready-checks');
readyChecks.addEventListener('click', (event) => {
  const item = event.target.closest('[data-check]');
  if (item) CHECKS[Number(item.dataset.check)].go();
});

function renderReady() {
  const results = CHECKS.map((check) => check.done());
  const done = results.filter(Boolean).length;
  const percent = Math.round((done / CHECKS.length) * 100);
  document.getElementById('ready-fill').style.strokeDasharray = `${RING}`;
  document.getElementById('ready-fill').style.strokeDashoffset = `${RING * (1 - done / CHECKS.length)}`;
  document.getElementById('ready-percent').textContent = `${percent}%`;
  const ring = document.getElementById('ready-ring');
  ring.classList.toggle('is-full', done === CHECKS.length);
  ring.setAttribute('aria-label', `Profil ${percent}% lengkap`);
  document.getElementById('ready-text').textContent = done === CHECKS.length
    ? 'Siap tampil! Pasien bisa menemukan dan booking praktik Anda dengan mudah.'
    : `${done} dari ${CHECKS.length} sudah lengkap. Ketuk yang belum untuk mengisinya.`;
  readyChecks.innerHTML = CHECKS.map((check, i) => `
    <button type="button" class="np-check${results[i] ? ' is-done' : ''}" data-check="${i}">
      <span class="np-check-mark" aria-hidden="true">✓</span>
      <span>${check.label}<span class="sr-only">${results[i] ? ' (sudah)' : ' (belum)'}</span></span>
      <span class="np-check-go" aria-hidden="true">Isi →</span>
    </button>`).join('');
}

function renderPreview() {
  const professionKey = professionSelect.value;
  document.getElementById('np-preview').innerHTML = phonePreviewHtml({
    practice: {
      name: infoForm.elements.name.value.trim(),
      address: infoForm.address.value.trim(),
      city: npForm.city.value.trim(),
      specialty: professionOf(professionKey).specialtyLabel ? infoForm.specialty.value.trim() : null,
      is_open: openToggle.checked,
    },
    professionKey,
    practitioner: profile.full_name,
    services: offeredServices(ownServices, professionKey),
    listed: listedToggle.checked,
  });
}

function refreshNakesaPatient() {
  renderReady();
  renderPreview();
  document.getElementById('np-counter').textContent = `${npForm.description.value.length}/1000`;
}

// Everything on this page that patients see updates the checklist and the preview while typing.
infoForm.addEventListener('input', refreshNakesaPatient);
infoForm.addEventListener('change', refreshNakesaPatient);
npForm.addEventListener('input', refreshNakesaPatient);
openToggle.addEventListener('change', renderPreview);
bookingToggle.addEventListener('change', renderReady);
new MutationObserver(renderReady).observe(days, { childList: true, subtree: true });

/* Listed in the app */
function showListed(on) {
  document.getElementById('listed-title').textContent = on ? '🟢 Tampil di aplikasi' : '⚪ Belum tampil';
  document.getElementById('listed-hint').textContent = on
    ? 'Pasien bisa menemukan praktik Anda'
    : 'Nyalakan saat profil sudah siap';
}
listedToggle.checked = practice.is_listed;
showListed(practice.is_listed);

listedToggle.addEventListener('change', async () => {
  if (listedToggle.checked) {
    const missing = CHECKS.filter((check) => !check.done()).map((check) => check.label);
    const noHours = !days.querySelector('.session');
    if (missing.length) {
      const ok = await confirmDialog({
        icon: '📱',
        tone: 'primary',
        title: 'Tampilkan sekarang?',
        message: `Masih belum lengkap: ${missing.join(', ')}.${noHours
          ? ' Tanpa jam praktik, pasien bisa melihat praktik Anda tetapi belum bisa memilih jam.' : ''} Anda bisa melengkapinya nanti.`,
        confirmLabel: 'Ya, tampilkan',
      });
      if (!ok) {
        listedToggle.checked = false;
        return;
      }
    }
  }
  await saveSwitch(listedToggle, 'is_listed', (on) => (on
    ? 'Praktik Anda sekarang tampil di Nakesa Patient 🎉'
    : 'Praktik disembunyikan dari Nakesa Patient'));
  showListed(listedToggle.checked);
  renderPreview();
});

/* Map point: saved right away, from the device's location */
const locationBox = document.getElementById('np-location');
let mapPoint = practice.latitude === null || practice.latitude === undefined
  ? null
  : { lat: Number(practice.latitude), lng: Number(practice.longitude) };

function renderLocation() {
  locationBox.innerHTML = mapPoint
    ? `<span>📍 <strong class="text-ink">${mapPoint.lat.toFixed(5)}, ${mapPoint.lng.toFixed(5)}</strong></span>
       <a class="btn btn-ghost btn-small" href="https://www.google.com/maps?q=${mapPoint.lat},${mapPoint.lng}" target="_blank" rel="noopener">🗺️ Lihat di peta</a>
       <button type="button" class="btn btn-ghost btn-small" data-location="here">🔄 Perbarui</button>
       <button type="button" class="btn btn-danger-ghost btn-small" data-location="clear">Hapus</button>`
    : `<span class="text-muted">Belum disimpan.</span>
       <button type="button" class="btn btn-ghost btn-small" data-location="here">📍 Pakai lokasi saya sekarang</button>`;
}
renderLocation();

async function saveMapPoint(point) {
  practice = await updateRow('practices', practice.id, {
    latitude: point?.lat ?? null,
    longitude: point?.lng ?? null,
  });
  mapPoint = point;
  renderLocation();
}

locationBox.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-location]');
  if (!button) return;
  if (button.dataset.location === 'clear') {
    try {
      await saveMapPoint(null);
      toast('Lokasi dihapus');
    } catch (error) {
      toast(appError(error), 'error');
    }
    return;
  }
  if (!navigator.geolocation) {
    toast('Perangkat ini tidak bisa membaca lokasi.', 'error');
    return;
  }
  button.disabled = true;
  button.textContent = 'Mencari lokasi…';
  navigator.geolocation.getCurrentPosition(async (position) => {
    try {
      await saveMapPoint({
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6)),
      });
      toast('Lokasi praktik disimpan');
    } catch (error) {
      toast(appError(error), 'error');
      renderLocation();
    }
  }, (error) => {
    toast(error.code === error.PERMISSION_DENIED
      ? 'Izin lokasi ditolak. Izinkan lokasi untuk situs ini di pengaturan browser.'
      : 'Lokasi belum bisa ditemukan. Coba lagi di tempat terbuka.', 'error');
    renderLocation();
  }, { enableHighAccuracy: true, timeout: 15000 });
});

/* Save the public profile */
npForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  npError.hidden = true;
  const values = formValues(npForm);
  try {
    await whileSaving(document.getElementById('np-save'), async () => {
      practice = await updateRow('practices', practice.id, {
        city: values.city,
        province: values.province,
        description: values.description,
      });
    });
    toast('Profil publik disimpan');
  } catch (error) {
    npError.textContent = appError(error);
    npError.hidden = false;
  }
});

refreshNakesaPatient();

// Links like practice.html#nakesa-patient: the page is shown only after loading, so scroll now.
if (window.location.hash === '#nakesa-patient') {
  requestAnimationFrame(() => document.getElementById('nakesa-patient').scrollIntoView({ behavior: 'smooth' }));
}
