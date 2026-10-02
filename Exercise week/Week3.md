# Week 3 — Web Programming: JavaScript & DOM

**Nama:** Sigit Novriyanto
**Proyek:** NAKESA — aplikasi manajemen praktik mandiri tenaga kesehatan (bidan, dokter, perawat, dll.)
**Halaman yang dikerjakan:**

- Keuangan (`html/finance.html`, `js/pages/finance.js`, `css/app.css`): Task 01–04
- Beranda / landing page (`html/index.html`, `js/pages/index.js`, `css/style.css`): Task 05–06

**Tugas dari kelas:**

1. Merubah CSS manual ke Tailwind CSS → **Task 04** (halaman Keuangan) dan **Task 05** (halaman Beranda)
2. Implementasi JavaScript (select & change, handle user event) → **Task 01**, **Task 02**, dan **Task 03** (halaman Keuangan), serta **Task 06** (halaman Beranda)

Pada latihan di slide, contohnya memakai halaman *PresidenKu*. Di sini ketiga task saya terapkan pada proyek saya sendiri, **NAKESA**, di halaman **Keuangan**. Halaman ini dipakai pemilik praktik untuk mencatat uang masuk dan uang keluar setiap bulan.

Alasan memilih halaman Keuangan: halaman ini paling sering dipakai untuk mencari dan membaca angka, jadi interaksi yang ditambahkan benar-benar terasa manfaatnya bagi pengguna.

---

## Task 01 — Select & Change

> Gunakan JavaScript untuk mengambil dan mengubah elemen pada halaman.

### Konsep

1. **Pilih elemen:** `document.querySelector(selector)` mengambil elemen **pertama** di halaman yang cocok dengan selector.
2. **Ubah elemen:** `elemen.textContent = "..."` mengganti teks di dalam elemen itu.
3. **Elemen berubah:** browser langsung menampilkan teks yang baru.

Ada tiga jenis selector:

| Selector | Penulisan | Artinya |
|---|---|---|
| Tag | `"h1"` | Memilih berdasarkan nama tag |
| ID | `"#subjudul"` | Memilih berdasarkan `id` (tanda `#`) |
| Class | `".btn-success"` | Memilih berdasarkan `class` (tanda `.`) |

### Penerapan di NAKESA

#### 1. `html/finance.html`: paragraf subjudul diberi `id`

**Sebelum:**

```html
<h1>Catatan Keuangan</h1>
<p>Uang masuk dan keluar praktik.</p>
```

**Sesudah:**

```html
<h1>Catatan Keuangan</h1>
<p id="subjudul">Uang masuk dan keluar praktik.</p>
```

> Ditambahkan `id="subjudul"` supaya paragraf ini bisa diambil dengan selector ID.

#### 2. `js/pages/finance.js`: mengambil dan mengubah elemen

**Sebelum:**

```js
const { profile } = await startPage('finance');
```

**Sesudah:**

```js
const { profile, practice } = await startPage('finance');

/* ---------- Task 01: Select & Change ---------- */
// Selector tag: ambil <h1> pertama di halaman, lalu ganti teksnya.
const title = document.querySelector('h1');
title.textContent = `Keuangan ${practice.name}`;

// Selector ID: ambil elemen dengan id="subjudul".
const subtitle = document.querySelector('#subjudul');
subtitle.textContent = 'Catat setiap uang masuk dan keluar supaya untung praktik terlihat jelas.';

// Selector class: ambil elemen PERTAMA yang punya class="btn-success".
const incomeButton = document.querySelector('.btn-success');
incomeButton.textContent = '＋ Catat Uang Masuk';
```

> `practice` ditambahkan supaya data praktik (termasuk namanya) bisa dipakai untuk judul.

### Hasil di halaman

| Elemen | Sebelum kode dijalankan | Setelah kode dijalankan |
|---|---|---|
| `h1` | Catatan Keuangan | Keuangan *(nama praktik pengguna, misal "Keuangan Praktik Bidan Siti")* |
| `#subjudul` | Uang masuk dan keluar praktik. | Catat setiap uang masuk dan keluar supaya untung praktik terlihat jelas. |
| `.btn-success` | ＋ Uang Masuk | ＋ Catat Uang Masuk |

### Penjelasan

- Berbeda dengan contoh slide yang menulis teks tetap (`"PresidenKu"`), judul di sini diambil dari **data praktik di database (Supabase)** lewat `practice.name`. Jadi setiap pengguna melihat nama praktiknya sendiri.
- Kode ini ditaruh **setelah** `await startPage('finance')`, karena data praktik baru tersedia setelah fungsi itu selesai memuat.
- `querySelector('.btn-success')` hanya mengambil **satu** elemen, yaitu yang pertama. Untuk mengambil semua elemen yang cocok, gunakan `querySelectorAll`.
- `document.getElementById('x')` yang sudah banyak dipakai di NAKESA hasilnya sama dengan `document.querySelector('#x')`.

---

## Task 02 — Handle User Event

> Tambahkan interaksi yang benar-benar dibutuhkan.

### Konsep

Alur sebuah event:

```
USER → CLICK / INPUT / SUBMIT → EVENT → JAVASCRIPT → UI RESPONSE
```

Kode untuk menangkap event:

```js
elemen.addEventListener('namaEvent', fungsiYangDijalankan);
```

### Interaksi yang dipilih: pencarian catatan keuangan

**Kebutuhannya:** halaman Pasien dan Obat di NAKESA sudah punya kotak pencarian, tapi halaman Keuangan belum. Padahal dalam sebulan catatan bisa puluhan, dan pengguna sering perlu mencari, misalnya "uang dari Bu Ani berapa?" atau "bulan ini beli obat berapa kali?".

### Penerapan di NAKESA

#### 1. `html/finance.html`: menambah kotak pencarian

**Sebelum:**

```html
<div class="two-cols" style="margin-top:14px">
  <button type="button" class="btn btn-success btn-big" data-new="masuk">＋ Uang Masuk</button>
  <button type="button" class="btn btn-danger btn-big" data-new="keluar">− Uang Keluar</button>
</div>

<div id="list" style="margin-top:8px"></div>
```

**Sesudah:**

```html
<div class="two-cols" style="margin-top:14px">
  <button type="button" class="btn btn-success btn-big" data-new="masuk">＋ Uang Masuk</button>
  <button type="button" class="btn btn-danger btn-big" data-new="keluar">− Uang Keluar</button>
</div>

<div class="search" style="margin-top:14px">
  <input class="input" type="search" id="search" placeholder="Cari catatan, misal: Bu Ani, Beli Obat…" aria-label="Cari catatan keuangan">
</div>

<div id="list" style="margin-top:8px"></div>
```

#### 2. `js/pages/finance.js`: mengambil elemen pencarian

**Sebelum:**

```js
const list = document.getElementById('list');
const dialog = document.getElementById('tx-dialog');
const form = document.getElementById('tx-form');
const errorBox = document.getElementById('form-error');
```

**Sesudah:**

```js
const list = document.getElementById('list');
const dialog = document.getElementById('tx-dialog');
const form = document.getElementById('tx-form');
const errorBox = document.getElementById('form-error');
const search = document.querySelector('#search');
```

#### 3. `js/pages/finance.js`: memasang event listener

**Sebelum:**

```js
document.getElementById('prev-month').addEventListener('click', () => { month.setMonth(month.getMonth() - 1); load(); });
document.getElementById('next-month').addEventListener('click', () => { month.setMonth(month.getMonth() + 1); load(); });
```

**Sesudah:**

