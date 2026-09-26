// NAKESA — Supabase configuration.
//
// The publishable key is SAFE to ship in frontend code: all data access is
// protected by Row Level Security in the database.
// NEVER put the service_role / secret key in any file in this folder.
export const SUPABASE_URL = 'https://fmmudgdkyihbyxntutit.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_pla1TfqgD36QZRrXfnVjrQ_g7eIwAwU';

// Turn each sign-in method on/off independently.
// Set to false until the provider is enabled in Supabase → Authentication → Providers.
export const AUTH_PROVIDERS = {
  google: true,
  apple: false, // Apple is not configured in Supabase yet — flip to true once it is.
  email: true,
};

export const MIN_PASSWORD_LENGTH = 8;

// Page file names (relative to the site root).
export const PAGES = {
  home: 'index.html',
  welcome: 'welcome.html',
  login: 'login.html',
  signup: 'signup.html',
  forgotPassword: 'forgot-password.html',
  resetPassword: 'reset-password.html',
  callback: 'callback.html',
  app: 'app.html', // profile setup (asks for a name when the account has none)
  dashboard: 'dashboard.html', // main page after sign-in
};
