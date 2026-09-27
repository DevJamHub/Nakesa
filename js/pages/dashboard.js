// Beranda: open/closed switch, today's summary, quick actions, booking link.
import { PAGES } from '../config.js';
import { countRows, run, supabase, updateRow } from '../db.js';
import { escapeHtml, rupiah, shortTime, todayISO } from '../format.js';
import { titledName } from '../professions.js';
import { appError, setOpenBadge, startPage, toast } from '../shell.js';
import { bookingLink, medicineStatus } from '../practice-utils.js';

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
try {
  const [bookings, income, patientCount, medicines, hours] = await Promise.all([
    run(supabase.from('bookings').select('*').eq('booking_date', today)
      .in('status', ['baru', 'dikonfirmasi']).order('booking_time', { ascending: true, nullsFirst: false })),
    run(supabase.from('transactions').select('amount').eq('kind', 'masuk').eq('occurred_on', today)),
    countRows('patients'),
    run(supabase.from('medicines').select('stock, min_stock, expires_on')),
    run(supabase.from('practice_hours').select('id').limit(1)),
  ]);

  document.getElementById('stat-bookings').textContent = bookings.length;
  document.getElementById('stat-income').textContent = rupiah(income.reduce((sum, t) => sum + t.amount, 0));
  document.getElementById('stat-patients').textContent = patientCount;
  document.getElementById('stat-medicines').textContent =
    medicines.filter((m) => medicineStatus(m).tone !== 'green').length;
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
    <a class="item" href="${PAGES.bookings}" style="text-decoration:none;color:inherit">
      <div class="item-main">
        <div>
          <div class="item-title">${escapeHtml(b.patient_name)}</div>
          <div class="item-sub">${b.booking_time ? `🕒 ${shortTime(b.booking_time)} · ` : ''}${escapeHtml(b.service ?? 'Layanan')}</div>
        </div>
        ${b.status === 'baru' ? '<span class="badge badge-orange">Perlu konfirmasi</span>' : '<span class="badge badge-green">Dikonfirmasi</span>'}
      </div>
    </a>`).join('');
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}
