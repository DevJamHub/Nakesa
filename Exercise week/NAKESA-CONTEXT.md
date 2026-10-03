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
| 🏠 **Beranda** (dashboard) | Ringkasan hari ini, sakelar buka/tutup praktik, dan tombol bagikan link booking ke WhatsApp |
| 📅 **Booking** | Daftar janji temu dari pasien (online atau dicatat manual). Status: baru → dikonfirmasi → selesai / batal |
| 👥 **Pasien** | Data pasien: nama, jenis kelamin, tanggal lahir, no. HP, alamat, catatan |
| 💊 **Obat** | Stok obat: jumlah, satuan, stok minimum (peringatan kalau menipis), harga, tanggal kedaluwarsa |
| 💰 **Keuangan** | Catatan uang masuk & keluar (rupiah) per bulan, dengan kategori sesuai profesi, pencarian, dan rincian per kategori |
| 🏥 **Praktik** | Nama & alamat praktik, no. HP, jam praktik per hari, buka/tutup praktik, aktifkan booking online |

**Halaman booking publik** (`book.html?p=<slug>`): pasien bisa membuat janji **tanpa login**. Mereka melihat nama praktik, profesi, alamat, jam praktik, lalu mengisi nama, no. WhatsApp, tanggal (hari ini s/d 60 hari ke depan), jam, layanan, dan keluhan.

**Alur akun:** welcome → daftar / masuk (email + kata sandi, atau Google) → onboarding (nama → profesi → data praktik) → dashboard. Ada juga lupa kata sandi & reset kata sandi, serta mode terang/gelap. Login Apple sudah disiapkan di kode tetapi masih dimatikan (`AUTH_PROVIDERS.apple = false` di `js/config.js`).

## Teknologi

- **Frontend:** HTML + CSS + JavaScript murni (ES modules), **tanpa framework dan tanpa build step**.
  - `html/` — satu file per halaman
  - `js/pages/` — logika per halaman; `js/` — modul bersama (`auth.js`, `db.js`, `shell.js` untuk kerangka halaman & navigasi, `professions.js`, `format.js`, `validation.js`, `errors.js`, `ui.js`, `practice-utils.js`, `profile.js`, `config.js`, `supabase.js`)
  - **Tampilan:** Tailwind CSS lewat Play CDN. Konfigurasi tema (warna sebagai variabel CSS, font, bayangan) dan komponen bersama (`btn`, `card`, `item`, `badge`, dll.) ada di `js/tailwind-setup.js`; tata letak tiap halaman memakai class Tailwind langsung di HTML.
  - `css/index.css` — CSS tulisan tangan khusus halaman Beranda publik (`html/index.html`).
  - `js/theme.js` — mode terang/gelap (mengikuti pengaturan HP, bisa diganti dan diingat); `js/tailwind-highlight.js` — alat bantu presentasi: buka halaman dengan `?tailwind` untuk menandai elemen yang memakai Tailwind.
- **Backend:** **Supabase** (Auth + Postgres). Tidak ada server sendiri.
  - Project ref Supabase: `fmmudgdkyihbyxntutit`
  - Migrasi ada di `supabase/migrations/`

## Database (Supabase / Postgres)

Tabel di skema `public` (semua dengan **Row Level Security**: setiap pengguna hanya bisa melihat datanya sendiri lewat `owner_id = auth.uid()`):

- `profiles` — profil pengguna (nama, email, profesi), dibuat otomatis oleh trigger saat daftar
- `practices` — satu praktik per pengguna; punya `booking_slug` untuk link booking publik
- `patients` — data pasien
- `bookings` — janji temu (`status`: baru/dikonfirmasi/selesai/batal, `source`: online/manual)
- `medicines` — stok obat
- `transactions` — keuangan (`kind`: masuk/keluar, `amount` dalam rupiah bulat)
- `practice_hours` — jam praktik (hari 0 = Minggu … 6 = Sabtu, bisa beberapa sesi per hari)

Fungsi publik (bisa dipanggil tanpa login, `security definer`):
- `get_public_practice(slug)` — info praktik untuk halaman booking (tanpa data pasien/keuangan)
- `create_booking(...)` — membuat booking online dengan validasi (praktik ada, booking aktif, tanggal valid, praktik buka di hari itu). Pesan error dalam Bahasa Indonesia dan langsung ditampilkan ke pasien.

Zona waktu yang dipakai: **Asia/Jakarta (WIB)**.

## Catatan untuk Claude

- Tulis semua teks UI dan pesan error dalam Bahasa Indonesia yang mudah dipahami.
- Utamakan kesederhanaan dan tampilan HP; jangan menambah framework atau build tool tanpa diminta.
- Keamanan data pasien penting: setiap tabel baru harus pakai RLS berbasis `owner_id`.
- Sebelum memberi saran konfigurasi Supabase, pastikan project ref-nya `fmmudgdkyihbyxntutit`.
