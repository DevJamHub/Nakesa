// Beranda: greeting that follows the time of day, open/closed switch, today's summary,
// today's patients (confirm right here), income of the last 7 days and the booking link.
import { PAGES } from '../config.js';
import { countRows, run, supabase, updateRow } from '../db.js';
import { DAYS, escapeHtml, formatDate, rupiah, shortTime, todayISO, waLink } from '../format.js';
import { titledName } from '../professions.js';
import {
  appError, countUp, openPopup, refreshNavBadges, setOpenBadge, startPage, toast,
} from '../shell.js';
import {
  BOOKING_STATUS, EXPIRY_STATUS, STOCK_STATUS, bookingLink, needsAttention,
} from '../practice-utils.js';

const { profile, practice } = await startPage('dashboard');
const $ = (id) => document.getElementById(id);

let today = todayISO();
let todayBookings = []; // today's bookings except cancelled ones, in time order
let pendingCount = 0; // new bookings (today and later) waiting for confirmation
let medicinesToCheck = [];
let hours = [];
let loadedAt = 0;
let firstLoad = true;
let shownNowIndex = -1; // where the "Sekarang" line is in the timeline
let week = []; // [{ date, in, out }] for the last 7 days, today last
let selectedDay = 6;
const hero = $('hero');
const toggle = $('open-toggle');
const list = $('today-list');
const bars = $('week-bars');

$('name').textContent = titledName(profile.full_name, profile.profession);

/* ---------- Time of day: sky, greeting and clock ---------- */
// [until hour, sky, greeting, emoji]
const PERIODS = [
  [4, 'malam', 'Selamat malam', '🌙'],
  [11, 'pagi', 'Selamat pagi', '🌤️'],
  [15, 'siang', 'Selamat siang', '☀️'],
  [19, 'sore', 'Selamat sore', '🌇'],
  [24, 'malam', 'Selamat malam', '🌙'],
];

/** Current local time as "HH:MM", comparable with the database's "HH:MM:SS". */
const nowTime = () => new Date().toTimeString().slice(0, 5);

function tick() {
  const now = new Date();
  const [, sky, hello, emoji] = PERIODS.find(([until]) => now.getHours() < until);
  $('hero').dataset.time = sky;
  $('sky-emoji').textContent = emoji;
  $('hello').textContent = `${hello},`;
  $('clock').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  $('today').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  if (todayISO() !== today) {
    load(); // a new day began while the page was open
    return;
  }
  showStatus();
  if (loadedAt && nowIndex() !== shownNowIndex) renderToday();
}

