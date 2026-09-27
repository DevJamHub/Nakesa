// Formatting helpers for Indonesian dates, rupiah and WhatsApp links.

export const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** 150000 → "Rp 150.000" */
export const rupiah = (amount) => `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;

/** "150.000" or "Rp150rb" typed by a user → 150000 */
export const parseRupiah = (text) => Number(String(text).replace(/\D/g, '')) || 0;

/** Show thousands separators while the user types an amount. */
export function bindRupiahInput(input) {
  input.addEventListener('input', () => {
    const value = parseRupiah(input.value);
    input.value = value ? value.toLocaleString('id-ID') : '';
  });
}

/** Local date as "YYYY-MM-DD" (toISOString would use UTC and can be a day off). */
export function toISODate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return toISODate(date);
}

/** "2026-09-27" → "Minggu, 27 September" */
export function formatDate(iso, options = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', options);
}

/** "Hari ini", "Besok", or the formatted date. */
export function friendlyDate(iso) {
  if (iso === todayISO()) return 'Hari ini';
  if (iso === todayISO(1)) return 'Besok';
  if (iso === todayISO(-1)) return 'Kemarin';
  return formatDate(iso);
}

/** "08:30:00" → "08.30" */
export const shortTime = (time) => (time ? time.slice(0, 5).replace(':', '.') : '');

/** Age in years from "YYYY-MM-DD", or null. */
export function age(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) years--;
  return years;
}

/** "0812-3456 789" → "628123456789" (format wa.me expects). */
export function waNumber(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;
  return digits;
}

export function waLink(phone, message = '') {
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${waNumber(phone)}${text}`;
}

/** Escape user text before putting it into an HTML template string. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
