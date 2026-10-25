// NAKESA — frontend configuration.
// Data and sign-in are handled by the PHP server in the api/ folder (see js/api.js).

// Turn each sign-in method on/off independently.
// Google / Apple need an outside sign-in service, which is not part of the course yet.
export const AUTH_PROVIDERS = {
  google: false,
  apple: false,
  email: true,
};

// "Lupa kata sandi" sends an email, which needs an outside email service: hidden for now.
export const PASSWORD_RESET = false;

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
