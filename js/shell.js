// Shared frame for the signed-in app pages: session check, header, menu,
// messages (toast), pop-ups and form/dialog helpers.
import { PAGES } from './config.js';
import { onAuthChange, signOut } from './auth.js';
import { api } from './db.js';
import { IS_DEV } from './errors.js';
import { escapeHtml, todayISO } from './format.js';
import { bookingLink } from './practice-utils.js';
import { professionOf, titledName } from './professions.js';
import { fetchProfile } from './profile.js';
import { requireSession } from './ui.js';

// tone: the item's colour (tone-* classes in js/tailwind-setup.js).
// anim: how its icon moves on hover and when its page opens (nav-* keyframes there).
const NAV = [
  { key: 'dashboard', label: 'Beranda', icon: '🏠', tone: 'accent', anim: 'hop' },
  { key: 'bookings', label: 'Booking', icon: '📅', tone: 'blue', anim: 'flip' },
  { key: 'patients', label: 'Pasien', icon: '👥', tone: 'purple', anim: 'wiggle' },
  { key: 'prescriptions', label: 'Resep', icon: '📝', tone: 'teal', anim: 'scribble' },
  { key: 'medicines', label: 'Obat', icon: '💊', tone: 'yellow', anim: 'spin' },
  { key: 'finance', label: 'Keuangan', icon: '💰', tone: 'green', anim: 'jingle' },
  { key: 'practice', label: 'Praktik', icon: '🏥', tone: 'red', anim: 'beat', settings: true },
  { key: 'services', label: 'Layanan & Harga', icon: '🩺', tone: 'teal', anim: 'swing', settings: true },
];

const never = () => new Promise(() => {}); // used while the browser navigates away

/** Profile + practice of the signed-in user. */
export async function loadAccount(userId) {
  const [profile, practice] = await Promise.all([
    fetchProfile(userId),
    api('practices.php'),
  ]);
  return { profile, practice };
}

export const isSetUp = ({ profile, practice }) => Boolean(profile?.full_name && profile?.profession && practice);

/**
 * Start a signed-in page. Redirects to login (no session) or onboarding
 * (setup not finished). Resolves with { user, profile, practice, profession }.
 */
export async function startPage(activeKey) {
  const session = await requireSession();
  if (!session) return never();

  let account;
  try {
    account = await loadAccount(session.user.id);
  } catch (error) {
    showFatal(appError(error));
    return never();
  }
  if (!isSetUp(account)) {
    window.location.replace(PAGES.onboarding);
    return never();
  }

  const { profile, practice } = account;
  const profession = professionOf(profile.profession);

  renderHeader(profile, practice, profession);
  renderNav(activeKey, profile, practice, profession);
  refreshNavBadges();

  onAuthChange((event) => {
    if (event === 'SIGNED_OUT') window.location.replace(PAGES.login);
  });

  document.getElementById('loader').hidden = true;
  document.getElementById('app-main').hidden = false;
  return { user: session.user, profile, practice, profession };
}

function renderHeader(profile, practice, profession) {
  const header = document.getElementById('app-header');
  header.innerHTML = `
    <div class="app-header-inner">
      <button type="button" class="menu-btn" id="menu-btn" aria-controls="app-nav" aria-expanded="false" aria-label="Buka menu">☰</button>
      <a class="app-brand" href="${PAGES.dashboard}">
        <span class="app-brand-icon" aria-hidden="true">${profession.icon}</span>
        <span class="app-brand-text">
          <strong>${escapeHtml(practice.name)}</strong>
          <small>${escapeHtml(titledName(profile.full_name, profile.profession))}</small>
        </span>
      </a>
      <span class="open-pill" id="open-pill"></span>
      <button type="button" class="icon-btn theme-toggle" data-theme-toggle></button>
    </div>`;
  header.hidden = false;
  window.nakesaTheme?.refresh(); // gives the theme button its icon (js/theme.js)
  setOpenBadge(practice.is_open);
}

/* ---------- Side menu ---------- */
// Phones: a drawer that slides in from the left. Wide screens: a fixed sidebar
// that can be collapsed to icons only (remembered on this device).
const wideScreen = window.matchMedia('(min-width: 900px)');
const COLLAPSED_KEY = 'nakesa-nav-collapsed';
const FROM_KEY = 'nakesa-nav-from'; // menu item of the page before, for the sliding highlight

