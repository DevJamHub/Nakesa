// Praktik: open/closed, weekly hours, online booking and practice details.
import { run, supabase, updateRow } from '../db.js';
import { DAYS, escapeHtml } from '../format.js';
import { bookingLink } from '../practice-utils.js';
import { PROFESSIONS, professionOf } from '../professions.js';
import { updateProfile } from '../profile.js';
import {
  appError, closeDialog, formValues, openPopup, setOpenBadge, startPage, toast, whileSaving,
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
document.getElementById('open-link').href = link;
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
