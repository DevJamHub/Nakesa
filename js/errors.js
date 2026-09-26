// Turns technical Supabase / network errors into safe, friendly messages.
// Technical details are only logged to the console when running locally.

export const IS_DEV = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const PROVIDER_NAMES = { google: 'Google', apple: 'Apple' };

const BY_CODE = {
  invalid_credentials: 'Email or password is incorrect.',
  email_not_confirmed: 'Please confirm your email address before logging in. Check your inbox.',
  user_already_exists: 'An account with this email already exists.',
  email_exists: 'An account with this email already exists.',
  email_address_invalid: 'Please enter a valid email address.',
  validation_failed: 'Please check the information you entered.',
  weak_password: 'Please choose a stronger password.',
  same_password: 'Your new password must be different from the old one.',
  over_email_send_rate_limit: 'Too many emails sent. Please wait a moment and try again.',
  over_request_rate_limit: 'Too many attempts. Please wait a moment and try again.',
  provider_disabled: 'This sign-in method is not available right now.',
  signup_disabled: 'New sign-ups are currently disabled.',
  user_banned: 'This account has been suspended. Please contact support.',
  flow_state_expired: 'This link has expired. Please try again.',
  otp_expired: 'This link has expired. Please request a new one.',
};

/** Friendly text for a Supabase error code (e.g. from a callback URL), or null. */
export const messageForCode = (code) => BY_CODE[code] ?? null;

export function friendlyError(error, context = 'general') {
  if (IS_DEV) console.error(`[auth:${context}]`, error);

  if (error?.name === 'AuthRetryableFetchError' || error instanceof TypeError || !navigator.onLine) {
    return 'Network error. Please check your connection and try again.';
  }
  if (error?.code === 'provider_disabled' && PROVIDER_NAMES[error.provider]) {
    return `${PROVIDER_NAMES[error.provider]} sign-in is not enabled yet. Please use another sign-in method.`;
  }
  if (error?.code && BY_CODE[error.code]) return BY_CODE[error.code];
  if (context === 'signIn' && error?.status === 400) {
    return 'Unable to sign in. Please check your email and password.';
  }
  return 'Something went wrong. Please try again.';
}
