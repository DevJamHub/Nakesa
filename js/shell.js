// Shared frame for the signed-in app pages: session check, header, menu,
// profession colour, messages (toast) and form/dialog helpers.
import { PAGES } from './config.js';
import { onAuthChange, signOut } from './auth.js';
import { run, supabase } from './db.js';
import { IS_DEV } from './errors.js';
import { escapeHtml } from './format.js';
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
  document.documentElement.style.setProperty('--accent', profession.color);

  renderHeader(profile, practice, profession);
  renderNav(activeKey);

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
      <a class="app-brand" href="${PAGES.dashboard}">
        <span class="app-brand-icon" aria-hidden="true">${profession.icon}</span>
        <span class="app-brand-text">
          <strong>${escapeHtml(practice.name)}</strong>
          <small>${escapeHtml(titledName(profile.full_name, profile.profession))}</small>
        </span>
      </a>
      <span class="open-pill" id="open-pill"></span>
      <button type="button" class="btn btn-ghost btn-small" id="sign-out">Keluar</button>
    </div>`;
  header.hidden = false;
  setOpenBadge(practice.is_open);

  document.getElementById('sign-out').addEventListener('click', async () => {
    if (!confirm('Keluar dari NAKESA?')) return;
    try {
      await signOut();
      window.location.replace(PAGES.welcome);
    } catch (error) {
      toast(appError(error), 'error');
    }
  });
}

function renderNav(activeKey) {
  const nav = document.getElementById('app-nav');
  nav.innerHTML = NAV.map((item) => `
    <a href="${PAGES[item.key]}" class="${item.key === activeKey ? 'is-active' : ''}"
       ${item.key === activeKey ? 'aria-current="page"' : ''}>
      <span aria-hidden="true">${item.icon}</span>${item.label}
    </a>`).join('');
  nav.hidden = false;
}

/** Update the "Buka / Tutup" badge in the header. */
export function setOpenBadge(isOpen) {
  const pill = document.getElementById('open-pill');
  if (!pill) return;
  pill.textContent = isOpen ? '● Buka' : '● Tutup';
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
  box.textContent = message;
  box.className = `toast toast-${tone}`;
  box.hidden = false;
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

/** Buttons with data-close close their dialog. */
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-close]');
  if (button) button.closest('dialog')?.close();
});

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
