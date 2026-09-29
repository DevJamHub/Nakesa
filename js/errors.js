// Turns technical Supabase / network errors into safe, friendly messages.
// Technical details are only logged to the console when running locally.

export const IS_DEV = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const PROVIDER_NAMES = { google: 'Google', apple: 'Apple' };

const BY_CODE = {
  invalid_credentials: 'Email atau kata sandi salah.',
  email_not_confirmed: 'Konfirmasi email Anda dulu sebelum masuk. Cek kotak masuk email Anda.',
  user_already_exists: 'Email ini sudah terdaftar. Silakan masuk.',
  email_exists: 'Email ini sudah terdaftar. Silakan masuk.',
  email_address_invalid: 'Format email belum benar.',
  validation_failed: 'Periksa kembali data yang Anda isi.',
  weak_password: 'Pilih kata sandi yang lebih kuat.',
  same_password: 'Kata sandi baru harus berbeda dari yang lama.',
  over_email_send_rate_limit: 'Terlalu banyak email terkirim. Tunggu sebentar lalu coba lagi.',
  over_request_rate_limit: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
  provider_disabled: 'Cara masuk ini sedang tidak tersedia.',
  signup_disabled: 'Pendaftaran akun baru sedang ditutup.',
  user_banned: 'Akun ini dinonaktifkan. Silakan hubungi admin.',
  flow_state_expired: 'Link sudah kedaluwarsa. Silakan coba lagi.',
  otp_expired: 'Link sudah kedaluwarsa. Silakan minta link baru.',
};

/** Friendly text for a Supabase error code (e.g. from a callback URL), or null. */
export const messageForCode = (code) => BY_CODE[code] ?? null;

export function friendlyError(error, context = 'general') {
  if (IS_DEV) console.error(`[auth:${context}]`, error);

  if (error?.name === 'AuthRetryableFetchError' || error instanceof TypeError || !navigator.onLine) {
    return 'Koneksi internet bermasalah. Periksa jaringan lalu coba lagi.';
  }
  if (error?.code === 'provider_disabled' && PROVIDER_NAMES[error.provider]) {
    return `Masuk dengan ${PROVIDER_NAMES[error.provider]} belum diaktifkan. Silakan gunakan cara masuk lain.`;
  }
  if (error?.code && BY_CODE[error.code]) return BY_CODE[error.code];
  if (context === 'signIn' && error?.status === 400) {
    return 'Gagal masuk. Periksa email dan kata sandi Anda.';
  }
  return 'Terjadi kesalahan. Silakan coba lagi.';
}