// The sun / moon drifts a little with the mouse.
if (window.matchMedia('(hover: hover)').matches) {
  hero.addEventListener('pointermove', (event) => {
    const box = hero.getBoundingClientRect();
    hero.style.setProperty('--px', ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
    hero.style.setProperty('--py', ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
  });
  hero.addEventListener('pointerleave', () => {
    hero.style.removeProperty('--px');
    hero.style.removeProperty('--py');
  });
}

/* ---------- Open / closed ---------- */
toggle.checked = practice.is_open;

toggle.addEventListener('change', async () => {
  const isOpen = toggle.checked;
  showStatus(true);
  try {
    await updateRow('practices', practice.id, { is_open: isOpen });
    practice.is_open = isOpen;
    setOpenBadge(isOpen);
    toast(isOpen ? 'Praktik sekarang BUKA' : 'Praktik sekarang TUTUP');
  } catch (error) {
    toggle.checked = !isOpen;
    showStatus();
    toast(appError(error), 'error');
  }
});

/** Today's practice sessions, e.g. [{ opens_at: '08:00:00', closes_at: '12:00:00' }]. */
const todaySessions = () => hours.filter((h) => h.day_of_week === new Date().getDay());

function showStatus(changed = false) {
  const isOpen = toggle.checked;
  const card = $('status-card');
  const sessions = todaySessions();
  const time = nowTime();
  const inSession = sessions.some((s) => s.opens_at.slice(0, 5) <= time && time < s.closes_at.slice(0, 5));
  const afterHours = sessions.length > 0 && time >= sessions.at(-1).closes_at.slice(0, 5);

  card.classList.toggle('is-open', isOpen);
  card.classList.toggle('is-nudge', inSession !== isOpen && (inSession || afterHours));
  $('status-title').textContent = isOpen ? 'Praktik sedang BUKA' : 'Praktik sedang TUTUP';
  let hint;
  if (isOpen) {
    hint = afterHours ? 'Jam praktik hari ini sudah lewat. Geser untuk menutup.' : 'Pasien melihat praktik BUKA di halaman booking.';
  } else {
    hint = inSession ? 'Sekarang jam praktik Anda. Geser untuk membuka.' : 'Geser untuk membuka. Pasien melihat status ini di halaman booking.';
  }
  $('status-hint').textContent = hint;
  if (changed) {
    card.classList.remove('bump');
    void card.offsetWidth; // restart the animation
    card.classList.add('bump');
  }
}

/* ---------- Load everything ---------- */
async function load() {
  today = todayISO();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  try {
    const [bookings, pending, money, patientCount, newPatients, medicines, practiceHours] = await Promise.all([
      run(supabase.from('bookings').select('*').eq('booking_date', today).neq('status', 'batal')
        .order('booking_time', { ascending: true, nullsFirst: false })),
      countRows('bookings', (q) => q.eq('status', 'baru').gte('booking_date', today)),
      run(supabase.from('transactions').select('kind, amount, occurred_on').gte('occurred_on', todayISO(-6))),
      countRows('patients'),
      countRows('patients', (q) => q.gte('created_at', weekAgo)),
      // The medicine card is a hint: if it can't load, the rest of Beranda still shows.
      run(supabase.from('medicine_inventory')
        .select('id, generic_name, unit, stock, expired_stock, nearest_expiry, stock_status, expiry_status, is_active')
        .eq('is_active', true).order('generic_name')).catch(() => []),
      run(supabase.from('practice_hours').select('day_of_week, opens_at, closes_at').order('opens_at')),
    ]);
    todayBookings = bookings;
    pendingCount = pending;
    medicinesToCheck = medicines.filter(needsAttention);
    hours = practiceHours;
    loadedAt = Date.now();

    renderStats({ money, patientCount, newPatients });
    renderWeek(money);
    renderHero();
    renderToday();
    showStatus();
    firstLoad = false;
  } catch (error) {
    toast(appError(error), 'error');
  }
}

/* ---------- Hero: summary sentence, progress and things to do ---------- */
function renderHero() {
  const total = todayBookings.length;
  const done = todayBookings.filter((b) => b.status === 'selesai').length;
  const waiting = todayBookings.filter((b) => b.status === 'baru').length;

  let summary;
  if (!total) summary = 'Belum ada pasien booking hari ini. Bagikan link booking supaya pasien bisa daftar sendiri ✨';
  else if (done === total) summary = `Semua ${total} pasien hari ini sudah dilayani. Kerja bagus! 🎉`;
  else {
    summary = `Ada ${total} pasien hari ini${done ? `, ${done} sudah dilayani` : ''}`
      + `${waiting ? `. ${waiting} masih menunggu konfirmasi` : ''}.`;
  }
  $('hero-summary').textContent = summary;

  $('progress').hidden = !total;
  if (total) {
    $('progress-count').textContent = `${done}/${total}`;
    const ring = $('progress-ring');
    const length = Number(ring.getAttribute('stroke-dasharray'));
    requestAnimationFrame(() => ring.setAttribute('stroke-dashoffset', String(length * (1 - done / total))));
  }

  const sessions = todaySessions();
  const chips = [];
  if (pendingCount) {
    chips.push(`<a class="dash-chip is-alert" href="${PAGES.bookings}">
      <span class="dash-chip-count">${pendingCount}</span>booking perlu dikonfirmasi <span aria-hidden="true">→</span></a>`);
  }
  if (medicinesToCheck.length) {
    chips.push(`<button type="button" class="dash-chip" data-show-medicines aria-haspopup="dialog">
      <span aria-hidden="true">💊</span>${medicinesToCheck.length} obat perlu dicek</button>`);
  }
  if (!hours.length) {
    chips.push(`<a class="dash-chip" href="${PAGES.practice}"><span aria-hidden="true">🕒</span>Atur jadwal praktik <span aria-hidden="true">→</span></a>`);
  } else {
    chips.push(`<span class="dash-chip flex-wrap"><span aria-hidden="true">📅</span>${sessions.length
      ? `Jadwal hari ini ${sessions.map((s) => `<span class="whitespace-nowrap">${shortTime(s.opens_at)}–${shortTime(s.closes_at)}</span>`).join(' · ')}`
      : 'Hari ini tidak ada jadwal praktik'}</span>`);
  }
  $('hero-chips').innerHTML = chips.join('');
}

/* ---------- Summary tiles ---------- */
function renderStats({ money, patientCount, newPatients }) {
  const incomeOn = (date) => money.filter((t) => t.kind === 'masuk' && t.occurred_on === date)
    .reduce((sum, t) => sum + t.amount, 0);
  const income = incomeOn(today);
  const yesterday = incomeOn(todayISO(-1));
  const show = (id, value, format) => (firstLoad ? countUp($(id), value, format) : ($(id).textContent = (format ?? String)(value)));

  show('stat-bookings', todayBookings.length);
  show('stat-income', income, rupiah);
  show('stat-patients', patientCount);
  show('stat-medicines', medicinesToCheck.length);
  renderBookingNote();

  const incomeNote = $('note-income');
  incomeNote.className = 'dash-stat-note';
  if (income === yesterday) incomeNote.textContent = income ? 'Sama dengan kemarin' : 'Belum ada uang masuk';
  else {
    incomeNote.classList.add(income > yesterday ? 'is-up' : 'is-down');
    incomeNote.textContent = `${income > yesterday ? '▲' : '▼'} ${rupiah(Math.abs(income - yesterday))} dari kemarin`;
  }

  const patientNote = $('note-patients');
  patientNote.className = `dash-stat-note${newPatients ? ' is-up' : ''}`;
  patientNote.textContent = newPatients ? `+${newPatients} baru minggu ini` : 'Belum ada pasien baru minggu ini';

  const card = $('medicine-card');
  const empty = medicinesToCheck.filter((m) => m.stock_status === 'habis' || m.expiry_status === 'kedaluwarsa').length;
  card.classList.toggle('tone-red', empty > 0);
  card.classList.toggle('tone-yellow', empty === 0);
  const medicineNote = $('note-medicines');
  medicineNote.className = `dash-stat-note${medicinesToCheck.length ? ' is-down' : ' is-up'}`;
  medicineNote.textContent = medicinesToCheck.length
    ? (empty ? `${empty} habis / kedaluwarsa` : 'Stok menipis atau segera ED')
    : '✓ Semua obat aman';
}

function renderBookingNote() {
  const done = todayBookings.filter((b) => b.status === 'selesai').length;
  const waiting = todayBookings.filter((b) => b.status === 'baru').length;
  const parts = [];
  if (waiting) parts.push(`${waiting} perlu konfirmasi`);
  if (done) parts.push(`${done} selesai`);
  $('note-bookings').textContent = todayBookings.length ? parts.join(' · ') || 'Semua sudah dikonfirmasi' : 'Belum ada booking';
}

/* ---------- Today's patients (timeline) ---------- */
/** Where the "Sekarang" line goes: before the first booking that is still to come (-1 = no line). */
function nowIndex() {
  if (!todayBookings.some((b) => b.booking_time)) return -1;
  const time = nowTime();
  const next = todayBookings.findIndex((b) => !b.booking_time || b.booking_time.slice(0, 5) > time);
  return next === -1 ? todayBookings.length : next;
}

function renderToday(flashId = null) {
  const total = todayBookings.length;
  const done = todayBookings.filter((b) => b.status === 'selesai').length;
  list.removeAttribute('aria-busy');
  $('today-sub').textContent = total ? `${total} pasien · ${done} sudah dilayani` : 'Urut sesuai jam booking';

  if (!total) {
    shownNowIndex = -1;
    list.innerHTML = `
      <li class="empty-state">
        <p class="empty-icon" aria-hidden="true">☕</p>
        <p class="muted">Belum ada pasien booking hari ini.</p>
        <div class="row justify-center">
          <a class="btn btn-ghost btn-small" href="#share">🔗 Bagikan link booking</a>
          <a class="btn btn-primary btn-small" href="${PAGES.bookings}?new=1">+ Tambah booking</a>
        </div>
      </li>`;
    return;
  }

  shownNowIndex = nowIndex();
  const nowLine = `<li class="tl-now"><span></span><span class="tl-now-line">Sekarang</span></li>`;
  list.innerHTML = todayBookings.map((b, i) => (i === shownNowIndex ? nowLine : '') + timelineItem(b, i, flashId)).join('')
    + (shownNowIndex === total ? nowLine : '');
}

function timelineItem(b, i, flashId) {
  const status = BOOKING_STATUS[b.status];
  let action = '';
  if (b.status === 'baru') {
    action = `<button type="button" class="btn btn-success btn-small" data-confirm="${b.id}">✓ Konfirmasi</button>`;
  } else if (b.status === 'dikonfirmasi') {
    action = `<a class="btn btn-wa btn-small" href="${waLink(b.patient_phone, confirmMessage(b))}" target="_blank" rel="noopener"
      aria-label="Kabari ${escapeHtml(b.patient_name)} lewat WhatsApp">💬 Kabari</a>`;
  }
  const classes = ['tl-item', firstLoad ? 'tl-enter' : '', b.id === flashId ? 'tl-flash' : ''].filter(Boolean).join(' ');
  return `
    <li class="${classes}" data-status="${b.status}" style="--i:${i}">
      <span class="tl-time">${b.booking_time ? shortTime(b.booking_time) : '—'}</span>
      <div class="tl-card">
        <button type="button" class="tl-open" data-booking="${b.id}" aria-haspopup="dialog">
          <span class="tl-name">${escapeHtml(b.patient_name)}</span>
          <span class="tl-sub">${escapeHtml(b.service ?? 'Layanan')}${b.source === 'online' ? ' · 🌐 Online' : ''}</span>
        </button>
        <div class="tl-side">
          <span class="badge badge-${status.tone}">${status.label}</span>
          ${action}
        </div>
      </div>
    </li>`;
}

const confirmMessage = (b) =>
  `Halo ${b.patient_name}, booking Anda di ${practice.name} untuk hari ini${b.booking_time ? `, jam ${shortTime(b.booking_time)}` : ''}`
  + ' sudah kami konfirmasi. Sampai jumpa! 🙏';

list.addEventListener('click', async (event) => {
  const confirmButton = event.target.closest('[data-confirm]');
  if (confirmButton) {
    const booking = todayBookings.find((b) => b.id === confirmButton.dataset.confirm);
    confirmButton.disabled = true;
    confirmButton.textContent = 'Menyimpan…';
    try {
      await updateRow('bookings', booking.id, { status: 'dikonfirmasi' });
      booking.status = 'dikonfirmasi';
      pendingCount = Math.max(0, pendingCount - 1);
      renderToday(booking.id);
      renderHero();
      renderBookingNote();
      refreshNavBadges();
      toast('Dikonfirmasi. Tekan “Kabari” untuk memberi tahu pasien lewat WhatsApp.');
    } catch (error) {
      confirmButton.disabled = false;
      confirmButton.textContent = '✓ Konfirmasi';
      toast(appError(error), 'error');
    }
    return;
  }

  // Tap a booking → its details, with WhatsApp and a shortcut to the Booking page.
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
      <a class="btn btn-ghost" href="${PAGES.prescriptions}?new=1&patient=${encodeURIComponent(b.patient_name)}&booking=${b.id}">📝 Buat resep</a>
      <a class="btn btn-ghost" href="${PAGES.bookings}">📅 Buka halaman Booking</a>`,
  });
});

/* ---------- Income of the last 7 days ---------- */
/** 1250000 → "1,3jt" (short labels for the chart). */
function shortRupiah(amount) {
  const short = (value, unit) => `${value.toLocaleString('id-ID', { maximumFractionDigits: 1 })}${unit}`;
  if (amount >= 1e9) return short(amount / 1e9, 'M');
  if (amount >= 1e6) return short(amount / 1e6, 'jt');
  if (amount >= 1e3) return short(amount / 1e3, 'rb');
  return String(amount);
}

/** Round the top of the chart up to a clean number: 1, 2 or 5 × 10ⁿ. */
function niceMax(value) {
  if (value <= 0) return 0;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((s) => value <= s * power);
  return step * power;
}

function renderWeek(money) {
  week = Array.from({ length: 7 }, (_, k) => ({ date: todayISO(k - 6), in: 0, out: 0 }));
  for (const t of money) {
    const day = week.find((d) => d.date === t.occurred_on);
    if (day) day[t.kind === 'masuk' ? 'in' : 'out'] += t.amount;
  }
  const max = niceMax(Math.max(...week.map((d) => d.in)));
  const [top, middle] = $('week-lines').children;
  top.dataset.label = max ? shortRupiah(max) : '';
  middle.dataset.label = max ? shortRupiah(max / 2) : '';

  bars.innerHTML = week.map((d, i) => {
    const weekday = DAYS[new Date(`${d.date}T00:00:00`).getDay()];
    return `
      <button type="button" class="week-col${i === 6 ? ' is-today' : ''}" data-day="${i}"
        aria-label="${dayName(i)}: pemasukan ${rupiah(d.in)}">
        <span class="week-plot" data-height="${max ? d.in / max : 0}">
          <span class="week-cap">${d.in ? shortRupiah(d.in) : ''}</span><span class="week-bar"></span>
        </span>
        <span class="week-day">${weekday.slice(0, 3)}</span>
      </button>`;
  }).join('');
  // Grow the bars from the baseline.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bars.querySelectorAll('.week-plot').forEach((plot) => plot.style.setProperty('--h', plot.dataset.height));
  }));

  const totalIn = week.reduce((sum, d) => sum + d.in, 0);
  const totalOut = week.reduce((sum, d) => sum + d.out, 0);
  $('week-in').textContent = rupiah(totalIn);
  $('week-out').textContent = rupiah(totalOut);
  $('week-balance').textContent = `${totalIn < totalOut ? '−' : ''}${rupiah(Math.abs(totalIn - totalOut))}`;
  selectDay(selectedDay);
}

function dayName(i) {
  if (i === 6) return 'Hari ini';
  if (i === 5) return 'Kemarin';
  return formatDate(week[i].date, { weekday: 'long', day: 'numeric', month: 'short' });
}

function selectDay(i) {
  selectedDay = i;
  bars.querySelectorAll('.week-col').forEach((col) => {
    const selected = Number(col.dataset.day) === i;
    col.classList.toggle('is-selected', selected);
    col.setAttribute('aria-pressed', String(selected));
  });
  const day = week[i];
  const readout = $('week-readout');
  if (!week.some((d) => d.in)) {
    readout.innerHTML = '<strong>Rp 0</strong><span>Belum ada uang masuk 7 hari terakhir</span>';
    return;
  }
  readout.innerHTML = `<strong>${rupiah(day.in)}</strong>
    <span>masuk · ${dayName(i)}${day.out ? ` · keluar ${rupiah(day.out)}` : ''}</span>`;
}

bars.addEventListener('click', (event) => {
  const col = event.target.closest('[data-day]');
  if (col) selectDay(Number(col.dataset.day));
});
bars.addEventListener('pointerover', (event) => {
  const col = event.target.closest('[data-day]');
  if (col && event.pointerType === 'mouse') selectDay(Number(col.dataset.day));
});
bars.addEventListener('focusin', (event) => {
  const col = event.target.closest('[data-day]');
  if (col) selectDay(Number(col.dataset.day));
});
bars.addEventListener('pointerleave', (event) => {
  if (event.pointerType === 'mouse') selectDay(6);
});

/* ---------- Medicines to check ---------- */
// The tile and the hero chip open the list right here instead of leaving the page.
function showMedicines() {
  openPopup({
    title: 'Obat perlu dicek',
    body: medicinesToCheck.length
      ? `<div>${medicinesToCheck.map((m) => {
        const expiry = m.nearest_expiry ? ` · ED ${formatDate(m.nearest_expiry, { day: 'numeric', month: 'short', year: 'numeric' })}` : '';
        const badges = [
          m.stock_status !== 'aman' ? `<span class="badge badge-${STOCK_STATUS[m.stock_status].tone}">${STOCK_STATUS[m.stock_status].label}</span>` : '',
          m.expiry_status !== 'aman' ? `<span class="badge badge-${EXPIRY_STATUS[m.expiry_status].tone}">${EXPIRY_STATUS[m.expiry_status].icon} ${EXPIRY_STATUS[m.expiry_status].label}</span>` : '',
        ].join('');
        return `
          <a class="mini-row text-inherit no-underline" href="${PAGES.medicine}?id=${m.id}">
            <div>
              <div class="item-title">${escapeHtml(m.generic_name)}</div>
              <div class="item-sub">Sisa ${m.stock} ${escapeHtml(m.unit)}${expiry}</div>
            </div>
            <span class="flex flex-wrap justify-end gap-1">${badges}</span>
          </a>`;
      }).join('')}</div>`
      : '<div class="empty-state"><p class="empty-icon" aria-hidden="true">✅</p><p class="muted">Semua obat aman.</p></div>',
    footer: `<a class="btn btn-primary" href="${PAGES.medicines}?filter=check">💊 Buka Database Obat</a>`,
  });
}

$('medicine-card').addEventListener('click', (event) => {
  event.preventDefault();
  showMedicines();
});
$('hero-chips').addEventListener('click', (event) => {
  if (event.target.closest('[data-show-medicines]')) showMedicines();
});

/* ---------- Booking link: QR code + copy ---------- */
const link = bookingLink(practice);
$('booking-link').textContent = link;
$('booking-link').title = link;
$('open-link').href = link;
$('booking-off').hidden = practice.booking_enabled;
$('phone-missing').hidden = Boolean(practice.phone) || !practice.booking_enabled;
$('share-wa').href = `https://wa.me/?text=${encodeURIComponent(`Booking ${practice.name} bisa lewat link ini ya: ${link}`)}`;

// The QR library comes from a CDN; if it can't load, the rest of the page still works.
const qr = import('../qr.js');
const qrBox = $('booking-qr');
const qrLabel = `QR code booking ${practice.name}`;
const poster = { title: practice.name, fileName: `QR booking ${practice.name}.png` };
qr.then(({ qrSvg }) => { qrBox.innerHTML = qrSvg(link, qrLabel); })
  .catch(() => { qrBox.innerHTML = '<span class="p-3 text-center text-xs text-muted">QR belum bisa dimuat. Periksa internet.</span>'; });

async function downloadQr() {
  try {
    const { downloadQrPoster } = await qr;
    await downloadQrPoster(link, poster);
    toast('QR code diunduh. Cetak dan tempel di ruang praktik.');
  } catch {
    toast('QR code belum bisa diunduh. Periksa internet lalu coba lagi.', 'error');
  }
}
$('download-qr').addEventListener('click', downloadQr);

// Tap the QR code → a big one, to show the screen to a patient who scans it right there.
qrBox.addEventListener('click', async () => {
  let svg;
  try {
    svg = (await qr).qrSvg(link, qrLabel);
  } catch {
    return;
  }
  const popup = openPopup({
    title: 'Scan untuk booking',
    body: `<div class="qr-big">${svg}</div>
      <p class="text-center text-muted">Tunjukkan layar ini ke pasien. Pasien scan dengan kamera HP, lalu isi data booking.</p>`,
    footer: '<button type="button" class="btn btn-ghost" id="popup-download-qr">⬇️ Unduh QR untuk dicetak</button>',
  });
  popup.querySelector('#popup-download-qr').addEventListener('click', downloadQr);
});

const copyButton = $('copy-link');
let copiedTimer;
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(link);
    copyButton.textContent = '✓ Tersalin';
    copyButton.classList.add('is-copied');
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copyButton.textContent = '📋 Salin link';
      copyButton.classList.remove('is-copied');
    }, 2000);
    toast('Link disalin');
  } catch {
    toast('Tidak bisa menyalin otomatis. Tekan lama link untuk menyalin.', 'error');
  }
});

/* ---------- Start ---------- */
tick();
// Tick right after every new minute, so the clock never lags.
(function everyMinute() {
  setTimeout(() => { tick(); everyMinute(); }, 60_000 - (Date.now() % 60_000) + 50);
})();
await load();

// Coming back to the app later (e.g. after replying on WhatsApp) shows fresh numbers.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && Date.now() - loadedAt > 60_000) load();
});
