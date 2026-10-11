// Hari libur nasional Indonesia (termasuk cuti bersama) dari API Hari Libur:
// https://github.com/guangrei/APIHariLibur_V2 — diperbarui otomatis tiap minggu dari Google Calendar.
// Tanpa login dan tanpa API key; jsDelivr menyajikannya lewat CDN dengan CORS terbuka.
export const HOLIDAY_API_URL = 'https://cdn.jsdelivr.net/gh/guangrei/APIHariLibur_V2@main/calendar.json';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Sumber datanya kadang masih memakai nama berbahasa Inggris.
const TO_INDONESIAN = [
  [/^Joint Holiday for /i, 'Cuti Bersama '],
  [/Good Friday/i, 'Wafat Isa Almasih'],
];

/* ---------- Week 4 · Task 01: Connect to API ---------- */
/**
 * Semua hari libur nasional dari API, urut tanggal:
 * [{ date: '2026-12-24', name: 'Cuti Bersama Natal (Malam Natal)', jointLeave: true, tentative: false }, …]
 * Melempar error kalau request gagal, sehingga halaman bisa menampilkan pesan error.
 */
export async function fetchHolidays() {
  // 1. Request: GET ke endpoint API. Dibatalkan setelah 10 detik supaya loading tidak menggantung.
  const response = await fetch(HOLIDAY_API_URL, { signal: AbortSignal.timeout?.(10_000) });

  // 2. Response: periksa status HTTP (200 OK). 404 / 500 tidak otomatis dianggap gagal oleh fetch.
  if (!response.ok) throw new Error(`API Hari Libur menjawab HTTP ${response.status}`);

  // 3. JSON → object JavaScript, bentuknya:
  //    { "2026-12-25": { "holiday": true, "summary": ["Hari Raya Natal"], … }, …, "info": { … } }
  const data = await response.json();

  // 4. Olah: object per tanggal → array of objects, hanya hari libur (bukan sekadar perayaan).
  return Object.entries(data)
    .filter(([date, day]) => ISO_DATE.test(date) && day?.holiday === true)
    .map(([date, day]) => {
      const summary = [day.summary].flat().join(' · '); // satu tanggal bisa punya beberapa nama
      const name = TO_INDONESIAN.reduce((text, [pattern, id]) => text.replace(pattern, id), summary)
        .replace(/\s*\(belum pasti\)/gi, '');
      return {
        date,
        name,
        jointLeave: /^cuti bersama/i.test(name),
        tentative: /belum pasti/i.test(summary), // tanggal hari raya Islam menunggu sidang isbat
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
