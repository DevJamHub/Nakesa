// Shared frame for the signed-in app pages: session check, header, menu,
// messages (toast), pop-ups and form/dialog helpers.
import { PAGES } from './config.js';
import { onAuthChange, signOut } from './auth.js';
import { run, supabase } from './db.js';
import { IS_DEV } from './errors.js';
import { escapeHtml, todayISO } from './format.js';
import { professionOf, titledName } from './professions.js';
import { fetchProfile } from './profile.js';
import { requireSession } from './ui.js';

const NAV = [
  { key: 'dashboard', label: 'Beranda', icon: '🏠' },
  { key: 'bookings', label: 'Booking', icon: '📅' },
  { key: 'patients', label: 'Pasien', icon: '👥' },
  { key: 'medicines', label: 'Obat', icon: '💊' },
  { key: 'finance', label: 'Keuangan', icon: '💰' },
  { key: 'practice', label: 'Praktik', icon: '🏥' },
];

const never = () => new Promise(() => {}); // used while the browser navigates away

/** Profile + practice of the signed-in user. */
export async function loadAccount(userId) {
  const [profile, practice] = await Promise.all([
    fetchProfile(userId),
    run(supabase.from('practices').select('*').eq('owner_id', userId).maybeSingle()),
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
  renderNav(activeKey);
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

function renderNav(activeKey) {
  const nav = document.getElementById('app-nav');
  nav.innerHTML = `
    <div class="side-head">
      <span class="side-logo"><span class="side-logo-mark" aria-hidden="true">✚</span><span class="nav-label">NAKESA</span></span>
      <button type="button" class="side-close" data-nav-close aria-label="Tutup menu">✕</button>
    </div>
    <p class="side-label">Menu</p>
    <div class="side-links">
      ${NAV.map((item) => `
        <a href="${PAGES[item.key]}" class="${item.key === activeKey ? 'is-active' : ''}" title="${item.label}"
           data-nav="${item.key}" ${item.key === activeKey ? 'aria-current="page"' : ''}>
          <span class="nav-icon" aria-hidden="true">${item.icon}</span><span class="nav-label">${item.label}</span>
        </a>`).join('')}
    </div>
    <div class="side-foot">
      <button type="button" class="side-signout" id="sign-out" title="Keluar">
        <span class="nav-icon" aria-hidden="true">🚪</span><span class="nav-label">Keluar</span>
      </button>
    </div>`;
  nav.hidden = false;

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

/** Number of new bookings waiting for confirmation, shown next to "Booking" in the menu. */
export async function refreshNavBadges() {
  const link = document.querySelector('[data-nav="bookings"]');
  if (!link) return;
  try {
    const { count, error } = await supabase.from('bookings').select('id', { count: 'exact', head: true })
      .eq('status', 'baru').gte('booking_date', todayISO());
    if (error) throw error;
    link.querySelector('.nav-badge')?.remove();
    if (count) {
      link.insertAdjacentHTML('beforeend',
        `<span class="nav-badge" aria-label="${count} perlu konfirmasi">${count > 99 ? '99+' : count}</span>`);
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
  const target = event.target.closest('.btn, .chip, .stat, .item-clickable, .menu-btn, .icon-btn');
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

/** Friendly Indonesian text for any Supabase / network error. */
export function appError(error) {
  if (IS_DEV) console.error('[app]', error);
  if (error?.name === 'AuthRetryableFetchError' || error instanceof TypeError || !navigator.onLine) {
    return 'Koneksi internet bermasalah. Periksa jaringan lalu coba lagi.';
  }
  if (error?.code === 'P0001') return error.message; // our own messages from the database
  if (error?.code === '23514') return 'Ada isian yang tidak sesuai. Periksa kembali.';
  if (error?.code === '23505') return 'Data yang sama sudah ada.';
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
