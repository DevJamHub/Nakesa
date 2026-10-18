# NAKESA — Konteks Aplikasi

> Ringkasan ini untuk disimpan di memori Claude, supaya Claude langsung paham proyek ini di percakapan mana pun.

## Apa itu NAKESA?

NAKESA (**Digital Practice Management**) adalah aplikasi web untuk **mengelola praktik mandiri tenaga kesehatan** di Indonesia: bidan, dokter umum, dokter gigi, dokter spesialis, perawat, fisioterapis, psikolog, ahli gizi, dan profesi kesehatan lain.

Satu akun = satu praktik. Pemilik praktik bisa mencatat pasien, menerima booking online, memantau stok obat, dan mencatat keuangan dari HP.

- **Pembuat:** Sigit Novriyanto (mahasiswa Informatika, proyek Semester 5).
- **Pengguna utama:** ibu dari pembuat (seorang tenaga kesehatan yang punya praktik sendiri, bukan orang teknis), dan praktisi lain yang mirip.

## Prinsip desain (penting!)

- **Semua teks UI dalam Bahasa Indonesia**, dengan bahasa sehari-hari yang sopan ("Anda").
- **Mobile-first**: sebagian besar dipakai di HP.
- **Sangat sederhana**: tombol besar, sedikit langkah, mudah dipahami orang tua/generasi milenial yang tidak paham teknologi.
- **Berpusat di WhatsApp**: link booking dibagikan lewat WhatsApp, dan pasien dihubungi lewat link `wa.me`.
- Warna dan pilihan layanan di aplikasi **menyesuaikan profesi** pengguna (misal bidan → warna pink, layanan "Periksa Kehamilan", "KB", "Imunisasi Anak").

## Fitur

| Menu | Fungsi |
|---|---|
| 🏠 **Beranda** (dashboard) | Sapaan sesuai waktu, sakelar buka/tutup praktik, ringkasan hari ini, pasien hari ini (bisa dikonfirmasi langsung), grafik pemasukan 7 hari, **hari libur nasional terdekat** (dari API Hari Libur, tugas Week 4), dan link booking |
| 📅 **Booking** | Janji temu dari link booking, aplikasi Nakesa Patient, atau dicatat manual. Status: baru → dikonfirmasi → selesai / batal |
| 👥 **Pasien** | Data pasien: nama, jenis kelamin, tanggal lahir, no. HP, alamat, catatan |
| 📝 **Resep** | Resep per pasien. Disimpan sebagai draf; "Selesaikan" mengurangi stok obat otomatis (kedaluwarsa paling awal dulu) |
| 💊 **Obat** | Database obat: stok per batch, tanggal kedaluwarsa, golongan obat, riwayat stok masuk/keluar, peringatan stok menipis/habis dan obat akan kedaluwarsa. Detail satu obat di `medicine.html?id=…` |
| 💰 **Keuangan** | Uang masuk & keluar per bulan dengan kategori sesuai profesi, pencarian, rincian per kategori, dan **Buku Kas** (saldo awal, saldo berjalan, saldo akhir) yang bisa dicetak / disimpan sebagai PDF |
| 🏥 **Praktik** | Data praktik, jam praktik per hari, buka/tutup, booking online, **QR code** link booking (bisa diunduh untuk dicetak), dan halaman praktik di aplikasi Nakesa Patient |
| 🩺 **Layanan & Harga** | Layanan, harga, dan durasi yang dipilih pasien di Nakesa Patient (tanpa daftar sendiri → layanan standar profesi) |

**Peran di praktik** (`practice_members`): **admin** (pemilik, semua akses), **nakes** (bidan/tenaga kesehatan: obat, stok, resep), **staf** (non-klinis: hanya melihat obat dan stok). Pemilik otomatis menjadi admin.

**Nakesa Patient** (repo terpisah `NAKESAPATIENT`): aplikasi untuk pasien. Pasien mencari praktik yang memilih tampil, melihat layanan dan jam kosong, booking, dan membatalkan janjinya sendiri. Booking-nya masuk ke halaman Booking di NAKESA (Nakesa Pro).

**Halaman booking publik** (`book.html?p=<slug>`): pasien bisa membuat janji **tanpa login**. Mereka melihat nama praktik, profesi, alamat, jam praktik, lalu mengisi nama, no. WhatsApp, tanggal (hari ini s/d 60 hari ke depan), jam (pilihan per 30 menit sesuai sesi praktik; jam yang lewat atau sudah dipesan dicoret; atau "Kapan saja"), layanan, dan keluhan.

**Alur akun:** welcome → daftar / masuk (email + kata sandi, atau Google) → onboarding (nama → profesi → data praktik) → dashboard. Ada juga lupa kata sandi & reset kata sandi, serta mode terang/gelap. Login Apple sudah disiapkan di kode tetapi masih dimatikan (`AUTH_PROVIDERS.apple = false` di `js/config.js`).

## Teknologi

