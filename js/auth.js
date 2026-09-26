// Authentication service — the only file that calls Supabase Auth.
// Page scripts use these functions instead of touching the client directly.
import { supabase } from './supabase.js';
import { PAGES } from './config.js';

/** Absolute URL of a page in this site, used as a Supabase redirect target. */
export const pageUrl = (page) => new URL(page, window.location.href).href;

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

/** provider: 'google' | 'apple'. The browser is redirected to the provider. */
export async function signInWithOAuth(provider) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: pageUrl(PAGES.callback) },
  });
  if (error) throw error;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data.session;
}

/** Returns 'signed_in' or 'confirm_email' (when email confirmation is required). */
export async function signUpWithEmail(fullName, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName.trim() },
      emailRedirectTo: pageUrl(PAGES.callback),
    },
  });
  if (error) throw error;

  // With email confirmation on, Supabase hides whether an address is taken by
  // returning a user with no identities.
  if (data.user && data.user.identities?.length === 0) {
    throw Object.assign(new Error('User already registered'), { code: 'user_already_exists' });
  }
  return data.session ? 'signed_in' : 'confirm_email';
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: pageUrl(PAGES.resetPassword),
  });
  if (error) throw error;
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
