# Week 5 — PHP Prosedural: Halaman Fitur & Profesi NAKESA

**Nama:** Aditiya Al Bayhaqy
**Proyek:** NAKESA — aplikasi manajemen praktik mandiri tenaga kesehatan
**Issue:** [#42](https://github.com/DevJamHub/Nakesa/issues/42) · **Milestone:** Week 5 — PHP Prosedural (Sprint 04)
**Halaman yang dikerjakan:** `php/fitur.php` (baru), dengan `php/data-fitur.php` dan `php/functions-fitur.php` (baru)

Bagian Sigit di Week 5 adalah halaman **Profil Praktik** untuk pasien ([`Week5.md`](Week5.md), [#41](https://github.com/DevJamHub/Nakesa/issues/41)). Bagian saya adalah halaman PHP kedua, **Fitur & Profesi**, untuk calon pengguna (nakes yang belum mendaftar): apa saja fitur NAKESA, statusnya, dan profesi apa saja yang didukung. Halaman Sigit dan halaman NAKESA lain **tidak diubah**. Halaman ini hanya memakai `data.php` dan `functions.php` milik Sigit lewat `require`, jadi daftar profesinya tetap satu sumber.

### Dari PresidenKu ke NAKESA

| PresidenKu (slide) | NAKESA (halaman Fitur & Profesi) |
|---|---|
| Nama Presiden, Periode | Nama aplikasi, tagline, mata kuliah, tim: `$appName`, `$tagline`, `$course`, `$team` |
| Status Program: Berjalan | Status aplikasi: `$appStatus` (dari `$isActive`) |
| Data program: No · Program | Tabel **Semua fitur**: No · Fitur · Menu · Status · Week (`$features`) |
| `getProgramStatus($status)` | `statusBadge($status)` → Tersedia / Baru minggu ini / Sedang direview |
| Kartu Program Prioritas | Kartu **Fitur unggulan** dan kartu **Profesi yang didukung** |

## Menjalankan

```bash
php -S localhost:8000          # dari folder proyek
# buka http://localhost:8000/php/fitur.php
```

Sama seperti `praktik.php`, halaman ini harus dibuka lewat server yang menjalankan PHP (`php -S`, XAMPP), bukan Live Server.

## Struktur file: DATA → PROCESS → OUTPUT

```
php/
├── data-fitur.php       DATA     konstanta STATUS_* dan array multidimensi $features (13 fitur)
├── functions-fitur.php  PROCESS  statusBadge(), countByStatus(), featuredOnly(), totalServices(), servicePreview()
└── fitur.php            OUTPUT   variabel halaman, olah data, cetak HTML
```

`fitur.php` juga memuat `data.php` (daftar `PROFESSIONS`) dan `functions.php` (`e()`, `indonesianDateTime()`) dari bagian Sigit.

## Task 01 — Create PHP Page

Variabel identitas aplikasi di bagian atas `fitur.php`, lalu dicetak ke kartu pertama:

```php
$appName = 'NAKESA';
$tagline = 'Digital Practice Management';
$course = 'Pemrograman Web';
$team = ['Sigit Novriyanto', 'Aditiya Al Bayhaqy'];
$currentWeek = 5;
$isActive = true;
$appStatus = $isActive ? 'Aktif dikembangkan' : 'Selesai';
```

```php
<h1 id="app-name"><?= e($appName) ?></h1>
<p><?= e($tagline) ?></p>
<p>Tim: <?= e(implode(' & ', $team)) ?></p>
```

`e()` (dari `functions.php`) mengamankan teks dengan `htmlspecialchars()` sebelum masuk ke HTML.

## Task 02 — Process Data with PHP

**Array multidimensi.** Setiap fitur adalah array di dalam array `$features`:

```php
$features = [
    [
        'name' => 'Booking online lewat link', 'icon' => '📅', 'menu' => 'Booking',
        'description' => 'Pasien membuat janji dari link yang dibagikan lewat WhatsApp, tanpa perlu login.',
        'status' => STATUS_TERSEDIA, 'week' => 2, 'unggulan' => true,
    ],
    // … 12 fitur lainnya
];
```

Isi daftar ini sesuai riwayat git dan issue: fitur yang sudah ada di `main` berstatus *tersedia*, halaman Profil Praktik Sigit berstatus *baru* (Week 5), dan fitur yang PR-nya masih direview berstatus *review*.

**Conditional: status → badge.**

```php
function statusBadge(string $status): array
{
    if ($status === STATUS_TERSEDIA) {
        return ['label' => 'Tersedia', 'class' => 'badge-green'];
    } elseif ($status === STATUS_BARU) {
        return ['label' => 'Baru minggu ini', 'class' => 'badge-blue'];
    } elseif ($status === STATUS_REVIEW) {
        return ['label' => 'Sedang direview', 'class' => 'badge-orange'];
    }
    return ['label' => 'Belum diketahui', 'class' => 'badge-gray'];
}
```

**Loop dengan penomoran.** Tabel *Semua fitur* memakai `for`, dan nomornya `$i + 1`:

```php
<?php for ($i = 0; $i < $featureTotal; $i++): ?>
<?php $feature = $features[$i]; $badge = statusBadge($feature['status']); ?>
  <tr>
    <td><?= $i + 1 ?></td>
    <td><?= e($feature['name']) ?></td>
    <td><span class="badge <?= $badge['class'] ?>"><?= e($badge['label']) ?></span></td>
    <td><?= $feature['week'] ?></td>
  </tr>
<?php endfor; ?>
```

**Angka ringkasan** dihitung dengan loop di `countByStatus()` dan `totalServices()`: 10 fitur tersedia (9 tersedia + 1 baru), 3 sedang direview, 8 profesi, 34 layanan bawaan.

## Task 03 — Build Dynamic Server-Side Content

Dua grid kartu dibuat PHP dari array, bukan ditulis satu per satu di HTML:

1. **Fitur unggulan** (pengganti *Program Prioritas* di slide): `featuredOnly($features)` mengambil fitur dengan `'unggulan' => true`, lalu `foreach` mencetak satu `<article>` per fitur, lengkap dengan ikon, badge status, dan deskripsi.
2. **Profesi yang didukung:** `foreach (PROFESSIONS …)` dari `data.php` mencetak satu kartu per profesi dengan jumlah layanan dan contoh layanannya (`servicePreview()`). Pilihan "Lainnya" dikeluarkan dengan `unset()` karena bukan profesi.

Kalau satu fitur ditambahkan ke `$features`, baris tabel, angka ringkasan, dan kartunya ikut bertambah tanpa mengubah HTML.

## Pengujian

| Cek | Hasil |
|---|---|
| `php -l` semua file di `php/` (sama dengan job CI `php-syntax`) | Tidak ada error |
| `node .github/scripts/check-refs.mjs` | Semua referensi valid |
| Dibuka lewat `php -S` di Chromium, HP 390 px dan desktop 1280 px, terang dan gelap | 24/24 cek lolos: HTTP 200, tidak ada kode PHP yang ikut terkirim, 13 baris bernomor 1–13, badge 9/1/3, 6 kartu fitur unggulan, 8 kartu profesi, tanpa scroll ke samping, tanpa error di console |
| Halaman Profil Praktik (`praktik.php`) | Tetap berjalan; tombol "Lihat contoh profil praktik" membukanya |

## Perubahan file

| File | Status | Isi |
|---|---|---|
| `php/fitur.php` | Baru | Halaman Fitur & Profesi (OUTPUT) |
| `php/data-fitur.php` | Baru | Data fitur dan status (DATA) |
| `php/functions-fitur.php` | Baru | Fungsi badge, hitung status, kartu (PROCESS) |
| `Exercise week/Week5-Bayhaqy.md` | Baru | Dokumentasi ini |

## Pertanyaan diskusi (slide Demo)

1. **Apa yang diproses PHP?** Daftar fitur dan profesi: dihitung, diberi nomor, diberi badge, dan disusun jadi tabel serta kartu.
2. **Variabel apa yang dipakai?** `$appName`, `$tagline`, `$team`, `$appStatus`, `$features`, `$statusCounts`, `$professions`.
3. **Bagaimana conditional/loop dipakai?** `if / elseif / else` di `statusBadge()`; `for` untuk tabel bernomor; `foreach` untuk kartu dan hitungan.
4. **Apa yang dihasilkan PHP?** HTML jadi. Browser tidak menerima kode PHP sama sekali.
5. **Bedanya dengan JavaScript?** JavaScript (Week 3–4) berjalan di browser setelah halaman dimuat; PHP berjalan di server sebelum halaman dikirim, jadi isinya sudah ada saat halaman pertama kali terbuka.
