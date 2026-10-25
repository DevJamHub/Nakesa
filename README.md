# NAKESA — Digital Practice Management

Aplikasi web untuk mengelola **praktik mandiri tenaga kesehatan** di Indonesia: bidan, dokter umum, dokter gigi, dokter spesialis, perawat, fisioterapis, psikolog, ahli gizi, dan profesi kesehatan lain. Pemilik praktik bisa mencatat pasien, menerima booking online, menulis resep, memantau stok obat, dan mencatat keuangan langsung dari HP. Pasien membuat janji lewat link booking (tanpa login).

Prinsip desainnya:

- **Bahasa Indonesia** sehari-hari yang sopan di seluruh aplikasi.
- **Mobile-first** dan **sederhana**: tombol besar, langkah sedikit, mudah dipakai orang yang tidak terbiasa dengan teknologi.
- **Berpusat di WhatsApp**: link booking dibagikan lewat WhatsApp, dan pasien dihubungi lewat link `wa.me`.
- **Menyesuaikan profesi**: warna dan pilihan layanan mengikuti profesi pengguna (misalnya bidan: warna pink, layanan Periksa Kehamilan, KB, Imunisasi Anak).

## Fitur

| Menu | Fungsi |
|---|---|
| **Beranda** (dashboard) | Sapaan sesuai waktu, sakelar buka/tutup praktik, ringkasan dan pasien hari ini, grafik pemasukan 7 hari, hari libur nasional terdekat (API Hari Libur), dan link booking |
| **Booking** | Janji temu dari link booking atau dicatat manual. Status: baru → dikonfirmasi → selesai / batal. Jam booking mengikuti slot 30 menit di dalam jam praktik |
| **Pasien** | Data pasien, pencarian, riwayat kunjungan, dan tombol hubungi lewat WhatsApp |
| **Resep** | Resep per pasien; saat diselesaikan, stok obat berkurang otomatis (kedaluwarsa paling awal dulu) |
| **Obat** | Database obat dengan stok per batch, golongan obat, riwayat stok, peringatan menipis/habis dan akan kedaluwarsa |
| **Keuangan** | Uang masuk & keluar per bulan, pencarian, rincian per kategori, grafik tren 6 bulan, dan Buku Kas (saldo berjalan) yang bisa dicetak / disimpan sebagai PDF atau diunduh sebagai CSV |
| **Praktik** | Data praktik, jam praktik per hari, booking online, dan QR code link booking |
| **Layanan & Harga** | Layanan, harga, dan durasi yang tampil di link booking dan Profil Praktik |

**Halaman booking publik** (`html/book.html?p=<slug>`): pasien bisa membuat janji **tanpa login**. Mereka melihat nama praktik, profesi, alamat, jam praktik, dan layanan + harga, lalu mengisi nama, nomor WhatsApp, tanggal, jam (jam yang sudah lewat atau sudah dipesan dicoret), layanan, dan keluhan.

**Profil Praktik** (`php/praktik.php?p=<slug>`): halaman yang HTML-nya dibuat PHP di server (tugas Week 5–7).

**Alur akun:** Sambutan → Daftar / Masuk (email + kata sandi) → Onboarding (nama → profesi → data praktik) → Dashboard. Tersedia mode terang/gelap. Satu akun = satu praktik.

## Arsitektur (MVC, Week 7)

```
VIEW        html/*.html        tampilan (HTML + Tailwind)
            js/pages/*.js      interaksi DOM, fetch ke API lewat js/api.js, lalu menggambar data
CONTROLLER  api/*.php          pintu masuk request: membaca method HTTP, ?view= / ?action=, dan body
            app/Controller/    alur & proses tiap fitur: AuthController, BookingController, PatientController, …
MODEL       app/Model/         data dan aturannya (OOP): Auth, Account, Table, Inventory, PrescriptionBook, …
            data/              data yang tersimpan (file JSON per akun, tidak di-commit)
```

Alurnya: `REQUEST → api/bookings.php → BookingController::today() → Model Table (bookings) → data
→ JSON → js/pages/bookings.js menggambar html/bookings.html`.

Halaman profil praktik publik (`php/praktik.php`) dibuat PHP di server dengan MVC sendiri:

```
php/praktik.php     front controller
php/Controller/     PracticeController: index(), show(), process()
php/Model/          PracticeModel (mengambil data) + Practice, Profession, Schedule (object praktik)
php/View/           practice-page.php (template HTML)
```

## Teknologi

