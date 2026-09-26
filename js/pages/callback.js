// Return page for Google / Apple sign-in and email-confirmation links.
// supabase-js exchanges the ?code= in the URL for a session automatically.
import { PAGES } from '../config.js';
import { getSession } from '../auth.js';
import { IS_DEV, messageForCode } from '../errors.js';

const params = new URLSearchParams(window.location.search + '&' + window.location.hash.slice(1));
const providerError = params.get('error_description') || params.get('error');
const errorCode = params.get('error_code');
const hasCode = params.has('code');

function showError(message) {
  if (message) document.getElementById('callback-error').textContent = message;
  document.getElementById('loader').hidden = true;
  document.getElementById('content').hidden = false;
}

if (providerError) {
  if (IS_DEV) console.error('[auth:callback]', errorCode, providerError);
  const cancelled = providerError === 'access_denied' || /cancel/i.test(providerError);
  showError(cancelled ? 'Sign-in was cancelled.' : messageForCode(errorCode));
} else {
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 10_000));
  const session = await Promise.race([getSession(), timeout]);
  if (session) {
    window.location.replace(PAGES.dashboard);
  } else {
    // A ?code= that could not be exchanged: expired, already used, or opened in a
    // different browser than the one that started sign-in (PKCE needs the same one).
    if (IS_DEV) console.error('[auth:callback] no session after redirect', { hasCode });
    showError(hasCode ? 'This sign-in link has expired or was opened in a different browser. Please log in again.' : null);
  }
}