```js
document.getElementById('prev-month').addEventListener('click', () => { month.setMonth(month.getMonth() - 1); load(); });
document.getElementById('next-month').addEventListener('click', () => { month.setMonth(month.getMonth() + 1); load(); });

/* ---------- Task 02: Handle User Event ---------- */
// Event "input" fires on every keystroke, so the list filters while the user types.
search.addEventListener('input', render);
```

#### 4. `js/pages/finance.js`: menyaring daftar di fungsi `render()`

**Sebelum:**

```js
if (!transactions.length) {
  list.innerHTML = `<div class="card empty-state" style="margin-top:14px"><p class="empty-icon" aria-hidden="true">💰</p>
    <p class="muted">Belum ada catatan di bulan ini.</p></div>`;
  return;
}
let lastDate = null;
list.innerHTML = transactions.map((t) => {
```

**Sesudah:**

```js
// Totals always cover the whole month; the search only narrows the list below.
const q = search.value.trim().toLowerCase();
const shown = transactions.filter((t) =>
  !q || t.category.toLowerCase().includes(q) || (t.note ?? '').toLowerCase().includes(q));

if (!shown.length) {
  list.innerHTML = `<div class="card empty-state" style="margin-top:14px"><p class="empty-icon" aria-hidden="true">💰</p>
    <p class="muted">${transactions.length ? `Tidak ada catatan yang cocok dengan “${escapeHtml(search.value.trim())}”.` : 'Belum ada catatan di bulan ini.'}</p></div>`;
  return;
}
let lastDate = null;
list.innerHTML = shown.map((t) => {
```

> Sebelumnya semua `transactions` langsung ditampilkan. Sekarang yang ditampilkan hanya `shown`, yaitu transaksi yang cocok dengan kata pencarian. Kalau tidak ada yang cocok, muncul pesan *"Tidak ada catatan yang cocok dengan “…”"*.

### Alur interaksi

| Tahap | Yang terjadi di NAKESA |
|---|---|
| **User** | Pengguna mengetik "ani" di kotak pencarian |
| **Input** | Aksinya berupa mengetik di elemen `#search` |
| **Event** | Event `input` menyala setiap satu huruf diketik atau dihapus |
| **JavaScript** | Fungsi `render()` dijalankan dan menyaring daftar transaksi |
| **UI Response** | Hanya catatan yang kategori atau catatannya mengandung "ani" yang ditampilkan |

### Penjelasan

- `render` ditulis **tanpa tanda kurung** di `addEventListener`. Yang dikirim adalah fungsinya, supaya browser bisa memanggilnya **nanti** saat event terjadi.
- Dipakai event `input`, bukan `change`. `input` langsung bereaksi setiap ketikan, sedangkan `change` baru bereaksi setelah kotaknya ditinggalkan.
- `.trim()` membuang spasi di awal dan akhir. `.toLowerCase()` membuat pencarian tidak membedakan huruf besar dan kecil.
- **Total di atas (uang masuk, keluar, sisa) tidak ikut tersaring.** Yang disaring hanya daftarnya, supaya ringkasan bulanan tetap benar.

---

## Task 03 — Build One Complete Interaction

> Buat satu interaksi lengkap yang bermanfaat.

### Interaksi yang dipilih: rincian keuangan per kategori

**Kebutuhannya:** sebelumnya pengguna hanya melihat total uang masuk dan keluar. Pemilik praktik tidak bisa langsung tahu **uangnya paling banyak dari mana** (misal dari Periksa Kehamilan atau dari Penjualan Obat) dan **paling banyak habis untuk apa** (misal Beli Obat atau Sewa Tempat). Informasi ini membantu mengambil keputusan, misalnya layanan mana yang paling menghasilkan.

### Alur interaksi

| Tahap (sesuai slide) | Yang terjadi di NAKESA |
|---|---|
| **Klik tombol** | Pengguna menekan tombol **"📊 Lihat Rincian per Kategori"** |
| **Event** | Event `click` pada tombol `#toggle-breakdown` dijalankan |
| **JavaScript** | Kode mengambil data transaksi bulan itu, menjumlahkan per kategori, lalu menghitung persentasenya |
| **Detail ditampilkan** | Daftar kategori berisi jumlah rupiah, persentase, dan bar warna (hijau = masuk, merah = keluar) |
| **Tampil di halaman** | Panel `#breakdown` muncul di bawah ringkasan. Klik lagi ("Tutup Rincian") untuk menyembunyikan |

### Penerapan di NAKESA

#### 1. `html/finance.html`: menambah tombol dan panel rincian

**Sebelum:**

```html
<div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
  ...
  <div class="stat"><span class="stat-label">Sisa (untung)</span><span class="stat-value" id="sum-balance">–</span></div>
</div>

<div class="two-cols" style="margin-top:14px">
```

**Sesudah:**

```html
<div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
  ...
  <div class="stat"><span class="stat-label">Sisa (untung)</span><span class="stat-value" id="sum-balance">–</span></div>
</div>

<button type="button" class="btn btn-ghost btn-block" id="toggle-breakdown"
  aria-expanded="false" aria-controls="breakdown" style="margin-top:12px">📊 Lihat Rincian per Kategori</button>
<div class="card breakdown" id="breakdown" hidden></div>

<div class="two-cols" style="margin-top:14px">
```

> Panel `#breakdown` awalnya disembunyikan dengan atribut `hidden`.

#### 2. `js/pages/finance.js`: event klik dan pengolahan data

**Sebelum:** belum ada. Halaman hanya menampilkan total uang masuk, keluar, dan sisa.

**Sesudah** (ditambahkan setelah kode Task 02):

```js
/* ---------- Task 03: Build One Complete Interaction ---------- */
// Click "Lihat Rincian" → sum this month's transactions per category → show the detail.
const breakdown = document.querySelector('#breakdown');
const breakdownButton = document.querySelector('#toggle-breakdown');

// 1. Event: tangkap klik tombol
breakdownButton.addEventListener('click', () => {
  const opening = breakdown.hidden;
  breakdown.hidden = !opening;                                   // tampilkan / sembunyikan panel
  breakdownButton.setAttribute('aria-expanded', String(opening));
  breakdownButton.textContent = opening ? '📊 Tutup Rincian' : '📊 Lihat Rincian per Kategori';
  renderBreakdown();
});

// 2. JavaScript: olah data lalu ubah DOM
function renderBreakdown() {
  if (breakdown.hidden) return;
  breakdown.innerHTML = breakdownSection('masuk', 'Uang masuk dari') + breakdownSection('keluar', 'Uang keluar untuk');
}

function breakdownSection(kind, heading) {
  // Jumlahkan uang per kategori
  const totals = {};
  for (const t of transactions) {
    if (t.kind === kind) totals[t.category] = (totals[t.category] ?? 0) + t.amount;
  }
  // Urutkan dari yang terbesar
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return `<h2>${heading}</h2><p class="muted">Belum ada catatan.</p>`;

  // Hitung persentase dan buat HTML-nya
  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);
  return `<h2>${heading}</h2>` + rows.map(([category, amount]) => {
    const percent = Math.round((amount / total) * 100);
    return `
      <div class="breakdown-row">
        <div class="breakdown-row-head">
          <span>${escapeHtml(category)}</span>
          <span class="${kind === 'masuk' ? 'money-in' : 'money-out'}">${rupiah(amount)} · ${percent}%</span>
        </div>
        <div class="breakdown-bar"><span class="${kind === 'masuk' ? 'bar-in' : 'bar-out'}" style="width:${percent}%"></span></div>
      </div>`;
  }).join('');
}
```

#### 3. `js/pages/finance.js`: rincian ikut diperbarui di `render()`

**Sebelum:**