function renderNav(activeKey, profile, practice, profession) {
  const nav = document.getElementById('app-nav');
  const link = (item) => `
    <a href="${PAGES[item.key]}" class="nav-link tone-${item.tone}${item.key === activeKey ? ' is-active' : ''}"
       data-nav="${item.key}" style="--icon-anim: nav-${item.anim}" ${item.key === activeKey ? 'aria-current="page"' : ''}>
      <span class="nav-icon" aria-hidden="true"><span class="nav-emoji">${item.icon}</span></span><span class="nav-label">${item.label}</span>
    </a>`;
  const booking = bookingLink(practice);
  nav.innerHTML = `
    <div class="side-head">
      <a class="side-logo" href="${PAGES.dashboard}" title="Beranda">
        <span class="side-logo-mark" aria-hidden="true">✚</span>
        <span class="side-logo-text nav-label"><strong>NAKESA</strong><small>Praktik jadi mudah</small></span>
      </a>
      <button type="button" class="side-close" data-nav-close aria-label="Tutup menu">✕</button>
    </div>
    <div class="side-menu">
      <p class="side-label">Menu</p>
      <div class="side-links">${NAV.filter((item) => !item.settings).map(link).join('')}</div>
      <p class="side-label">Pengaturan</p>
      <div class="side-links">${NAV.filter((item) => item.settings).map(link).join('')}</div>
    </div>
    <div class="side-foot">
      ${practice.booking_enabled ? `
        <div class="side-share">
          <p class="side-share-title">Link booking online</p>
          <p class="side-share-text">Pasien scan QR atau buka link untuk booking sendiri.</p>
          <div class="side-share-actions">
            <button type="button" class="side-share-btn is-main" id="side-copy">📋 Salin link</button>
            <button type="button" class="side-share-btn" id="side-qr" title="Tampilkan QR code" aria-haspopup="dialog">▦ QR</button>
          </div>
        </div>` : ''}
      <div class="side-profile">
        <span class="side-avatar" style="--profession-color: ${profession.color}" aria-hidden="true">${profession.icon}</span>
        <span class="side-profile-text nav-label">
          <strong>${escapeHtml(titledName(profile.full_name, profile.profession))}</strong>
          <small>${escapeHtml(practice.specialty ? `${profession.label} · ${practice.specialty}` : profession.label)}</small>
        </span>
        <button type="button" class="side-signout" id="sign-out" title="Keluar" aria-label="Keluar"><span>🚪</span></button>
      </div>
    </div>`;
  nav.hidden = false;
  // Order for the one-by-one entrance when the phone drawer opens.
  nav.querySelectorAll('.side-label, .nav-link, .side-foot > *').forEach((element, i) => element.style.setProperty('--i', i));
  setupGlider(nav);
  setupTips(nav);
  arrive(activeKey);

  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  backdrop.dataset.navClose = '';
  document.body.append(backdrop);
  document.body.classList.add('has-nav');
  document.body.classList.toggle('nav-collapsed', readCollapsed());

  const menuButton = document.getElementById('menu-btn');
  menuButton.addEventListener('click', () => {
    if (wideScreen.matches) {
      const collapsed = document.body.classList.toggle('nav-collapsed');
      try { localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : ''); } catch { /* private mode */ }
      syncMenuButton();
    } else {
      setDrawer(!document.body.classList.contains('nav-open'));
    }
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-nav-close]')) setDrawer(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('nav-open')) setDrawer(false);
  });
  wideScreen.addEventListener('change', () => setDrawer(false));
  setDrawer(false);
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('nav-ready')));

  const copyButton = document.getElementById('side-copy');
  let copyTimer;
  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(booking);
      toast('Link booking disalin');
      copyButton.textContent = '✓ Tersalin';
      copyButton.classList.add('is-done');
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copyButton.textContent = '📋 Salin link';
        copyButton.classList.remove('is-done');
      }, 2000);
    } catch {
      toast('Tidak bisa menyalin otomatis. Buka menu Praktik untuk melihat link.', 'error');
    }
  });
  // QR code in a pop-up, to show to a patient or download for printing.
  document.getElementById('side-qr')?.addEventListener('click', async () => {
    let qr;
    try {
      qr = await import('./qr.js');
    } catch {
      toast('QR code belum bisa dimuat. Periksa internet lalu coba lagi.', 'error');
      return;
    }
    setDrawer(false);
    const popup = openPopup({
      title: 'Scan untuk booking',
      body: `<div class="qr-big">${qr.qrSvg(booking, `QR code booking ${practice.name}`)}</div>
        <p class="text-center text-muted">Tunjukkan layar ini ke pasien, atau unduh untuk dicetak.</p>`,
      footer: '<button type="button" class="btn btn-ghost" id="popup-download-qr">⬇️ Unduh QR untuk dicetak</button>',
    });
    popup.querySelector('#popup-download-qr').addEventListener('click', () =>
      qr.downloadQrPoster(booking, { title: practice.name, fileName: `QR booking ${practice.name}.png` }));
  });

  document.getElementById('sign-out').addEventListener('click', async () => {
    const ok = await confirmDialog({
      icon: '🚪', title: 'Keluar dari NAKESA?', message: 'Anda perlu masuk lagi untuk membuka data praktik.',
      confirmLabel: 'Ya, keluar',
    });
    if (!ok) return;
    try {
      await signOut();
      window.location.replace(PAGES.welcome);
    } catch (error) {
      toast(appError(error), 'error');
    }
  });
}

