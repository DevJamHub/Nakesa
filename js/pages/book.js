// Public booking page (no login). The link looks like book.html?p=<booking_slug>.
// Uses two database functions that expose only what patients need.
import { supabase } from '../supabase.js';
import { IS_DEV } from '../errors.js';
import { DAYS, escapeHtml, formatDate, shortTime, todayISO, waLink } from '../format.js';
import { professionOf, titledName } from '../professions.js';
import { isDayOver, isWithinHours, minutesOfDay, slotsOn, toMinutes } from '../booking-slots.js';

const slug = new URLSearchParams(location.search).get('p');
const main = document.getElementById('app-main');

function showPage() {
  document.getElementById('loader').hidden = true;
  main.hidden = false;
}

function notFound(message) {
  document.getElementById('loader').innerHTML =
    `<div class="card empty-state"><p class="empty-icon" aria-hidden="true">🔍</p><p>${escapeHtml(message)}</p></div>`;
}

const { data: practice, error } = slug
  ? await supabase.rpc('get_public_practice', { p_slug: slug })
  : { data: null, error: null };

if (error) {
  if (IS_DEV) console.error('[book]', error);
  notFound('Halaman tidak bisa dimuat. Periksa koneksi internet lalu coba lagi.');
} else if (!practice) {
  notFound('Link booking tidak ditemukan. Minta link terbaru dari praktik.');
} else {
  render(practice);
  showPage();
}

function render(p) {
  const profession = professionOf(p.profession);
  document.title = `Booking ${p.name}`;

  document.getElementById('practice-icon').textContent = profession.icon;
  document.getElementById('practice-name').textContent = p.name;
  document.getElementById('practitioner').textContent =
    [titledName(p.practitioner ?? '', p.profession), p.specialty ? `${profession.label} ${p.specialty}` : profession.label]
      .filter(Boolean).join(' · ');
  document.getElementById('address').textContent = p.address ? `📍 ${p.address}` : '';

  const pill = document.getElementById('open-pill');
  pill.innerHTML = `<span class="live-dot" aria-hidden="true"></span>${p.is_open ? 'Sedang buka' : 'Sedang tutup'}`;
  pill.classList.toggle('is-open', p.is_open);

  // Schedule, Monday first
  const openDays = new Set(p.hours.map((h) => h.day));
  const todayDow = new Date().getDay();
  document.getElementById('hours').innerHTML = [1, 2, 3, 4, 5, 6, 0].map((day) => {
    const sessions = p.hours.filter((h) => h.day === day).map((h) => `${h.opens}–${h.closes}`);
    return `<tr class="${day === todayDow ? 'is-today' : ''}"><td>${DAYS[day]}</td>
      <td>${sessions.length ? sessions.join('<br>') : '<span class="muted">Tutup</span>'}</td></tr>`;
  }).join('');
  document.getElementById('hours-box').hidden = p.hours.length === 0;

  if (p.phone) {
    const contact = document.getElementById('contact');
    contact.href = waLink(p.phone, `Halo ${p.name}, saya ingin bertanya.`);
    contact.hidden = false;
  }

  if (!p.booking_enabled) {
    document.getElementById('form-card').hidden = true;
    document.getElementById('disabled-card').hidden = false;
    return;
  }
  setUpForm(p, profession, openDays);
}

// Function declarations, not const: render() is called above, before this part of the module runs.
function dayOf(iso) {
  return new Date(`${iso}T00:00:00`).getDay();
}

function nowMinutes() {
  return minutesOfDay(new Date());
}

/** One radio "chip" (same look as the service choices). Past times stay visible but can't be picked. */
function timeChoice(value, label, { past = false, wide = false } = {}) {
  const look = [wide ? 'w-full justify-center px-2 tabular-nums' : '',
    past ? 'cursor-not-allowed line-through opacity-40 hover:bg-surface' : ''].join(' ');
  return `<label class="choice"><input type="radio" name="p_time" value="${value}" ${past ? 'disabled' : ''}>
    <span class="${look}"${past ? ' title="Jam ini sudah lewat"' : ''}>${label}</span></label>`;
}