```js
balance.textContent = `${income - expense < 0 ? '−' : ''}${rupiah(Math.abs(income - expense))}`;
balance.className = `stat-value ${income - expense < 0 ? 'money-out' : ''}`;
```

**Sesudah:**

```js
balance.textContent = `${income - expense < 0 ? '−' : ''}${rupiah(Math.abs(income - expense))}`;
balance.className = `stat-value ${income - expense < 0 ? 'money-out' : ''}`;
renderBreakdown(); // keep an open breakdown in sync when the month or data changes
```

> Dengan baris ini, rincian tetap benar saat pengguna mengganti bulan atau menambah, mengubah, atau menghapus catatan.

#### 4. `css/app.css`: gaya panel rincian

**Sebelum:** belum ada.

**Sesudah** (ditambahkan di akhir file):

```css
/* ---------- Finance breakdown per category ---------- */
.breakdown { margin-top: 10px; display: grid; gap: 6px; }
.breakdown h2 { font-size: 1rem; margin-top: 8px; }
.breakdown-row { display: grid; gap: 4px; padding: 6px 0; }
.breakdown-row-head { display: flex; justify-content: space-between; gap: 10px; font-weight: 600; }
.breakdown-bar { height: 8px; border-radius: 99px; background: var(--line); overflow: hidden; }
.breakdown-bar span { display: block; height: 100%; border-radius: inherit; }
.breakdown-bar .bar-in { background: var(--green); }
.breakdown-bar .bar-out { background: var(--red); }
```

> **Catatan:** CSS di atas kemudian dihapus dan diganti dengan class Tailwind. Lihat **Task 04**.

### Hasil di halaman

**Sebelum tombol diklik:** hanya terlihat tombol "📊 Lihat Rincian per Kategori". Panel rincian tersembunyi.

**Setelah tombol diklik:** tombol berubah menjadi "📊 Tutup Rincian" dan panel rincian muncul:

```
Uang masuk dari
Periksa Kehamilan          Rp 1.500.000 · 60%
██████████████████░░░░░░░░░░░░
KB                           Rp 750.000 · 30%
█████████░░░░░░░░░░░░░░░░░░░░░
Penjualan Obat               Rp 250.000 · 10%
███░░░░░░░░░░░░░░░░░░░░░░░░░░░

Uang keluar untuk
Beli Obat                    Rp 600.000 · 75%
██████████████████████░░░░░░░░
Listrik & Air                Rp 200.000 · 25%
███████░░░░░░░░░░░░░░░░░░░░░░░
```

### Checklist

- [x] **Event berjalan:** klik tombol terdeteksi oleh `addEventListener('click', …)`.
- [x] **JavaScript berjalan:** data dijumlahkan per kategori tanpa error (sintaks sudah dicek dengan `node --check`).
- [x] **DOM berubah:** panel `#breakdown` muncul atau hilang, isinya dibuat lewat `innerHTML`, dan teks tombol berubah.
- [x] **Interaksi sesuai kebutuhan:** pemilik praktik bisa melihat sumber pemasukan dan pengeluaran terbesarnya.
- [x] **Tidak merusak halaman:** panel tersembunyi secara default; total, pencarian, tambah/ubah/hapus catatan, dan ganti bulan tetap berjalan normal.

### Penjelasan tambahan

- **`hidden`** adalah atribut HTML untuk menyembunyikan elemen. Dengan `breakdown.hidden = true/false`, JavaScript bisa menampilkan dan menyembunyikan panel.
- **`aria-expanded`** memberi tahu pembaca layar (untuk pengguna tunanetra) apakah panel sedang terbuka atau tertutup.
- **`escapeHtml(category)`** dipakai karena nama kategori dimasukkan ke `innerHTML`. Tujuannya mencegah teks dari pengguna dijalankan sebagai kode HTML atau JavaScript (serangan XSS).
- Datanya diambil dari variabel `transactions`, yang sudah dimuat dari **database Supabase** saat halaman dibuka. Jadi tidak perlu meminta data lagi ke server setiap kali tombol diklik.

---

## Task 04 — Merubah CSS Manual ke Tailwind CSS

> Ganti CSS yang ditulis manual (file `.css` dan atribut `style="..."`) dengan *utility class* Tailwind CSS.

### Konsep

- **CSS manual:** kita membuat nama class sendiri (misal `.month-picker`), lalu menulis aturannya di file `.css`.
- **Tailwind CSS:** kita tidak menulis file CSS. Gayanya langsung ditulis sebagai class kecil di HTML, satu class untuk satu aturan.

| CSS manual | Class Tailwind | Artinya |
|---|---|---|
| `display: flex` | `flex` | Susun elemen berjajar |
| `align-items: center` | `items-center` | Rata tengah secara vertikal |
| `justify-content: space-between` | `justify-between` | Dorong elemen ke kiri dan kanan |
| `gap: 10px` | `gap-2.5` | Jarak antar-elemen 10px (1 = 4px) |
| `margin-top: 14px` | `mt-3.5` | Jarak atas 14px |
| `margin-bottom: 14px` | `mb-3.5` | Jarak bawah 14px |
| `padding: 6px 0` | `py-1.5` | Padding atas-bawah 6px |
| `height: 8px` | `h-2` | Tinggi 8px |
| `border-radius: 99px` | `rounded-full` | Sudut membulat penuh |
| `overflow: hidden` | `overflow-hidden` | Sembunyikan isi yang keluar |
| `font-weight: 600` / `800` | `font-semibold` / `font-extrabold` | Ketebalan huruf |
| `white-space: nowrap` | `whitespace-nowrap` | Teks tidak turun baris |
| `grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))` | `grid-cols-[repeat(auto-fit,minmax(150px,1fr))]` | Nilai bebas ditulis di dalam `[...]` |

### Batasan yang dipilih

Halaman lain di NAKESA (Pasien, Obat, Dashboard, dll.) juga memakai `css/app.css`. Supaya halaman lain **tidak rusak**, yang diubah ke Tailwind hanya CSS **khusus halaman Keuangan**:

- semua atribut `style="..."` di `html/finance.html` dan di HTML yang dibuat `js/pages/finance.js`
- class `.month-picker`, `.breakdown-*`, `.bar-in`, `.bar-out`, `.money-in`, `.money-out` (hanya dipakai di halaman Keuangan)

Class bersama seperti `.btn`, `.card`, `.stat`, `.search`, `.two-cols` tetap dari `app.css`.

### Penerapan di NAKESA

#### 1. `html/finance.html`: memasang Tailwind CSS

**Sebelum:**

```html
<link rel="stylesheet" href="../css/app.css">
<script type="module" src="../js/pages/finance.js"></script>
```

**Sesudah:**

```html
<link rel="stylesheet" href="../css/app.css">
<!-- Tailwind CSS (Play CDN). Preflight is off so it doesn't reset the shared app.css styles. -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    corePlugins: { preflight: false },
    theme: {
      extend: {
        colors: { navy: 'var(--navy)', line: 'var(--line)', 'money-in': 'var(--green)', 'money-out': 'var(--red)' },
      },
    },
  };
</script>
<script type="module" src="../js/pages/finance.js"></script>
```

> - Tailwind dipasang lewat **CDN**, jadi tidak perlu `npm install` atau proses build.
> - `preflight: false` mematikan *reset CSS* bawaan Tailwind. Kalau tidak dimatikan, gaya tombol, judul, dan kartu dari `app.css` ikut berubah.
> - `colors` menambahkan warna NAKESA ke Tailwind, sehingga bisa dipakai sebagai `text-navy`, `bg-line`, `text-money-in`, `bg-money-out`, dan seterusnya. Warnanya tetap diambil dari variabel di `app.css`, jadi tidak ada warna yang berubah.

