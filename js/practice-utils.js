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

/* ---------- Medicines ---------- */
// Statuses come from the medicine_inventory view in the database.
export const STOCK_STATUS = {
  aman: { label: 'Stok aman', tone: 'green' },
  menipis: { label: 'Menipis', tone: 'orange' },
  habis: { label: 'Habis', tone: 'red' },
};

export const EXPIRY_STATUS = {
  aman: { label: 'Aman', icon: '🟢', tone: 'green' },
  akan_kedaluwarsa: { label: 'Akan kedaluwarsa', icon: '🟡', tone: 'orange' },
  kedaluwarsa: { label: 'Kedaluwarsa', icon: '🔴', tone: 'red' },
};

/** Expiry status of a whole medicine: "kedaluwarsa" means one of its batches is. */
export const medicineExpiry = (status) =>
  (status === 'kedaluwarsa' ? { ...EXPIRY_STATUS.kedaluwarsa, label: 'Ada stok kedaluwarsa' } : EXPIRY_STATUS[status]);

// Golongan obat (logo on the packaging) and medical devices.
export const DRUG_CLASS = {
  bebas: { label: 'Obat bebas', tone: 'green' },
  bebas_terbatas: { label: 'Obat bebas terbatas', tone: 'blue' },
  keras: { label: 'Obat keras', tone: 'red' },
  narkotika_psikotropika: { label: 'Narkotika/psikotropika', tone: 'red' },
  alkes: { label: 'Alat kesehatan', tone: 'gray' },
};

export const MOVEMENT_TYPE = {
  masuk: { label: 'Stok masuk', icon: '📥', tone: 'green' },
  keluar: { label: 'Stok keluar', icon: '📤', tone: 'blue' },
  koreksi: { label: 'Koreksi stok', icon: '⚖️', tone: 'gray' },
  resep: { label: 'Resep', icon: '📝', tone: 'purple' },
  kedaluwarsa: { label: 'Kedaluwarsa', icon: '⌛', tone: 'red' },
  rusak: { label: 'Rusak', icon: '💔', tone: 'red' },
};

/** A medicine from medicine_inventory that needs a look (low stock or expiry). */
export const needsAttention = (m) => m.is_active && (m.stock_status !== 'aman' || m.expiry_status !== 'aman');

/** Expiry status of one batch: 'kedaluwarsa', 'akan_kedaluwarsa' or 'aman' (no date = aman). */
export function batchExpiry(expiresOn, warningDays) {
  if (!expiresOn) return 'aman';
  if (expiresOn < todayISO()) return 'kedaluwarsa';
  if (expiresOn <= todayISO(warningDays)) return 'akan_kedaluwarsa';
  return 'aman';
}

/** "Paracetamol" + "Sanmol · Tablet 500 mg" style description of a medicine. */
export const medicineDetail = (m) => [m.brand_name, [m.dosage_form, m.strength].filter(Boolean).join(' ')]
  .filter(Boolean).join(' · ');
