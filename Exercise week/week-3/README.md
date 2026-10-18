# Week 3 — Sprint 02 — JavaScript, DOM & Tailwind

**Periode:** 29 Sep – 5 Okt 2026 · **Milestone:** [Week 3](https://github.com/DevJamHub/Nakesa/milestone/5?closed=1) · **Issue tugas:** [#31](https://github.com/DevJamHub/Nakesa/issues/31) · **Kode saat tugas selesai:** tag [`week-3`](https://github.com/DevJamHub/Nakesa/tree/week-3)

## Materi

*From Static to Interactive.* JavaScript, DOM, dan event (user action → event → JavaScript → perubahan tampilan), serta mengganti CSS manual dengan Tailwind CSS.

## Tugas

- [x] Task 01–03 — Select & change, handle user event, satu interaksi lengkap (halaman Keuangan)
- [x] Task 04–05 — CSS manual ke Tailwind CSS (Keuangan dan Beranda)
- [x] Task 06 — JavaScript di Beranda
- [x] Penjelasan lengkap: [`Week3.md`](../Week3.md)

## Siapa mengerjakan apa

| Anggota | Pekerjaan | Bukti |
|---|---|---|
| Sigit Novriyanto (@DevJamHub) | Tugas Task 01–06 dan dokumentasi `Week3.md`; fitur tambahan 5 Okt (sistem obat, resep, layanan, buku kas, QR) | ec7e9c7 … 48149ce, d06b5bd |
| Aditiya Al Bayhaqy (@baybayyy26) | Menyiapkan alur kerja tim di GitHub (3 Okt): template issue/PR dan CI (PR #1, di-push dan di-merge Sigit), backlog user story #2–#20, dan papan kerja; membuka PR #21–#28 | issue #2–#20, PR #21–#28 |

## User story yang selesai / dikerjakan

[#8](https://github.com/DevJamHub/Nakesa/issues/8) · [#14](https://github.com/DevJamHub/Nakesa/issues/14) · [#15](https://github.com/DevJamHub/Nakesa/issues/15) · [#33](https://github.com/DevJamHub/Nakesa/issues/33) · [#34](https://github.com/DevJamHub/Nakesa/issues/34) · [#35](https://github.com/DevJamHub/Nakesa/issues/35) · [#36](https://github.com/DevJamHub/Nakesa/issues/36) · [#37](https://github.com/DevJamHub/Nakesa/issues/37) · [#38](https://github.com/DevJamHub/Nakesa/issues/38)

## File yang dikerjakan

Diambil dari riwayat git: perubahan dari commit `0263ac5` sampai tag `week-3`. Klik nama file untuk membukanya (di VS Code: buka pratinjau Markdown dengan `Ctrl+Shift+V`).

| File | Status | Isi |
|---|---|---|
| [`html/book.html`](../../html/book.html) | Diubah | Booking online untuk pasien (tanpa login) |
| [`html/bookings.html`](../../html/bookings.html) | Diubah | Booking |
| [`html/callback.html`](../../html/callback.html) | Diubah | Kembali dari login Google / link email |
| [`html/dashboard.html`](../../html/dashboard.html) | Diubah | Beranda setelah login |
| [`html/finance.html`](../../html/finance.html) | Diubah | Keuangan |
| [`html/forgot-password.html`](../../html/forgot-password.html) | Diubah | Lupa kata sandi |
| [`html/index.html`](../../html/index.html) | Diubah | Beranda publik (landing page) |
| [`html/login.html`](../../html/login.html) | Diubah | Masuk |
| [`html/medicines.html`](../../html/medicines.html) | Diubah | Obat |
| [`html/onboarding.html`](../../html/onboarding.html) | Diubah | Onboarding (nama, profesi, praktik) |
| [`html/patients.html`](../../html/patients.html) | Diubah | Pasien |
| [`html/practice.html`](../../html/practice.html) | Diubah | Praktik |
| [`html/reset-password.html`](../../html/reset-password.html) | Diubah | Atur ulang kata sandi |
| [`html/signup.html`](../../html/signup.html) | Diubah | Daftar |
| [`html/welcome.html`](../../html/welcome.html) | Diubah | Sambutan |
| [`js/errors.js`](../../js/errors.js) | Diubah | Pesan error yang ramah |
| [`js/pages/book.js`](../../js/pages/book.js) | Diubah | Logika halaman Booking online untuk pasien (tanpa login) |
| [`js/pages/bookings.js`](../../js/pages/bookings.js) | Diubah | Logika halaman Booking |
| [`js/pages/callback.js`](../../js/pages/callback.js) | Diubah | Logika halaman Kembali dari login Google / link email |
| [`js/pages/dashboard.js`](../../js/pages/dashboard.js) | Diubah | Logika halaman Beranda setelah login |
| [`js/pages/finance.js`](../../js/pages/finance.js) | Diubah | Logika halaman Keuangan |
| [`js/pages/forgot-password.js`](../../js/pages/forgot-password.js) | Diubah | Logika halaman Lupa kata sandi |
| [`js/pages/index.js`](../../js/pages/index.js) | Baru | Logika halaman Beranda publik (landing page) |
| [`js/pages/login.js`](../../js/pages/login.js) | Diubah | Logika halaman Masuk |
| [`js/pages/medicines.js`](../../js/pages/medicines.js) | Diubah | Logika halaman Obat |
| [`js/pages/onboarding.js`](../../js/pages/onboarding.js) | Diubah | Logika halaman Onboarding (nama, profesi, praktik) |
| [`js/pages/patients.js`](../../js/pages/patients.js) | Diubah | Logika halaman Pasien |
| [`js/pages/practice.js`](../../js/pages/practice.js) | Diubah | Logika halaman Praktik |
| [`js/pages/reset-password.js`](../../js/pages/reset-password.js) | Diubah | Logika halaman Atur ulang kata sandi |
| [`js/pages/signup.js`](../../js/pages/signup.js) | Diubah | Logika halaman Daftar |
| [`js/shell.js`](../../js/shell.js) | Diubah | Kerangka halaman (header, menu, dialog) |
| [`js/tailwind-highlight.js`](../../js/tailwind-highlight.js) | Baru | Penanda bagian Tailwind (`?tailwind`) untuk presentasi |
| [`js/tailwind-setup.js`](../../js/tailwind-setup.js) | Baru | Konfigurasi dan komponen Tailwind CSS |
| [`js/theme.js`](../../js/theme.js) | Baru | Mode terang/gelap |
| [`js/ui.js`](../../js/ui.js) | Diubah | Komponen tampilan kecil |
| [`js/validation.js`](../../js/validation.js) | Diubah | Validasi form |
| [`css/app.css`](https://github.com/DevJamHub/Nakesa/blob/week-2/css/app.css) | Dihapus | CSS halaman aplikasi |
| [`css/auth.css`](https://github.com/DevJamHub/Nakesa/blob/week-2/css/auth.css) | Dihapus | CSS halaman masuk/daftar |
| [`css/index.css`](../../css/index.css) | Baru | CSS Beranda publik |
| [`style.css`](https://github.com/DevJamHub/Nakesa/blob/week-2/style.css) | Dihapus | CSS halaman pembuka |
| [`Exercise week/NAKESA-CONTEXT.md`](../../Exercise%20week/NAKESA-CONTEXT.md) | Baru | Ringkasan konteks aplikasi |
| [`Exercise week/Week3.md`](../../Exercise%20week/Week3.md) | Baru | Dokumentasi tugas Week 3 |
| [`index.html`](../../index.html) | Diubah | Halaman pembuka (mengarahkan ke `html/index.html`) |

### Setelah tugas kelas: alur kerja tim (3 Okt) dan fitur tambahan (5 Okt)

| File | Status | Isi |
|---|---|---|
| [`html/book.html`](../../html/book.html) | Diubah | Booking online untuk pasien (tanpa login) |
| [`html/dashboard.html`](../../html/dashboard.html) | Diubah | Beranda setelah login |
| [`html/finance.html`](../../html/finance.html) | Diubah | Keuangan |
| [`html/medicine.html`](../../html/medicine.html) | Baru | Detail satu obat |
| [`html/medicines.html`](../../html/medicines.html) | Diubah | Obat |
| [`html/practice.html`](../../html/practice.html) | Diubah | Praktik |
| [`html/prescriptions.html`](../../html/prescriptions.html) | Baru | Resep |
| [`html/services.html`](../../html/services.html) | Baru | Layanan & Harga |
| [`js/config.js`](../../js/config.js) | Diubah | Konfigurasi Supabase dan nama halaman |
| [`js/db.js`](../../js/db.js) | Diubah | Helper query database |
| [`js/medicine-forms.js`](../../js/medicine-forms.js) | Baru | Form obat dan stok masuk |
| [`js/pages/book.js`](../../js/pages/book.js) | Diubah | Logika halaman Booking online untuk pasien (tanpa login) |
| [`js/pages/bookings.js`](../../js/pages/bookings.js) | Diubah | Logika halaman Booking |
| [`js/pages/dashboard.js`](../../js/pages/dashboard.js) | Diubah | Logika halaman Beranda setelah login |
| [`js/pages/finance.js`](../../js/pages/finance.js) | Diubah | Logika halaman Keuangan |
| [`js/pages/medicine.js`](../../js/pages/medicine.js) | Baru | Logika halaman Detail satu obat |
| [`js/pages/medicines.js`](../../js/pages/medicines.js) | Diubah | Logika halaman Obat |
| [`js/pages/practice.js`](../../js/pages/practice.js) | Diubah | Logika halaman Praktik |
| [`js/pages/prescriptions.js`](../../js/pages/prescriptions.js) | Baru | Logika halaman Resep |
| [`js/pages/services.js`](../../js/pages/services.js) | Baru | Logika halaman Layanan & Harga |
| [`js/patient-preview.js`](../../js/patient-preview.js) | Baru | Pratinjau tampilan Nakesa Patient |
| [`js/practice-utils.js`](../../js/practice-utils.js) | Diubah | Status booking dan obat |
| [`js/qr.js`](../../js/qr.js) | Baru | QR code link booking |
| [`js/regions.js`](../../js/regions.js) | Baru | Daftar provinsi |
| [`js/roles.js`](../../js/roles.js) | Baru | Peran admin / nakes / staf |
| [`js/shell.js`](../../js/shell.js) | Diubah | Kerangka halaman (header, menu, dialog) |
| [`js/tailwind-setup.js`](../../js/tailwind-setup.js) | Diubah | Konfigurasi dan komponen Tailwind CSS |
| [`.github/ISSUE_TEMPLATE/bug.md`](../../.github/ISSUE_TEMPLATE/bug.md) | Baru | Template issue/PR dan CI |
| [`.github/ISSUE_TEMPLATE/user-story.md`](../../.github/ISSUE_TEMPLATE/user-story.md) | Baru | Template issue/PR dan CI |
| [`.github/pull_request_template.md`](../../.github/pull_request_template.md) | Baru | Template issue/PR dan CI |
| [`.github/scripts/check-refs.mjs`](../../.github/scripts/check-refs.mjs) | Baru | Template issue/PR dan CI |
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | Baru | Template issue/PR dan CI |
| [`docs/sistem-obat.md`](../../docs/sistem-obat.md) | Baru | Rancangan sistem obat & resep |
| [`supabase/migrations/20261005151705_medicine_inventory.sql`](../../supabase/migrations/20261005151705_medicine_inventory.sql) | Baru | Migrasi database (tabel, RLS, fungsi) |
| [`supabase/migrations/20261005170000_patient_app.sql`](../../supabase/migrations/20261005170000_patient_app.sql) | Baru | Migrasi database (tabel, RLS, fungsi) |

## Catatan

Tag `week-3` menunjuk commit tugas kelas (`48149ce`, 29 Sep). Fitur tambahan Sigit pada 5 Okt (`d06b5bd`: sistem obat per batch, resep, layanan & harga, buku kas, QR, profil Nakesa Patient) masuk setelah tag itu dan tercatat di issue #33–#38.

## Membuka kode minggu ini

```bash
git fetch --tags
git switch --detach week-3   # lihat kode saat Week 3 selesai
git switch main             # kembali ke kode terbaru
```

Di GitHub: pilih **Tags → `week-3`** pada daftar branch, atau buka [https://github.com/DevJamHub/Nakesa/tree/week-3](https://github.com/DevJamHub/Nakesa/tree/week-3).