function readCollapsed() {
  try { return localStorage.getItem(COLLAPSED_KEY) === '1'; } catch { return false; }
}

/** Computers: a soft highlight in the item's colour glides after the mouse from item to item. */
function setupGlider(nav) {
  const menu = nav.querySelector('.side-menu');
  const glider = document.createElement('span');
  glider.className = 'nav-glider';
  glider.setAttribute('aria-hidden', 'true');
  menu.prepend(glider);
  let current = null;
  menu.addEventListener('pointerover', (event) => {
    const link = event.target.closest('.nav-link');
    if (event.pointerType !== 'mouse' || !link || link === current) return;
    glider.classList.toggle('no-slide', !current); // first item: appear in place, not slide in from the last spot
    glider.style.setProperty('--tone', getComputedStyle(link).getPropertyValue('--tone'));
    glider.style.height = `${link.offsetHeight}px`;
    glider.style.transform = `translateY(${link.offsetTop}px)`;
    glider.classList.add('is-on');
    current = link;
  });
  menu.addEventListener('pointerleave', () => {
    current = null;
    glider.classList.remove('is-on');
  });
}

/** Icons-only sidebar: the item's name (and its counter) pops out beside it on hover or keyboard focus. */
function setupTips(nav) {
  const tip = document.createElement('div');
  tip.className = 'nav-tip';
  tip.setAttribute('aria-hidden', 'true'); // screen readers already get the name from the link
  document.body.append(tip);
  const show = (link) => {
    if (!wideScreen.matches || !document.body.classList.contains('nav-collapsed')) return;
    const box = link.getBoundingClientRect();
    const badge = link.querySelector('.nav-badge');
    tip.innerHTML = escapeHtml(link.querySelector('.nav-label').textContent)
      + (badge ? `<span class="nav-tip-badge">${escapeHtml(badge.dataset.count > 99 ? '99+' : badge.dataset.count)}</span>` : '');
    tip.classList.toggle('no-slide', !tip.classList.contains('is-on'));
    tip.style.left = `${box.right + 14}px`;
    tip.style.top = `${box.top + box.height / 2}px`;
    tip.classList.add('is-on');
  };
  const hide = () => tip.classList.remove('is-on');
  nav.addEventListener('pointerover', (event) => {
    const link = event.target.closest('.nav-link');
    if (link) show(link);
    else if (!event.target.closest('.side-menu')) hide(); // gaps between items keep it, so it glides
  });
  nav.addEventListener('pointerleave', hide);
  nav.addEventListener('focusin', (event) => {
    const link = event.target.closest('.nav-link');
    if (link) show(link); else hide();
  });
  nav.addEventListener('focusout', hide);
  nav.addEventListener('scroll', hide, { passive: true });
}

/**
 * The current page's highlight slides over from the menu item of the page before
 * (remembered for this tab), changing colour on the way; then its icon does its little move.
 */
function arrive(activeKey) {
  let fromKey = null;
  try { fromKey = sessionStorage.getItem(FROM_KEY); } catch { /* private mode */ }
  window.addEventListener('pagehide', () => {
    try { sessionStorage.setItem(FROM_KEY, activeKey); } catch { /* private mode */ }
  });
  const link = document.querySelector(`.nav-link[data-nav="${activeKey}"]`);
  if (!link) return;
  // Measured in the next frame: the Tailwind CDN styles the freshly added menu just after this runs.
  requestAnimationFrame(() => {
    const from = fromKey !== activeKey && document.querySelector(`.nav-link[data-nav="${fromKey}"]`);
    if (from) {
      link.style.setProperty('--from-y', `${from.offsetTop - link.offsetTop}px`);
      link.style.setProperty('--from-tone', getComputedStyle(from).getPropertyValue('--tone'));
    }
    link.classList.add('is-arriving');
    setTimeout(() => link.classList.remove('is-arriving'), 1500);
  });
}

