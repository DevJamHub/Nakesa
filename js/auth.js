// Authentication service — the only file that talks to api/auth.php.
// Page scripts use these functions instead of calling the API directly.
// Login memakai session PHP di server (cookie), bukan Supabase Auth lagi.
import { api } from './api.js';

/** { user: { id, email } } when signed in, otherwise null. */
export async function getSession() {
  const { user } = await api('auth.php');
  return user ? { user } : null;
}

/**
 * Calls back with 'SIGNED_OUT' when the session ended in another tab (checked whenever this tab
 * becomes visible again). Returns a function that stops listening.
 */
export function onAuthChange(callback) {
  const check = async () => {
    if (document.visibilityState !== 'visible') return;
    try {
      if (!(await getSession())) callback('SIGNED_OUT');
    } catch { /* offline: check again next time */ }
  };
  document.addEventListener('visibilitychange', check);
  return () => document.removeEventListener('visibilitychange', check);
}

/** Google / Apple sign-in needs an outside service, so it is switched off (see AUTH_PROVIDERS). */
export async function signInWithOAuth(provider) {
  throw Object.assign(new Error(`Provider "${provider}" is not enabled`), { code: 'provider_disabled', provider });
}

export async function signInWithEmail(email, password) {
  return getSessionFrom(await api('auth.php', { method: 'POST', params: { action: 'login' }, body: { email: email.trim(), password } }));
}

/** Returns 'signed_in' (there is no email confirmation step). */
export async function signUpWithEmail(fullName, email, password) {
  await api('auth.php', {
    method: 'POST',
    params: { action: 'signup' },
    body: { full_name: fullName.trim(), email: email.trim(), password },
  });
  return 'signed_in';
}

/** Password reset by email needs an email service, so it is not available yet. */
export async function sendPasswordReset() {
  throw Object.assign(new Error('Password reset is not available'), { code: 'feature_unavailable' });
}

export async function updatePassword() {
  throw Object.assign(new Error('Password reset is not available'), { code: 'feature_unavailable' });
}

export async function signOut() {
  await api('auth.php', { method: 'POST', params: { action: 'logout' } });
}

const getSessionFrom = ({ user }) => (user ? { user } : null);
