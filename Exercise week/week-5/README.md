# Week 5 — Sprint 04 — PHP Prosedural (Server-Side)

**Periode:** 13–19 Okt 2026 · **Milestone:** [Week 5](https://github.com/DevJamHub/Nakesa/milestone/7) · **Issue tugas:** [#41](https://github.com/DevJamHub/Nakesa/issues/41) (Sigit), [#42](https://github.com/DevJamHub/Nakesa/issues/42) (Bayhaqy) · **Kode:** tag `week-5` dibuat setelah PR #43 masuk `main`

## Materi

*From Client-Side to Server-Side.* Cara kerja PHP (request → web server → PHP process → HTML response), PHP prosedural (input → process → output), sintaks dasar, variabel, conditional, loop, function, dan PHP yang menghasilkan HTML.

## Tugas

- [x] Task 01 — Create PHP Page (variabel → HTML)
- [x] Task 02 — Process Data with PHP (array, conditional, loop)
- [x] Task 03 — Build Dynamic Server-Side Content (bagian halaman yang dibuat PHP)
- [x] Penjelasan: [`Week5.md`](../Week5.md) (Sigit) dan [`Week5-Bayhaqy.md`](../Week5-Bayhaqy.md) (Bayhaqy, di PR #43)

Pekerjaan dibagi dua halaman PHP yang berbeda, dengan Task 01–03 lengkap di masing-masing halaman:

| Halaman | Untuk | Isi yang dibuat PHP |
|---|---|---|
| `php/praktik.php` — Profil Praktik | Pasien | Identitas praktik, status buka/tutup, jadwal seminggu, daftar layanan, tombol booking & WhatsApp |
| `php/fitur.php` — Fitur & Profesi | Calon pengguna (nakes) | Identitas aplikasi, tabel fitur bernomor dengan badge status, grid kartu fitur unggulan dan profesi |

## Siapa mengerjakan apa

| Anggota | Pekerjaan | Bukti |
|---|---|---|
| Sigit Novriyanto (@DevJamHub) | Halaman Profil Praktik (`php/data.php`, `php/functions.php`, `php/praktik.php`), job CI `php-syntax`, `Week5.md`, PDF presentasi | ceb4855, 356a3a1 |
| Aditiya Al Bayhaqy (@baybayyy26) | Halaman Fitur & Profesi (`php/data-fitur.php`, `php/functions-fitur.php`, `php/fitur.php`), `Week5-Bayhaqy.md`; menggabungkan PR #21–#40 yang sudah disetujui ke satu branch; peta Week 5 ini | PR #43, PR gabungan (menunggu review) |

## File yang dikerjakan

| File | Status | Isi |
|---|---|---|
| [`php/data.php`](../../php/data.php) | Baru | Data profesi, hari, bulan, contoh praktik |
| [`php/functions.php`](../../php/functions.php) | Baru | Fungsi halaman Profil Praktik dan ambil data dari Supabase |
| [`php/praktik.php`](../../php/praktik.php) | Baru | Halaman Profil Praktik |
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | Diubah | Job `php-syntax` |
| [`.github/scripts/check-refs.mjs`](../../.github/scripts/check-refs.mjs) | Diubah | Ikut memeriksa file PHP |
| [`Exercise week/Week5.md`](../Week5.md) | Baru | Dokumentasi tugas Week 5 (Sigit) |
| `php/data-fitur.php`, `php/functions-fitur.php`, `php/fitur.php` | Baru (PR #43) | Halaman Fitur & Profesi |
| `Exercise week/Week5-Bayhaqy.md` | Baru (PR #43) | Dokumentasi tugas Week 5 (Bayhaqy) |

## Menjalankan halaman PHP

```bash
php -S localhost:8000                     # dari folder proyek
# http://localhost:8000/php/praktik.php   Profil Praktik (contoh)
# http://localhost:8000/php/fitur.php     Fitur & Profesi
```

Live Server tidak menjalankan PHP, jadi halaman `.php` harus dibuka lewat `php -S` atau XAMPP.
