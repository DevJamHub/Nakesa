import { MIN_PASSWORD_LENGTH } from './config.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.';
  return '';
}

export function validatePassword(password) {
  if (!password) return 'Password is required.';
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  return '';
}

export function validateFullName(name) {
  if (!name.trim()) return 'Full name is required.';
  if (name.trim().length > 120) return 'Name is too long.';
  return '';
}

export function validateConfirm(password, confirm) {
  if (!confirm) return 'Please confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return '';
}
