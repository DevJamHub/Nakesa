# Week 4 — Web Programming: REST API & Fetch API (Single Page Application)

**Nama:** Sigit Novriyanto
**Tanggal:** Selasa, 6 Oktober 2026
**Proyek:** NAKESA — aplikasi manajemen praktik mandiri tenaga kesehatan (bidan, dokter, perawat, dll.)
**Halaman yang dikerjakan:** Beranda / dashboard setelah login (`html/dashboard.html`, `js/pages/dashboard.js`, `js/holidays.js`, `js/tailwind-setup.js`)

**Tugas dari kelas (Sprint 03 — Connect to an API):** Implementasi REST API & Fetch API (Single Page Application)

1. **Task 01 — Connect to API:** fetch API & parsing JSON
2. **Task 02 — Display API Data:** DOM manipulation dinamis dari API ke interface NAKESA
3. **Task 03 — Handle API State:** feedback loading spinner, success data, error handling & tombol Coba Lagi

Pada slide, contohnya memakai *PresidenKu* yang mengambil data "Program Prioritas" dari API. Di sini ketiga task saya terapkan pada proyek saya sendiri, **NAKESA**, dengan menambahkan kartu **"Libur nasional terdekat"** di halaman **Beranda**. Datanya diambil dari API hari libur nasional Indonesia.

Alasan memilih fitur ini: pemilik praktik (bidan, dokter, perawat, dll.) perlu tahu kapan tanggal merah dan cuti bersama. Dengan begitu mereka bisa memutuskan praktik buka atau tutup, lalu mengabari pasien jauh-jauh hari. Beranda dipilih karena halaman ini yang pertama kali dibuka setiap hari.

---

## API yang Digunakan

