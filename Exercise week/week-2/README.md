# Week 2 — Sprint 01 — HTML & CSS

**Periode:** 22–28 Sep 2026 · **Milestone:** [Week 2](https://github.com/DevJamHub/Nakesa/milestone/4?closed=1) · **Issue tugas:** [#30](https://github.com/DevJamHub/Nakesa/issues/30) · **Kode saat tugas selesai:** tag [`week-2`](https://github.com/DevJamHub/Nakesa/tree/week-2)

## Materi

*From Idea to Web Interface.* HTML untuk struktur dan makna konten, CSS untuk tampilan, layout, dan responsive.

## Tugas

- [x] Task 01 — Struktur HTML semantic
- [x] Task 02 — Style & responsive
- [x] Task 03 — Merapikan tampilan
- [x] Demo dan review, commit & push

**Issue per task (sub-issue):** [#50](https://github.com/DevJamHub/Nakesa/issues/50) · [#51](https://github.com/DevJamHub/Nakesa/issues/51) · [#52](https://github.com/DevJamHub/Nakesa/issues/52)

## Siapa mengerjakan apa

| Anggota | Pekerjaan | Bukti |
|---|---|---|
| Sigit Novriyanto (@DevJamHub) | Semua halaman HTML + CSS, database Supabase, login, logika halaman | 77bc3f2, eab146a, e509028, 0263ac5 |

## Fitur tambahan yang dibuat minggu ini (Bagian B)

Bukan bagian dari tugas week ini. Dicatat terpisah per kelompok fitur di [📌 Peta Issues #73](https://github.com/DevJamHub/Nakesa/issues/73).

[#2](https://github.com/DevJamHub/Nakesa/issues/2) · [#3](https://github.com/DevJamHub/Nakesa/issues/3) · [#4](https://github.com/DevJamHub/Nakesa/issues/4) · [#5](https://github.com/DevJamHub/Nakesa/issues/5) · [#7](https://github.com/DevJamHub/Nakesa/issues/7) · [#9](https://github.com/DevJamHub/Nakesa/issues/9) · [#10](https://github.com/DevJamHub/Nakesa/issues/10) · [#11](https://github.com/DevJamHub/Nakesa/issues/11) · [#12](https://github.com/DevJamHub/Nakesa/issues/12) · [#13](https://github.com/DevJamHub/Nakesa/issues/13) · [#16](https://github.com/DevJamHub/Nakesa/issues/16)

## File yang dikerjakan

Diambil dari riwayat git: perubahan dari commit `c5f30b2` sampai tag `week-2`. Klik nama file untuk membukanya (di VS Code: buka pratinjau Markdown dengan `Ctrl+Shift+V`).

| File | Status | Isi |
|---|---|---|
| [`html/book.html`](../../html/book.html) | Baru | Booking online untuk pasien (tanpa login) |
| [`html/bookings.html`](../../html/bookings.html) | Baru | Booking |
| [`html/callback.html`](../../html/callback.html) | Baru | Kembali dari login Google / link email |
| [`html/dashboard.html`](../../html/dashboard.html) | Baru | Beranda setelah login |
| [`html/finance.html`](../../html/finance.html) | Baru | Keuangan |
| [`html/forgot-password.html`](../../html/forgot-password.html) | Baru | Lupa kata sandi |
| [`html/index.html`](../../html/index.html) | Baru | Beranda publik (landing page) |
| [`html/login.html`](../../html/login.html) | Baru | Masuk |
| [`html/medicines.html`](../../html/medicines.html) | Baru | Obat |
| [`html/onboarding.html`](../../html/onboarding.html) | Baru | Onboarding (nama, profesi, praktik) |
| [`html/patients.html`](../../html/patients.html) | Baru | Pasien |
| [`html/practice.html`](../../html/practice.html) | Baru | Praktik |
| [`html/reset-password.html`](../../html/reset-password.html) | Baru | Atur ulang kata sandi |
| [`html/signup.html`](../../html/signup.html) | Baru | Daftar |
| [`html/welcome.html`](../../html/welcome.html) | Baru | Sambutan |
| [`js/auth.js`](../../js/auth.js) | Baru | Login, daftar, keluar |
| [`js/config.js`](../../js/config.js) | Baru | Konfigurasi Supabase dan nama halaman |
| [`js/db.js`](../../js/db.js) | Baru | Helper query database |
| [`js/errors.js`](../../js/errors.js) | Baru | Pesan error yang ramah |
| [`js/format.js`](../../js/format.js) | Baru | Format rupiah, tanggal, WhatsApp |
| [`js/pages/book.js`](../../js/pages/book.js) | Baru | Logika halaman Booking online untuk pasien (tanpa login) |
| [`js/pages/bookings.js`](../../js/pages/bookings.js) | Baru | Logika halaman Booking |
| [`js/pages/callback.js`](../../js/pages/callback.js) | Baru | Logika halaman Kembali dari login Google / link email |
| [`js/pages/dashboard.js`](../../js/pages/dashboard.js) | Baru | Logika halaman Beranda setelah login |
| [`js/pages/finance.js`](../../js/pages/finance.js) | Baru | Logika halaman Keuangan |
| [`js/pages/forgot-password.js`](../../js/pages/forgot-password.js) | Baru | Logika halaman Lupa kata sandi |
| [`js/pages/login.js`](../../js/pages/login.js) | Baru | Logika halaman Masuk |
| [`js/pages/medicines.js`](../../js/pages/medicines.js) | Baru | Logika halaman Obat |
| [`js/pages/onboarding.js`](../../js/pages/onboarding.js) | Baru | Logika halaman Onboarding (nama, profesi, praktik) |
| [`js/pages/patients.js`](../../js/pages/patients.js) | Baru | Logika halaman Pasien |
| [`js/pages/practice.js`](../../js/pages/practice.js) | Baru | Logika halaman Praktik |
| [`js/pages/reset-password.js`](../../js/pages/reset-password.js) | Baru | Logika halaman Atur ulang kata sandi |
| [`js/pages/signup.js`](../../js/pages/signup.js) | Baru | Logika halaman Daftar |
| [`js/pages/welcome.js`](../../js/pages/welcome.js) | Baru | Logika halaman Sambutan |
| [`js/practice-utils.js`](../../js/practice-utils.js) | Baru | Status booking dan obat |
| [`js/professions.js`](../../js/professions.js) | Baru | Data profesi |
| [`js/profile.js`](../../js/profile.js) | Baru | Profil pengguna |
| [`js/shell.js`](../../js/shell.js) | Baru | Kerangka halaman (header, menu, dialog) |
| [`js/supabase.js`](../../js/supabase.js) | Baru | Koneksi Supabase |
| [`js/ui.js`](../../js/ui.js) | Baru | Komponen tampilan kecil |
| [`js/validation.js`](../../js/validation.js) | Baru | Validasi form |
| [`css/app.css`](https://github.com/DevJamHub/Nakesa/blob/week-2/css/app.css) (sudah dihapus di `main`) | Baru | CSS halaman aplikasi |
| [`css/auth.css`](https://github.com/DevJamHub/Nakesa/blob/week-2/css/auth.css) (sudah dihapus di `main`) | Baru | CSS halaman masuk/daftar |
| [`.gitignore`](../../.gitignore) | Baru | Daftar file yang tidak ikut di-commit |
| [`index.html`](../../index.html) | Diubah | Halaman pembuka (mengarahkan ke `html/index.html`) |
| [`supabase/migrations/20260926150710_create_profiles.sql`](../../supabase/migrations/20260926150710_create_profiles.sql) | Baru | Migrasi database (tabel, RLS, fungsi) |
| [`supabase/migrations/20260927130131_practice_features.sql`](../../supabase/migrations/20260927130131_practice_features.sql) | Baru | Migrasi database (tabel, RLS, fungsi) |

## Catatan

Selain HTML/CSS, minggu ini juga dibuat database Supabase, login, dan logika setiap halaman (`js/`), yang dipakai di week berikutnya.

## Membuka kode minggu ini

```bash
git fetch --tags
git switch --detach week-2   # lihat kode saat Week 2 selesai
git switch main             # kembali ke kode terbaru
```

Di GitHub: pilih **Tags → `week-2`** pada daftar branch, atau buka [https://github.com/DevJamHub/Nakesa/tree/week-2](https://github.com/DevJamHub/Nakesa/tree/week-2).
