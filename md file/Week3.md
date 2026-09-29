# Week 3 — Web Programming: JavaScript & DOM

**Nama:** Sigit Novriyanto
**Proyek:** NAKESA — aplikasi manajemen praktik mandiri tenaga kesehatan (bidan, dokter, perawat, dll.)
**Halaman yang dikerjakan:** Keuangan (`html/finance.html`, `js/pages/finance.js`)

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

Di `html/finance.html`, paragraf di bawah judul diberi id supaya bisa dipilih:

```html
<p id="subjudul">Uang masuk dan keluar praktik.</p>
```

Di `js/pages/finance.js`:

```js
const { profile, practice } = await startPage('finance');

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

### Hasil

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

HTML: kotak pencarian di atas daftar catatan.

```html
<div class="search" style="margin-top:14px">
  <input class="input" type="search" id="search"
         placeholder="Cari catatan, misal: Bu Ani, Beli Obat…" aria-label="Cari catatan keuangan">
</div>
```

JavaScript: ambil elemennya, lalu pasang event listener.

```js
const search = document.querySelector('#search');

// Event "input" menyala setiap ketikan, jadi daftar tersaring sambil mengetik.
search.addEventListener('input', render);
```

Di dalam fungsi `render()`, daftar disaring sesuai kata yang diketik:

```js
const q = search.value.trim().toLowerCase();
const shown = transactions.filter((t) =>
  !q || t.category.toLowerCase().includes(q) || (t.note ?? '').toLowerCase().includes(q));
```

Kalau tidak ada yang cocok, muncul pesan: *"Tidak ada catatan yang cocok dengan “…”"*.

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

**HTML** (`html/finance.html`): tombol dan panel rincian, awalnya disembunyikan dengan atribut `hidden`.

```html
<button type="button" class="btn btn-ghost btn-block" id="toggle-breakdown"
  aria-expanded="false" aria-controls="breakdown">📊 Lihat Rincian per Kategori</button>
<div class="card breakdown" id="breakdown" hidden></div>
```

**JavaScript** (`js/pages/finance.js`):

```js
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
    return `...baris kategori + bar selebar ${percent}%...`;
  }).join('');
}
```

Supaya rincian tetap benar saat pengguna mengganti bulan atau menambah, mengubah, atau menghapus catatan, `renderBreakdown()` juga dipanggil dari `render()`:

```js
renderBreakdown(); // keep an open breakdown in sync when the month or data changes
```

**CSS** (`css/app.css`): gaya untuk panel rincian dan bar persentase (`.breakdown`, `.breakdown-row`, `.breakdown-bar`, `.bar-in`, `.bar-out`).

### Contoh tampilan

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

## Ringkasan

| Task | Materi | Penerapan di NAKESA (halaman Keuangan) |
|---|---|---|
| 01 — Select & Change | `querySelector` + `textContent` | Judul, subjudul, dan tombol diubah lewat selector tag, ID, dan class |
| 02 — Handle User Event | `addEventListener('input', …)` | Kotak pencarian untuk menyaring catatan keuangan |
| 03 — One Complete Interaction | Click → event → olah data → update DOM | Tombol "Lihat Rincian per Kategori" dengan jumlah, persentase, dan bar |

**File yang diubah:**

- `html/finance.html`: `id="subjudul"`, kotak pencarian `#search`, tombol `#toggle-breakdown`, panel `#breakdown`
- `js/pages/finance.js`: kode Task 01, 02, dan 03
- `css/app.css`: gaya panel rincian per kategori
