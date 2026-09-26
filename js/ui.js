// Small DOM helpers shared by all auth pages.
import { AUTH_PROVIDERS, PAGES } from './config.js';
import { getSession, signInWithOAuth } from './auth.js';
import { friendlyError } from './errors.js';

/* ---------- Loading state ---------- */

/** Disable a button and show a spinner + text (e.g. "Signing in…"). */
export function setLoading(button, loading, loadingText) {
  const label = button.querySelector('.btn-label');
  if (loading) {
    button.dataset.label = label.textContent;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.classList.add('is-loading');
    if (loadingText) label.textContent = loadingText;
  } else {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.classList.remove('is-loading');
    if (button.dataset.label) label.textContent = button.dataset.label;
  }
}

/* ---------- Alerts ---------- */

export function showAlert(container, message, tone = 'error') {
  container.innerHTML = '';
  const div = document.createElement('div');
  div.className = `alert alert-${tone}`;
  div.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  div.textContent = message;
  container.append(div);
  container.hidden = false;
}

export function clearAlert(container) {
  container.innerHTML = '';
  container.hidden = true;
}

/* ---------- Form fields ---------- */

/** Show or clear the error text under an input (expects <p id="{input.id}-error">). */
export function setFieldError(input, message) {
  const errorEl = document.getElementById(`${input.id}-error`);
  const field = input.closest('.field');
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    field.classList.add('field-invalid');
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
    input.removeAttribute('aria-invalid');
    field.classList.remove('field-invalid');
  }
  return !message;
}

/** Run validators; focus the first invalid field. Returns true when all pass. */
export function validateFields(checks) {
  let firstInvalid = null;
  for (const [input, message] of checks) {
    if (!setFieldError(input, message) && !firstInvalid) firstInvalid = input;
  }
  firstInvalid?.focus();
  return !firstInvalid;
}

/** Wire up every "Show / Hide" password button on the page. */
export function initPasswordToggles() {
  document.querySelectorAll('.field-toggle').forEach((btn) => {
    const input = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => {
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      btn.textContent = reveal ? 'Hide' : 'Show';
      btn.setAttribute('aria-pressed', String(reveal));
      btn.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
    });
  });
}

/* ---------- Provider visibility ---------- */

/** Hide Google / Apple / Email sections that are switched off in config.js. */
export function applyProviderConfig() {
  const oauthOn = AUTH_PROVIDERS.google || AUTH_PROVIDERS.apple;
  document.querySelectorAll('[data-provider]').forEach((el) => {
    el.hidden = !AUTH_PROVIDERS[el.dataset.provider];
  });
  document.querySelectorAll('[data-requires="oauth"]').forEach((el) => (el.hidden = !oauthOn));
  document.querySelectorAll('[data-requires="both"]').forEach((el) => (el.hidden = !(oauthOn && AUTH_PROVIDERS.email)));
}

/**
 * Attach click handlers to the Google / Apple buttons.
 * `alertBox` receives any error; `lockWhileBusy` are other buttons to disable meanwhile.
 */
export function initOAuthButtons(alertBox, lockWhileBusy = []) {
  const buttons = [...document.querySelectorAll('[data-oauth]')];
  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      clearAlert(alertBox);
      const others = [...buttons, ...lockWhileBusy].filter((b) => b !== button);
      others.forEach((b) => (b.disabled = true));
      setLoading(button, true, 'Signing in…');
      try {
        await signInWithOAuth(button.dataset.oauth);
        // Success: the browser is navigating to Google/Apple — keep the loading state.
      } catch (error) {
        showAlert(alertBox, friendlyError(error, 'oauth'));
        setLoading(button, false);
        others.forEach((b) => (b.disabled = false));
      }
    });
  });
}

/* ---------- Page guards ---------- */

/** For login / sign-up pages: signed-in users go straight to the app. */
export async function redirectIfSignedIn() {
  if (await getSession()) window.location.replace(PAGES.app);
}

/** For private pages: signed-out users go to the login page. Returns the session. */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    window.location.replace(PAGES.login);
    return null;
  }
  return session;
}
