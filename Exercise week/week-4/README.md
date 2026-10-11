# Week 4 — Sprint 03 — REST API & Fetch API

**Periode:** 6–12 Okt 2026 · **Milestone:** [Week 4](https://github.com/DevJamHub/Nakesa/milestone/6?closed=1) · **Issue tugas:** [#32](https://github.com/DevJamHub/Nakesa/issues/32) · **Kode saat tugas selesai:** tag [`week-4`](https://github.com/DevJamHub/Nakesa/tree/week-4)

## Materi

*From Interactive to Data-Driven.* REST API (request → response → JSON), Fetch API, asynchronous JavaScript, Promise/async-await, dan state loading/success/error.

## Tugas

- [x] Task 01 — Connect to API (`fetchHolidays()`)
- [x] Task 02 — Display API data (kartu libur nasional di Beranda)
- [x] Task 03 — Handle API state (loading, berhasil, error + Coba Lagi)
- [x] Penjelasan lengkap: [`Week4.md`](../Week4.md)

## Siapa mengerjakan apa

| Anggota | Pekerjaan | Bukti |
|---|---|---|
| Sigit Novriyanto (@DevJamHub) | Tugas Task 01–03 (API Hari Libur) dan dokumentasi `Week4.md` | 2394365, 678e46c |
| Aditiya Al Bayhaqy (@baybayyy26) | Menyesuaikan dan menguji ulang PR #21–#28 dengan kode terbaru (booking per slot, grafik tren, unduh CSV buku kas, unit test termasuk test API hari libur, dokumentasi); peta per week ini (#39) | PR #21–#28, #39 (menunggu review) |

## User story yang selesai / dikerjakan

[#17](https://github.com/DevJamHub/Nakesa/issues/17) · [#18](https://github.com/DevJamHub/Nakesa/issues/18) · [#19](https://github.com/DevJamHub/Nakesa/issues/19) · [#20](https://github.com/DevJamHub/Nakesa/issues/20) · [#24](https://github.com/DevJamHub/Nakesa/issues/24) · [#26](https://github.com/DevJamHub/Nakesa/issues/26)

## File yang dikerjakan

Diambil dari riwayat git: perubahan dari commit `d06b5bd` sampai tag `week-4`. Klik nama file untuk membukanya (di VS Code: buka pratinjau Markdown dengan `Ctrl+Shift+V`).

| File | Status | Isi |
|---|---|---|
| [`html/dashboard.html`](../../html/dashboard.html) | Diubah | Beranda setelah login |
| [`js/holidays.js`](../../js/holidays.js) | Baru | Ambil hari libur dari API (Fetch) |
| [`js/pages/dashboard.js`](../../js/pages/dashboard.js) | Diubah | Logika halaman Beranda setelah login |
| [`js/tailwind-setup.js`](../../js/tailwind-setup.js) | Diubah | Konfigurasi dan komponen Tailwind CSS |
| [`Exercise week/Week4.md`](../../Exercise%20week/Week4.md) | Baru | Dokumentasi tugas Week 4 |

## Catatan

Daftar file di atas hanya yang sudah masuk `main`. Pekerjaan yang masih berupa PR (#21–#28) belum termasuk sampai di-merge.

## Membuka kode minggu ini

```bash
git fetch --tags
git switch --detach week-4   # lihat kode saat Week 4 selesai
git switch main             # kembali ke kode terbaru
```

Di GitHub: pilih **Tags → `week-4`** pada daftar branch, atau buka [https://github.com/DevJamHub/Nakesa/tree/week-4](https://github.com/DevJamHub/Nakesa/tree/week-4).