- **Frontend:** HTML + CSS + JavaScript murni (ES modules), **tanpa framework dan tanpa build step**.
  - `html/` — satu file per halaman
  - `js/pages/` — logika per halaman; `js/` — modul bersama (`auth.js`, `db.js`, `shell.js` untuk kerangka halaman & navigasi, `professions.js`, `format.js`, `validation.js`, `errors.js`, `ui.js`, `practice-utils.js` (status booking & obat), `roles.js` (peran admin/nakes/staf), `medicine-forms.js` (form obat & stok masuk), `holidays.js` (API Hari Libur), `qr.js` (QR link booking), `patient-preview.js` (pratinjau tampilan Nakesa Patient), `regions.js`, `profile.js`, `config.js`, `supabase.js`)
  - **API eksternal:** API Hari Libur (`guangrei/APIHariLibur_V2` lewat jsDelivr), tanpa login dan tanpa API key; diambil dengan `fetch()` di `js/holidays.js`.
  - `docs/sistem-obat.md` — rancangan lengkap sistem obat & resep (ERD, alur stok, peran).
  - **Tampilan:** Tailwind CSS lewat Play CDN. Konfigurasi tema (warna sebagai variabel CSS, font, bayangan) dan komponen bersama (`btn`, `card`, `item`, `badge`, dll.) ada di `js/tailwind-setup.js`; tata letak tiap halaman memakai class Tailwind langsung di HTML.
  - `css/index.css` — CSS tulisan tangan khusus halaman Beranda publik (`html/index.html`).
  - `js/theme.js` — mode terang/gelap (mengikuti pengaturan HP, bisa diganti dan diingat); `js/tailwind-highlight.js` — alat bantu presentasi: buka halaman dengan `?tailwind` untuk menandai elemen yang memakai Tailwind.
- **Backend:** **Supabase** (Auth + Postgres). Tidak ada server sendiri.
  - Project ref Supabase: `fmmudgdkyihbyxntutit`
  - Migrasi ada di `supabase/migrations/`

## Database (Supabase / Postgres)

Tabel di skema `public` (semua dengan **Row Level Security**). Data praktik dasar memakai `owner_id = auth.uid()`; data obat & resep memakai peran di `practice_members`; pasien Nakesa Patient hanya membaca data miliknya sendiri:

- `profiles` — profil pengguna (nama, email, profesi, peran), dibuat otomatis oleh trigger saat daftar
- `practices` — satu praktik per pengguna; punya `booking_slug` untuk link booking publik, pengaturan peringatan kedaluwarsa, dan profil untuk Nakesa Patient (`is_listed`, kota, provinsi)
- `practice_members` — siapa saja di praktik dan perannya (admin / nakes / staf)
- `patients` — data pasien milik praktik; `patient_profiles` — akun pasien Nakesa Patient
- `bookings` — janji temu (`status`: baru/dikonfirmasi/selesai/batal, `source`: online/manual; dari Nakesa Patient juga punya `end_time`, layanan, dan akun pasien)
- `practice_hours` — jam praktik (hari 0 = Minggu … 6 = Sabtu, bisa beberapa sesi per hari)
- `practice_services` — layanan, harga, durasi; `professions` — daftar profesi
- `medicines`, `medicine_categories`, `suppliers`, `medicine_batches`, `medicine_stock` — obat dan stok per batch; view `medicine_inventory` menghitung status stok & kedaluwarsa
- `stock_movements` — semua perubahan stok (tidak pernah diketik langsung); `prescriptions`, `prescription_items` — resep
- `transactions` — keuangan (`kind`: masuk/keluar, `amount` dalam rupiah bulat)
- `audit_log` — catatan perubahan data penting

Fungsi publik (bisa dipanggil tanpa login, `security definer`):
- `get_public_practice(slug)` — info praktik untuk halaman booking dan Profil Praktik PHP: jam praktik dan layanan aktif dari menu Layanan & Harga (tanpa data pasien/keuangan)
- `get_public_slots(slug, tanggal)` — slot jam pada tanggal itu dan mana yang masih kosong (hanya jam, tanpa data pasien)
- `create_booking(...)` — membuat booking online dengan validasi (praktik ada, booking aktif, tanggal valid, praktik buka di hari itu, jam berupa slot 30 menit di dalam sesi praktik yang belum lewat dan belum dipesan orang lain — aturan slot yang sama dengan aplikasi Nakesa Patient). Pesan error dalam Bahasa Indonesia dan langsung ditampilkan ke pasien.

Zona waktu yang dipakai: **Asia/Jakarta (WIB)**.

## Catatan untuk Claude

- Tulis semua teks UI dan pesan error dalam Bahasa Indonesia yang mudah dipahami.
- Utamakan kesederhanaan dan tampilan HP; jangan menambah framework atau build tool tanpa diminta.
- Keamanan data pasien penting: setiap tabel baru harus pakai RLS (berbasis `owner_id` atau peran di `practice_members`).
- Sebelum memberi saran konfigurasi Supabase, pastikan project ref-nya `fmmudgdkyihbyxntutit`.