#### 2. `html/finance.html`: pemilih bulan

**Sebelum:**

```html
<div class="month-picker">
  <button type="button" class="btn btn-ghost btn-small" id="prev-month" aria-label="Bulan sebelumnya">◀</button>
  <strong id="month-label"></strong>
  <button type="button" class="btn btn-ghost btn-small" id="next-month" aria-label="Bulan berikutnya">▶</button>
</div>
```

**Sesudah:**

```html
<div class="flex items-center justify-between gap-2.5 mb-3.5">
  <button type="button" class="btn btn-ghost btn-small" id="prev-month" aria-label="Bulan sebelumnya">◀</button>
  <strong class="text-lg text-navy" id="month-label"></strong>
  <button type="button" class="btn btn-ghost btn-small" id="next-month" aria-label="Bulan berikutnya">▶</button>
</div>
```

#### 3. `html/finance.html`: ringkasan, tombol rincian, tombol tambah, pencarian, daftar

**Sebelum:**

```html
<div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
  <div class="stat"><span class="stat-label">Uang masuk</span><span class="stat-value money-in" id="sum-in">–</span></div>
  <div class="stat"><span class="stat-label">Uang keluar</span><span class="stat-value money-out" id="sum-out">–</span></div>
  ...
</div>

<button type="button" class="btn btn-ghost btn-block" id="toggle-breakdown"
  aria-expanded="false" aria-controls="breakdown" style="margin-top:12px">📊 Lihat Rincian per Kategori</button>
<div class="card breakdown" id="breakdown" hidden></div>

<div class="two-cols" style="margin-top:14px">
...
<div class="search" style="margin-top:14px">
...
<div id="list" style="margin-top:8px"></div>
```

**Sesudah:**

```html
<div class="grid gap-3 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
  <div class="stat"><span class="stat-label">Uang masuk</span><span class="stat-value font-extrabold whitespace-nowrap !text-money-in" id="sum-in">–</span></div>
  <div class="stat"><span class="stat-label">Uang keluar</span><span class="stat-value font-extrabold whitespace-nowrap !text-money-out" id="sum-out">–</span></div>
  ...
</div>

<button type="button" class="btn btn-ghost btn-block mt-3" id="toggle-breakdown"
  aria-expanded="false" aria-controls="breakdown">📊 Lihat Rincian per Kategori</button>
<div class="card mt-2.5 grid gap-1.5" id="breakdown" hidden></div>

<div class="two-cols mt-3.5">
...
<div class="search mt-3.5">
...
<div class="mt-2" id="list"></div>
```

> - Semua `style="..."` di file HTML sudah hilang.
> - Tanda `!` pada `!text-money-in` artinya `!important`. Ini perlu karena aturan `.stat .stat-value { color: navy }` di `app.css` lebih kuat daripada satu class biasa.

#### 4. `js/pages/finance.js`: class untuk jumlah uang

**Sebelum:** belum ada. Warna uang diatur class `.money-in` / `.money-out` di `app.css`.

**Sesudah** (ditambahkan setelah `let editing = null;`):

```js
// Tailwind classes for money amounts (green = masuk, red = keluar).
const moneyClass = (kind) => `font-extrabold whitespace-nowrap ${kind === 'masuk' ? 'text-money-in' : 'text-money-out'}`;
```

> Class yang sama dipakai di dua tempat (daftar catatan dan rincian), jadi dibuat satu fungsi supaya tidak ditulis ulang.

#### 5. `js/pages/finance.js`: HTML rincian per kategori (Task 03)

**Sebelum:**

```js
if (!rows.length) return `<h2>${heading}</h2><p class="muted">Belum ada catatan.</p>`;

const total = rows.reduce((sum, [, amount]) => sum + amount, 0);
return `<h2>${heading}</h2>` + rows.map(([category, amount]) => {
  const percent = Math.round((amount / total) * 100);
  return `
    <div class="breakdown-row">
      <div class="breakdown-row-head">
        <span>${escapeHtml(category)}</span>
        <span class="${kind === 'masuk' ? 'money-in' : 'money-out'}">${rupiah(amount)} · ${percent}%</span>
      </div>
      <div class="breakdown-bar"><span class="${kind === 'masuk' ? 'bar-in' : 'bar-out'}" style="width:${percent}%"></span></div>
    </div>`;
```

**Sesudah:**

```js
const title = `<h2 class="text-base mt-2">${heading}</h2>`;
if (!rows.length) return `${title}<p class="muted">Belum ada catatan.</p>`;

const total = rows.reduce((sum, [, amount]) => sum + amount, 0);
return title + rows.map(([category, amount]) => {
  const percent = Math.round((amount / total) * 100);
  // The bar width is computed at runtime, so it stays an inline style (Tailwind can't know it in advance).
  return `
    <div class="grid gap-1 py-1.5">
      <div class="flex justify-between gap-2.5 font-semibold">
        <span>${escapeHtml(category)}</span>
        <span class="${moneyClass(kind)}">${rupiah(amount)} · ${percent}%</span>
      </div>
      <div class="h-2 rounded-full bg-line overflow-hidden"><span class="block h-full rounded-full ${kind === 'masuk' ? 'bg-money-in' : 'bg-money-out'}" style="width:${percent}%"></span></div>
    </div>`;
```

> `style="width:${percent}%"` **sengaja tidak diubah**. Lebar bar baru diketahui saat JavaScript berjalan (misal 37%), jadi tidak bisa ditulis sebagai class Tailwind yang sudah pasti sejak awal.

#### 6. `js/pages/finance.js`: warna sisa uang, kotak kosong, dan daftar catatan

**Sebelum:**

```js
balance.className = `stat-value ${income - expense < 0 ? 'money-out' : ''}`;
...
list.innerHTML = `<div class="card empty-state" style="margin-top:14px">...`;
...
<span class="${t.kind === 'masuk' ? 'money-in' : 'money-out'}">${t.kind === 'masuk' ? '+' : '−'} ${rupiah(t.amount)}</span>
```

**Sesudah:**

```js
balance.className = `stat-value whitespace-nowrap ${income - expense < 0 ? '!text-money-out' : ''}`;
...
list.innerHTML = `<div class="card empty-state mt-3.5">...`;
...
<span class="${moneyClass(t.kind)}">${t.kind === 'masuk' ? '+' : '−'} ${rupiah(t.amount)}</span>
```

> Ini sekaligus contoh **JavaScript mengubah tampilan lewat class Tailwind**: saat sisa uang minus, JavaScript menambahkan class `!text-money-out` sehingga angkanya menjadi merah.

#### 7. `css/app.css`: CSS manual dihapus

**Sebelum** (di akhir file):

```css
.money-in { color: var(--green); font-weight: 800; white-space: nowrap; }
.money-out { color: var(--red); font-weight: 800; white-space: nowrap; }
.month-picker { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.month-picker strong { font-size: 1.1rem; color: var(--navy); }

/* ---------- Finance breakdown per category ---------- */
.breakdown { margin-top: 10px; display: grid; gap: 6px; }
.breakdown h2 { font-size: 1rem; margin-top: 8px; }
.breakdown-row { display: grid; gap: 4px; padding: 6px 0; }
.breakdown-row-head { display: flex; justify-content: space-between; gap: 10px; font-weight: 600; }
.breakdown-bar { height: 8px; border-radius: 99px; background: var(--line); overflow: hidden; }
.breakdown-bar span { display: block; height: 100%; border-radius: inherit; }
.breakdown-bar .bar-in { background: var(--green); }
.breakdown-bar .bar-out { background: var(--red); }
```

