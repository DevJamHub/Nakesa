# NAKESA — Digital Practice Management

Aplikasi web untuk mengelola **praktik mandiri tenaga kesehatan** di Indonesia: bidan, dokter umum, dokter gigi, dokter spesialis, perawat, fisioterapis, psikolog, ahli gizi, dan profesi kesehatan lain. Pemilik praktik bisa mencatat pasien, menerima booking online, menulis resep, memantau stok obat, dan mencatat keuangan langsung dari HP. Pasien membuat janji lewat link booking (tanpa login) atau lewat aplikasi pendamping **Nakesa Patient**.

Prinsip desainnya:

- **Bahasa Indonesia** sehari-hari yang sopan di seluruh aplikasi.
- **Mobile-first** dan **sederhana**: tombol besar, langkah sedikit, mudah dipakai orang yang tidak terbiasa dengan teknologi.
- **Berpusat di WhatsApp**: link booking dibagikan lewat WhatsApp, dan pasien dihubungi lewat link `wa.me`.
- **Menyesuaikan profesi**: warna dan pilihan layanan mengikuti profesi pengguna (misalnya bidan: warna pink, layanan Periksa Kehamilan, KB, Imunisasi Anak).

## Fitur

| Menu | Fungsi |
|---|---|
| **Beranda** (dashboard) | Sapaan sesuai waktu, sakelar buka/tutup praktik, ringkasan dan pasien hari ini, grafik pemasukan 7 hari, hari libur nasional terdekat (API Hari Libur), dan link booking |
| **Booking** | Janji temu dari link booking, Nakesa Patient, atau dicatat manual. Status: baru → dikonfirmasi → selesai / batal. Jam booking mengikuti slot 30 menit di dalam jam praktik |
| **Pasien** | Data pasien, pencarian, riwayat kunjungan, dan tombol hubungi lewat WhatsApp |
| **Resep** | Resep per pasien; saat diselesaikan, stok obat berkurang otomatis (kedaluwarsa paling awal dulu) |
| **Obat** | Database obat dengan stok per batch, golongan obat, riwayat stok, peringatan menipis/habis dan akan kedaluwarsa |
| **Keuangan** | Uang masuk & keluar per bulan, pencarian, rincian per kategori, grafik tren 6 bulan, dan Buku Kas (saldo berjalan) yang bisa dicetak / disimpan sebagai PDF atau diunduh sebagai CSV |
| **Praktik** | Data praktik, jam praktik per hari, booking online, QR code link booking, dan profil praktik di Nakesa Patient |
| **Layanan & Harga** | Layanan, harga, dan durasi yang dipilih pasien di Nakesa Patient |

**Peran:** setiap anggota praktik punya peran **admin** (pemilik), **nakes** (tenaga kesehatan: obat, stok, resep), atau **staf** (hanya melihat obat dan stok). Database menegakkan aturan yang sama lewat Row Level Security.

**Halaman booking publik** (`html/book.html?p=<slug>`): pasien bisa membuat janji **tanpa login**. Mereka melihat nama praktik, profesi, alamat, dan jam praktik, lalu mengisi nama, nomor WhatsApp, tanggal, jam, layanan, dan keluhan.

**Alur akun:** Sambutan → Daftar / Masuk (email + kata sandi, atau Google) → Onboarding (nama → profesi → data praktik) → Dashboard. Tersedia juga lupa dan atur ulang kata sandi, serta mode terang/gelap.

## Teknologi

