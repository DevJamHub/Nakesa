// Return page for Google / Apple sign-in and email-confirmation links.
// supabase-js exchanges the ?code= in the URL for a session automatically.
import { PAGES } from '../config.js';
import { getSession } from '../auth.js';

const params = new URLSearchParams(window.location.search + '&' + window.location.hash.slice(1));
const providerError = params.get('error_description') || params.get('error');

function showError(message) {
  if (message) document.getElementById('callback-error').textContent = message;
  document.getElementById('loader').hidden = true;
  document.getElementById('content').hidden = false;
}

if (providerError) {
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) console.error('[auth:callback]', providerError);
  const cancelled = providerError === 'access_denied' || /cancel/i.test(providerError);
  showError(cancelled ? 'Sign-in was cancelled.' : null);
} else {
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 10_000));
  const session = await Promise.race([getSession(), timeout]);
  if (session) window.location.replace(PAGES.app);
  else showError(null);
}