function setDrawer(open) {
  const nav = document.getElementById('app-nav');
  const wasOpen = document.body.classList.contains('nav-open');
  document.body.classList.toggle('nav-open', open);
  nav.inert = !open && !wideScreen.matches; // closed drawer: not reachable with Tab
  syncMenuButton();
  if (open) nav.querySelector('a.is-active, a')?.focus();
  else if (wasOpen) document.getElementById('menu-btn').focus();
}

function syncMenuButton() {
  const button = document.getElementById('menu-btn');
  if (wideScreen.matches) {
    const collapsed = document.body.classList.contains('nav-collapsed');
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', collapsed ? 'Lebarkan menu' : 'Kecilkan menu');
  } else {
    const open = document.body.classList.contains('nav-open');
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  }
}

/**
 * Small counters in the menu: new bookings waiting for confirmation (Booking) and
 * medicines that need a look because of low stock or expiry (Obat).
 */
export async function refreshNavBadges() {
  await Promise.all([
    setNavBadge('bookings', 'perlu konfirmasi', api('bookings.php', { params: { view: 'pending_count', date: todayISO() } })),
    setNavBadge('medicines', 'obat perlu dicek', api('medicine_inventory.php', { params: { view: 'attention_count' } })),
  ]);
}

async function setNavBadge(key, label, query) {
  const link = document.querySelector(`[data-nav="${key}"]`);
  if (!link) return;
  try {
    const { count } = await query;
    const old = link.querySelector('.nav-badge');
    if (Number(old?.dataset.count ?? 0) === count) return; // unchanged: don't replay the animation
    old?.remove();
    if (count) {
      link.insertAdjacentHTML('beforeend',
        `<span class="nav-badge" data-count="${count}" aria-label="${count} ${label}"></span>`);
      countUp(link.querySelector('.nav-badge'), count, (n) => (n > 99 ? '99+' : String(n)));
    }
  } catch { /* the badge is only a hint */ }
}

/** Update the "Buka / Tutup" badge in the header. */
export function setOpenBadge(isOpen) {
  const pill = document.getElementById('open-pill');
  if (!pill) return;
  pill.innerHTML = `<span class="live-dot" aria-hidden="true"></span>${isOpen ? 'Buka' : 'Tutup'}`;
  pill.classList.toggle('is-open', isOpen);
}

function showFatal(message) {
  document.getElementById('loader').innerHTML = `
    <div class="card empty-state">
      <p class="empty-icon" aria-hidden="true">⚠️</p>
      <p>${escapeHtml(message)}</p>
      <button type="button" class="btn btn-primary" onclick="location.reload()">Coba lagi</button>
    </div>`;
}

