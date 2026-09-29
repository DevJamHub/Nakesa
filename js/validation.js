import { MIN_PASSWORD_LENGTH } from './config.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email.trim()) return 'Email wajib diisi.';
  if (!EMAIL_RE.test(email.trim())) return 'Format email belum benar.';
  return '';
}

export function validatePassword(password) {
  if (!password) return 'Kata sandi wajib diisi.';
  if (password.length < MIN_PASSWORD_LENGTH) return `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  return '';
}

export function validateFullName(name) {
  if (!name.trim()) return 'Nama lengkap wajib diisi.';
  if (name.trim().length > 120) return 'Nama terlalu panjang.';
  return '';
}

export function validateConfirm(password, confirm) {
  if (!confirm) return 'Ketik ulang kata sandi Anda.';
  if (password !== confirm) return 'Kata sandi tidak sama.';
  return '';
}
