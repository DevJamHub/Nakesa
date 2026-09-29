// Beranda: open/closed switch, today's summary, quick actions, booking link.
import { PAGES } from '../config.js';
import { countRows, run, supabase, updateRow } from '../db.js';
import { escapeHtml, formatDate, rupiah, shortTime, todayISO, waLink } from '../format.js';
import { titledName } from '../professions.js';
import { appError, countUp, openPopup, setOpenBadge, startPage, toast } from '../shell.js';
import { BOOKING_STATUS, bookingLink, medicineStatus } from '../practice-utils.js';

const { profile, practice } = await startPage('dashboard');
const today = todayISO();

document.getElementById('today').textContent = new Date().toLocaleDateString('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
document.getElementById('greeting').textContent = `${greeting()}, ${titledName(profile.full_name, profile.profession)} 👋`;

/* ---------- Open / closed ---------- */
const toggle = document.getElementById('open-toggle');
toggle.checked = practice.is_open;
showStatus(practice.is_open);

toggle.addEventListener('change', async () => {
  const isOpen = toggle.checked;
  showStatus(isOpen);
  try {
    await updateRow('practices', practice.id, { is_open: isOpen });
    setOpenBadge(isOpen);
    toast(isOpen ? 'Praktik sekarang BUKA' : 'Praktik sekarang TUTUP');
  } catch (error) {
    toggle.checked = !isOpen;
    showStatus(!isOpen);
    toast(appError(error), 'error');
  }
});

function showStatus(isOpen) {
  const card = document.getElementById('status-card');
  card.classList.toggle('is-open', isOpen);
  card.classList.toggle('is-closed', !isOpen);
  document.getElementById('status-title').textContent = isOpen ? '🟢 Praktik sedang BUKA' : '🔴 Praktik sedang TUTUP';
  document.getElementById('status-hint').textContent = isOpen
    ? 'Geser untuk menutup praktik.'
    : 'Geser untuk membuka praktik. Pasien melihat status ini di halaman booking.';
}

/* ---------- Booking link ---------- */
const link = bookingLink(practice);
document.getElementById('booking-link').textContent = link;
document.getElementById('share-wa').href =
  `https://wa.me/?text=${encodeURIComponent(`Booking ${practice.name} bisa lewat link ini ya: ${link}`)}`;
document.getElementById('copy-link').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(link);
    toast('Link disalin');
  } catch {
    toast('Tidak bisa menyalin otomatis. Tekan lama link untuk menyalin.', 'error');
  }
});

/* ---------- Summary ---------- */
let todayBookings = [];
let medicinesToCheck = [];
try {
  const [bookings, income, patientCount, medicines, hours] = await Promise.all([
    run(supabase.from('bookings').select('*').eq('booking_date', today)
      .in('status', ['baru', 'dikonfirmasi']).order('booking_time', { ascending: true, nullsFirst: false })),
    run(supabase.from('transactions').select('amount').eq('kind', 'masuk').eq('occurred_on', today)),
    countRows('patients'),
    run(supabase.from('medicines').select('id, name, unit, stock, min_stock, expires_on').order('name')),
    run(supabase.from('practice_hours').select('id').limit(1)),
  ]);

  todayBookings = bookings;
  medicinesToCheck = medicines.filter((m) => medicineStatus(m).tone !== 'green');
  countUp(document.getElementById('stat-bookings'), bookings.length);
  countUp(document.getElementById('stat-income'), income.reduce((sum, t) => sum + t.amount, 0), rupiah);
  countUp(document.getElementById('stat-patients'), patientCount);
  countUp(document.getElementById('stat-medicines'), medicinesToCheck.length);
  document.getElementById('hours-tip').hidden = hours.length > 0;

  renderToday(bookings);
} catch (error) {
  toast(appError(error), 'error');
}

function renderToday(bookings) {
  const list = document.getElementById('today-list');
  if (!bookings.length) {
    list.innerHTML = `<div class="card empty-state"><p class="empty-icon" aria-hidden="true">☕</p>
      <p class="muted">Belum ada booking untuk hari ini.</p></div>`;
    return;
  }
  list.innerHTML = bookings.map((b) => `
    <button type="button" class="item item-clickable" data-booking="${b.id}" aria-haspopup="dialog">
      <div class="item-main">
        <div>
          <div class="item-title">${escapeHtml(b.patient_name)}</div>
          <div class="item-sub">${b.booking_time ? `🕒 ${shortTime(b.booking_time)} · ` : ''}${escapeHtml(b.service ?? 'Layanan')}</div>
        </div>
        ${b.status === 'baru' ? '<span class="badge badge-orange">Perlu konfirmasi</span>' : '<span class="badge badge-green">Dikonfirmasi</span>'}
      </div>
    </button>`).join('');
}

/* ---------- Pop-ups ---------- */
// Tap a booking of today → its details, with WhatsApp and a shortcut to the Booking page.
document.getElementById('today-list').addEventListener('click', (event) => {
  const item = event.target.closest('[data-booking]');
  if (!item) return;
  const b = todayBookings.find((x) => x.id === item.dataset.booking);
  const status = BOOKING_STATUS[b.status];
  const rows = [
    ['Jam', b.booking_time ? shortTime(b.booking_time) : 'Belum ditentukan'],
    ['Layanan', b.service ?? 'Layanan'],
    ['No. HP / WA', b.patient_phone],
    ['Daftar lewat', b.source === 'online' ? '🌐 Online' : 'Manual'],
  ];
  openPopup({
    title: b.patient_name,
    body: `
      <span class="badge badge-${status.tone} justify-self-start">${status.label}</span>
      <dl class="detail-list">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}</dl>
      ${b.complaint ? `<div class="note-box">📝 ${escapeHtml(b.complaint)}</div>` : ''}`,
    footer: `
      <a class="btn btn-wa" href="${waLink(b.patient_phone)}" target="_blank" rel="noopener">💬 Chat WhatsApp</a>
      <a class="btn btn-ghost" href="${PAGES.bookings}">📅 Buka halaman Booking</a>`,
  });
});

// "Obat perlu dicek" opens the list right here instead of leaving the page.
document.getElementById('medicine-card').addEventListener('click', (event) => {
  event.preventDefault();
  openPopup({
    title: 'Obat perlu dicek',
    body: medicinesToCheck.length
      ? `<div>${medicinesToCheck.map((m) => {
        const status = medicineStatus(m);
        const expiry = m.expires_on ? ` · ED ${formatDate(m.expires_on, { day: 'numeric', month: 'short', year: 'numeric' })}` : '';
        return `
          <div class="mini-row">
            <div>
              <div class="item-title">${escapeHtml(m.name)}</div>
              <div class="item-sub">Sisa ${m.stock} ${escapeHtml(m.unit)}${expiry}</div>
            </div>
            <span class="badge badge-${status.tone}">${status.label}</span>
          </div>`;
      }).join('')}</div>`
      : '<div class="empty-state"><p class="empty-icon" aria-hidden="true">✅</p><p class="muted">Semua obat aman.</p></div>',
    footer: `<a class="btn btn-primary" href="${PAGES.medicines}?filter=check">💊 Buka Stok Obat</a>`,
  });
});

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}
