# Week 5 — Web Programming: From Client-Side to Server-Side (PHP)

**Nama:** Sigit Novriyanto
**Tanggal:** Selasa, 13 Oktober 2026
**Proyek:** NAKESA — aplikasi manajemen praktik mandiri tenaga kesehatan (bidan, dokter, perawat, dll.)
**Halaman yang dikerjakan:** Profil praktik publik untuk pasien (`php/praktik.php`, `php/data.php`, `php/functions.php`)

**Tugas dari kelas (Sprint 04 — Build Server-Side):** Memproses data dengan PHP dan menghasilkan HTML dari server

1. **Task 01 — Create PHP Page:** membuat halaman PHP yang menampilkan informasi dari variabel
2. **Task 02 — Process Data with PHP:** mengolah data dengan array, conditional, dan loop sebelum ditampilkan
3. **Task 03 — Build Dynamic Server-Side Content:** bagian halaman yang isinya dibuat oleh PHP, bukan ditulis satu per satu

Pada slide, contohnya memakai *PresidenKu* (nama presiden, periode, program prioritas, status program). Di sini ketiga task saya terapkan pada proyek saya sendiri, **NAKESA**, dengan membuat halaman baru **Profil Praktik**. Halaman ini menampilkan nama praktik dan nakes, status buka/tutup, jadwal praktik seminggu, daftar layanan, serta tombol booking dan WhatsApp. **Seluruh isinya dibuat oleh PHP di server.**

Alasan memilih fitur ini:

- **Link praktik biasanya dibagikan lewat WhatsApp.** Saat link ditempel, WhatsApp membuat pratinjau (judul dan deskripsi) dari HTML halaman **tanpa menjalankan JavaScript**. Halaman booking yang sudah ada (`html/book.html`) diisi oleh JavaScript, sehingga pratinjaunya selalu "Booking Online — NAKESA". Halaman PHP mengirim HTML yang sudah berisi nama praktiknya, sehingga judul dan deskripsi pratinjaunya sesuai dengan praktik itu.
- **Pasien membuka halaman ini dari HP**, sering dengan sinyal lemah. Karena HTML sudah jadi di server, isi halaman tidak perlu menunggu JavaScript mengambil data terlebih dahulu.

### Dari PresidenKu ke NAKESA

| PresidenKu (slide) | NAKESA (halaman Profil Praktik) |
|---|---|
| Nama Presiden: Eko Felix | Nama praktik dan nama nakes: `$practiceName`, `$practitioner` |
| Periode: 2044–2049 | Jadwal praktik per hari: `$hoursByDay` |
| Program Prioritas: Pendidikan, Kesehatan, Infrastruktur | Layanan: Periksa Kehamilan, KB, Imunisasi Anak, … (`$services`) |
| Status Program: Berjalan | Status: Sedang buka / Sedang tutup (`$isOpen`) |
| `getProgramStatus($status)` | `openLabel($isOpen)` |