- **Frontend:** HTML + CSS + JavaScript murni (ES modules), **tanpa framework dan tanpa build step**. Tampilan memakai Tailwind CSS (Play CDN) dengan konfigurasi dan komponen bersama di `js/tailwind-setup.js`; halaman Beranda publik memakai `css/index.css`.
- **Backend:** PHP 8 tanpa library: API JSON di `api/*.php`, class Controller dan Model di `app/`, data disimpan sebagai file JSON per akun. Login memakai session PHP dan kata sandi di-hash (`password_hash`).
- **API eksternal:** [API Hari Libur](https://github.com/guangrei/APIHariLibur_V2) untuk hari libur nasional di Beranda (tanpa login dan tanpa API key).
- **Zona waktu:** Asia/Jakarta (WIB).

## Menjalankan di lokal

```
php -S localhost:8000 router.php
```

Buka http://localhost:8000/. Live Server atau `python3 -m http.server` tidak bisa dipakai, karena tidak menjalankan PHP.
`router.php` menjaga folder `app/` dan `data/` supaya tidak bisa dibuka dari browser (di XAMPP tugas ini dikerjakan `.htaccess`).

Saat pertama kali dibuka, data contoh di `app/data/contoh/` disalin ke `data/`. Untuk kembali ke data awal, hapus folder `data/`.

Unit test (Node.js 22 atau lebih baru): `node --test "tests/**/*.test.mjs"`.

### Akun demo

Kata sandi semua akun: `nakesa123`

| Email | Profesi | Praktik |
|---|---|---|
| siti@nakesa.test | Bidan | Praktik Bidan Sehati |
| andi@nakesa.test | Dokter Umum | Klinik Sehat Pratama |
| rina@nakesa.test | Dokter Gigi | Klinik Gigi Senyum Rina |
| budi@nakesa.test | Perawat | Rawat Luka & Home Care Budi |
| dewi@nakesa.test | Fisioterapis | Fisioterapi Dewi |
| maya@nakesa.test | Psikolog | Ruang Cerita Maya |

## Struktur folder

```
html/                 Satu file per halaman (index, welcome, login, signup, onboarding, dashboard, …, book)
js/                   Modul bersama: api, auth, db, shell (kerangka halaman), professions, format, validation, errors, ui,
                      theme, practice-utils, booking-slots, finance-trend, finance-report, roles, holidays, qr, …
js/pages/             Logika per halaman, nama file sama dengan halamannya
css/index.css         Gaya halaman Beranda publik
api/                  API JSON, satu file per jenis data (meneruskan request ke Controller)
app/Controller/       Controller API
app/Model/            Model: class data dan aturannya
app/schema.php        Aturan kolom setiap tabel (pengganti CHECK di database)
app/data/contoh/      Data awal 6 akun demo
php/                  Halaman PHP server-side: praktik.php (Profil Praktik, MVC) dan fitur.php (Fitur & Profesi)
docs/                 Rancangan sistem obat & resep (docs/sistem-obat.md)
tests/                Unit test (node --test) untuk modul di js/
Exercise week/        Dokumentasi tugas mingguan, peta per week, dan PDF demo
.github/              Template issue/PR, workflow CI, dan skrip pengecekan
```

## Data

Setiap akun punya folder sendiri `data/akun-<id>/`, satu file JSON per tabel. Class `Account` hanya membuka folder akun yang sedang login, jadi data antar-praktik tidak tercampur.

| Tabel | Isi |
|---|---|
| `users` | Akun (nama, email, profesi, hash kata sandi), di `data/users.json` |
| `practices` | Satu praktik per akun, dengan `booking_slug` untuk link booking publik |
| `patients` | Data pasien |
| `bookings` | Janji temu (`status`: baru/dikonfirmasi/selesai/batal, `source`: online/manual) |
| `practice_hours` | Jam praktik (hari 0 = Minggu … 6 = Sabtu, bisa beberapa sesi per hari) |
| `practice_services` | Layanan, harga, dan durasi |
| `medicines`, `medicine_batches` | Obat dan stok per batch (`Inventory::list()` menghitung status stok & kedaluwarsa) |
| `stock_movements` | Semua perubahan stok, tidak pernah dihapus |
| `prescriptions`, `prescription_items` | Resep dan obatnya |
| `transactions` | Keuangan (`kind`: masuk/keluar, `amount` dalam rupiah bulat) |
| `suppliers` | Supplier obat |

API untuk halaman booking (tanpa login): `api/public.php?slug=…` (profil praktik), `?view=slots&date=…` (jam yang masih bisa dipesan), dan `POST` untuk membuat booking.

## Alur kerja tim

Pekerjaan dicatat sebagai issue user story, dikerjakan di branch terpisah, lalu masuk ke `main` lewat pull request yang dicek CI dan di-review teman. Aturan lengkapnya (format issue, branch, commit, PR, CI, review, dan konvensi kode) ada di **[CONTRIBUTING.md](CONTRIBUTING.md)**.

| Ingin melihat | Buka |
|---|---|
| Daftar user story | [Issue berlabel `feature`](https://github.com/DevJamHub/Nakesa/issues?q=is%3Aissue%20label%3Afeature) |
| Semua pekerjaan (fitur, bug, dokumentasi, test) | [Issues](https://github.com/DevJamHub/Nakesa/issues?q=is%3Aissue) |
| Pekerjaan per pertemuan | [Milestones](https://github.com/DevJamHub/Nakesa/milestones?state=all) `Week 1`, `Week 2`, … dan peta per week di [`Exercise week/`](Exercise%20week/) |
| Papan kerja (Todo → In Progress → Review → Done) | [Nakesa Board](https://github.com/users/baybayyy26/projects/1) |
| Riwayat perubahan yang sudah masuk | [Pull request yang di-merge](https://github.com/DevJamHub/Nakesa/pulls?q=is%3Apr%20is%3Amerged) |

**Tim:** Sigit Novriyanto ([@DevJamHub](https://github.com/DevJamHub)) dan Aditiya Al Bayhaqy ([@baybayyy26](https://github.com/baybayyy26)).

## Dokumentasi tugas

- [`Exercise week/README.md`](Exercise%20week/README.md): peta pekerjaan per week (Week 1–5).
- [`Exercise week/Demo/Demo-NAKESA-tanpa-Supabase.pdf`](Exercise%20week/Demo/Demo-NAKESA-tanpa-Supabase.pdf): penjelasan & tutorial demo Week 1–7 (tanpa Supabase, MVC).
- [`Exercise week/NAKESA-CONTEXT.md`](Exercise%20week/NAKESA-CONTEXT.md): ringkasan konteks aplikasi.