**Sesudah:** 14 baris di atas **dihapus**. Semua gayanya sekarang ditulis sebagai class Tailwind di `finance.html` dan `finance.js`.

### Hasil di halaman

Tampilan halaman Keuangan **tetap sama** seperti sebelumnya (warna, jarak, ukuran huruf). Yang berubah hanya cara penulisan gayanya:

| | Sebelum | Sesudah |
|---|---|---|
| Atribut `style="..."` di `finance.html` | 5 | 0 |
| Atribut `style="..."` di `finance.js` | 2 | 1 (lebar bar, nilainya dinamis) |
| Baris CSS khusus Keuangan di `app.css` | 14 | 0 |

### Penjelasan

- Tailwind **Play CDN** membaca class di halaman saat halaman berjalan, termasuk class yang baru ditambahkan JavaScript lewat `innerHTML` atau `className`. Karena itu class di `finance.js` tetap mendapat gaya.
- Play CDN cocok untuk belajar dan prototipe. Untuk aplikasi yang dirilis, sebaiknya Tailwind dipasang lewat npm (Tailwind CLI) supaya file CSS-nya kecil dan tidak bergantung pada CDN.
- Nama class di JavaScript ditulis **utuh** (`'text-money-in'`, bukan `'text-money-' + kind`). Ini kebiasaan yang baik, karena Tailwind versi npm mencari nama class utuh di file sumber.

---

## Task 05 — Halaman Beranda: CSS Manual ke Tailwind CSS

> Halaman Beranda (`html/index.html`) sebelumnya **100% memakai CSS manual** dari `css/style.css` (900 baris). Sekarang seluruh gayanya ditulis dengan class Tailwind, dan `css/style.css` dihapus.

### Kenapa halaman ini diubah seluruhnya?

Berbeda dengan halaman Keuangan, `css/style.css` **hanya dipakai oleh `html/index.html`**. Jadi seluruh halaman bisa diubah ke Tailwind tanpa merusak halaman lain.

Sebelum diubah, halaman ini juga sedang **rusak**. Di commit "week3", `style.css` dipindah ke folder `css/`, tetapi link di `index.html` masih `../style.css`. Akibatnya halaman tampil tanpa CSS sama sekali. Masalah ini ikut hilang karena halaman sekarang tidak memakai file CSS lagi.

### Konsep tambahan: breakpoint (tampilan HP vs laptop)

`style.css` ditulis **desktop-first**: gaya dasar untuk laptop, lalu diubah untuk layar kecil dengan `@media (max-width: ...)`.
Tailwind ditulis **mobile-first**: class tanpa awalan berlaku untuk HP, lalu class berawalan (`md:`, `lg:`) berlaku mulai lebar tertentu **ke atas**.

Supaya tampilannya tetap sama, breakpoint Tailwind disamakan dengan `style.css`:

| `style.css` (lama) | Tailwind (baru) | Berlaku untuk |
|---|---|---|
| `@media (max-width: 430px)` | *(tanpa awalan)* | HP kecil, 0–430px |
| `@media (max-width: 720px)` | `xs:` (mulai 431px) | HP besar, 431–720px |
| `@media (max-width: 980px)` | `md:` (mulai 721px) | Tablet, 721–980px |
| *(gaya dasar)* | `lg:` (mulai 981px) | Laptop, 981px ke atas |

Contoh untuk grid fitur: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` artinya 1 kolom di HP, 2 kolom di tablet, dan 3 kolom di laptop.

### Penerapan di NAKESA

#### 1. `html/index.html`: memasang Tailwind CSS

**Sebelum:**

```html
<html lang="id">
<head>
  ...
  <title>NAKESA — Digital Practice Management</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>
```

**Sesudah:**

```html
<html lang="id" class="scroll-smooth">
<head>
  ...
  <title>NAKESA — Digital Practice Management</title>
  <!-- Tailwind CSS (Play CDN). Replaces the old hand-written css/style.css. -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        // Same breakpoints as the old style.css (max-width 430 / 720 / 980px), written mobile-first.
        screens: { xs: '431px', md: '721px', lg: '981px' },
        extend: {
          colors: {
            navy: '#173a5e',
            primary: '#2c8ecb',
            'primary-dark': '#236f9f',
            'primary-soft': '#eaf6fc',
            aqua: '#5bc0d8',
            mint: '#49b89f',
            ink: '#25415f',
            muted: '#6f8297',
            line: '#dce9f1',
            soft: '#f3f9fc',
          },
          fontFamily: {
            sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
          },
          boxShadow: { soft: '0 18px 50px rgba(36, 93, 125, 0.12)' },
        },
      },
    };
  </script>
  <style type="text/tailwindcss">
    @layer base {
      :focus-visible { @apply outline outline-[3px] outline-offset-[3px] outline-[rgba(44,142,203,0.35)]; }
    }
  </style>
  <script type="module" src="../js/pages/index.js"></script>
</head>
<body class="min-w-0 overflow-x-hidden bg-white font-sans leading-[1.6] text-ink">
```

> - Variabel warna di `:root` pada `style.css` (`--navy`, `--blue`, `--mint`, dll.) dipindah ke `colors`, sehingga bisa dipakai sebagai `text-navy`, `bg-primary`, `text-mint`, dan seterusnya.
> - `html { scroll-behavior: smooth; }` diganti class `scroll-smooth` pada `<html>`.
> - Berbeda dengan halaman Keuangan, di sini *preflight* (reset CSS Tailwind) **tidak dimatikan**, karena halaman ini tidak memakai CSS lain.
> - `@apply` dipakai sekali untuk gaya fokus keyboard (`:focus-visible`), karena aturan ini berlaku untuk semua elemen dan tidak bisa ditulis sebagai class. VS Code mungkin menampilkan peringatan *"Unknown at rule @apply"*. Itu hanya karena linter CSS VS Code belum mengenal sintaks Tailwind, dan tidak memengaruhi halaman.
> - Script `../js/pages/index.js` ditambahkan untuk Task 06.

#### 2. `html/index.html`: header dan navigasi

**Sebelum** (HTML + CSS di `css/style.css`):

```html
<header class="site-header">
  <div class="container nav-wrapper">
    <a class="brand" href="#beranda" aria-label="NAKESA Beranda">
    ...
    <nav class="desktop-nav" aria-label="Navigasi utama">
      <a href="#beranda">Beranda</a>
      ...
      <a class="nav-button" href="welcome.html">Masuk</a>
    </nav>
