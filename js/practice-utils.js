// Small shared rules used by several app pages.
import { PAGES } from './config.js';
import { todayISO } from './format.js';

/** Public booking link for a practice, e.g. http://127.0.0.1:5500/html/book.html?p=ab12cd34ef */
export const bookingLink = (practice) =>
  new URL(`${PAGES.book}?p=${practice.booking_slug}`, window.location.href).href;

export const BOOKING_STATUS = {
  baru: { label: 'Perlu konfirmasi', tone: 'orange' },
  dikonfirmasi: { label: 'Dikonfirmasi', tone: 'green' },
  selesai: { label: 'Selesai', tone: 'blue' },
  batal: { label: 'Batal', tone: 'gray' },
};

/** Stock / expiry status of a medicine → { label, tone }. */
export function medicineStatus({ stock, min_stock, expires_on }) {
  if (expires_on && expires_on < todayISO()) return { label: 'Kedaluwarsa', tone: 'red' };
  if (stock <= 0) return { label: 'Habis', tone: 'red' };
  if (stock <= min_stock) return { label: 'Menipis', tone: 'orange' };
  if (expires_on && expires_on <= todayISO(30)) return { label: 'Segera kedaluwarsa', tone: 'orange' };
  return { label: 'Aman', tone: 'green' };
}