| | Keterangan |
|---|---|
| **Nama API** | API Hari Libur V2 buatan guangrei (https://github.com/guangrei/APIHariLibur_V2) |
| **Endpoint** | `https://cdn.jsdelivr.net/gh/guangrei/APIHariLibur_V2@main/calendar.json` |
| **Method** | `GET` |
| **Response** | `200 OK`, `Content-Type: application/json` |
| **Isi data** | Hari libur nasional dan cuti bersama Indonesia, tahun ini dan tahun depan |
| **Asal data** | Kalender hari libur Indonesia dari Google Calendar, diperbarui otomatis setiap minggu |
| **Biaya / API key** | Gratis, tanpa login, tanpa API key |
| **CORS** | `Access-Control-Allow-Origin: *`, jadi boleh dipanggil langsung dari browser |

Bedah alamat endpoint:

```
https://cdn.jsdelivr.net / gh / guangrei / APIHariLibur_V2 @main / calendar.json
└──── server (CDN) ────┘ └┬─┘  └── ┬ ──┘  └───── ┬ ─────┘ └─┬─┘  └──── ┬ ────┘
                        GitHub  pemilik     nama project     versi   data yang diminta
```

### Kenapa memilih API ini?

Sebelum memilih, saya mencoba beberapa API hari libur Indonesia (dicek pada 6 Oktober 2026):

| API | Hasil |
|---|---|
| `api-harilibur.vercel.app` | Mati (`402 DEPLOYMENT_DISABLED`) |
| `dayoffapi.vercel.app` | Mati (`402 DEPLOYMENT_DISABLED`) |
| `libur.deno.dev` | Mati (`404`, layanan Deno Deploy Classic sudah dihentikan) |
| `date.nager.at` (Nager.Date) | Jalan, tetapi data Indonesia **tidak lengkap**: Idul Fitri, Idul Adha, Nyepi, Waisak, dan Imlek tidak ada |
| **API Hari Libur V2 (guangrei)** | **Jalan dan lengkap**, termasuk cuti bersama. Terakhir diperbarui 24 September 2026 |

### Contoh JSON dari API

Potongan response asli (seluruhnya ada 56 entri, dari 1 Januari 2026 sampai 31 Desember 2027):

```json
{
    "2026-12-24": {
        "description": ["Hari libur nasional"],
        "holiday": true,
        "summary": ["Cuti Bersama Natal (Malam Natal)"]
    },
    "2026-12-25": {
        "description": ["Hari libur nasional"],
        "holiday": true,
        "summary": ["Hari Raya Natal"]
    },
    "2026-12-31": {
        "description": ["Perayaan"],
        "holiday": false,
        "summary": ["Malam Tahun Baru"]
    },
    "info": {
        "author": "guangrei",
        "link": "https://github.com/guangrei",
        "updated": "20260924 17:05:45"
    }
}
```

Cara membacanya:

- **Kunci** (`"2026-12-25"`) adalah tanggalnya.
- **`holiday`** bernilai `true` kalau tanggal merah, `false` kalau hanya perayaan.
- **`summary`** adalah nama harinya. Bentuknya array karena satu tanggal bisa punya lebih dari satu nama.
- **`info`** bukan tanggal, hanya keterangan pembuat API dan waktu update terakhir.

---

## Konsep Dasar

| Istilah | Arti | Di NAKESA |
|---|---|---|
| **REST API** | Cara client dan server bertukar data lewat HTTP. Client mengirim *request* ke sebuah *endpoint*, server membalas dengan *response* | NAKESA (client) meminta data ke server API Hari Libur |
| **Fetch API** | Fungsi bawaan browser, `fetch()`, untuk mengirim request dan menerima response | `fetch(HOLIDAY_API_URL)` |
| **Asynchronous** | Proses yang butuh waktu dijalankan tanpa menghentikan halaman | Halaman tetap bisa dipakai selama data libur diambil |
| **Promise & async/await** | `fetch` mengembalikan Promise ("janji" hasilnya datang nanti). `await` menunggu hasilnya | `await fetch(...)` dan `await response.json()` |
| **JSON** | Format **teks** untuk menyimpan dan mengirim data | Isi response dari API |
| **Parsing JSON** | Mengubah teks JSON menjadi object JavaScript supaya isinya bisa dipakai | `response.json()` |
| **Single Page Application** | Halaman tidak di-refresh. Data diambil di belakang layar, lalu hanya bagian tertentu yang diperbarui | Hanya kartu libur yang berubah, halaman Beranda tidak di-reload |

---

## Task 01 — Connect to API (Fetch API & Parsing JSON)

> Hubungkan NAKESA dengan API yang menyediakan data yang relevan dengan aplikasi.

### Konsep

Alur Fetch API (sesuai slide):

```
fetch() → Response → response.json() → JavaScript Object
```

1. **`fetch(url)`** mengirim request `GET` ke server dan mengembalikan **Promise**.
2. **Response** adalah balasan server. Ada `status` (`200`, `404`, `500`) dan `ok` (`true` kalau status 200–299). Isinya masih berupa teks.
3. **`response.json()`** membaca isi response, lalu mem-*parsing* teks JSON menjadi object JavaScript.
4. **JavaScript Object** siap diolah dan ditampilkan.

### Penerapan di NAKESA

#### `js/holidays.js`: file baru

Kode untuk terhubung ke API saya taruh di file tersendiri. Tujuannya supaya halaman lain, misalnya halaman booking pasien, bisa memakai fungsi yang sama nanti.

```js
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
```

### Hasil pengolahan data

JSON dari API berbentuk **object per tanggal**. Untuk ditampilkan dengan `forEach`, lebih mudah memakai **array of objects**. Karena itu datanya diolah dulu:

| Langkah | Kode | Fungsi |
|---|---|---|
| 1 | `Object.entries(data)` | Object diubah menjadi daftar pasangan `[tanggal, isi]` |
| 2 | `.filter(...)` | Membuang yang bukan hari libur (misalnya "Malam Tahun Baru") dan entri `info` |
| 3 | `.map(...)` | Merapikan data: nama berbahasa Inggris diterjemahkan, tulisan "(belum pasti)" diubah menjadi penanda `tentative`, cuti bersama ditandai `jointLeave` |
| 4 | `.sort(...)` | Mengurutkan dari tanggal paling awal |

**Sebelum (JSON dari API):**

```json
{
  "2026-12-24": { "description": ["Hari libur nasional"], "holiday": true, "summary": ["Cuti Bersama Natal (Malam Natal)"] },
  "2026-12-31": { "description": ["Perayaan"], "holiday": false, "summary": ["Malam Tahun Baru"] },
  "2027-01-05": { "description": ["Hari libur nasional"], "holiday": true, "summary": ["Isra Mikraj Nabi Muhammad (belum pasti)"] },
  "info": { "author": "guangrei", "link": "https://github.com/guangrei", "updated": "20260924 17:05:45" }
}
```

**Sesudah (array of objects yang dikembalikan `fetchHolidays()`):**

```js
[
  { date: '2026-12-24', name: 'Cuti Bersama Natal (Malam Natal)', jointLeave: true, tentative: false },
  { date: '2027-01-05', name: 'Isra Mikraj Nabi Muhammad', jointLeave: false, tentative: true },
]
```

> "Malam Tahun Baru" (`holiday: false`) dan `info` sudah dibuang.

### Penjelasan

- **Ada dua `await`.** Yang pertama menunggu response datang dari server. Yang kedua menunggu isi response selesai dibaca dan di-parse.
- **`response.ok` wajib dicek.** `fetch` hanya dianggap gagal kalau koneksinya putus. Kalau server menjawab `404` atau `500`, `fetch` tetap dianggap berhasil, jadi saya melempar error sendiri dengan `throw new Error(...)`. Error ini nanti ditangkap di Task 03.
- **`AbortSignal.timeout(10_000)`** membatalkan request kalau 10 detik belum ada jawaban. Tanpa ini, loading bisa berputar selamanya saat sinyal HP jelek. Tanda `?.` membuat kode tetap jalan di browser lama yang belum mengenal fungsi ini.
- **`[day.summary].flat()`** memastikan `summary` selalu menjadi array, entah dari API datangnya berupa teks atau array.
- **Kenapa tidak disimpan saja sebagai file JSON di project?** Kalau begitu, datanya harus diperbarui manual setiap tahun. Dengan API, data tahun depan dan cuti bersama terbaru tersedia otomatis.

---

## Task 02 — Display API Data (DOM Manipulation Dinamis)

> Ambil data dari API dan tampilkan pada interface NAKESA.

### Konsep

Alur render banyak data (sesuai slide "Render Banyak Data"):

```
ARRAY → forEach() → Template Literal → HTML → DOM
```

Isi daftar **tidak ditulis manual di HTML**. HTML hanya menyediakan **wadah kosong**, lalu JavaScript mengisinya dengan data dari API. Karena itu tampilannya **dinamis**: kalau datanya berubah, tampilan ikut berubah tanpa mengubah kode.

### Penerapan di NAKESA

#### 1. `html/dashboard.html`: kartu baru dengan wadah kosong

**Sebelum:** di antara grafik "Pemasukan 7 hari" dan "Link booking online" belum ada kartu apa pun.

```html
    </div>

    <!-- Booking link: a QR code to scan and a link to copy -->
```

**Sesudah:**

```html
    </div>

    <!-- Upcoming national holidays, from a public API (Week 4) -->
    <section class="card dash-panel mt-8" aria-labelledby="holiday-title">
      <div class="dash-section-head">
        <div>
          <h2 id="holiday-title">Libur nasional terdekat</h2>
          <p class="holiday-status" id="holiday-status" role="status" data-state="loading">Memuat…</p>
        </div>
        <button type="button" class="btn btn-ghost btn-small shrink-0" id="holiday-reload" aria-label="Muat ulang data libur nasional" title="Muat ulang">↻<span class="hidden sm:inline">&nbsp;Muat ulang</span></button>
      </div>
      <ul class="holiday-list" id="holiday-list"></ul>
    </section>

    <!-- Booking link: a QR code to scan and a link to copy -->
```

> `<ul id="holiday-list">` sengaja dibiarkan **kosong**. Isinya dibuat oleh JavaScript dari data API.

#### 2. `js/pages/dashboard.js`: memanggil fungsi dari `holidays.js`

**Sebelum:**

```js
import { DAYS, escapeHtml, formatDate, rupiah, shortTime, todayISO, waLink } from '../format.js';
import { titledName } from '../professions.js';
```

**Sesudah:**

```js
import { IS_DEV } from '../errors.js';
import { DAYS, escapeHtml, formatDate, rupiah, shortTime, todayISO, waLink } from '../format.js';
import { fetchHolidays } from '../holidays.js';
import { titledName } from '../professions.js';
```

#### 3. `js/pages/dashboard.js`: fungsi `renderHolidays()`

```js
/* ---------- Week 4 · Task 02: Display API Data ---------- */
const HOLIDAYS_SHOWN = 4;

/** Days from today to an ISO date: 0 = today. */
const daysUntil = (iso) => Math.round((new Date(`${iso}T00:00:00`) - new Date(`${todayISO()}T00:00:00`)) / 86_400_000);

function countdown(iso) {
  const days = daysUntil(iso);
  if (days === 0) return 'Hari ini';
  if (days === 1) return 'Besok';
  return `${days} hari lagi`;
}

function renderHolidays() {
  // Saring di sini (bukan saat fetch) supaya tetap benar kalau halaman terbuka melewati tengah malam.
  const upcoming = holidays.filter((h) => h.date >= todayISO()).slice(0, HOLIDAYS_SHOWN);
  if (!upcoming.length) {
    holidayList.innerHTML = `
      <li class="empty-state">
        <p class="empty-icon" aria-hidden="true">📅</p>
        <p class="muted">Belum ada data libur nasional berikutnya.</p>
      </li>`;
    return;
  }

  // Array of objects → forEach → template literal → HTML → DOM.
  let html = '';
  upcoming.forEach((holiday) => {
    const date = new Date(`${holiday.date}T00:00:00`);
    // Gabungkan dengan data praktik dari Supabase: apakah hari itu ada jadwal praktik?
    const sessions = hours.filter((h) => h.day_of_week === date.getDay());
    const badges = [
      holiday.jointLeave ? '<span class="badge badge-blue">Cuti bersama</span>' : '',
      holiday.tentative ? '<span class="badge badge-gray">Tanggal belum pasti</span>' : '',
    ].join('');
    const practiceNote = sessions.length
      ? `<p class="holiday-note">🩺 Ada jadwal praktik ${sessions.map((s) => `${shortTime(s.opens_at)}–${shortTime(s.closes_at)}`).join(' & ')}. Kabari pasien kalau praktik tutup.</p>`
      : '';

    html += `
      <li class="holiday-item">
        <span class="holiday-date" aria-hidden="true">
          <strong>${date.getDate()}</strong>
          <small>${date.toLocaleDateString('id-ID', { month: 'short' })}</small>
        </span>
        <div class="min-w-0 flex-1">
          <p class="item-title">${escapeHtml(holiday.name)}</p>
          <p class="item-sub">${formatDate(holiday.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · <strong class="whitespace-nowrap text-ink">${countdown(holiday.date)}</strong></p>
          ${badges ? `<div class="mt-1.5 flex flex-wrap gap-1.5">${badges}</div>` : ''}
          ${practiceNote}
        </div>
      </li>`;
  });
  holidayList.innerHTML = html;
}
```

#### 4. `js/pages/dashboard.js`: kartu digambar ulang setelah data Supabase dimuat

**Sebelum** (di dalam fungsi `load()`):

```js
    renderHero();
    renderToday();
    showStatus();
    firstLoad = false;
```

**Sesudah:**

```js
    renderHero();
    renderToday();
    showStatus();
    if (holidays) renderHolidays(); // practice hours may have changed the "Ada jadwal praktik" notes
    firstLoad = false;
```

> Data libur (dari API) dan jam praktik (dari Supabase) diambil **bersamaan**. Kalau data libur datang lebih dulu, catatan "Ada jadwal praktik" belum bisa dibuat karena jam praktik belum ada. Baris ini menggambar ulang kartu setelah jam praktik selesai dimuat.

#### 5. `js/tailwind-setup.js`: gaya kartu

Ditambahkan di bagian gaya halaman Beranda, memakai `@apply` seperti komponen lain:

```css
/* National holidays (from the API): a red date tile, like "tanggal merah" on a calendar. */
.holiday-list { @apply m-0 list-none p-0; }
.holiday-item { @apply flex items-start gap-3.5 border-t border-line py-3 first:border-t-0; }
.holiday-date { @apply grid h-14 w-14 shrink-0 place-content-center rounded-xl bg-red-soft text-center leading-none text-red; }
.holiday-date strong { @apply block text-xl font-bold; font-variant-numeric: tabular-nums; }
.holiday-date small { @apply mt-1 block text-[11px] font-semibold uppercase tracking-wider; }
.holiday-note { @apply mt-1.5 rounded-lg bg-yellow-soft px-2.5 py-1.5 text-[13px] font-medium leading-snug text-yellow; }
```

### Hasil di halaman

Tampilan di HP pada 6 Oktober 2026. Contoh ini untuk praktik yang buka hari Kamis dan Selasa pukul 08.00–12.00 dan 16.00–20.00:

```
┌───────────────────────────────────────────────┐
│ Libur nasional terdekat                  [↻]  │
│ ● Data berhasil dimuat · 18.17                │
│                                               │
│ ┌────┐  Cuti Bersama Natal (Malam Natal)      │
│ │ 24 │  Kamis, 24 Desember 2026 · 79 hari lagi│
│ │DES │  [Cuti bersama]                        │
│ └────┘  🩺 Ada jadwal praktik 08.00–12.00 &   │
│         16.00–20.00. Kabari pasien kalau      │
│         praktik tutup.                        │
│ ───────────────────────────────────────────── │
│ ┌────┐  Hari Raya Natal                       │
│ │ 25 │  Jumat, 25 Desember 2026 · 80 hari lagi│
│ │DES │                                        │
│ └────┘                                        │
│ ───────────────────────────────────────────── │
│ ┌────┐  Hari Tahun Baru                       │
│ │ 1  │  Jumat, 1 Januari 2027 · 87 hari lagi  │
│ │JAN │                                        │
│ └────┘                                        │
│ ───────────────────────────────────────────── │
│ ┌────┐  Isra Mikraj Nabi Muhammad             │
│ │ 5  │  Selasa, 5 Januari 2027 · 91 hari lagi │
│ │JAN │  [Tanggal belum pasti]                 │
│ └────┘  🩺 Ada jadwal praktik 08.00–12.00 &   │
│         16.00–20.00. Kabari pasien kalau      │
│         praktik tutup.                        │
└───────────────────────────────────────────────┘
```

Dari satu object menjadi satu baris di layar:

| Data (object dari API) | Menjadi di layar |
|---|---|
| `date: '2026-12-24'` | Kotak merah **24 DES** |
| `date: '2026-12-24'` | "**Kamis, 24 Desember 2026**" |
| `date: '2026-12-24'` | "**79 hari lagi**" (dihitung dari tanggal hari ini) |
| `name` | Judul "**Cuti Bersama Natal (Malam Natal)**" |
| `jointLeave: true` | Label biru **Cuti bersama** |
| `tentative: true` | Label abu-abu **Tanggal belum pasti** |
| *(jam praktik dari Supabase)* | Catatan kuning **"🩺 Ada jadwal praktik …"** |

### Penjelasan

- **Satu field diolah menjadi beberapa tampilan.** Field `date` saja menghasilkan kotak tanggal, tanggal lengkap, dan hitung mundur. Jadi data tidak sekadar disalin, tetapi diolah.
- **Data API digabung dengan data Supabase.** Kalau hari libur jatuh di hari praktik, muncul catatan untuk mengabari pasien. Setiap pengguna melihat catatan yang berbeda sesuai jadwal praktiknya sendiri.
- **`escapeHtml(holiday.name)`** dipakai karena nama libur berasal dari pihak luar dan dimasukkan ke `innerHTML`. Tujuannya mencegah teks dijalankan sebagai kode HTML atau JavaScript (serangan XSS).
- **HTML dirangkai dulu di variabel `html`, lalu dimasukkan ke DOM sekali.** Di slide memakai `container.innerHTML += card` di dalam loop. Hasilnya sama, tetapi cara ini lebih ringan karena browser hanya menggambar ulang satu kali.
- **Disaring saat render, bukan saat fetch.** Kalau halaman dibiarkan terbuka melewati tengah malam, libur yang sudah lewat tidak ikut tampil.
- **Kotak tanggal diberi `aria-hidden="true"`**, karena tanggal lengkapnya sudah ada di teks. Pembaca layar (untuk pengguna tunanetra) tidak membacanya dua kali.
- **Tampilan HP sudah dicek di lebar 360px.** Sempat ditemukan nama libur dan label yang keluar dari kartu. Ini diperbaiki dengan mengubah daftar menjadi elemen biasa (bukan `grid`) dan mengganti label jadwal praktik menjadi catatan yang bisa turun baris.

---

## Task 03 — Handle API State (Loading, Success, Error & Coba Lagi)

> Berikan feedback ketika API sedang diproses, berhasil, atau gagal.

### Konsep

Alur (sesuai slide):

```
REQUEST → LOADING → RESPONSE ─┬─ SUCCESS → DATA    (data tampil)
                              └─ ERROR   → MESSAGE (pesan error + tombol Coba Lagi)
```

| State | Kapan | Yang dilihat pengguna |
|---|---|---|
| **Loading** | Sebelum `fetch` dijalankan | Spinner berputar + "Mengambil data libur nasional…", label abu-abu **● Memuat…** dengan titik berkedip, tombol ↻ dimatikan |
| **Success** | `fetch` berhasil dan data terbaca | Label hijau **● Data berhasil dimuat · 18.17**, lalu daftar libur tampil |
| **Error** | Internet mati, server error, JSON rusak, atau lebih dari 10 detik | Label merah **● Gagal dimuat**, ikon ⚠️, pesan "Gagal mengambil data libur nasional. Periksa koneksi internet Anda, lalu coba lagi." + tombol **Coba Lagi** |

### Penerapan di NAKESA

#### 1. `html/dashboard.html`: label status dan tombol muat ulang

Sudah termasuk di kartu pada Task 02:

```html
<p class="holiday-status" id="holiday-status" role="status" data-state="loading">Memuat…</p>
...
<button type="button" class="btn btn-ghost btn-small shrink-0" id="holiday-reload" aria-label="Muat ulang data libur nasional" title="Muat ulang">↻<span class="hidden sm:inline">&nbsp;Muat ulang</span></button>
```

#### 2. `js/pages/dashboard.js`: mengambil elemen dan fungsi label status

```js
/* ---------- Libur nasional terdekat (Week 4: data dari API) ---------- */
// Task 01 (Connect to API) ada di ../holidays.js: fetch → cek response.ok → response.json() → olah data.
// Gaya Single Page Application: data diambil di belakang layar lalu hanya kartu ini yang diperbarui,
// halaman tidak pernah di-refresh (juga saat menekan "Muat ulang" atau "Coba Lagi").
const holidayList = $('holiday-list');
const holidayStatus = $('holiday-status');
const holidayReload = $('holiday-reload');
let holidays = null; // all national holidays from the API; null while loading or after an error

/** Status pill under the title: 'loading' | 'ok' | 'error'. */
function setHolidayStatus(state, text) {
  holidayStatus.dataset.state = state;
  holidayStatus.textContent = text;
}
```

> `dataset.state` mengubah atribut `data-state` di HTML. CSS memakai atribut itu untuk memilih warna label (abu-abu, hijau, atau merah).

#### 3. `js/pages/dashboard.js`: fungsi `loadHolidays()`

```js
/* ---------- Week 4 · Task 03: Handle API State (loading, berhasil, gagal) ---------- */
async function loadHolidays() {
  // LOADING: spinner + teks selama request berjalan.
  holidays = null;
  holidayReload.disabled = true;
  holidayList.setAttribute('aria-busy', 'true');
  setHolidayStatus('loading', 'Memuat…');
  holidayList.innerHTML = `
    <li class="empty-state">
      <span class="spinner" aria-hidden="true"></span>
      <p class="muted">Mengambil data libur nasional…</p>
    </li>`;

  try {
    holidays = await fetchHolidays();
    // BERHASIL: tanda hijau + jam dimuat, lalu data ditampilkan.
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setHolidayStatus('ok', `Data berhasil dimuat · ${time}`);
    renderHolidays();
  } catch (error) {
    // GAGAL: pesan yang mudah dipahami + tombol untuk mencoba lagi.
    if (IS_DEV) console.error('[holidays]', error);
    setHolidayStatus('error', 'Gagal dimuat');
    holidayList.innerHTML = `
      <li class="empty-state">
        <p class="empty-icon" aria-hidden="true">⚠️</p>
        <p class="font-semibold text-ink">Gagal mengambil data libur nasional</p>
        <p class="muted">Periksa koneksi internet Anda, lalu coba lagi.</p>
        <button type="button" class="btn btn-primary btn-small" data-retry>↻ Coba Lagi</button>
      </li>`;
  } finally {
    holidayList.removeAttribute('aria-busy');
    holidayReload.disabled = false;
  }
}
```

#### 4. `js/pages/dashboard.js`: tombol Muat ulang dan Coba Lagi

```js
holidayReload.addEventListener('click', loadHolidays);
holidayList.addEventListener('click', (event) => {
  if (event.target.closest('[data-retry]')) loadHolidays();
});
```

#### 5. `js/pages/dashboard.js`: dijalankan saat Beranda dibuka

**Sebelum:**

```js
await load();
```

**Sesudah:**

```js
loadHolidays(); // runs alongside load(): the holiday API and Supabase are fetched at the same time
await load();
```

> `loadHolidays()` sengaja **tidak** diberi `await`. Request ke API Hari Libur dan request ke Supabase berjalan bersamaan, jadi Beranda tidak menjadi lebih lambat.

#### 6. `js/tailwind-setup.js`: warna label status

```css
.holiday-status { @apply mt-1 inline-flex items-center gap-1.5 rounded-full bg-ink/[0.06] px-2.5 py-0.5 text-[13px] font-semibold text-muted; }
.holiday-status::before { content: ''; @apply h-2 w-2 shrink-0 rounded-full bg-current; }
.holiday-status[data-state='loading']::before { animation: twinkle 0.7s ease-in-out infinite alternate; }
.holiday-status[data-state='ok'] { @apply bg-green-soft text-green; }
.holiday-status[data-state='error'] { @apply bg-red-soft text-red; }
```

> Spinner memakai class `.spinner` yang sudah ada di NAKESA, sehingga tampilannya sama dengan loading di halaman lain.

### Hasil di halaman

```
      LOADING                       SUCCESS                          ERROR
┌─────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐
│ Libur nasional  [↻] │   │ Libur nasional       [↻] │   │ Libur nasional       [↻] │
│ ● Memuat…           │   │ ● Data berhasil dimuat   │   │ ● Gagal dimuat           │
│   (abu-abu)         │   │   · 18.17 (hijau)        │   │   (merah)                │
│                     │   │                          │   │            ⚠️            │
│         ◌           │   │ 24  Cuti Bersama Natal   │   │  Gagal mengambil data    │
│   (spinner)         │   │ DES Kamis · 79 hari lagi │   │  libur nasional          │
│                     │   │ 25  Hari Raya Natal      │   │  Periksa koneksi         │
│ Mengambil data      │   │ DES Jumat · 80 hari lagi │   │  internet Anda, lalu     │
│ libur nasional…     │   │ ...                      │   │  coba lagi.              │
│                     │   │                          │   │     [ ↻ Coba Lagi ]      │
└─────────────────────┘   └──────────────────────────┘   └──────────────────────────┘
```

### Checklist (sesuai slide Task 03)

- [x] **Request berhasil:** API dapat diakses dengan benar (`GET` → `200 OK`).
- [x] **JSON terbaca:** response dibaca dengan `response.json()` dan diolah menjadi array of objects.
- [x] **Data tampil:** 4 libur terdekat ditampilkan di Beranda.
- [x] **Loading ditampilkan:** spinner dan label "Memuat…" muncul selama request diproses.
- [x] **Error ditangani:** pesan error dan tombol Coba Lagi muncul kalau request gagal.

### Penjelasan

- **`try / catch / finally`.**
  - `try` berisi kode yang mungkin gagal. Baris setelah `await fetchHolidays()` hanya jalan kalau request berhasil.
  - Kalau ada yang gagal, JavaScript langsung loncat ke `catch`.
  - `finally` **selalu** dijalankan, entah berhasil atau gagal. Di sini dipakai untuk menghidupkan lagi tombol ↻.
- **Satu `catch` menangkap semua jenis kegagalan:**
  - internet mati, sehingga `fetch` gagal;
  - server error `404`/`500`, karena di Task 01 kita `throw` sendiri;
  - lebih dari 10 detik tanpa jawaban (timeout);
  - JSON rusak, sehingga `response.json()` gagal.
- **Tombol ↻ dimatikan selama loading**, supaya tidak terjadi request dobel kalau pengguna menekan berkali-kali.
- **Tombol Coba Lagi memakai *event delegation*.** Tombol itu baru dibuat oleh JavaScript saat terjadi error, jadi event `click` dipasang di wadahnya (`holidayList`) yang sudah ada sejak awal. `event.target.closest('[data-retry]')` mengecek apakah yang diklik adalah tombol Coba Lagi.
- **Pesan error memakai bahasa sehari-hari**, bukan pesan teknis seperti "TypeError: Failed to fetch". Detail teknisnya hanya ditulis di Console saat dijalankan di komputer sendiri (`IS_DEV`, yaitu `localhost`/`127.0.0.1`).
- **Kalau API gagal, bagian Beranda yang lain tetap berjalan normal**: ringkasan, pasien hari ini, grafik pemasukan, dan link booking tidak terpengaruh.
- **`role="status"` dan `aria-busy`** memberi tahu pembaca layar bahwa data sedang dimuat atau statusnya berubah.

---

## Kenapa Disebut Single Page Application?

Pada web biasa, setiap kali butuh data baru, seluruh halaman di-*refresh* (layar berkedip putih, semuanya dimuat ulang). Pada pola **Single Page Application**:

1. Halaman dibuka **sekali**.
2. Data diambil **di belakang layar** dengan `fetch` (asynchronous).
3. Hanya **bagian yang perlu** diperbarui lewat DOM.

Di NAKESA:

- Saat Beranda dibuka, data libur dari API dan data praktik dari Supabase diambil **bersamaan**, tanpa saling menunggu.
- Saat tombol **↻** atau **Coba Lagi** ditekan, hanya kartu "Libur nasional terdekat" yang berubah (loading → data). Bagian lain halaman tetap di tempatnya.
- Buktinya: jam pada label hijau ("Data berhasil dimuat · 18.17") berubah setiap kali ↻ ditekan, padahal halaman tidak di-reload.

---

## Demo: Show Your Data Flow

```
USER ACTION          API REQUEST            RESPONSE        JSON DATA                NAKESA UI
Membuka Beranda  →   GET calendar.json  →   200 OK      →   { "2026-12-24": {...},   →   Kartu "Libur nasional
atau menekan ↻                                               "2026-12-25": {...} }        terdekat"
```

| Pertanyaan (slide Demo) | Jawaban |
|---|---|
| **1. API apa yang digunakan?** | API Hari Libur V2 (guangrei), endpoint `https://cdn.jsdelivr.net/gh/guangrei/APIHariLibur_V2@main/calendar.json`, method `GET` |
| **2. Data apa yang diambil?** | Tanggal dan nama hari libur nasional serta cuti bersama Indonesia (tahun ini dan tahun depan) |
| **3. Bagaimana data diproses?** | `response.json()` → `Object.entries` → `filter` (hanya hari libur) → `map` (rapikan nama, tandai cuti bersama/belum pasti) → `sort` (urut tanggal) → ambil 4 terdekat → `forEach` + template literal → `innerHTML` (DOM) |
| **4. Apa yang terjadi ketika request gagal?** | Error ditangkap `catch`, label berubah merah "Gagal dimuat", muncul ⚠️ "Gagal mengambil data libur nasional" dan tombol **Coba Lagi**. Bagian Beranda lainnya tetap berjalan |

### Cara mendemokan

1. **Melihat request API:** buka Beranda → tekan **F12** → tab **Network** → klik filter **Fetch/XHR** → klik baris `calendar.json`.
   - Tab **Headers**: `Request Method: GET`, `Status Code: 200 OK`, `Content-Type: application/json`.
   - Tab **Preview** / **Response**: isi JSON dari API.
2. **Bukti DOM dinamis:**
   - Tekan **Cmd+Option+U** (*View Page Source*) dan cari `holiday-list`. Isinya `<ul ... id="holiday-list"></ul>`, masih **kosong**.
   - Buka **DevTools → Elements** dan cari `holiday-list`. Sekarang di dalamnya ada 4 `<li class="holiday-item">` yang dibuat JavaScript.
3. **Loading:** di tab Network, ganti *No throttling* menjadi **Slow 4G**, lalu tekan **↻**. Spinner terlihat lebih lama.
4. **Error:** ganti menjadi **Offline**, lalu tekan **↻**. Muncul ⚠️ dan tombol **Coba Lagi**.
5. **Coba Lagi → Success:** kembalikan ke **No throttling**, lalu tekan **Coba Lagi**. Spinner muncul sebentar, lalu label hijau dan daftar libur tampil.
6. **Fetch langsung di Console** (tab **Console**):

   ```js
   const response = await fetch('https://cdn.jsdelivr.net/gh/guangrei/APIHariLibur_V2@main/calendar.json');
   console.log(response.status, response.ok);   // 200 true
   const data = await response.json();
   console.log(data['2026-12-25']);             // { description: [...], holiday: true, summary: ['Hari Raya Natal'] }
   ```

---

## Review: Is the Data Flow Working?

- [x] **API dapat diakses:** request berhasil dan menerima response `200 OK`.
- [x] **Data sesuai kebutuhan:** hari libur nasional dan cuti bersama relevan untuk jadwal praktik.
- [x] **Data tampil dengan benar:** tanggal, nama, hitung mundur, dan label tampil di Beranda.
- [x] **Loading tersedia:** spinner muncul saat request diproses.
- [x] **Error ditangani:** pesan error dan tombol Coba Lagi ditampilkan dengan jelas.

### Pengujian yang dilakukan

| Pengujian | Cara | Hasil |
|---|---|---|
| Sintaks JavaScript | `node --check` untuk semua file di `js/` (sama dengan CI) | Lulus |
| Referensi file | `node .github/scripts/check-refs.mjs` (sama dengan CI) | Lulus |
| `fetchHolidays()` ke API asli | Dijalankan di Node.js | 49 hari libur (2026–2027) terbaca, terurut, nama sudah berbahasa Indonesia |
| Server error | Alamat diubah ke file yang tidak ada | Error "API Hari Libur menjawab HTTP 404" tertangkap |
| Internet mati | `fetch` dibuat gagal | Error tertangkap |
| Tampilan 3 state | Chrome, lebar HP 360px dan desktop, mode terang dan gelap | Spinner, data, dan pesan error tampil benar |
| Tombol Coba Lagi | Request pertama dibuat gagal, lalu Coba Lagi ditekan | Data tampil, label hijau |
| Timeout | API dibuat tidak pernah menjawab | Setelah 10 detik muncul pesan error, tidak loading selamanya |
| Akun asli | Beranda dibuka dengan akun sendiri di `127.0.0.1:5501`, dicek di tab Network | `calendar.json` → `GET 200 OK`, `application/json` |

---

## Sprint 03: Completion Checklist

- [x] API request
- [x] JSON
- [x] JavaScript processing
- [x] Dynamic data
- [x] Loading
- [x] Error handling
- [x] Test
- [x] Commit (`2394365` — "API")
- [x] Push (ke `origin/main`)

**Output:** Beranda NAKESA yang terhubung dengan API dan menampilkan data hari libur nasional secara dinamis.

---

## Ringkasan

| Task | Materi | Penerapan di NAKESA (halaman Beranda) |
|---|---|---|
| 01 — Connect to API | `fetch`, `async/await`, `response.ok`, `response.json()` | `fetchHolidays()` di `js/holidays.js`: mengambil JSON dari API Hari Libur, lalu mengolahnya menjadi array of objects |
| 02 — Display API Data | Array of objects, `forEach`, template literal, `innerHTML` | `renderHolidays()`: 4 libur terdekat dengan kotak tanggal merah, hitung mundur, label cuti bersama/belum pasti, dan catatan jadwal praktik dari Supabase |
| 03 — Handle API State | `try/catch/finally`, loading/success/error | `loadHolidays()`: spinner, label hijau "Data berhasil dimuat", pesan error + tombol Coba Lagi, timeout 10 detik |

**File yang diubah:**

- `js/holidays.js`: **file baru**, berisi endpoint API dan fungsi `fetchHolidays()` (Task 01)
- `html/dashboard.html`: kartu "Libur nasional terdekat" dengan label status `#holiday-status`, tombol `#holiday-reload`, dan wadah kosong `#holiday-list` (Task 02 & 03)
- `js/pages/dashboard.js`: import `fetchHolidays`, fungsi `renderHolidays()` (Task 02), fungsi `setHolidayStatus()` dan `loadHolidays()`, event tombol ↻ dan Coba Lagi (Task 03), serta pemanggilan `loadHolidays()` saat halaman dibuka
- `js/tailwind-setup.js`: gaya kotak tanggal merah, catatan jadwal praktik, dan label status hijau/merah
