// Pieces of the Nakesa Patient app drawn inside Nakesa Pro, so a practice sees exactly
// what patients will see (styles: .pp-* in js/tailwind-setup.js). Also the service helpers
// shared by the Layanan page and the Praktik page.
import { run, supabase } from './db.js';
import { escapeHtml, rupiah } from './format.js';
import { professionOf, titledName } from './professions.js';

/** Choices for "lama per pasien", in minutes. */
export const DURATIONS = [15, 20, 30, 45, 60, 90, 120];

export const durationLabel = (minutes) => {
  if (minutes % 60 === 0) return `${minutes / 60} jam`;
  if (minutes > 60) return `${Math.floor(minutes / 60)} jam ${minutes % 60} menit`;
  return `${minutes} menit`;
};

/** A missing price is never guessed: patients are asked to check with the practice. */
export const priceLabel = (price) => (price === null || price === undefined ? 'Tanya harga ke praktik' : rupiah(price));

/** The practice's own services (also hidden ones), in the order patients see them. */
export const loadServices = (practiceId) =>
  run(supabase.from('practice_services').select('*').eq('practice_id', practiceId).order('sort_order').order('name'));

/** What patients are offered: the active own services, or the profession's standard ones. */
export function offeredServices(own, professionKey) {
  if (own.length) return own.filter((s) => s.is_active);
  return professionOf(professionKey).services.map((name) => ({
    name, description: null, price: null, duration_minutes: 30, standard: true,
  }));
}

/** One service as the patient app shows it. */
export function serviceCardHtml(service) {
  const price = service.price === null || service.price === undefined
    ? `<span class="pp-price is-ask">${priceLabel(null)}</span>`
    : `<span class="pp-price">${priceLabel(service.price)}</span>`;
  return `
    <div class="pp-service">
      <div class="min-w-0">
        <strong>${escapeHtml(service.name || 'Nama layanan')}</strong>
        ${service.description ? `<small>${escapeHtml(service.description)}</small>` : ''}
        <span class="pp-meta">${price}${service.standard ? '' : `<span>· ${durationLabel(service.duration_minutes)}</span>`}</span>
      </div>
      <span class="pp-radio" aria-hidden="true"></span>
    </div>`;
}

/**
 * The practice on a phone, as found in the patient app's search, with its first services.
 * practice: { name, address, city, specialty, is_open }; professionKey and practitioner name
 * come from the profile. listed = shown in the app.
 */
export function phonePreviewHtml({ practice, professionKey, practitioner, services, listed }) {
  const profession = professionOf(professionKey);
  const subtitle = practice.specialty ? `${profession.label} · ${practice.specialty}` : profession.label;
  const place = [practice.address, practice.city].filter(Boolean).join(', ');
  const shown = services.slice(0, 3);
  return `
    <div class="pp-phone${listed ? '' : ' is-off'}">
      <div class="pp-notch" aria-hidden="true"></div>
      <div class="pp-screen">
        <div class="pp-status" aria-hidden="true"><span>09.41</span><span>▂▄▆ ▮</span></div>
        <div class="pp-search" aria-hidden="true">🔍 <span>Cari dokter, bidan, praktik…</span></div>
        <div class="pp-card">
          <span class="pp-avatar" style="--pc: ${profession.color}" aria-hidden="true">${profession.icon}</span>
          <div class="pp-card-body">
            <strong>${escapeHtml(practice.name || 'Nama praktik')}</strong>
            <em style="color: ${profession.color}">${escapeHtml(subtitle)}</em>
            ${practitioner ? `<small>${escapeHtml(titledName(practitioner, professionKey))}</small>` : ''}
            ${place ? `<small>📍 ${escapeHtml(place)}</small>` : '<small class="pp-missing">📍 Alamat belum diisi</small>'}
            <span class="pp-badge${practice.is_open ? ' is-open' : ''}">● ${practice.is_open ? 'Sedang buka' : 'Sedang tutup'}</span>
          </div>
        </div>
        <p class="pp-section">Layanan</p>
        ${shown.length ? shown.map(serviceCardHtml).join('') : '<p class="pp-empty">Belum ada layanan yang ditampilkan.</p>'}
        ${services.length > shown.length ? `<p class="pp-more">+${services.length - shown.length} layanan lain</p>` : ''}
        <div class="pp-cta" aria-hidden="true">📅 Buat Janji Temu</div>
      </div>
      ${listed ? '' : `
        <div class="pp-off">
          <span aria-hidden="true">🔒</span>
          <strong>Belum tampil</strong>
          <small>Pasien belum bisa menemukan praktik ini di aplikasi.</small>
        </div>`}
    </div>`;
}