> **Ringkasan perubahan file:** 3 file **baru** di folder `php/` (`data.php`, `functions.php`, `praktik.php`), 2 file **dimodifikasi** untuk CI (`.github/workflows/ci.yml`, `.github/scripts/check-refs.mjs`), dan laporan ini (`Exercise week/Week5.md`, **baru**). Halaman NAKESA yang sudah ada **tidak diubah**. Rinciannya ada di bagian [Perubahan File](#perubahan-file-ditambah--dimodifikasi).

---

## Persiapan: Menjalankan PHP

| | Keterangan |
|---|---|
| **Versi PHP** | PHP 8.5.11 (dipasang lewat Homebrew, cek dengan `php -v`). Kode hanya memakai fitur PHP 8.0 ke atas, jadi bisa juga dijalankan dengan XAMPP |
| **Server** | Server bawaan PHP: `php -S localhost:8000`, dijalankan dari folder proyek |
| **Contoh praktik** | `http://localhost:8000/php/praktik.php` |
| **Praktik asli** | `http://localhost:8000/php/praktik.php?p=<kode link booking>` |

```bash
cd NAKESA
php -S localhost:8000
# PHP 8.5.11 Development Server (http://localhost:8000) started
```

> **Kenapa tidak memakai Live Server (port 5501) seperti biasa?** Live Server hanya mengirim file apa adanya, tanpa menjalankan PHP. Kalau `praktik.php` dibuka lewat Live Server, browser menerima kode PHP mentah, bukan HTML. File PHP harus dibuka lewat server yang menjalankan PHP: `php -S`, XAMPP, atau hosting yang mendukung PHP.

**Kode link booking** adalah bagian akhir link booking di menu *Praktik* NAKESA. Contohnya, link `book.html?p=4dafb47bcd` berarti kodenya `4dafb47bcd`.

---

## Konsep Dasar

| Istilah | Arti | Di NAKESA |
|---|---|---|
| **Client-side** | Kode dijalankan di **browser** pengguna | JavaScript di Week 4: `fetch()` data libur, lalu mengisi kartu di Beranda |
| **Server-side** | Kode dijalankan di **server** sebelum halaman dikirim | PHP di Week 5: menyusun seluruh halaman Profil Praktik |
| **PHP** | Bahasa pemrograman yang diproses di server dan menghasilkan HTML | `php/praktik.php` |
| **Request** | Permintaan dari browser ke server | Browser meminta `praktik.php?p=4dafb47bcd` |
| **Response** | Hasil dari server yang dikirim kembali ke browser | HTML yang sudah berisi nama praktik, jadwal, dan layanan |
| **`<?php … ?>`** | Penanda awal dan akhir kode PHP | Bagian atas `praktik.php` berisi kode PHP, bagian bawahnya HTML |
| **`echo` / `<?= … ?>`** | Mencetak output ke HTML. `<?= $x ?>` adalah singkatan dari `<?php echo $x; ?>` | `<h1><?= e($practiceName) ?></h1>` |
| **Variable** | Tempat menyimpan data, diawali tanda `$` | `$practiceName`, `$isOpen`, `$services` |
| **Array** | Kumpulan banyak data | Daftar layanan, daftar sesi praktik |
| **Conditional** | `if / elseif / else`: menentukan output sesuai kondisi | Buka atau tutup? Hari ini atau bukan? |
| **Loop** | `foreach` / `for`: mengulang proses untuk setiap data | Satu baris tabel per hari, satu `<li>` per layanan |
| **Function** | Kumpulan perintah yang diberi nama: menerima input, mengembalikan hasil | `openLabel()`, `todaySummary()`, `waLink()` |

### Alur kerja PHP di NAKESA (sesuai slide "How PHP Works")

```
1 USER        Pasien menekan link praktik di WhatsApp
2 BROWSER     Mengirim request: GET /php/praktik.php?p=4dafb47bcd
3 PHP REQUEST Server menerima request untuk file .php
4 WEB SERVER  php -S menjalankan praktik.php
5 PHP PROCESS Baca ?p= → ambil data dari Supabase → olah jadwal & layanan (variable, if, foreach, function)
6 HTML RESPONSE  HTML jadi dikirim ke browser (kode PHP-nya tidak ikut terkirim)
7 BROWSER     Menampilkan Profil Praktik
```

### Struktur file: INPUT → PROCESS → OUTPUT

Kode PHP saya bagi menjadi tiga file sesuai alur *PHP Procedural* di slide:

```
php/
├── data.php       DATA     konstanta & array: nama hari, nama bulan, profesi + layanannya, contoh praktik
├── functions.php  PROCESS  fungsi-fungsi: e(), professionOf(), titledName(), openLabel(), groupHoursByDay(),
│                           todaySummary(), waLink(), indonesianDateTime(), fetchPractice()
└── praktik.php    OUTPUT   halaman: baca input ?p=, siapkan variabel, cetak HTML
```

`praktik.php` memuat dua file lainnya dengan `require`:

```php
require __DIR__ . '/data.php';
require __DIR__ . '/functions.php';

date_default_timezone_set('Asia/Jakarta');
```

> `date_default_timezone_set('Asia/Jakarta')` membuat `date()` memakai jam WIB. Ini sama dengan zona waktu yang dipakai database NAKESA saat memeriksa tanggal booking.

---

## Task 01 — Create PHP Page

> Buat satu halaman PHP untuk menampilkan informasi NAKESA.

### Konsep

```
PHP FILE → PHP PROCESS → HTML OUTPUT
```

1. **PHP FILE:** `php/praktik.php` berisi kode program dan HTML.
2. **PHP PROCESS:** server menjalankan bagian `<?php … ?>`: mengisi variabel, lalu mencetaknya ke HTML.
3. **HTML OUTPUT:** browser hanya menerima HTML hasil akhirnya.

### Penerapan di NAKESA

#### 1. `php/praktik.php` (file baru): variabel untuk identitas praktik

```php
if ($practice) {
    /* ---------- Week 5 · Task 01: Create PHP Page (variabel → HTML) ---------- */
    $profession = professionOf($practice['profession']);
    $practiceName = $practice['name'];
    $practitioner = titledName($practice['practitioner'] ?? '', $profession['title']);
    $professionLabel = $practice['specialty'] ? "{$profession['label']} {$practice['specialty']}" : $profession['label'];
    $subtitle = implode(' · ', array_filter([$practitioner, $professionLabel])); // nama nakes bisa saja kosong
    $address = $practice['address'];
    $phone = $practice['phone'];
    $isOpen = $practice['is_open'];
    $bookingEnabled = $practice['booking_enabled'];
```

| Variabel | Isi (contoh praktik) | Tipe data |
|---|---|---|
| `$practiceName` | `'Praktik Bidan Sehati'` | string |
| `$practitioner` | `'Bidan Siti Aminah'` (gelar ditambahkan oleh `titledName()`) | string |
| `$professionLabel` | `'Bidan'` | string |
| `$address` | `'Jl. Melati No. 12, Sleman'` | string |
| `$phone` | `null` (contoh tidak punya nomor WhatsApp) | null |
| `$isOpen` | `true` | boolean |
| `$profession` | `['label' => 'Bidan', 'title' => 'Bidan', 'icon' => '🤰', 'services' => [...]]` | array |

#### 2. `php/functions.php` (file baru): fungsi status (seperti `getProgramStatus()` di slide)

```php
/** Label status untuk tombol "Buka / tutup" yang diatur nakes di NAKESA. */
function openLabel(bool $isOpen): string
{
    if ($isOpen) {
        return 'Sedang buka';
    }
    return 'Sedang tutup';
}
```

#### 3. `php/praktik.php`: variabel dicetak ke HTML

```php
<section class="card grid gap-4" aria-labelledby="practice-name">
  <div class="flex items-center gap-3.5">
    <span class="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-raised text-3xl" aria-hidden="true"><?= $profession['icon'] ?></span>
    <div class="min-w-0">
      <h1 class="text-2xl" id="practice-name"><?= e($practiceName) ?></h1>
      <p class="text-muted"><?= e($subtitle) ?></p>
    </div>
  </div>
  <div class="flex flex-wrap items-center gap-2.5">
    <span class="open-pill<?= $isOpen ? ' is-open' : '' ?>"><span class="live-dot" aria-hidden="true"></span><?= openLabel($isOpen) ?></span>
<?php if ($address): ?>
    <span class="text-sm text-muted">📍 <?= e($address) ?></span>
<?php endif; ?>
  </div>
```

**Hasil yang dikirim ke browser** (bagian PHP sudah diganti dengan datanya):

```html
<section class="card grid gap-4" aria-labelledby="practice-name">
  <div class="flex items-center gap-3.5">
    <span class="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-raised text-3xl" aria-hidden="true">🤰</span>
    <div class="min-w-0">
      <h1 class="text-2xl" id="practice-name">Praktik Bidan Sehati</h1>
      <p class="text-muted">Bidan Siti Aminah · Bidan</p>
    </div>
  </div>
  <div class="flex flex-wrap items-center gap-2.5">
    <span class="open-pill is-open"><span class="live-dot" aria-hidden="true"></span>Sedang buka</span>
    <span class="text-sm text-muted">📍 Jl. Melati No. 12, Sleman</span>
  </div>
```

### Penjelasan

- **`<?= … ?>` sama dengan `<?php echo …; ?>`.** Bentuk pendek ini lebih mudah dibaca kalau disisipkan di tengah HTML.
- **`e()` dipakai untuk semua teks dari database.** Fungsi ini membungkus `htmlspecialchars()`, sehingga `<`, `>`, `&`, dan tanda kutip diubah menjadi teks biasa. Kalau ada yang menulis `<script>` di nama praktik, kode itu tampil sebagai tulisan dan tidak dijalankan (mencegah XSS). Fungsinya sama dengan `escapeHtml()` di JavaScript NAKESA.
- **`titledName()` menambahkan gelar sesuai profesi** ("Bidan", "dr.", "drg.", "Ns."), kecuali kalau nama sudah diawali gelar itu. Hasilnya: "Bidan Siti Aminah", sedangkan "dr. Andi" tetap "dr. Andi".
- **Tanda `$` dan kutip dua.** Di dalam `"…"`, PHP langsung mengganti nama variabel dengan isinya: `"Halo $practiceName"` menjadi `"Halo Praktik Bidan Sehati"`.
- **HTML tetap terstruktur.** Halaman memakai class yang sama dengan halaman booking (`card`, `open-pill`, `btn`, `hours`) dan `tailwind-setup.js` yang sama, jadi tampilannya serasi dengan bagian NAKESA yang lain, termasuk mode gelap.

### Checklist (sesuai slide Task 01)

- [x] **PHP dapat dijalankan:** `php -S localhost:8000` → `praktik.php` menjawab `200 OK`.
- [x] **Variable digunakan:** `$practiceName`, `$practitioner`, `$professionLabel`, `$address`, `$isOpen`, dll.
- [x] **Output tampil:** nama praktik, nakes, status, dan alamat tampil di halaman.
- [x] **HTML tetap terstruktur:** `<main>`, `<section>`, `<h1>`, `<h2>`, `<table>`, `<ol>` dengan class NAKESA yang sudah ada.

---

## Task 02 — Process Data with PHP

> Gunakan PHP untuk memproses data sebelum ditampilkan pada halaman NAKESA.

### Konsep

```
DATA → PHP → CONDITION / LOOP → HTML
```

Datanya adalah **jadwal praktik**. Bentuknya dari database berupa daftar sesi, satu baris per sesi. PHP **mengolah** data itu dulu: dikelompokkan per hari, ditentukan hari ini praktik atau tutup, lalu dicari kapan praktik buka lagi. Hasil olahan itulah yang ditampilkan.

### Data

#### `php/data.php` (file baru): konstanta dan array

```php
// Indeks hari sama dengan day_of_week di database: 0 = Minggu … 6 = Sabtu.
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // jadwal ditampilkan mulai Senin
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
    'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Per profesi: label, gelar, ikon dan layanan bawaan (sama dengan PROFESSIONS di js/professions.js).
const PROFESSIONS = [
    'bidan' => [
        'label' => 'Bidan', 'title' => 'Bidan', 'icon' => '🤰',
        'services' => ['Periksa Kehamilan', 'KB', 'Imunisasi Anak', 'Periksa Bayi & Balita', 'Persalinan', 'Nifas', 'Konsultasi'],
    ],
    'dokter_umum' => [ /* … */ ],
    // … 9 profesi
];
```

Contoh praktik, dengan bentuk **sama persis** dengan data dari Supabase:

```php
$samplePractice = [
    'name' => 'Praktik Bidan Sehati',
    'practitioner' => 'Siti Aminah',
    'profession' => 'bidan',
    // …
    'hours' => [
        ['day' => 1, 'opens' => '08:00', 'closes' => '12:00'],
        ['day' => 1, 'opens' => '16:00', 'closes' => '20:00'],
        ['day' => 2, 'opens' => '08:00', 'closes' => '12:00'],
        // … sampai Sabtu. Minggu tidak ada (tutup).
    ],
];
```

> **Array biasa vs array asosiatif.** `DAYS` adalah array biasa dengan kunci angka (`DAYS[2]` → `'Selasa'`). `PROFESSIONS` dan `$samplePractice` adalah **array asosiatif** dengan kunci teks (`$samplePractice['name']`). Ini seperti *object* di JavaScript.

### Proses

#### 1. `groupHoursByDay()`: loop untuk mengelompokkan sesi per hari

```php
/**
 * Kelompokkan sesi praktik per hari.
 * [['day' => 1, 'opens' => '08:00', 'closes' => '12:00'], …] → [1 => ['08.00–12.00', '16.00–20.00'], …]
 */
function groupHoursByDay(array $hours): array
{
    $byDay = [];
    foreach ($hours as $session) {
        $byDay[$session['day']][] = shortTime($session['opens']) . '–' . shortTime($session['closes']);
    }
    return $byDay;
}
```

**Sebelum** (data dari database, satu baris per sesi):

```php
[
  ['day' => 1, 'opens' => '08:00', 'closes' => '12:00'],
  ['day' => 1, 'opens' => '16:00', 'closes' => '20:00'],
  ['day' => 2, 'opens' => '08:00', 'closes' => '12:00'],
]
```

**Sesudah** (dikelompokkan per hari, jam ditulis cara Indonesia):

```php
[
  1 => ['08.00–12.00', '16.00–20.00'],   // Senin: dua sesi
  2 => ['08.00–12.00'],                  // Selasa: satu sesi
]
```

#### 2. `todaySummary()`: conditional + loop untuk kalimat "hari ini"

```php
/** Kalimat singkat tentang jadwal hari ini, atau kapan praktik buka lagi. */
function todaySummary(array $hoursByDay, int $today): string
{
    if (count($hoursByDay) === 0) {
        return 'Jadwal praktik belum diatur. Tanyakan langsung ke praktik.';
    }
    if (isset($hoursByDay[$today])) {
        return 'Hari ini (' . DAYS[$today] . ') praktik pukul ' . implode(' & ', $hoursByDay[$today]) . '.';
    }
    // Hari ini tutup: cari hari praktik berikutnya (besok, lusa, … sampai 6 hari lagi).
    for ($i = 1; $i <= 6; $i++) {
        $day = ($today + $i) % 7;
        if (isset($hoursByDay[$day])) {
            $when = $i === 1 ? 'besok (' . DAYS[$day] . ')' : 'hari ' . DAYS[$day];
            $opens = explode('–', $hoursByDay[$day][0])[0];
            return "Hari ini tutup. Buka lagi $when mulai pukul $opens.";
        }
    }
    return 'Hari ini tutup.';
}
```

Hasilnya berbeda tergantung hari dan data (diuji dengan contoh praktik):

| Kondisi | Output |
|---|---|
| Senin (ada 2 sesi) | Hari ini (Senin) praktik pukul 08.00–12.00 & 16.00–20.00. |
| Selasa (1 sesi) | Hari ini (Selasa) praktik pukul 08.00–12.00. |
| Minggu (tutup) | Hari ini tutup. Buka lagi besok (Senin) mulai pukul 08.00. |
| Praktik hanya buka Rabu, sekarang Kamis | Hari ini tutup. Buka lagi hari Rabu mulai pukul 09.00. |
| Jadwal belum diatur | Jadwal praktik belum diatur. Tanyakan langsung ke praktik. |

> **Operator `%` (modulo, sisa bagi)** membuat hari "berputar": Sabtu (6) + 1 = 7, dan `7 % 7 = 0` = Minggu. Tanpa `%`, hari setelah Sabtu menjadi angka 7 yang tidak ada di `DAYS`.

#### 3. `php/praktik.php`: memanggil fungsi pengolah

```php
    /* ---------- Week 5 · Task 02: Process Data (array, conditional, loop) ---------- */
    $today = (int) date('w'); // 0 = Minggu … 6 = Sabtu, waktu WIB
    $hoursByDay = groupHoursByDay($practice['hours']);
    $todayText = todaySummary($hoursByDay, $today);
```

#### 4. `php/praktik.php`: tabel jadwal dengan `foreach` + conditional

```php
<?php if (count($hoursByDay) === 0): ?>
      <p class="muted">Jadwal praktik belum diatur. Tanyakan langsung ke praktik.</p>
<?php else: ?>
      <table class="hours">
        <tbody>
<?php foreach (WEEK_ORDER as $day): ?>
          <tr<?= $day === $today ? ' class="is-today"' : '' ?>>
            <td><?= DAYS[$day] ?><?= $day === $today ? ' <span class="badge badge-orange ml-1">Hari ini</span>' : '' ?></td>
            <td><?= isset($hoursByDay[$day]) ? implode('<br>', $hoursByDay[$day]) : '<span class="muted">Tutup</span>' ?></td>
          </tr>
<?php endforeach; ?>
        </tbody>
      </table>
<?php endif; ?>
```

PHP menentukan **bagaimana** setiap baris ditampilkan:

| Kondisi | Tampilan |
|---|---|
| `$day === $today` | Baris disorot oranye + label **Hari ini** |
| Hari itu ada sesi | Jam praktik, satu sesi per baris (`implode('<br>', …)`) |
| Hari itu tidak ada sesi | Tulisan abu-abu **Tutup** |
| Belum ada jadwal sama sekali | Tabel tidak dibuat, diganti kalimat "Jadwal praktik belum diatur" |

### Materi yang digunakan

| Materi | Di kode NAKESA |
|---|---|
| **Variable** | `$today`, `$hoursByDay`, `$todayText` |
| **Array** | `DAYS`, `WEEK_ORDER`, `PROFESSIONS`, `$samplePractice['hours']` |
| **Conditional** | `if / elseif / else`, `isset()`, operator ternary `? :` |
| **Loop** | `foreach` (kelompokkan sesi, baris tabel), `for` (cari hari buka berikutnya) |
| **Operator** | `===` (sama persis), `%` (modulo), `.` (gabung teks), `??` (nilai cadangan kalau kosong) |
| **Function** | `groupHoursByDay()`, `todaySummary()`, `shortTime()` |

### Checklist

- [x] **Data diolah sebelum ditampilkan:** sesi dikelompokkan per hari, jam diubah `08:00` → `08.00`.
- [x] **Conditional:** hari ini / tutup / jadwal kosong.
- [x] **Loop:** `foreach` dan `for`.

---

## Task 03 — Build Dynamic Server-Side Content

> Buat bagian halaman NAKESA yang kontennya dihasilkan oleh PHP, bukan ditulis satu per satu secara manual.

### Konsep

```
PHP DATA → PROCESS → GENERATED HTML → NAKESA PAGE
```

Ada tiga hal yang membuat halaman ini **dinamis**:

1. **Daftar layanan** dibuat dengan `foreach` dari array. Di HTML tidak ada satu pun `<li>` yang ditulis manual.
2. **Satu file untuk semua praktik.** `praktik.php?p=4dafb47bcd` dan `praktik.php?p=a763f4e5c8` adalah file yang sama, tetapi isinya berbeda karena PHP mengambil data praktik yang diminta dari database.
3. **Judul tab dan pratinjau WhatsApp** (`<title>`, `og:title`, `og:description`) juga dibuat PHP sesuai praktiknya.

### Penerapan di NAKESA

#### 1. Daftar layanan: `foreach` menghasilkan `<li>`

```php
    /* ---------- Week 5 · Task 03: Dynamic Server-Side Content ---------- */
    $services = $profession['services'];
    $serviceTones = ['bg-blue-soft text-blue', 'bg-green-soft text-green', 'bg-yellow-soft text-yellow', 'bg-purple-soft text-purple'];
```

```php
    <section class="card" aria-labelledby="services-title">
      <h2 id="services-title">🩺 Layanan</h2>
      <p class="mb-3 mt-1 text-sm text-muted"><?= count($services) ?> layanan <?= e($profession['label']) ?>. Pilih salah satu saat membuat janji.</p>
      <ol class="m-0 grid list-none gap-2 p-0">
<?php foreach ($services as $index => $service): ?>
        <li class="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3">
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold <?= $serviceTones[$index % count($serviceTones)] ?>"><?= $index + 1 ?></span>
          <span class="font-medium text-ink"><?= e($service) ?></span>
        </li>
<?php endforeach; ?>
      </ol>
    </section>
```

- `$index` dimulai dari 0, jadi nomornya ditulis `$index + 1`.
- `$index % count($serviceTones)` membuat warna nomor bergiliran biru → hijau → kuning → ungu → biru lagi, seperti contoh di slide.
- Profesi lain otomatis mendapat daftar berbeda. Dokter gigi mendapat 5 layanan (Periksa Gigi, Tambal Gigi, …), bidan 7 layanan, tanpa mengubah HTML.

#### 2. Satu file untuk semua praktik: PHP mengambil data dari Supabase

**INPUT:** kode praktik dibaca dari URL (`?p=`), lalu dicek bentuknya.

```php
/* ---------- INPUT: slug praktik dari URL ---------- */
$slug = is_string($_GET['p'] ?? null) ? trim($_GET['p']) : '';
$isSample = $slug === '';
$practice = null;
$error = null; // ['icon' => …, 'message' => …, 'retry' => …] kalau halaman tidak bisa ditampilkan

if ($isSample) {
    $practice = $samplePractice;
} elseif (preg_match('/^[a-z0-9-]{4,40}$/', $slug)) { // bentuk slug sama dengan aturan di database
    try {
        $practice = fetchPractice($slug);
    } catch (Throwable $exception) {
        error_log('[praktik.php] ' . $exception->getMessage()); // detail teknis hanya di log server
        http_response_code(503);
        $error = ['icon' => '⚠️', 'message' => 'Data praktik tidak bisa dimuat. Periksa koneksi internet lalu coba lagi.', 'retry' => true];
    }
}
if (!$practice && !$error) {
    http_response_code(404);
    $error = ['icon' => '🔍', 'message' => 'Profil praktik tidak ditemukan. Minta link terbaru dari praktik.', 'retry' => false];
}
```

**`fetchPractice()`** di `php/functions.php`: **server** (bukan browser) yang menghubungi Supabase.

```php
function fetchPractice(string $slug): ?array
{
    // Fungsi database yang sama dengan halaman booking (book.html): hanya data yang boleh dilihat pasien.
    $request = curl_init(SUPABASE_URL . '/rest/v1/rpc/get_public_practice');
    curl_setopt_array($request, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['apikey: ' . SUPABASE_PUBLISHABLE_KEY, 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode(['p_slug' => $slug]),
        CURLOPT_RETURNTRANSFER => true, // jawaban disimpan ke variabel, bukan langsung dicetak
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10, // jangan biarkan halaman menunggu selamanya
    ]);
    $body = curl_exec($request);
    $status = curl_getinfo($request, CURLINFO_RESPONSE_CODE);

    if ($body === false) {
        throw new RuntimeException('Supabase tidak bisa dihubungi: ' . curl_error($request));
    }
    if ($status !== 200) {
        throw new RuntimeException("Supabase menjawab HTTP $status");
    }
    // JSON → array PHP. Slug yang tidak ada dijawab dengan null.
    $practice = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
    return is_array($practice) ? $practice : null;
}
```

| Kemungkinan | Yang terjadi | Kode HTTP |
|---|---|---|
| Tanpa `?p=` | Contoh praktik dari `$samplePractice` + catatan biru "Ini contoh tampilan" (tetap jalan tanpa internet) | `200` |
| `?p=` benar | Data praktik asli dari Supabase | `200` |
| `?p=` tidak ada di database, atau bentuknya salah | 🔍 "Profil praktik tidak ditemukan. Minta link terbaru dari praktik." | `404` |
| Supabase tidak bisa dihubungi | ⚠️ "Data praktik tidak bisa dimuat…" + tombol **Coba lagi**. Detail teknis hanya ditulis ke log server | `503` |

#### 3. Judul dan pratinjau link dibuat PHP

```php
    // Judul & deskripsi untuk tab browser dan pratinjau link saat dibagikan di WhatsApp.
    $pageTitle = "$practiceName · Jadwal & Layanan";
    $pageDescription = implode(' · ', array_filter([$subtitle, $address]))
        . '. Lihat jadwal praktik dan buat janji periksa online.';
```

```php
  <title><?= e($pageTitle) ?></title>
  <meta name="description" content="<?= e($pageDescription) ?>">
  <meta property="og:type" content="website">
  <meta property="og:title" content="<?= e($pageTitle) ?>">
  <meta property="og:description" content="<?= e($pageDescription) ?>">
```

Hasil untuk praktik asli `?p=4dafb47bcd`:

```html
<title>Praktik Ahli Gizi Sigit Novriyanto · Jadwal &amp; Layanan</title>
<meta property="og:description" content="dr. Sigit Novriyanto · Dokter Umum · JL. TIRTO. Lihat jadwal praktik dan buat janji periksa online.">
```

#### 4. Tombol yang muncul sesuai data

```php
<?php if (!$bookingEnabled): ?>
        <p class="…">📵 Booking online sedang ditutup. Silakan hubungi praktik langsung.</p>
<?php elseif ($bookingUrl): ?>
        <a class="btn btn-primary btn-big" href="<?= e($bookingUrl) ?>">📅 Buat janji periksa</a>
<?php else: ?>
        <span class="btn btn-primary btn-big pointer-events-none opacity-60" aria-disabled="true">📅 Buat janji periksa</span>
<?php endif; ?>
<?php if ($chatUrl): ?>
        <a class="btn btn-wa" href="<?= e($chatUrl) ?>" target="_blank" rel="noopener">💬 Chat praktik via WhatsApp</a>
<?php endif; ?>
```

- **Buat janji periksa** menuju halaman booking yang sudah ada (`../html/book.html?p=…`). Kalau nakes menutup booking online, tombol diganti pesan kuning. Pada contoh praktik, tombolnya hanya pajangan.
- **Chat via WhatsApp** hanya muncul kalau praktik mengisi nomor. Link `wa.me` dibuat `waLink()`, yang mengubah `0821…` menjadi `62821…`.

### Hasil di halaman

Contoh praktik di HP (lebar 360px), Selasa 13 Oktober 2026:

```
┌───────────────────────────────────────┐
│ 👀 Ini contoh tampilan. Profil praktik│
│ asli dibuka lewat praktik.php?p= + …  │
├───────────────────────────────────────┤
│ ┌────┐ Praktik Bidan Sehati           │
│ │ 🤰 │ Bidan Siti Aminah · Bidan      │
│ └────┘                                │
│ ● Sedang buka                         │
│ 📍 Jl. Melati No. 12, Sleman          │
│ ┌───────────────────────────────────┐ │
│ │ 🕒 Hari ini (Selasa) praktik pukul│ │
│ │ 08.00–12.00.                      │ │
│ └───────────────────────────────────┘ │
│ [       📅 Buat janji periksa       ] │
├───────────────────────────────────────┤
│ 🗓️ Jadwal praktik                     │
│ Senin                    08.00–12.00  │
│                          16.00–20.00  │
│ Selasa [Hari ini]        08.00–12.00  │  ← oranye
│ Rabu                     08.00–12.00  │
│                          16.00–20.00  │
│ Kamis                    16.00–20.00  │
│ Jumat                    08.00–11.00  │
│ Sabtu                    08.00–12.00  │
│ Minggu                         Tutup  │
├───────────────────────────────────────┤
│ 🩺 Layanan                            │
│ 7 layanan Bidan. Pilih salah satu …   │
│ (1) Periksa Kehamilan                 │
│ (2) KB                                │
│ (3) Imunisasi Anak                    │
│ (4) Periksa Bayi & Balita             │
│ (5) Persalinan                        │
│ (6) Nifas                             │
│ (7) Konsultasi                        │
├───────────────────────────────────────┤
│        Dibuat dengan NAKESA ✻         │
│ Halaman dibuat oleh PHP di server ·   │
│ Selasa, 13 Oktober 2026, 17.32 WIB    │
└───────────────────────────────────────┘
```

### Penjelasan

- **`<?php foreach (…): ?> … <?php endforeach; ?>`** adalah gaya penulisan PHP di dalam HTML. Isinya tetap HTML biasa, jadi lebih mudah dibaca daripada `echo "<li>…</li>"` yang panjang.
- **Jam di bawah halaman** ("Halaman dibuat oleh PHP di server · … 17.32 WIB") dibuat `indonesianDateTime()` setiap kali halaman diminta. Jamnya berubah setiap reload, sebagai bukti HTML dibuat baru oleh server. Nama hari dan bulan diambil dari array `DAYS` dan `MONTHS`, karena `date()` bawaan PHP memakai bahasa Inggris.
- **Publishable key di `data.php` aman.** Key ini sama dengan yang sudah ada di `js/config.js`. Data tetap dilindungi Row Level Security, dan `get_public_practice` hanya mengembalikan data yang boleh dilihat pasien (tanpa data pasien atau keuangan). *Secret key* tidak pernah ditaruh di kode.
- **Contoh praktik sengaja tidak punya nomor WhatsApp**, supaya saat demo tidak ada pesan yang terkirim ke nomor orang lain.

### Checklist (sesuai slide Task 03)

- [x] **Data berasal dari PHP:** array di `data.php` atau data Supabase yang diambil oleh PHP.
- [x] **Loop digunakan:** `foreach` untuk layanan dan jadwal.
- [x] **Output HTML berhasil:** View Source sudah berisi semua `<li>` dan `<tr>`.
- [x] **Tampilan tetap sesuai desain:** memakai komponen NAKESA yang sama, mode terang dan gelap.
- [x] **Tidak merusak halaman:** tidak ada halaman lama yang diubah. Halaman booking dan dashboard tetap seperti sebelumnya.

---

## Demo: Show Your Server-Side Process

```
BROWSER              PHP REQUEST                  PHP PROCESS                       HTML OUTPUT             NAKESA PAGE
Pasien membuka   →   GET /php/praktik.php     →   baca ?p= → Supabase →        →    <h1>Praktik …</h1>  →   Profil praktik
link praktik         ?p=4dafb47bcd                variable, if, foreach,            <tr>…</tr> <li>…</li>   tampil di HP
                                                  function
```

| Pertanyaan (slide Demo) | Jawaban |
|---|---|
| **1. Apa yang diproses menggunakan PHP?** | Profil praktik publik: membaca kode praktik dari URL, mengambil data praktik dari Supabase, mengelompokkan jadwal per hari, menentukan status hari ini, menyusun daftar layanan sesuai profesi, membuat link WhatsApp, serta judul dan pratinjau link |
| **2. Variable apa yang digunakan?** | `$slug`, `$practice`, `$practiceName`, `$practitioner`, `$professionLabel`, `$address`, `$phone`, `$isOpen`, `$bookingEnabled`, `$today`, `$hoursByDay`, `$todayText`, `$services`, `$bookingUrl`, `$chatUrl`, `$pageTitle`, `$generatedAt` |
| **3. Bagaimana conditional/loop digunakan?** | **Conditional:** contoh atau praktik asli, praktik ditemukan atau tidak, buka/tutup, hari ini atau bukan, hari tutup, booking dibuka/ditutup, ada nomor WhatsApp atau tidak. **Loop:** `foreach` mengelompokkan sesi, membuat 7 baris jadwal, dan membuat daftar layanan; `for` mencari hari buka berikutnya |
| **4. Apa yang dihasilkan PHP?** | Satu dokumen HTML lengkap: `<title>` dan meta pratinjau, kartu identitas, tabel jadwal, daftar layanan, dan jam pembuatan halaman. Kode PHP-nya sendiri tidak pernah sampai ke browser |
| **5. Apa perbedaan proses PHP dengan JavaScript?** | Lihat tabel di bawah |

### PHP (Week 5) vs JavaScript (Week 4)

| | JavaScript: kartu Libur Nasional (Week 4) | PHP: Profil Praktik (Week 5) |
|---|---|---|
| **Dijalankan di** | Browser pengguna | Server |
| **Kapan** | Setelah halaman terbuka | Sebelum halaman dikirim |
| **View Source** | `<ul id="holiday-list"></ul>` masih **kosong** | Sudah **berisi** nama praktik, 7 baris jadwal, semua layanan |
| **Tab Network di browser** | Ada request ke `calendar.json` (API) | Hanya ada `praktik.php`. Request ke Supabase dilakukan server, jadi tidak terlihat di browser |
| **Loading** | Perlu spinner, karena data datang belakangan | Tidak perlu spinner, halaman datang sudah lengkap |
| **Pratinjau link WhatsApp / mesin pencari** | Tidak melihat data (tidak menjalankan JavaScript) | Melihat judul dan deskripsi praktik |
| **Kalau gagal** | Pesan error + Coba Lagi di dalam kartu | Halaman error dengan kode HTTP yang benar (`404` / `503`) |
| **Cocok untuk** | Bagian interaktif yang berubah tanpa reload (dashboard) | Halaman publik yang dibagikan dan isinya sama untuk semua pengunjung |

### Cara mendemokan

1. **Jalankan server:** di Terminal, dari folder proyek, ketik `php -S localhost:8000`.
2. **Buka contoh:** `http://localhost:8000/php/praktik.php`. Contoh ini jalan tanpa internet, karena datanya ada di `data.php`.
3. **Bukti HTML dibuat server:**
   - Tekan **Cmd+Option+U** (*View Page Source*). Semua isi (nama praktik, `<tr>` jadwal, `<li>` layanan) sudah ada di sumber halaman, dan tidak ada satu pun `<?php`.
   - Bandingkan dengan Beranda Week 4: di sana `holiday-list` masih kosong di View Source.
   - **Reload** halaman: jam di bagian bawah ikut berubah.
4. **Praktik asli:** buka `http://localhost:8000/php/praktik.php?p=4dafb47bcd`.
   - Tekan **F12** → tab **Network** → reload. Hanya ada satu dokumen, `praktik.php?p=4dafb47bcd` (`200 OK`), dan **tidak ada** request ke `supabase.co` dari browser.
   - Di Terminal tempat `php -S` berjalan, muncul log request yang diterima server.
   - Supaya tabel jadwal terisi, atur dulu jam praktik di menu **Praktik** NAKESA. Saat ini kedua praktik di database belum punya jadwal, jadi tampil "Jadwal praktik belum diatur".
5. **Satu file, isi berbeda:** ganti menjadi `?p=a763f4e5c8`. Ikon, nama, gelar (drg.), status (Sedang tutup), dan daftar layanan dokter gigi ikut berubah.
6. **Tidak ditemukan:** buka `?p=salah123`. Muncul 🔍 "Profil praktik tidak ditemukan", dan Network menunjukkan status `404`.
7. **Gagal terhubung:** di `php/data.php`, ubah sementara `SUPABASE_URL` menjadi alamat yang salah (misalnya tambahkan huruf `x` setelah `fmmudgdkyihbyxntutit`), simpan, lalu reload `?p=4dafb47bcd`.
   - Muncul ⚠️ "Data praktik tidak bisa dimuat" + tombol **Coba lagi**, dan Network menunjukkan status `503`.
   - Terminal menampilkan penyebab teknisnya: `[praktik.php] Supabase tidak bisa dihubungi: Could not resolve host: …`.
   - Kembalikan alamatnya, lalu tekan **Coba lagi**: data tampil lagi.
   - Mematikan Wi-Fi juga bisa, tetapi tampilan bisa menjadi polos karena Tailwind CDN juga butuh internet.
8. **Matikan JavaScript** (DevTools → **Cmd+Shift+P** → ketik *Disable JavaScript* → reload). Teks nama praktik, jadwal, dan layanan **tetap ada** karena dibuat PHP. Yang hilang hanya gayanya, karena Tailwind CDN di NAKESA berjalan dengan JavaScript.

---

## Review: Is PHP Working?

- [x] **PHP berjalan:** `php -S` melayani `praktik.php` dengan `200 OK`.
- [x] **Variable digunakan:** identitas praktik, jadwal, dan layanan disimpan di variabel.
- [x] **Conditional/loop bekerja:** baris "Hari ini", hari "Tutup", 7 baris jadwal, dan daftar layanan sesuai profesi.
- [x] **Output HTML benar:** semua teks dari database di-*escape* dengan `e()`, dan struktur HTML-nya sama dengan halaman NAKESA lain.
- [x] **Struktur halaman tetap baik:** sudah dicek di lebar HP 360px, mode terang dan gelap.
- [x] **Tidak ada error:** `php -l` lulus, log server bersih (tidak ada *warning* atau *deprecated*).

### Pertanyaan Review: Bagian mana dari NAKESA yang paling tepat diproses menggunakan PHP?

**Halaman publik untuk pasien**, yaitu Profil Praktik (dan nantinya halaman booking), karena:

1. Linknya **dibagikan lewat WhatsApp**. Pratinjau link hanya membaca HTML awal, jadi isinya harus sudah jadi dari server.
2. **Isinya sama untuk semua pengunjung** dan tidak butuh login, jadi cocok disusun sekali di server.
3. **Pasien memakai HP dengan sinyal yang beragam.** HTML yang sudah jadi langsung bisa dibaca tanpa menunggu JavaScript mengambil data.

Sebaliknya, **dashboard nakes** (Beranda, Pasien, Keuangan, Obat) tetap lebih cocok di client-side dengan JavaScript + Supabase. Datanya pribadi untuk setiap nakes (dijaga oleh login dan Row Level Security), sering berubah, dan perlu interaktif tanpa reload.

---

## Pengujian yang dilakukan

| Pengujian | Cara | Hasil |
|---|---|---|
| Sintaks PHP | `php -l` untuk semua file di `php/` (juga ditambahkan ke CI) | Lulus |
| Sintaks JavaScript | `node --check` untuk semua file di `js/` (sama dengan CI) | Lulus |
| Referensi file | `node .github/scripts/check-refs.mjs`, sekarang ikut memeriksa `src`/`href` di file `.php` | Lulus. Sudah dicoba dengan file rusak: error terdeteksi |
| Contoh praktik | `GET /php/praktik.php` | `200`, jadwal 7 hari + 7 layanan bidan |
| Praktik asli | `?p=4dafb47bcd` dan `?p=a763f4e5c8` | `200`, data sesuai database (nama, gelar dr./drg., buka/tutup, WhatsApp) |
| Praktik tidak ada | `?p=zzzz9999` | `404` + pesan "tidak ditemukan" |
| Input aneh | `?p=BAD<slug` dan `?p[]=x` | `404` (tanpa memanggil Supabase) dan `200` contoh praktik, tanpa error PHP |
| Supabase tidak bisa dihubungi | Salinan file dengan alamat Supabase yang salah | `503` + pesan ramah + Coba lagi; log server: "Could not resolve host" |
| `todaySummary()` | Dipanggil untuk Minggu, Senin, Kamis, Sabtu, jadwal kosong, dan praktik yang hanya buka Rabu | Kalimat sesuai tabel di Task 02 |
| XSS | `e('<script>alert(1)</script> & "x" \'y\'')` | `&lt;script&gt;…&amp; &quot;x&quot; &#039;y&#039;` |
| Profesi kosong | `professionOf(null)` | Sempat muncul *deprecated* di PHP 8.5 ("Using null as an array offset"). Diperbaiki menjadi `PROFESSIONS[$key ?? 'lainnya']` |
| Tampilan | Chrome, lebar 360px, mode terang dan gelap | Rapi, tidak ada teks yang keluar dari kartu |

---

## Sprint 04: Completion Checklist

- [x] PHP setup (`php -S localhost:8000`)
- [x] PHP syntax (`<?php ?>`, `<?= ?>`, `echo`)
- [x] Variable
- [x] Conditional
- [x] Loop
- [x] Function
- [x] Server-side processing
- [x] Dynamic HTML
- [x] Test
- [x] Commit (`ceb4855` — "PHP")
- [x] Push (ke `origin/main`, CI hijau termasuk job baru `php-syntax`)
- [x] Ready for demo

**Output:** halaman Profil Praktik NAKESA yang dibuat di server dengan PHP.

---

## Catatan

- **Layanan diambil dari daftar bawaan profesi**, sama seperti halaman booking (`book.html`). Fungsi database `get_public_practice` belum mengirim layanan dan harga yang diatur sendiri oleh nakes di menu *Layanan*. Kalau nanti fungsi itu ditambah, cukup `$services` yang diganti.
- **Hosting:** NAKESA saat ini berupa situs statis, jadi halaman PHP butuh server yang menjalankan PHP (`php -S` atau XAMPP untuk lokal, atau hosting PHP). Pratinjau link di WhatsApp baru bisa dicoba setelah halaman ini online, karena WhatsApp tidak bisa membuka `localhost`.

---

## Ringkasan

| Task | Materi | Penerapan di NAKESA (Profil Praktik) |
|---|---|---|
| 01 — Create PHP Page | `<?php ?>`, `<?= ?>`, variable, function | `praktik.php`: identitas praktik dari variabel (`$practiceName`, `$practitioner`, `$isOpen`, …) dan `openLabel()` |
| 02 — Process Data with PHP | Array, conditional, loop, operator | `groupHoursByDay()` dan `todaySummary()`: jadwal dikelompokkan per hari, baris "Hari ini" dan "Tutup", kalimat kapan buka lagi |
| 03 — Dynamic Server-Side Content | `foreach` → HTML, data dari server | Daftar layanan dari array, satu file untuk semua praktik (`?p=` → `fetchPractice()` ke Supabase), judul dan pratinjau link, halaman 404/503 |

---

## Perubahan File: Ditambah & Dimodifikasi

### File yang ditambahkan (baru)

| File | Isi | Untuk task |
|---|---|---|
| `php/data.php` | **DATA:** konstanta Supabase (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`), `DAYS`, `WEEK_ORDER`, `MONTHS`, `PROFESSIONS` (9 profesi + layanannya), dan `$samplePractice` (contoh praktik) | 02, 03 |
| `php/functions.php` | **PROCESS:** `e()`, `professionOf()`, `titledName()`, `openLabel()`, `shortTime()`, `groupHoursByDay()`, `todaySummary()`, `waLink()`, `indonesianDateTime()`, `fetchPractice()` | 01, 02, 03 |
| `php/praktik.php` | **OUTPUT:** halaman Profil Praktik: baca `?p=`, siapkan variabel, cetak HTML (kartu identitas, jadwal, layanan, halaman 404/503) | 01, 02, 03 |
| `Exercise week/Week5.md` | Laporan ini | — |

### File yang dimodifikasi

#### 1. `.github/workflows/ci.yml`: tambah job `php-syntax`

Supaya setiap push dan pull request juga memeriksa sintaks PHP, seperti `node --check` untuk JavaScript.

**Sebelum:** hanya ada dua job, `js-syntax` dan `check-refs`.

```yaml
jobs:
  js-syntax:
    # … (tidak berubah)

  check-refs:
    # … (tidak berubah)
```

**Sesudah:** ada job baru di antara keduanya.

```yaml
jobs:
  js-syntax:
    # … (tidak berubah)

  php-syntax:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Cek sintaks semua file PHP
        run: |
          php --version
          find php -name '*.php' -print0 | xargs -0 -n1 php -l

  check-refs:
    # … (tidak berubah)
```

> Runner `ubuntu-latest` di GitHub Actions sudah berisi PHP, jadi tidak perlu langkah instalasi.

#### 2. `.github/scripts/check-refs.mjs`: ikut memeriksa file `.php`

Sebelumnya skrip ini hanya memeriksa `src`/`href` di file `.html`. Sekarang file `.php` ikut diperiksa, sehingga kalau `praktik.php` salah menulis alamat `../js/theme.js` atau `../html/book.html`, CI akan gagal. Atribut yang isinya dibuat PHP (`href="<?= … ?>"`) dilewati karena alamatnya baru diketahui saat halaman dijalankan.

**Sebelum:**

```js
// Pastikan setiap src/href lokal di HTML dan setiap import relatif di JS menunjuk ke file yang ada.
…
const isLocal = (u) => u && !/^(https?:|\/\/|#|mailto:|tel:|data:|javascript:|\$\{)/.test(u);
…
  if (file.endsWith('.html')) refs = [...src.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]);
```

**Sesudah:**

```js
// Pastikan setiap src/href lokal di HTML/PHP dan setiap import relatif di JS menunjuk ke file yang ada.
…
const isLocal = (u) => u && !/^(https?:|\/\/|#|mailto:|tel:|data:|javascript:|\$\{|<\?)/.test(u);
…
  if (/\.(html|php)$/.test(file)) refs = [...src.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]);
```

| Baris | Perubahan |
|---|---|
| Komentar | "HTML" → "HTML/PHP" |
| `isLocal` | Tambah `<\?`: alamat yang diawali `<?` (dibuat PHP) tidak diperiksa |
| Pemilihan file | `file.endsWith('.html')` → `/\.(html\|php)$/.test(file)`: file `.html` **dan** `.php` |

### File yang tidak diubah

- Semua halaman NAKESA yang sudah ada (`html/*.html`, `js/pages/*.js`) tetap sama. `praktik.php` hanya **memakai** `js/theme.js` dan `js/tailwind-setup.js` yang sudah ada, dan menautkan ke `html/book.html` untuk booking.
- Database Supabase tidak diubah: `praktik.php` memakai fungsi `get_public_practice` yang sudah ada sejak halaman booking dibuat.
