# Nakesa

Aplikasi praktik untuk tenaga kesehatan mandiri: booking pasien, data pasien, resep, stok obat, keuangan, dan jadwal praktik.

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

Halaman profil praktik publik (`php/praktik.php`, tugas Week 5–7) dibuat PHP di server dengan MVC sendiri:

```
php/praktik.php     front controller
php/Controller/     PracticeController: index(), show(), process()
php/Model/          PracticeModel (mengambil data) + Practice, Profession, Schedule (object praktik)
php/View/           practice-page.php (template HTML)
```

## Menjalankan

```
php -S localhost:8000 router.php
```

Buka http://localhost:8000/. `router.php` menjaga folder `app/` dan `data/` supaya tidak bisa dibuka dari browser
(di XAMPP tugas ini dikerjakan `.htaccess`).

Saat pertama kali dibuka, data contoh di `app/data/contoh/` disalin ke `data/`. Untuk kembali ke data awal, hapus folder `data/`.

## Akun demo

Kata sandi semua akun: `nakesa123`

| Email | Profesi | Praktik |
|---|---|---|
| siti@nakesa.test | Bidan | Praktik Bidan Sehati |
| andi@nakesa.test | Dokter Umum | Klinik Sehat Pratama |
| rina@nakesa.test | Dokter Gigi | Klinik Gigi Senyum Rina |
| budi@nakesa.test | Perawat | Rawat Luka & Home Care Budi |
| dewi@nakesa.test | Fisioterapis | Fisioterapi Dewi |
| maya@nakesa.test | Psikolog | Ruang Cerita Maya |
