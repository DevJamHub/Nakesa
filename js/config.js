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

// Page file names. All pages live in the /html folder, so these are relative to it.
export const PAGES = {
  home: 'index.html',
  welcome: 'welcome.html',
  login: 'login.html',
  signup: 'signup.html',
  forgotPassword: 'forgot-password.html',
  resetPassword: 'reset-password.html',
  callback: 'callback.html',
  onboarding: 'onboarding.html', // first-time setup: name, profession, practice
  dashboard: 'dashboard.html', // main page after sign-in
  bookings: 'bookings.html',
  patients: 'patients.html',
  medicines: 'medicines.html',
  finance: 'finance.html',
  practice: 'practice.html', // hours, open/closed, booking link, practice info, Nakesa Patient profile
  services: 'services.html', // services, prices and durations patients choose in Nakesa Patient
  medicine: 'medicine.html', // one medicine: batches, stock history, use (medicine.html?id=…)
  prescriptions: 'prescriptions.html',
  book: 'book.html', // public booking page for patients (no login)
};
