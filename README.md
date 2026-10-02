# NAKESA — Digital Practice Management

Aplikasi web untuk mengelola **praktik mandiri tenaga kesehatan** di Indonesia: bidan, dokter umum, dokter gigi, dokter spesialis, perawat, fisioterapis, psikolog, ahli gizi, dan profesi kesehatan lain. Satu akun untuk satu praktik: pemilik praktik bisa mencatat pasien, menerima booking online, memantau stok obat, dan mencatat keuangan langsung dari HP.

Prinsip desainnya:

- **Bahasa Indonesia** sehari-hari yang sopan di seluruh aplikasi.
- **Mobile-first** dan **sederhana**: tombol besar, langkah sedikit, mudah dipakai orang yang tidak terbiasa dengan teknologi.
- **Berpusat di WhatsApp**: link booking dibagikan lewat WhatsApp, dan pasien dihubungi lewat link `wa.me`.
- **Menyesuaikan profesi**: warna dan pilihan layanan mengikuti profesi pengguna (misalnya bidan: warna pink, layanan Periksa Kehamilan, KB, Imunisasi Anak).

## Fitur

| Menu | Fungsi |
|---|---|
| **Beranda** (dashboard) | Ringkasan hari ini, sakelar buka/tutup praktik, dan tombol bagikan link booking ke WhatsApp |
| **Booking** | Janji temu dari pasien (online atau dicatat manual). Status: baru → dikonfirmasi → selesai / batal |
| **Pasien** | Data pasien, pencarian, riwayat kunjungan, dan tombol hubungi lewat WhatsApp |
| **Obat** | Stok obat dengan peringatan menipis, habis, dan kedaluwarsa |
| **Keuangan** | Uang masuk & keluar per bulan, pencarian, dan rincian per kategori |
| **Praktik** | Data praktik, jam praktik per hari, dan pengaturan booking online |

**Halaman booking publik** (`html/book.html?p=<slug>`): pasien bisa membuat janji **tanpa login**. Mereka melihat nama praktik, profesi, alamat, dan jam praktik, lalu mengisi nama, nomor WhatsApp, tanggal, jam, layanan, dan keluhan.

**Alur akun:** Sambutan → Daftar / Masuk (email + kata sandi, atau Google) → Onboarding (nama → profesi → data praktik) → Dashboard. Tersedia juga lupa dan atur ulang kata sandi, serta mode terang/gelap.

## Teknologi

- **Frontend:** HTML + CSS + JavaScript murni (ES modules), **tanpa framework dan tanpa build step**. Tampilan memakai Tailwind CSS (Play CDN) dengan konfigurasi dan komponen bersama di `js/tailwind-setup.js`; halaman Beranda publik memakai `css/index.css`.
- **Backend:** [Supabase](https://supabase.com) (Auth + Postgres). Tidak ada server sendiri; semua akses data dilindungi Row Level Security.
- **Zona waktu:** Asia/Jakarta (WIB).

## Menjalankan di lokal

Halaman memakai ES modules, jadi harus dibuka lewat server lokal (bukan `file://`).

1. Clone repo ini.
2. Jalankan server statis di folder repo, misalnya:
   - VS Code **Live Server** (port 5501 sudah diatur di `.vscode/settings.json`), atau
   - `python3 -m http.server 5501`
3. Buka `http://localhost:5501/`. Halaman akan diarahkan ke `html/index.html`.

Koneksi ke Supabase diatur di `js/config.js` (URL project dan *publishable key*, yang memang aman dipakai di frontend). Metode login bisa dinyalakan/dimatikan lewat `AUTH_PROVIDERS` di file yang sama. Kalau login Google atau tautan dari email tidak kembali ke alamat lokal, tambahkan alamat tersebut ke **Redirect URLs** di Supabase (Authentication → URL Configuration).

## Struktur folder

```
html/                 Satu file per halaman (index, welcome, login, signup, onboarding, dashboard, …, book)
js/                   Modul bersama: auth, db, shell (kerangka halaman), professions, format, validation, errors, ui, theme
js/pages/             Logika per halaman, nama file sama dengan halamannya
css/index.css         Gaya halaman Beranda publik
supabase/migrations/  Skema database, Row Level Security, dan fungsi publik
Exercise week/        Dokumentasi tugas mingguan dan konteks aplikasi
.github/              Template issue/PR, workflow CI, dan skrip pengecekan
```

## Database

Semua tabel di skema `public` memakai **Row Level Security**: setiap pengguna hanya bisa membaca dan mengubah datanya sendiri (`owner_id = auth.uid()`).

| Tabel | Isi |
|---|---|
| `profiles` | Profil pengguna (nama, email, profesi), dibuat otomatis oleh trigger saat mendaftar |
| `practices` | Satu praktik per pengguna, dengan `booking_slug` untuk link booking publik |
| `patients` | Data pasien |
| `bookings` | Janji temu (`status`: baru/dikonfirmasi/selesai/batal, `source`: online/manual) |
| `medicines` | Stok obat |
| `transactions` | Keuangan (`kind`: masuk/keluar, `amount` dalam rupiah bulat) |
| `practice_hours` | Jam praktik (hari 0 = Minggu … 6 = Sabtu, bisa beberapa sesi per hari) |

Fungsi publik untuk halaman booking (bisa dipanggil tanpa login): `get_public_practice(slug)` dan `create_booking(...)`.

## Alur kerja tim

Pekerjaan dicatat sebagai issue user story, dikerjakan di branch terpisah, lalu masuk ke `main` lewat pull request yang dicek CI dan di-review teman. Aturan lengkapnya ada di **[CONTRIBUTING.md](CONTRIBUTING.md)**, dan daftar pekerjaannya ada di tab **Issues** (milestone `MVP` dan `Rilis 1`).

## Dokumentasi tugas

- [`Exercise week/Week3.md`](Exercise%20week/Week3.md): Week 3, JavaScript & DOM serta Tailwind CSS.
- [`Exercise week/NAKESA-CONTEXT.md`](Exercise%20week/NAKESA-CONTEXT.md): ringkasan konteks aplikasi.