- **Frontend:** HTML + CSS + JavaScript murni (ES modules), **tanpa framework dan tanpa build step**. Tampilan memakai Tailwind CSS (Play CDN) dengan konfigurasi dan komponen bersama di `js/tailwind-setup.js`; halaman Beranda publik memakai `css/index.css`.
- **Backend:** [Supabase](https://supabase.com) (Auth + Postgres + Storage). Aplikasi utama tidak memakai server sendiri; semua akses data dilindungi Row Level Security, dan aturan penting (stok, resep, booking) dijalankan oleh fungsi database.
- **Server-side (Week 5):** PHP 8 prosedural di folder `php/` untuk halaman publik yang HTML-nya dibuat di server (Profil Praktik). PHP hanya membaca data publik lewat fungsi database yang sama dengan halaman booking.
- **API eksternal:** [API Hari Libur](https://github.com/guangrei/APIHariLibur_V2) untuk hari libur nasional di Beranda (tanpa login dan tanpa API key).
- **Zona waktu:** Asia/Jakarta (WIB).

## Menjalankan di lokal

Halaman memakai ES modules, jadi harus dibuka lewat server lokal (bukan `file://`).

1. Clone repo ini.
2. Jalankan server statis di folder repo, misalnya:
   - VS Code **Live Server** (port 5501 sudah diatur di `.vscode/settings.json`), atau
   - `python3 -m http.server 5501`
3. Buka `http://localhost:5501/`. Halaman akan diarahkan ke `html/index.html`.
4. (Opsional) Jalankan unit test dengan Node.js 22 atau lebih baru: `node --test "tests/**/*.test.mjs"`.
5. Halaman PHP (Week 5) di folder `php/` butuh server yang menjalankan PHP 8: dari folder repo jalankan `php -S localhost:8000`, lalu buka `http://localhost:8000/php/praktik.php` (Profil Praktik). Live Server tidak menjalankan PHP.

Koneksi ke Supabase diatur di `js/config.js` (URL project dan *publishable key*, yang memang aman dipakai di frontend). Metode login bisa dinyalakan/dimatikan lewat `AUTH_PROVIDERS` di file yang sama. Kalau login Google atau tautan dari email tidak kembali ke alamat lokal, tambahkan alamat tersebut ke **Redirect URLs** di Supabase (Authentication → URL Configuration).

## Struktur folder

```
html/                 Satu file per halaman (index, welcome, login, signup, onboarding, dashboard, …, book)
js/                   Modul bersama: auth, db, shell (kerangka halaman), professions, format, validation, errors, ui, theme,
                      practice-utils (status booking & obat), roles, medicine-forms, holidays, qr, patient-preview
js/pages/             Logika per halaman, nama file sama dengan halamannya
css/index.css         Gaya halaman Beranda publik
php/                  Halaman PHP server-side (Week 5): data.php, functions.php, praktik.php (Profil Praktik)
supabase/migrations/  Skema database, Row Level Security, dan fungsi publik
docs/                 Rancangan sistem obat & resep (docs/sistem-obat.md)
tests/                Unit test (node --test) untuk modul di js/
Exercise week/        Dokumentasi tugas mingguan dan konteks aplikasi
.github/              Template issue/PR, workflow CI, dan skrip pengecekan
```

## Database

Semua tabel di skema `public` memakai **Row Level Security**. Data praktik dasar hanya bisa dibaca dan diubah pemiliknya (`owner_id = auth.uid()`); data obat dan resep mengikuti peran di `practice_members`; akun Nakesa Patient hanya melihat data miliknya sendiri.

| Tabel | Isi |
|---|---|
| `profiles` | Profil pengguna (nama, email, profesi, peran), dibuat otomatis oleh trigger saat mendaftar |
| `practices` | Satu praktik per pengguna, dengan `booking_slug` untuk link booking publik dan profil untuk Nakesa Patient |
| `practice_members` | Anggota praktik dan perannya (admin / nakes / staf) |
| `patients` | Data pasien milik praktik (akun pasien Nakesa Patient ada di `patient_profiles`) |
| `bookings` | Janji temu (`status`: baru/dikonfirmasi/selesai/batal, `source`: online/manual) |
| `practice_hours` | Jam praktik (hari 0 = Minggu … 6 = Sabtu, bisa beberapa sesi per hari) |
| `practice_services` | Layanan, harga, dan durasi |
| `medicines`, `medicine_batches`, `medicine_stock` | Obat dan stok per batch (view `medicine_inventory` menghitung status stok & kedaluwarsa) |
| `stock_movements` | Semua perubahan stok, tidak pernah diketik langsung |
| `prescriptions`, `prescription_items` | Resep dan obatnya |
| `transactions` | Keuangan (`kind`: masuk/keluar, `amount` dalam rupiah bulat) |
| `audit_log` | Catatan perubahan data penting |

Fungsi publik untuk halaman booking (bisa dipanggil tanpa login): `get_public_practice(slug)`, `get_public_slots(slug, tanggal)`, dan `create_booking(...)`. Nakesa Patient memakai fungsi `patient_*` yang hanya bisa dipanggil akun pasien.

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

- [`Exercise week/Week3.md`](Exercise%20week/Week3.md): Week 3, JavaScript & DOM serta Tailwind CSS.
- [`Exercise week/Week4.md`](Exercise%20week/Week4.md): Week 4, REST API & Fetch API (hari libur nasional di Beranda).
- [`Exercise week/NAKESA-CONTEXT.md`](Exercise%20week/NAKESA-CONTEXT.md): ringkasan konteks aplikasi.