function setUpForm(p, profession, openDays) {
  const form = document.getElementById('book-form');
  const errorBox = document.getElementById('form-error');
  const submit = document.getElementById('submit');
  const dateHint = document.getElementById('date-hint');
  const timeField = document.getElementById('time-field');
  const timeSlots = document.getElementById('time-slots');
  const timeHint = document.getElementById('time-hint');
  const hasSchedule = p.hours.length > 0;

  document.getElementById('services').innerHTML = profession.services.map((s, i) => `
    <label class="choice"><input type="radio" name="p_service" value="${escapeHtml(s)}" ${i === 0 ? 'checked' : ''}>
    <span>${escapeHtml(s)}</span></label>`).join('');

  form.p_date.min = todayISO();
  form.p_date.max = todayISO(60);
  form.p_date.value = firstOpenDay(p.hours, openDays);

  const dayIsClosed = (iso) => openDays.size > 0 && !openDays.has(dayOf(iso));
  // Today, after the last session has ended, nobody can be seen anymore.
  const dayIsOver = (iso) => iso === todayISO() && isDayOver(p.hours, dayOf(iso), nowMinutes());

  // Time choices follow the sessions of the chosen day (every 30 minutes).
  const renderTimes = () => {
    const iso = form.p_date.value;
    if (!hasSchedule) {
      // No schedule yet: keep a free time field, as before.
      if (!form.querySelector('#time')) {
        timeSlots.innerHTML = '<input class="input" id="time" name="p_time" type="time" aria-describedby="time-hint">';
      }
      timeHint.textContent = 'Opsional.';
      return;
    }
    timeField.hidden = !iso || dayIsClosed(iso) || dayIsOver(iso);
    if (timeField.hidden) {
      timeSlots.innerHTML = '';
      return;
    }
    const previous = form.querySelector('input[name="p_time"]:checked')?.value ?? '';
    const sessions = slotsOn(p.hours, dayOf(iso), { now: iso === todayISO() ? nowMinutes() : null });
    timeSlots.innerHTML = `
      <div class="choices">${timeChoice('', '🕒 Kapan saja (ikut antrean)')}</div>
      ${sessions.map((s) => `
        <div class="grid gap-2" role="group" aria-label="${s.label}, ${shortTime(s.opens)} sampai ${shortTime(s.closes)}">
          <p class="text-sm font-semibold text-muted">${s.label} · ${shortTime(s.opens)}–${shortTime(s.closes)}</p>
          <div class="grid grid-cols-4 gap-2 sm:grid-cols-6">
            ${s.slots.map((slot) => timeChoice(slot.time, shortTime(slot.time), { past: slot.past, wide: true })).join('')}
          </div>
        </div>`).join('')}`;
    // Keep the chosen time when it still exists on the new day, otherwise fall back to "Kapan saja".
    const choices = [...form.querySelectorAll('input[name="p_time"]')];
    (choices.find((c) => c.value === previous && !c.disabled) ?? choices[0]).checked = true;
    timeHint.textContent = sessions.some((s) => s.slots.some((slot) => slot.past))
      ? 'Jam yang sudah lewat tidak bisa dipilih.'
      : '';
  };

  const checkDate = () => {
    const iso = form.p_date.value;
    if (iso && dayIsClosed(iso)) dateHint.textContent = `⚠️ Praktik tutup hari ${DAYS[dayOf(iso)]}. Pilih hari lain.`;
    else if (iso && dayIsOver(iso)) dateHint.textContent = '⚠️ Jam praktik hari ini sudah selesai. Pilih hari lain.';
    else dateHint.textContent = '';
    renderTimes();
  };
  form.p_date.addEventListener('change', checkDate);
  checkDate();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    const values = Object.fromEntries(new FormData(form));
    const name = values.p_name.trim();
    const phone = values.p_phone.trim();

    const time = values.p_time || null;
    const isToday = values.p_date === todayISO();

    let problem = '';
    if (!name) problem = 'Nama pasien wajib diisi.';
    else if (phone.replace(/\D/g, '').length < 9) problem = 'Nomor WhatsApp belum benar.';
    else if (!values.p_date) problem = 'Pilih tanggal.';
    else if (dayIsClosed(values.p_date)) problem = 'Praktik tutup pada hari itu. Pilih hari lain.';
    else if (dayIsOver(values.p_date)) problem = 'Jam praktik hari ini sudah selesai. Pilih hari lain.';
    else if (time && hasSchedule && !isWithinHours(p.hours, dayOf(values.p_date), time)) {
      problem = 'Jam yang dipilih di luar jam praktik. Pilih jam lain.';
    } else if (time && isToday && toMinutes(time) <= nowMinutes()) {
      problem = 'Jam yang dipilih sudah lewat. Pilih jam lain.';
      renderTimes(); // the page was open for a while: refresh which times are still available
    }
    if (problem) {
      errorBox.textContent = problem;
      errorBox.hidden = false;
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Mengirim…';
    const { error } = await supabase.rpc('create_booking', {
      p_slug: slug,
      p_name: name,
      p_phone: phone,
      p_date: values.p_date,
      p_time: time,
      p_service: values.p_service || null,
      p_complaint: values.p_complaint.trim() || null,
    });

    if (error) {
      if (IS_DEV) console.error('[book]', error);
      errorBox.textContent = error.code === 'P0001'
        ? error.message
        : 'Booking gagal dikirim. Periksa koneksi internet lalu coba lagi.';
      errorBox.hidden = false;
      submit.disabled = false;
      submit.textContent = 'Kirim Booking';
      return;
    }

    const when = `${formatDate(values.p_date)}${time ? `, jam ${shortTime(time)}` : ''}`;
    document.getElementById('form-card').hidden = true;
    document.getElementById('success-card').hidden = false;
    document.getElementById('success-text').textContent =
      `Booking untuk ${name} pada ${when} sudah diterima. ${p.name} akan mengonfirmasi lewat WhatsApp.`;
    if (p.phone) {
      const wa = document.getElementById('success-wa');
      wa.href = waLink(p.phone, `Halo, saya ${name}. Saya sudah booking ${values.p_service ?? ''} untuk ${when} lewat NAKESA.`);
      wa.hidden = false;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/** Today, or the next day the practice is open (when a schedule exists). Skips today once its sessions are over. */
function firstOpenDay(hours, openDays) {
  for (let i = 0; i <= 7; i++) {
    const iso = todayISO(i);
    if (!openDays.size) return iso;
    if (!openDays.has(dayOf(iso))) continue;
    if (i === 0 && isDayOver(hours, dayOf(iso), nowMinutes())) continue;
    return iso;
  }
  return todayISO();
}