/* ---------- Press feedback ---------- */
// A soft ripple spreads from where a button is pressed (style: .ripple in js/tailwind-setup.js).
document.addEventListener('pointerdown', (event) => {
  const target = event.target.closest('.btn, .chip, .stat, .dash-stat, .dash-quick, .item-clickable, .menu-btn, .icon-btn');
  if (!target || target.disabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = target.getBoundingClientRect();
  const size = Math.max(box.width, box.height) * 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.setAttribute('aria-hidden', 'true');
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - box.left - size / 2}px;top:${event.clientY - box.top - size / 2}px`;
  target.append(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});

/* ---------- Messages ---------- */

/** Friendly Indonesian text for any server / network error. */
export function appError(error) {
  if (IS_DEV) console.error('[app]', error);
  if (error instanceof TypeError || !navigator.onLine) {
    return 'Koneksi internet bermasalah. Periksa jaringan lalu coba lagi.';
  }
  if (error?.userMessage) return error.userMessage; // our own messages from the PHP server
  return 'Terjadi kesalahan. Silakan coba lagi.';
}

let toastTimer;
/** Short message at the bottom of the screen. tone: 'success' | 'error' */
export function toast(message, tone = 'success') {
  const box = document.getElementById('toast');
  box.textContent = `${tone === 'error' ? '⚠️' : '✓'} ${message}`;
  box.className = `toast toast-${tone}`;
  box.hidden = false;
  box.style.animation = 'none'; // restart the slide-in when a new message replaces an old one
  void box.offsetWidth;
  box.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (box.hidden = true), 3500);
}

/* ---------- Forms & dialogs ---------- */

/** Form fields as an object; empty text becomes null. */
export function formValues(form) {
  const values = {};
  for (const [key, value] of new FormData(form)) {
    const text = typeof value === 'string' ? value.trim() : value;
    values[key] = text === '' ? null : text;
  }
  return values;
}

/** Fill a form's fields from an object (missing keys become empty). */
export function fillForm(form, values = {}) {
  for (const element of form.elements) {
    if (!element.name) continue;
    const value = values[element.name] ?? '';
    if (element.type === 'radio') element.checked = element.value === value;
    else if (element.type === 'checkbox') element.checked = Boolean(value);
    else element.value = value;
  }
}

/** Close a dialog with its closing animation (see dialog.is-closing in js/tailwind-setup.js). */
export function closeDialog(dialog, value) {
  if (!dialog?.open || dialog.classList.contains('is-closing')) return;
  let done = false;
  const onEnd = (event) => { if (event.target === dialog) finish(); };
  const finish = () => {
    if (done) return;
    done = true;
    dialog.removeEventListener('animationend', onEnd);
    if (!dialog.classList.contains('is-closing')) return; // reopened meanwhile
    dialog.classList.remove('is-closing');
    dialog.close(value);
  };
  dialog.classList.add('is-closing');
  dialog.addEventListener('animationend', onEnd);
  setTimeout(finish, 260); // in case the animation doesn't run (reduced motion)
}

// Buttons with data-close close their dialog; tapping the dark area closes pop-ups
// (not forms, so typed data isn't lost by accident); Esc closes with the animation too.
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-close]');
  if (button) return closeDialog(button.closest('dialog'));
  if (event.target instanceof HTMLDialogElement && event.target.classList.contains('popup')) closeDialog(event.target);
});
document.addEventListener('cancel', (event) => {
  if (!(event.target instanceof HTMLDialogElement)) return;
  event.preventDefault();
  closeDialog(event.target);
}, true);

let confirmBox;
/**
 * Pop-up asking the user to confirm. Resolves true for "yes".
 * Replaces the browser's confirm(), which is small and looks different on every phone.
 */
export function confirmDialog({ title, message = '', confirmLabel = 'Ya', tone = 'danger', icon = '⚠️' }) {
  if (!confirmBox) {
    confirmBox = document.createElement('dialog');
    confirmBox.className = 'popup popup-center';
    confirmBox.setAttribute('aria-labelledby', 'confirm-title');
    confirmBox.setAttribute('aria-describedby', 'confirm-message');
    confirmBox.innerHTML = `
      <div class="popup-body confirm-body">
        <p class="confirm-icon" aria-hidden="true"></p>
        <h2 id="confirm-title"></h2>
        <p class="muted" id="confirm-message"></p>
        <div class="two-cols">
          <button type="button" class="btn btn-ghost" data-close>Batal</button>
          <button type="button" class="btn" id="confirm-yes"></button>
        </div>
      </div>`;
    document.body.append(confirmBox);
    confirmBox.querySelector('#confirm-yes').addEventListener('click', () => closeDialog(confirmBox, 'yes'));
  }
  confirmBox.querySelector('.confirm-icon').textContent = icon;
  confirmBox.querySelector('#confirm-title').textContent = title;
  confirmBox.querySelector('#confirm-message').textContent = message;
  const yes = confirmBox.querySelector('#confirm-yes');
  yes.textContent = confirmLabel;
  yes.className = `btn btn-${tone}`;
  confirmBox.returnValue = '';
  confirmBox.showModal();
  confirmBox.querySelector('[data-close]').focus(); // the safe choice is focused first
  return new Promise((resolve) => {
    confirmBox.addEventListener('close', () => resolve(confirmBox.returnValue === 'yes'), { once: true });
  });
}

let popupBox;
/**
 * Detail pop-up. `title` is plain text; `body` and `footer` are HTML
 * (escape user text with escapeHtml). Returns the dialog so the caller can
 * wire up buttons inside it — its content is replaced on every call.
 */
export function openPopup({ title, body, footer = '' }) {
  if (!popupBox) {
    popupBox = document.createElement('dialog');
    popupBox.className = 'popup';
    popupBox.setAttribute('aria-labelledby', 'popup-title');
    document.body.append(popupBox);
  }
  popupBox.innerHTML = `
    <div class="popup-body">
      <div class="dialog-head">
        <h2 id="popup-title">${escapeHtml(title)}</h2>
        <button type="button" class="dialog-close" data-close aria-label="Tutup">✕</button>
      </div>
      ${body}
      ${footer ? `<div class="popup-actions">${footer}</div>` : ''}
    </div>`;
  popupBox.classList.remove('is-closing');
  if (!popupBox.open) popupBox.showModal();
  return popupBox;
}

/** Animate a number from 0 up to `value` (format turns the number into text). */
export function countUp(element, value, format = String) {
  if (!value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.textContent = format(value);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 700);
    element.textContent = format(Math.round(value * (1 - (1 - t) ** 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Disable a submit button while saving. */
export async function whileSaving(button, task) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = 'Menyimpan…';
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}