```

```css
.site-header {
  position: sticky; top: 0; z-index: 20;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
}
.desktop-nav { display: flex; align-items: center; gap: 28px; font-size: 0.94rem; font-weight: 750; }
.desktop-nav a:not(.nav-button) { color: #688099; transition: color 0.2s ease; }
.desktop-nav a:not(.nav-button):hover { color: var(--blue); }

@media (max-width: 720px) {
  .site-header { position: relative; }
  .desktop-nav { display: none; }
}
```

**Sesudah** (semuanya di HTML, tanpa CSS):

```html
<header class="relative md:sticky md:top-0 z-20 border-b border-line bg-white/[.96] backdrop-blur-md">
  <div class="mx-auto w-[min(100%_-_24px,620px)] xs:w-[min(100%_-_28px,620px)] md:w-[min(1180px,100%_-_40px)] flex min-h-[68px] xs:min-h-[76px] items-center justify-between gap-6">
    <a class="inline-flex items-center gap-2.5 text-[1.2rem] font-black tracking-[-0.02em] text-navy" href="#beranda" aria-label="NAKESA Beranda">
    ...
    <nav class="hidden md:flex items-center gap-7 text-[0.94rem] font-[750]" id="desktop-nav" aria-label="Navigasi utama">
      <a class="text-[#688099] transition-colors hover:text-primary" href="#beranda">Beranda</a>
      ...
      <a class="inline-flex min-h-[43px] items-center justify-center rounded-[11px] bg-primary px-[17px] text-white shadow-[0_8px_18px_rgba(44,142,203,0.22)]" href="welcome.html">Masuk</a>
    </nav>
```

> - `hidden md:flex`: menu atas disembunyikan di HP dan baru tampil mulai 721px. Ini pengganti `@media (max-width: 720px) { .desktop-nav { display: none; } }`.
> - `hover:text-primary` adalah pengganti `a:hover { color: ... }`.
> - `bg-white/[.96]` artinya putih dengan transparansi 96%.
> - Di dalam `[...]`, tanda `_` dibaca sebagai spasi. Jadi `w-[min(100%_-_24px,620px)]` sama dengan `width: min(100% - 24px, 620px)`.
> - `id="desktop-nav"` ditambahkan untuk Task 06.

#### 3. `html/index.html`: menu HP

**Sebelum:**

```html
<details class="mobile-nav">
  <summary aria-label="Buka menu navigasi">☰</summary>
  <nav aria-label="Navigasi mobile">
    <a href="#beranda">Beranda</a>
```

```css
.mobile-nav { display: none; }
@media (max-width: 720px) {
  .mobile-nav { display: block; position: relative; }
  .mobile-nav summary { list-style: none; cursor: pointer; width: 42px; height: 42px; display: grid; place-items: center;
    border-radius: 12px; background: var(--blue-soft); color: var(--navy); font-size: 1.25rem; }
  .mobile-nav summary::-webkit-details-marker { display: none; }
  .mobile-nav nav { position: absolute; top: calc(100% + 10px); right: 0; min-width: 205px; display: grid; gap: 4px;
    padding: 10px; border: 1px solid var(--line); border-radius: 15px; background: #ffffff; box-shadow: var(--shadow); }
  .mobile-nav nav a { padding: 10px 12px; border-radius: 10px; color: #637d93; font-weight: 750; }
  .mobile-nav nav a:hover { color: var(--blue); background: var(--blue-soft); }
}
```

**Sesudah:**

```html
<details class="relative md:hidden" id="mobile-menu">
  <summary class="grid h-[42px] w-[42px] cursor-pointer list-none place-items-center rounded-xl bg-primary-soft text-[1.25rem] text-navy [&::-webkit-details-marker]:hidden" aria-label="Buka menu navigasi">☰</summary>
  <nav class="absolute right-0 top-[calc(100%_+_10px)] grid min-w-[205px] gap-1 rounded-[15px] border border-line bg-white p-2.5 shadow-soft" aria-label="Navigasi mobile">
    <a class="rounded-[10px] px-3 py-2.5 font-[750] text-[#637d93] hover:bg-primary-soft hover:text-primary" href="#beranda">Beranda</a>
```

> - `md:hidden` adalah kebalikan dari menu atas: tampil di HP dan hilang mulai 721px.
> - `[&::-webkit-details-marker]:hidden` adalah *arbitrary variant*, yaitu cara Tailwind menulis selector khusus (di sini menyembunyikan segitiga bawaan `<details>` di Safari).
> - `id="mobile-menu"` ditambahkan untuk Task 06.
> - **Perbaikan kecil:** di CSS lama, tombol "Masuk" di menu HP berubah menjadi biru muda dengan teks biru saat disentuh, karena aturan `.mobile-nav nav a:hover` menimpa `.nav-button`. Sekarang tombol itu memakai `hover:bg-primary-dark`, jadi tetap terlihat seperti tombol.

#### 4. `html/index.html`: hero (judul besar + ilustrasi dashboard)

**Sebelum:**

```html
<section id="beranda" class="hero-section" aria-labelledby="hero-title">
  <div class="container">
    <div class="hero-card">
      <div class="hero-content">
        <p class="eyebrow">Digital Practice Management</p>
        <h1 id="hero-title">Kelola Praktik.<br>Rawat Pasien.<br>Lebih Teratur.</h1>
        ...
        <div class="hero-actions">
          <a class="primary-button" href="#fitur">
```

```css
.hero-card {
  min-height: 460px; display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  overflow: hidden; border: 1px solid #d8edf5; border-radius: var(--radius-xl);
  background:
    radial-gradient(circle at 87% 20%, rgba(255, 255, 255, 0.95), transparent 21%),
    linear-gradient(120deg, #effaff 0%, #e4f5fb 52%, #d9f0f7 100%);
  box-shadow: var(--shadow);
}
.hero-content h1 {
  margin: 0; color: var(--navy);
  font-size: clamp(2.55rem, 5vw, 4.9rem); line-height: 0.98; letter-spacing: -0.055em;
}
.primary-button:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(44, 142, 203, 0.3); }
.hero-visual::before {
  content: ""; position: absolute; width: 430px; height: 430px; border-radius: 50%;
  background: rgba(177, 225, 238, 0.55);
  box-shadow: 0 0 0 32px rgba(255, 255, 255, 0.28), 0 0 0 66px rgba(255, 255, 255, 0.12);
}
@media (max-width: 980px) { .hero-card { grid-template-columns: 1fr; } }
@media (max-width: 720px) { .hero-content h1 { font-size: clamp(2.35rem, 13vw, 3.9rem); } }
@media (max-width: 430px) { .hero-content h1 { font-size: 2.55rem; } }
```

**Sesudah:**

```html
<section id="beranda" class="pt-5 pb-[18px] md:pt-8" aria-labelledby="hero-title">
  <div class="mx-auto w-[min(100%_-_24px,620px)] xs:w-[min(100%_-_28px,620px)] md:w-[min(1180px,100%_-_40px)]">
    <div class="grid min-h-[460px] grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] overflow-hidden rounded-[22px] md:rounded-[30px] border border-[#d8edf5] bg-[image:radial-gradient(circle_at_87%_20%,rgba(255,255,255,0.95),transparent_21%),linear-gradient(120deg,#effaff_0%,#e4f5fb_52%,#d9f0f7_100%)] shadow-soft">
      <div class="relative z-[2] flex flex-col justify-center px-6 pt-8 pb-[26px] md:px-11 md:pt-[46px] md:pb-[30px] lg:p-[58px]">
        <p class="mb-2.5 text-[0.8rem] font-black uppercase tracking-[0.09em] text-primary">Digital Practice Management</p>
        <h1 class="text-[2.55rem] xs:text-[length:clamp(2.35rem,13vw,3.9rem)] md:text-[length:clamp(2.55rem,5vw,4.9rem)] font-bold leading-[0.98] tracking-[-0.055em] text-navy" id="hero-title">Kelola Praktik.<br>Rawat Pasien.<br>Lebih Teratur.</h1>
        ...
        <div class="flex flex-col md:flex-row flex-wrap gap-3">
          <a class="... transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(44,142,203,0.3)]" href="#fitur">
      ...
      <div class="relative grid ... place-items-center before:absolute before:h-[300px] before:w-[300px] md:before:h-[430px] md:before:w-[430px] before:rounded-full before:bg-[rgba(177,225,238,0.55)] before:shadow-[0_0_0_32px_rgba(255,255,255,0.28),0_0_0_66px_rgba(255,255,255,0.12)] before:content-['']" aria-label="Dashboard ringkas NAKESA">
```

> - Ukuran judul yang tadinya diatur di 3 tempat (gaya dasar dan 2 `@media`) sekarang ditulis dalam satu class: `text-[2.55rem] xs:text-[...] md:text-[...]`.
> - Pseudo-element `::before` (lingkaran di belakang kartu dashboard) ditulis dengan awalan `before:`.
> - `hover:-translate-y-0.5` adalah pengganti `transform: translateY(-2px)` saat hover.
> - Nilai yang tidak ada di skala Tailwind (misal gradien, `clamp()`, bayangan khusus) ditulis di dalam `[...]`. Hint `image:` dan `length:` memberi tahu Tailwind jenis nilainya.

#### 5. `html/index.html`: kartu fitur, praktik, tentang, dan footer

Polanya sama untuk bagian lainnya. Contoh satu kartu fitur:

**Sebelum:**

```html
<div class="feature-grid">
  <article class="feature-card feature-blue">
    <div class="feature-icon" aria-hidden="true">👤</div>
    <h3>Manajemen Pasien</h3>
    <p>Kelola identitas pasien, ...</p>
  </article>
```

```css
.feature-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.feature-card { min-width: 0; padding: 24px; border: 1px solid var(--line); border-radius: var(--radius-md);
  background: #ffffff; box-shadow: 0 10px 28px rgba(39, 96, 130, 0.055); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.feature-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
.feature-icon { width: 58px; height: 58px; display: grid; place-items: center; margin-bottom: 18px; border-radius: 15px; font-size: 1.6rem; }
.feature-blue .feature-icon { background: #eaf6fc; }
.feature-card h3 { margin: 0; color: var(--navy); font-size: 1.12rem; }
.feature-card p { margin: 8px 0 0; color: var(--muted); font-size: 0.92rem; }
@media (max-width: 980px) { .feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 720px) { .feature-grid { grid-template-columns: 1fr; } }
```

**Sesudah:**

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[18px]">
  <article class="min-w-0 rounded-[17px] border border-line bg-white p-6 shadow-[0_10px_28px_rgba(39,96,130,0.055)] transition duration-200 hover:-translate-y-1 hover:shadow-soft">
    <div class="mb-[18px] grid h-[58px] w-[58px] place-items-center rounded-[15px] bg-[#eaf6fc] text-[1.6rem]" aria-hidden="true">👤</div>
    <h3 class="text-[1.12rem] font-bold text-navy">Manajemen Pasien</h3>
    <p class="mt-2 text-[0.92rem] text-muted">Kelola identitas pasien, ...</p>
  </article>
```

> Class pembeda warna (`feature-blue`, `feature-purple`, dll.) tidak diperlukan lagi. Warna latar ikon langsung ditulis di tiap kartu, misal `bg-[#eaf6fc]` atau `bg-[#f1edfc]`.

Bagian lain diubah dengan cara yang sama:

| Bagian | Class lama (`style.css`) | Diganti dengan (contoh class Tailwind) |
|---|---|---|
| Judul bagian | `.section-heading h2` | `text-[length:clamp(1.85rem,3vw,2.75rem)] font-bold leading-[1.08] text-navy` |
| Label kecil biru | `.eyebrow` | `mb-2.5 text-[0.8rem] font-black uppercase tracking-[0.09em] text-primary` |
| Jarak antar-bagian | `.section` + `@media` | `py-[62px] md:py-[84px]` |
| Latar bagian Praktik | `.section-soft` | `bg-soft` |
| Tata letak Praktik | `.practice-layout` + `@media` | `grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] gap-6` |
| Label profesi | `.role-list span` | `rounded-full bg-[#eff7fb] px-3 py-[9px] font-extrabold` |
| Nomor langkah 01/02/03 | `.workflow-number` | `bg-gradient-to-br from-primary to-aqua rounded-[13px] font-black text-white` |
| Kotak angka (6+, 1, Multi) | `.stats-card div` + 2 `@media` | `px-1.5 py-[15px] xs:px-3 xs:py-[21px] text-center` |
| Footer | `.site-footer`, `.footer-content` | `bg-[#193c5d] py-11`, `flex flex-col md:flex-row gap-7` |

#### 6. `html/index.html`: tahun di footer (untuk Task 06)

**Sebelum:**

```html
<p>Asisten digital untuk mengelola aktivitas praktik tenaga kesehatan.</p>
```

**Sesudah:**

```html
<p class="mt-[9px] text-[0.88rem] text-[#abc1d1]">Asisten digital untuk mengelola aktivitas praktik tenaga kesehatan.</p>
<p class="mt-1 text-[0.8rem] text-[#abc1d1]">© <span id="tahun">2026</span> NAKESA</p>
```

#### 7. `css/style.css`: dihapus

**Sebelum:** 900 baris CSS manual (variabel warna, 90+ aturan class, 3 blok `@media`).

**Sesudah:** file **dihapus**, karena tidak ada halaman lain yang memakainya.

### Hasil di halaman

Halaman lama dan baru sudah dibandingkan lewat screenshot di Chrome, di lebar laptop (1280px) dan HP (390px). **Tampilannya sama.** Perbedaannya hanya:

- tahun "© 2026" muncul di footer (dari Task 06)
- menu "Beranda" di atas berwarna biru sebagai tanda halaman sedang di bagian Beranda (dari Task 06)

| | Sebelum | Sesudah |
|---|---|---|
| File CSS untuk Beranda | `css/style.css` (900 baris) | tidak ada (0 baris) |
| Link CSS di `index.html` | `../style.css` (**rusak**, file sudah dipindah) | tidak perlu |
| Breakpoint responsive | 3 blok `@media (max-width)` | awalan `xs:`, `md:`, `lg:` |

---

## Task 06 — Halaman Beranda: JavaScript (Select & Change, Handle User Event)

> Halaman Beranda sebelumnya **tidak punya JavaScript sama sekali**. Ditambahkan file baru `js/pages/index.js`.

### Kebutuhannya

1. **Menu HP tidak tertutup sendiri.** Setelah pengguna menekan ☰ lalu memilih "Fitur", halaman bergulir ke bagian Fitur, tetapi menunya tetap terbuka dan menutupi isi halaman. Pengguna harus menekan ☰ lagi.
2. **Ikon ☰ tidak berubah** saat menu terbuka, sehingga pengguna tidak tahu cara menutupnya.
3. **Pengguna tidak tahu sedang berada di bagian mana** saat menggulir halaman di laptop.
4. **Tahun di footer** sebaiknya selalu mengikuti tahun sekarang, tanpa perlu diedit manual setiap tahun.

### Penerapan di NAKESA

#### `html/index.html`: menghubungkan file JavaScript

**Sebelum:** tidak ada `<script>`.

**Sesudah** (di dalam `<head>`):

```html
<script type="module" src="../js/pages/index.js"></script>
```

> `type="module"` membuat script berjalan **setelah** HTML selesai dimuat, sehingga `querySelector` pasti menemukan elemennya. Ini sama dengan halaman NAKESA lainnya.

#### `js/pages/index.js`: file baru

**Sebelum:** file belum ada.

**Sesudah:**

```js
// Beranda (landing page): small interactions, no login needed.

/* ---------- Select & Change ---------- */
// Selector ID: ambil <span id="tahun"> di footer, lalu isi dengan tahun sekarang.
const year = document.querySelector('#tahun');
year.textContent = new Date().getFullYear();

/* ---------- Handle User Event ---------- */
const mobileMenu = document.querySelector('#mobile-menu');
const menuButton = mobileMenu.querySelector('summary');

// Event "toggle": menu HP dibuka/ditutup → ganti ikon ☰ / ✕.
mobileMenu.addEventListener('toggle', () => {
  menuButton.textContent = mobileMenu.open ? '✕' : '☰';
  menuButton.setAttribute('aria-label', mobileMenu.open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
});

// Event "click": setelah link di menu HP diklik, atau klik di luar menu, tutup menunya.
document.addEventListener('click', (event) => {
  if (!mobileMenu.open) return;
  if (event.target.closest('#mobile-menu a') || !mobileMenu.contains(event.target)) mobileMenu.open = false;
});

// Event "scroll": tandai link menu atas sesuai bagian yang sedang dilihat.
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('#desktop-nav a[href^="#"]');

function markActiveLink() {
  let current = sections[0].id;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 120) current = section.id;
  }
  navLinks.forEach((link) => {
    const active = link.getAttribute('href') === `#${current}`;
    link.classList.toggle('text-primary', active);
    link.classList.toggle('text-[#688099]', !active);
    if (active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

window.addEventListener('scroll', markActiveLink, { passive: true });
markActiveLink();
```

### Select & Change di halaman Beranda

| Elemen dipilih | Selector | Yang diubah | Sebelum | Sesudah |
|---|---|---|---|---|
| Tahun di footer | `#tahun` (ID) | `textContent` | 2026 (ditulis manual) | tahun sekarang, otomatis |
| Tombol menu HP | `summary` (tag, di dalam `#mobile-menu`) | `textContent` dan `aria-label` | ☰ | ✕ saat menu terbuka |
| Link menu atas | `#desktop-nav a[href^="#"]` (atribut) | class Tailwind lewat `classList.toggle` | semua abu-abu | link bagian yang dilihat menjadi biru (`text-primary`) |

### Handle User Event di halaman Beranda

| User | Event | JavaScript | UI Response |
|---|---|---|---|
| Menekan ☰ di HP | `toggle` pada `<details>` | Cek `mobileMenu.open` | Ikon berubah menjadi ✕ (atau kembali ☰) |
| Memilih "Fitur" di menu HP | `click` | `event.target.closest('#mobile-menu a')` → `mobileMenu.open = false` | Menu tertutup, halaman bergulir ke Fitur |
| Menyentuh area di luar menu | `click` | `!mobileMenu.contains(event.target)` → `mobileMenu.open = false` | Menu tertutup |
| Menggulir halaman di laptop | `scroll` | `markActiveLink()` mencari bagian yang sedang di atas layar | Link menu yang sesuai berwarna biru |

### Penjelasan

- **Satu listener untuk banyak link.** Event `click` dipasang sekali di `document`, bukan di setiap link. `event.target.closest('#mobile-menu a')` mengecek apakah yang diklik adalah link di dalam menu. Cara ini disebut *event delegation*.
- **`mobileMenu.open`** adalah properti bawaan `<details>`. Mengisinya dengan `false` langsung menutup menu dan juga memicu event `toggle`, jadi ikon otomatis kembali menjadi ☰.
- **`getBoundingClientRect().top`** memberi jarak bagian dari atas layar. Bagian terakhir yang sudah lewat 120px dari atas (tinggi header) dianggap sedang dilihat.
- **`classList.toggle(nama, kondisi)`** menambah class kalau kondisinya `true` dan menghapusnya kalau `false`. Di sini JavaScript mengganti **class Tailwind** (`text-primary` ↔ `text-[#688099]`), sehingga gayanya tetap dari Tailwind dan tidak perlu menulis CSS baru.
- **`{ passive: true }`** memberi tahu browser bahwa listener scroll tidak akan membatalkan scroll, sehingga menggulir tetap lancar di HP.
- **`aria-current` dan `aria-label`** membantu pengguna pembaca layar mengetahui menu mana yang aktif dan fungsi tombol ☰/✕.

### Checklist

- [x] **Select & change:** `querySelector` dengan selector ID, tag, dan atribut; mengubah `textContent`, atribut, dan class.
- [x] **Handle user event:** event `toggle`, `click`, dan `scroll` ditangkap dengan `addEventListener`.
- [x] **JavaScript berjalan:** sintaks sudah dicek dengan `node --check`.
- [x] **Tidak merusak halaman:** tampilan dibandingkan dengan versi lama lewat screenshot, dan hasilnya sama.

---

## Menyorot Bagian yang Memakai Tailwind CSS

Supaya mudah ditunjukkan saat presentasi, ditambahkan file `js/tailwind-highlight.js`. File ini dipasang di `html/index.html` dan `html/finance.html`.

**Cara pakai:** tambahkan `?tailwind` di akhir alamat halaman, misalnya:

- `html/index.html?tailwind` (Beranda: hampir semua elemen tersorot, karena seluruh halaman sudah Tailwind)
- `html/finance.html?tailwind` (Keuangan: hanya bagian yang diganti di Task 04 yang tersorot)

Hasilnya:

- Setiap elemen yang diberi gaya oleh class Tailwind mendapat **garis putus-putus biru**.
- Saat kursor diarahkan ke elemen, garisnya menebal dan muncul keterangan class Tailwind-nya, misal `Tailwind: text-lg text-navy`.
- Di pojok kiri bawah tampil jumlah elemen yang memakai Tailwind, beserta tombol **Matikan**.

Tanpa `?tailwind`, file ini tidak melakukan apa-apa, jadi tampilan untuk pengguna biasa tidak berubah.

**Cara kerjanya:** Tailwind CDN membuat satu `<style>` berisi CSS untuk class yang dipakai di halaman. Script membaca daftar class dari `<style>` itu, lalu menandai elemen yang memiliki salah satu class tersebut. `MutationObserver` menandai ulang saat JavaScript menambah elemen baru, misalnya daftar catatan keuangan.

---

## Ringkasan

| Task | Materi | Penerapan di NAKESA (halaman Keuangan) |
|---|---|---|
| 01 — Select & Change | `querySelector` + `textContent` | Judul, subjudul, dan tombol diubah lewat selector tag, ID, dan class |
| 02 — Handle User Event | `addEventListener('input', …)` | Kotak pencarian untuk menyaring catatan keuangan |
| 03 — One Complete Interaction | Click → event → olah data → update DOM | Tombol "Lihat Rincian per Kategori" dengan jumlah, persentase, dan bar |
| 04 — CSS Manual ke Tailwind | Utility class Tailwind (CDN) | `style="..."` dan CSS khusus Keuangan diganti class Tailwind |
| 05 — Beranda: CSS Manual ke Tailwind | Tailwind + breakpoint `xs:`/`md:`/`lg:` | Seluruh `index.html` memakai Tailwind, `css/style.css` (900 baris) dihapus |
| 06 — Beranda: Select & Change + Event | `querySelector`, `classList`, `addEventListener` (`toggle`, `click`, `scroll`) | Menu HP otomatis tertutup, ikon ☰/✕, menu aktif saat scroll, tahun otomatis |

**File yang diubah:**

- `html/finance.html`: `id="subjudul"`, kotak pencarian `#search`, tombol `#toggle-breakdown`, panel `#breakdown`, pemasangan Tailwind CDN, class Tailwind menggantikan `style="..."` (Task 04)
- `js/pages/finance.js`: kode Task 01, 02, dan 03; class Tailwind dan fungsi `moneyClass` (Task 04)
- `css/app.css`: gaya panel rincian per kategori (Task 03), lalu dihapus bersama `.month-picker` dan `.money-in/out` karena diganti Tailwind (Task 04)
- `html/index.html`: seluruh class diganti Tailwind, konfigurasi Tailwind, `id` untuk JavaScript, tahun di footer (Task 05)
- `css/style.css`: **dihapus** (Task 05)
- `js/pages/index.js`: **file baru**, JavaScript halaman Beranda (Task 06)
