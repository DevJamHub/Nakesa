// Public booking page (no login). The link looks like book.html?p=<booking_slug>.
// Uses two database functions that expose only what patients need.
import { supabase } from '../supabase.js';
import { IS_DEV } from '../errors.js';
import { DAYS, escapeHtml, formatDate, todayISO, waLink } from '../format.js';
import { professionOf, titledName } from '../professions.js';

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
  document.documentElement.style.setProperty('--accent', profession.color);
  document.title = `Booking ${p.name}`;

  document.getElementById('practice-icon').textContent = profession.icon;
  document.getElementById('practice-name').textContent = p.name;
  document.getElementById('practitioner').textContent =
    [titledName(p.practitioner ?? '', p.profession), p.specialty ? `${profession.label} ${p.specialty}` : profession.label]
      .filter(Boolean).join(' · ');
  document.getElementById('address').textContent = p.address ? `📍 ${p.address}` : '';

  const pill = document.getElementById('open-pill');
  pill.textContent = p.is_open ? '● Sedang buka' : '● Sedang tutup';
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

function setUpForm(p, profession, openDays) {
  const form = document.getElementById('book-form');
  const errorBox = document.getElementById('form-error');
  const submit = document.getElementById('submit');
  const dateHint = document.getElementById('date-hint');

  document.getElementById('services').innerHTML = profession.services.map((s, i) => `
    <label class="choice"><input type="radio" name="p_service" value="${escapeHtml(s)}" ${i === 0 ? 'checked' : ''}>
    <span>${escapeHtml(s)}</span></label>`).join('');

  form.p_date.min = todayISO();
  form.p_date.max = todayISO(60);
  form.p_date.value = firstOpenDay(openDays);

  const dayIsClosed = (iso) => openDays.size > 0 && !openDays.has(new Date(`${iso}T00:00:00`).getDay());
  const checkDate = () => {
    const iso = form.p_date.value;
    dateHint.textContent = iso && dayIsClosed(iso)
      ? `⚠️ Praktik tutup hari ${DAYS[new Date(`${iso}T00:00:00`).getDay()]}. Pilih hari lain.`
      : '';
  };
  form.p_date.addEventListener('change', checkDate);
  checkDate();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    const values = Object.fromEntries(new FormData(form));
    const name = values.p_name.trim();
    const phone = values.p_phone.trim();

    let problem = '';
    if (!name) problem = 'Nama pasien wajib diisi.';
    else if (phone.replace(/\D/g, '').length < 9) problem = 'Nomor WhatsApp belum benar.';
    else if (!values.p_date) problem = 'Pilih tanggal.';
    else if (dayIsClosed(values.p_date)) problem = 'Praktik tutup pada hari itu. Pilih hari lain.';
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
      p_time: values.p_time || null,
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

    const when = `${formatDate(values.p_date)}${values.p_time ? `, jam ${values.p_time.replace(':', '.')}` : ''}`;
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

/** Today, or the next day the practice is open (when a schedule exists). */
function firstOpenDay(openDays) {
  for (let i = 0; i <= 7; i++) {
    const iso = todayISO(i);
    if (!openDays.size || openDays.has(new Date(`${iso}T00:00:00`).getDay())) return iso;
  }
  return todayISO();
}
