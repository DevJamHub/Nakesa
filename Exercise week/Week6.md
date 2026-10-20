# Week 6 — Web Programming: From Procedural to Object-Oriented (PHP OOP)

**Nama:** Sigit Novriyanto
**Tanggal:** Selasa, 20 Oktober 2026
**Proyek:** NAKESA — aplikasi manajemen praktik mandiri tenaga kesehatan (bidan, dokter, perawat, dll.)
**Halaman yang dikerjakan:** Profil praktik publik untuk pasien (`php/praktik.php`), sekarang memakai class di `php/classes/`

**Tugas dari kelas (Sprint 05 — Build PresidentKu with OOP):** Mengelola data halaman dengan class dan object PHP, tanpa merusak output HTML

1. **Task 01 — Create a Class:** membuat class yang merepresentasikan data halaman, lalu membuat object darinya
2. **Task 02 — Add Properties & Methods:** menambahkan property (data) dan method (perilaku) yang dibutuhkan halaman
3. **Task 03 — Generate Dynamic Content with Object:** memakai object untuk menghasilkan bagian konten halaman secara dinamis

Pada slide, contohnya memakai *PresidenKu*: class `President` dengan property `name`, `period`, `programs` dan method `getProfile()`, `getPrograms()`. Di sini ketiga task saya terapkan pada halaman yang saya buat minggu lalu, yaitu **Profil Praktik NAKESA** (`php/praktik.php`). Di Week 5 halaman ini ditulis secara **procedural**: data praktik berupa array dan diolah oleh fungsi-fungsi lepas di `functions.php`. Di Week 6 halaman yang sama saya **ubah menjadi OOP**: data praktik sekarang berupa object `Practice`, dan fungsi-fungsinya pindah menjadi method di dalam class.

Target slide Sprint 05 adalah **"Output HTML tetap berjalan"**. Karena itu tampilan halaman sengaja **tidak berubah sama sekali**; yang berubah adalah cara kodenya disusun. Ini sudah saya buktikan dengan membandingkan HTML sebelum dan sesudah untuk 6 kasus, dan hasilnya identik (lihat [Bukti: output HTML tetap sama](#bukti-output-html-tetap-sama)).

Alasan memakai OOP di halaman ini:

- **Data dan perilakunya jadi satu.** Di Week 5, `groupHoursByDay()` dan `todaySummary()` sama-sama mengolah jadwal, tetapi jadwalnya (`$hoursByDay`) harus dioper sebagai array dari satu fungsi ke fungsi lain. Sekarang jadwal adalah object `Schedule` yang tahu cara membaca dirinya sendiri: `$schedule->getTodaySummary($today)`.
- **Halaman lebih bersih.** Bagian persiapan di `praktik.php` sebelumnya membuat 18 variabel lepas (`$practiceName`, `$practitioner`, `$isOpen`, `$chatUrl`, …). Sekarang halaman cukup memegang satu object `$practice` dan memanggil method-nya.
- **Lebih aman dari perubahan tidak sengaja dan salah ketik.** Property dibuat `private`, jadi data praktik tidak bisa diubah dari halaman. Salah ketik nama method langsung menjadi error yang jelas (`Call to undefined method`), bukan nilai kosong diam-diam seperti salah ketik kunci array (`$practice['nmae']`).
- **Bisa dipakai ulang.** Kalau nanti halaman booking juga dibuat dengan PHP, class `Practice` dan `PracticeRepository` tinggal di-`require`, tanpa menyalin fungsi.

### Dari PresidenKu ke NAKESA

| PresidenKu (slide) | NAKESA (halaman Profil Praktik) |
|---|---|
| `class President` | `class Practice` (+ class pendukung `Profession`, `Schedule`, `PracticeRepository`) |
| Property `$name` → "Eko Felix" | Property `$name` → "Praktik Bidan Sehati" |
| Property `$period` → "2044 - 2049" | Property `$schedule` → object `Schedule` (jadwal praktik seminggu) |
| Property `$programs` → Pendidikan, Kesehatan, Infrastruktur | Layanan profesi → Periksa Kehamilan, KB, Imunisasi Anak, … |
| `getProfile()` | `getSubtitle()` → "Bidan Siti Aminah · Bidan" |
| `getPrograms()` | `getServices()` |
| `new President("Eko Felix", "2044 - 2049", [...])` | `new Practice($samplePractice)` atau `$repository->findBySlug($slug)` |
| `private $name` + getter | Semua property `private`, dibaca lewat `getName()`, `isOpen()`, … |

> **Ringkasan perubahan file:** 4 file **baru** di folder `php/classes/` (`Practice.php`, `Profession.php`, `Schedule.php`, `PracticeRepository.php`), 2 file **dimodifikasi** (`php/praktik.php`, `php/functions.php`), dan laporan ini (`Exercise week/Week6.md`, **baru**). `php/data.php`, halaman NAKESA lain, CI, dan database **tidak diubah**. Rinciannya ada di bagian [Perubahan File](#perubahan-file-ditambah--dimodifikasi).

---

## Persiapan: Menjalankan PHP

Sama dengan Week 5:

| | Keterangan |
|---|---|
| **Versi PHP** | PHP 8.5.11 (Homebrew). Class memakai *typed property* dan tipe `?string` (PHP 7.4+) serta `str_starts_with()` (PHP 8.0+), jadi tetap bisa dijalankan dengan XAMPP versi PHP 8 |
| **Server** | `php -S localhost:8000`, dijalankan dari folder proyek |
| **Contoh praktik** | `http://localhost:8000/php/praktik.php` |
| **Praktik asli** | `http://localhost:8000/php/praktik.php?p=<kode link booking>` |

---

## Konsep Dasar

| Istilah | Arti | Di NAKESA |
|---|---|---|
| **Procedural** | Program disusun sebagai urutan instruksi + fungsi. Data dan fungsi terpisah | Week 5: array `$practice` + fungsi `openLabel($isOpen)`, `todaySummary($hoursByDay, $today)` |
| **OOP (Object-Oriented Programming)** | Program disusun dari object yang punya data **dan** perilaku | Week 6: object `$practice` dengan method `$practice->getOpenLabel()` |
| **Class** | *Blueprint* (cetakan) untuk membuat object | `class Practice { … }` di `php/classes/Practice.php` |
| **Object / Instance** | Hasil nyata yang dibuat dari class dengan `new` | `$practice = new Practice($samplePractice);` |
| **Property** | Data yang dimiliki object | `$name`, `$address`, `$isOpen`, `$schedule`, … |
| **Method** | Fungsi di dalam class, yaitu perilaku object | `getName()`, `getOpenLabel()`, `getChatUrl()`, … |
| **`$this`** | Menunjuk object itu sendiri, dipakai di dalam class | `return $this->name;` |
| **`->`** | Operator untuk mengakses property atau memanggil method object | `$practice->getName()`, `$this->profession` |
| **`new`** | Membuat object baru dari class | `new Practice(...)`, `new Schedule($data['hours'])` |
| **Constructor `__construct()`** | Method yang otomatis dijalankan saat `new`, untuk mengisi nilai awal property | `Practice::__construct(array $data, ?string $slug = null)` |
| **Encapsulation** | Menyembunyikan data di dalam object; dari luar hanya bisa lewat method | Semua property `private`, dibaca lewat getter |
| **`public` / `private`** | `public` bisa diakses dari luar class; `private` hanya dari dalam class | Getter `public`; semua property dan `Schedule::shortTime()` `private` |
| **Getter / setter** | Method untuk membaca (*get*) atau mengubah (*set*) property secara aman | Getter: `getName()`, `getAddress()`, `isOpen()`. Setter sengaja tidak dibuat (lihat [Encapsulation](#encapsulation)) |
| **`static`** | Method milik class, dipanggil tanpa object: `NamaClass::method()` | `Profession::find('bidan')` |

### Procedural vs OOP di NAKESA (sesuai slide "From Procedural to Object-Oriented")

**PHP Procedural (Week 5):** data dan fungsi terpisah, data harus dioper ke fungsi.

```php
$practice = $samplePractice;                        // data: array
$isOpen = $practice['is_open'];
echo openLabel($isOpen);                            // fungsi lepas, menerima data
$hoursByDay = groupHoursByDay($practice['hours']);
echo todaySummary($hoursByDay, $today);
```

**OOP PHP (Week 6):** object membawa datanya sendiri, kita cukup memanggil method-nya.

```php
$practice = new Practice($samplePractice);          // object
echo $practice->getOpenLabel();                     // method milik object
echo $practice->getSchedule()->getTodaySummary($today);
```

### Struktur file

```
php/
├── data.php                    DATA     konstanta & array (tidak berubah)
├── functions.php               HELPER   tinggal e(), waLink(), indonesianDateTime()
├── classes/                    ← baru (Week 6)
│   ├── Practice.php            CLASS    satu praktik nakes (≈ class President di slide)
│   ├── Profession.php          CLASS    profesi: label, gelar, ikon, layanan bawaan
│   ├── Schedule.php            CLASS    jadwal praktik seminggu
│   └── PracticeRepository.php  CLASS    mengambil praktik dari Supabase → object Practice
└── praktik.php                 OUTPUT   halaman: buat object, panggil method, cetak HTML
```

Satu class per file, dan nama file sama dengan nama class. `praktik.php` memuat semuanya dengan `require`:

```php
require __DIR__ . '/data.php';
require __DIR__ . '/functions.php';
require __DIR__ . '/classes/Profession.php';
require __DIR__ . '/classes/Schedule.php';
require __DIR__ . '/classes/Practice.php';
require __DIR__ . '/classes/PracticeRepository.php';
```

### Fungsi setiap class

| Class | Fungsinya (tugas class ini) | Analogi |
|---|---|---|
| `Practice` | Menyimpan data **satu praktik** dan menyiapkannya untuk halaman: nama bergelar, status buka, layanan, link booking & WhatsApp, judul halaman | "Kartu identitas" praktik |
| `Profession` | Menyimpan data **satu profesi** (label, gelar, ikon, layanan bawaan) dan tahu cara menulis gelar di depan nama | "Buku aturan" profesi: bidan bergelar "Bidan", dokter gigi "drg." |
| `Schedule` | Menyimpan **jadwal seminggu** yang sudah dikelompokkan per hari, dan menjawab pertanyaan tentang jadwal: buka hari apa, jam berapa, kapan buka lagi | Papan jadwal di depan praktik |
| `PracticeRepository` | **Mengambil** data praktik dari Supabase lewat internet, lalu mengubahnya menjadi object `Practice` | "Petugas arsip" yang mengambilkan berkas dari gudang (database) |

### Hubungan antar class

```
PracticeRepository ──findBySlug($slug)──▶ Practice ──punya──▶ Profession  (label, gelar, ikon, layanan)
  (ambil dari Supabase)                    (data praktik) └─punya──▶ Schedule (jadwal per hari)
```

Object `Practice` **berisi** object lain: property `$profession` adalah object `Profession`, dan `$schedule` adalah object `Schedule`. Ini disebut *object di dalam object* (komposisi).

---

## Task 01 — Create a Class

> Buat sebuah class yang merepresentasikan data NAKESA.

### Konsep

```
DESIGN DATA → CLASS → OBJECT → NAKESA DATA
```

### 1. Design data

Datanya sudah ada: jawaban fungsi database `get_public_practice` dari Supabase (dan `$samplePractice` di `data.php` yang bentuknya sama). Setiap kunci array menjadi satu property:

| Kunci dari Supabase | Property di `Practice` | Tipe | Contoh |
|---|---|---|---|
| (dari URL `?p=`) | `$slug` | `?string` | `'4dafb47bcd'`, atau `null` untuk contoh |
| `name` | `$name` | `string` | `'Praktik Bidan Sehati'` |
| `practitioner` | `$practitioner` | `string` | `'Siti Aminah'` (tanpa gelar) |
| `specialty` | `$specialty` | `?string` | `null` |
| `address` | `$address` | `?string` | `'Jl. Melati No. 12, Sleman'` |
| `phone` | `$phone` | `?string` | `null` |
| `is_open` | `$isOpen` | `bool` | `true` |
| `booking_enabled` | `$bookingEnabled` | `bool` | `true` |
| `profession` | `$profession` | `Profession` (object) | object profesi Bidan |
| `hours` | `$schedule` | `Schedule` (object) | object jadwal Senin–Sabtu |

> **`?string`** artinya boleh `string` atau `null`. Alamat, nomor WhatsApp, dan spesialisasi memang boleh kosong di NAKESA.

### 2. Class

#### `php/classes/Practice.php` (file baru): property dan constructor

```php
class Practice
{
    private ?string $slug;          // kode link booking; null untuk contoh praktik
    private string $name;
    private string $practitioner;   // nama nakes tanpa gelar
    private ?string $specialty;
    private ?string $address;
    private ?string $phone;
    private bool $isOpen;
    private bool $bookingEnabled;
    private Profession $profession; // object di dalam object
    private Schedule $schedule;

    /**
     * $data: bentuknya sama dengan jawaban get_public_practice dari Supabase (dan $samplePractice di data.php).
     * $slug: kode link booking praktik ini, kosongkan untuk contoh praktik.
     */
    public function __construct(array $data, ?string $slug = null)
    {
        $this->slug = $slug;
        $this->name = $data['name'];
        $this->practitioner = $data['practitioner'] ?? '';
        $this->specialty = $data['specialty'];
        $this->address = $data['address'];
        $this->phone = $data['phone'];
        $this->isOpen = $data['is_open'];
        $this->bookingEnabled = $data['booking_enabled'];
        $this->profession = Profession::find($data['profession']);
        $this->schedule = new Schedule($data['hours']);
    }
    // … method di Task 02
}
```

**Fungsi constructor:** mengubah data mentah (array dari Supabase) menjadi object yang siap dipakai. Alurnya sama dengan slide "Constructor & Encapsulation":

```
new Practice($data)  →  __construct()  →  INITIALIZE DATA                       →  PRACTICE OBJECT
                                          $this->name = $data['name']                siap dipakai halaman
                                          $this->profession = Profession::find(…)
                                          $this->schedule = new Schedule(…)
```

| Baris di constructor | Fungsinya |
|---|---|
| `$this->slug = $slug;` | Menyimpan kode link booking, dipakai nanti oleh `getBookingUrl()` |
| `$this->name = $data['name'];` … `$this->bookingEnabled = …` | Menyalin data dari array ke property object |
| `$data['practitioner'] ?? ''` | Kalau nama nakes kosong (`null`), diganti teks kosong supaya tipe `string` tetap terpenuhi |
| `Profession::find($data['profession'])` | Mengubah teks `'bidan'` menjadi **object** `Profession` lengkap dengan label, gelar, ikon, dan layanannya |
| `new Schedule($data['hours'])` | Mengubah daftar sesi menjadi **object** `Schedule` yang sudah dikelompokkan per hari |

> **Bedanya dengan slide:** constructor `President` menerima tiga parameter (`$name, $period, $programs`). Data praktik punya 9 kolom, jadi constructor `Practice` menerima **satu array** yang bentuknya sama dengan jawaban Supabase. Dengan begitu data dari Supabase dan contoh praktik bisa langsung dimasukkan tanpa disusun ulang.

### 3. Object

#### `php/praktik.php`: object dibuat dari class

```php
/* ---------- Week 6 · Task 01: Create a Class → object dibuat dari class Practice ---------- */
if ($isSample) {
    $practice = new Practice($samplePractice);
} elseif (preg_match('/^[a-z0-9-]{4,40}$/', $slug)) { // bentuk slug sama dengan aturan di database
    try {
        $repository = new PracticeRepository(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
        $practice = $repository->findBySlug($slug);
    } catch (Throwable $exception) {
        // … sama dengan Week 5: tulis log, HTTP 503, pesan "Data praktik tidak bisa dimuat"
    }
}
```

- **Tanpa `?p=`:** object dibuat langsung dari contoh praktik di `data.php`.
- **Dengan `?p=`:** object dibuat oleh `PracticeRepository` dari data Supabase (penjelasan lengkapnya ada di [Task 02](#5-practicerepository-mengambil-data-dari-supabase)).

Satu class bisa menghasilkan banyak object. Pada pengujian saya membuat dua object sekaligus dari class yang sama:

```php
$bidan = new Practice($samplePractice);
$gigi  = new Practice([... 'name' => 'Klinik Gigi Ceria', 'profession' => 'dokter_gigi', 'is_open' => false, ...], 'klinik-ceria');

echo $bidan->getName();        // Praktik Bidan Sehati
echo $gigi->getName();         // Klinik Gigi Ceria
echo $bidan->getOpenLabel();   // Sedang buka
echo $gigi->getOpenLabel();    // Sedang tutup
```

### Penjelasan

- **`$this->name = $data['name']`**: `$this` adalah object yang sedang dibuat. Baris ini artinya "isi property `name` milik object ini dengan nilai dari array".
- **Typed property** (`private string $name`): PHP memastikan isinya selalu bertipe benar. Kalau Supabase mengirim data yang tidak sesuai, error muncul di constructor, ditangkap oleh `catch (Throwable …)`, dan pasien melihat pesan ⚠️ yang ramah.
- **`Profession::find()`** adalah method **static**: dipanggil lewat nama class, bukan lewat object, karena tugasnya justru *membuat* object `Profession` dari kunci `'bidan'`, `'dokter_gigi'`, dst.

### Checklist (sesuai slide Task 01)

- [x] **Class dibuat:** `Practice`, `Profession`, `Schedule`, `PracticeRepository`.
- [x] **Property ditentukan:** 10 property di `Practice`, semuanya bertipe.
- [x] **Object berhasil dibuat:** `new Practice($samplePractice)` dan `$repository->findBySlug('4dafb47bcd')` menghasilkan object `Practice` (diuji dengan `instanceof`).
- [x] **Data dapat diakses:** lewat method, misalnya `$practice->getName()` → "Praktik Bidan Sehati".

---

## Task 02 — Add Properties & Methods

> Tambahkan property dan method yang dibutuhkan oleh halaman NAKESA.

### Konsep

```
OBJECT = DATA + BEHAVIOR
```

Slide meminta mahasiswa menentukan sendiri tiga hal:

| | Keputusan saya |
|---|---|
| **1. Data yang diperlukan** | Semua yang tampil di Profil Praktik: nama praktik, nama nakes, profesi & spesialisasi, alamat, nomor WhatsApp, status buka, status booking, jadwal, dan layanan. Ditambah `slug` untuk membuat link booking |
| **2. Method yang diperlukan** | Satu method untuk setiap hal yang **ditanyakan halaman**: "nama praktiknya apa?", "sedang buka?", "link WhatsApp-nya apa?", "hari ini praktik jam berapa?". Pengolahan data (gelar, label, link, kalimat jadwal) dikerjakan di dalam method, bukan di halaman |
| **3. Bagaimana object digunakan halaman** | Halaman hanya membuat object lalu memanggil method-nya di dalam HTML (`<?= e($practice->getName()) ?>`). Halaman tidak perlu tahu bentuk array dari Supabase |

### Fungsi setiap method

#### 1. `Practice` (≈ `President` di slide)

| Method | Fungsinya | Contoh hasil |
|---|---|---|
| `getName()` | Mengembalikan nama praktik | `Praktik Bidan Sehati` |
| `getPractitioner()` | Nama nakes + gelar profesinya (gelarnya dari object `Profession`) | `Bidan Siti Aminah`, `drg. aditiya` |
| `getProfessionLabel()` | Nama profesi, ditambah spesialisasi kalau ada | `Bidan`, `Dokter Spesialis Anak` |
| `getSubtitle()` | Baris di bawah nama praktik (≈ `getProfile()` di slide) | `Bidan Siti Aminah · Bidan` |
| `getAddress()` | Alamat praktik, atau `null` kalau kosong | `Jl. Melati No. 12, Sleman` |
| `getServices()` | Daftar layanan yang bisa dipilih pasien (≈ `getPrograms()`) | `['Periksa Kehamilan', 'KB', …]` |
| `isOpen()` | Apakah praktik sedang buka (`true`/`false`), untuk warna label | `true` |
| `getOpenLabel()` | Teks status untuk ditampilkan | `Sedang buka` / `Sedang tutup` |
| `isBookingEnabled()` | Apakah booking online sedang dibuka nakes | `true` |
| `getBookingUrl()` | Link ke halaman booking; `null` untuk contoh praktik | `../html/book.html?p=4dafb47bcd` |
| `getChatUrl()` | Link chat WhatsApp; `null` kalau praktik tidak mengisi nomor | `https://wa.me/62821…?text=Halo%20…` |
| `getPageTitle()` | Judul tab browser & pratinjau link WhatsApp | `Praktik Bidan Sehati · Jadwal & Layanan` |
| `getPageDescription()` | Deskripsi untuk pratinjau link | `Bidan Siti Aminah · Bidan · Jl. Melati …. Lihat jadwal …` |
| `getProfession()` | Mengembalikan object `Profession` di dalamnya | object `Profession` |
| `getSchedule()` | Mengembalikan object `Schedule` di dalamnya | object `Schedule` |

#### 2. `Profession`

| Method | Fungsinya | Contoh |
|---|---|---|
| `static find($key)` | Membuat object `Profession` dari kunci profesi di database. Kunci yang tidak dikenal (atau `null`) dianggap "Lainnya" | `Profession::find('dokter_gigi')` → object Dokter Gigi |
| `getLabel()` | Nama profesi | `Dokter Gigi` |
| `getIcon()` | Ikon profesi | `🦷` |
| `getServices()` | Layanan bawaan profesi | `['Periksa Gigi', 'Tambal Gigi', …]` |
| `titledName($fullName)` | Menambahkan gelar di depan nama, kecuali nama sudah diawali gelar itu | `'Rina'` → `drg. Rina`; `'drg. Rina'` tetap `drg. Rina` |

#### 3. `Schedule`

| Method | Fungsinya | Contoh |
|---|---|---|
| `__construct($hours)` | Mengelompokkan daftar sesi dari database per hari, sekaligus mengubah format jam | `[['day' => 1, 'opens' => '08:00', …], …]` → `[1 => ['08.00–12.00', '16.00–20.00'], …]` |
| `isEmpty()` | Apakah jadwal belum diatur sama sekali | `false` |
| `isOpenOn($day)` | Apakah praktik buka pada hari itu (0 = Minggu … 6 = Sabtu) | `isOpenOn(0)` → `false` |
| `getSessions($day)` | Daftar sesi pada hari itu; array kosong kalau tutup | `getSessions(1)` → `['08.00–12.00', '16.00–20.00']` |
| `getTodaySummary($today)` | Kalimat tentang jadwal hari ini, atau kapan buka lagi | `Hari ini tutup. Buka lagi besok (Senin) mulai pukul 08.00.` |
| `shortTime($time)` (**private**) | Mengubah `08:00` menjadi `08.00`. Hanya dipakai di dalam class | — |

#### 4. `PracticeRepository`

| Method | Fungsinya |
|---|---|
| `__construct($url, $key)` | Menyimpan alamat Supabase dan publishable key sebagai property private |
| `findBySlug($slug)` | Mengambil profil publik praktik dari Supabase, lalu mengembalikan object `Practice`, atau `null` kalau tidak ditemukan. Penjelasan baris per baris ada di [bawah](#5-practicerepository-mengambil-data-dari-supabase) |

### Contoh method

#### 1. Getter sederhana dan method dengan conditional (`Practice.php`)

```php
public function getName(): string
{
    return $this->name;
}

/** Label untuk tombol "Buka / tutup" yang diatur nakes di NAKESA. */
public function getOpenLabel(): string
{
    if ($this->isOpen) {
        return 'Sedang buka';
    }
    return 'Sedang tutup';
}
```

#### 2. Method yang memakai object lain (`Practice.php`)

```php
/** Nama nakes dengan gelar profesinya: "Bidan Siti Aminah", "dr. Andi". */
public function getPractitioner(): string
{
    return $this->profession->titledName($this->practitioner);
}

/** Layanan yang bisa dipilih pasien (seperti getPrograms() di slide). */
public function getServices(): array
{
    return $this->profession->getServices();
}
```

`$this->profession->titledName(…)` dibaca: "dari object ini, ambil object profesinya, lalu panggil method `titledName()` milik profesi itu". `Practice` tidak perlu tahu gelar setiap profesi; itu urusan `Profession`.

#### 3. Method yang memakai property lain (`Practice.php`)

```php
/** Link ke halaman booking (dilihat dari halaman di folder php/). Contoh praktik tidak punya link. */
public function getBookingUrl(): ?string
{
    return $this->slug === null ? null : '../html/book.html?p=' . rawurlencode($this->slug);
}

/** Link chat WhatsApp ke praktik, atau null kalau praktik tidak mengisi nomor. */
public function getChatUrl(): ?string
{
    return $this->phone ? waLink($this->phone, "Halo $this->name, saya ingin bertanya.") : null;
}
```

- `getBookingUrl()`: kalau object dibuat tanpa slug (contoh praktik), tidak ada link booking. `rawurlencode()` mengamankan slug sebelum dimasukkan ke URL.
- `getChatUrl()`: kalau ada nomor, `waLink()` (helper di `functions.php`) mengubah `0821…` menjadi `https://wa.me/62821…` dengan pesan pembuka berisi nama praktik.

#### 4. `Schedule`: constructor yang mengolah data + method private

```php
class Schedule
{
    /** Hari (0 = Minggu … 6 = Sabtu) → sesi praktik hari itu: [1 => ['08.00–12.00', '16.00–20.00'], …] */
    private array $sessionsByDay = [];

    /** $hours: daftar sesi dari database, [['day' => 1, 'opens' => '08:00', 'closes' => '12:00'], …] */
    public function __construct(array $hours)
    {
        foreach ($hours as $session) {
            $this->sessionsByDay[$session['day']][] = $this->shortTime($session['opens']) . '–' . $this->shortTime($session['closes']);
        }
    }

    public function isEmpty(): bool
    {
        return count($this->sessionsByDay) === 0;
    }

    public function isOpenOn(int $day): bool
    {
        return isset($this->sessionsByDay[$day]);
    }

    /** Kalimat singkat tentang jadwal hari ini, atau kapan praktik buka lagi. */
    public function getTodaySummary(int $today): string
    {
        if ($this->isEmpty()) {
            return 'Jadwal praktik belum diatur. Tanyakan langsung ke praktik.';
        }
        if ($this->isOpenOn($today)) {
            return 'Hari ini (' . DAYS[$today] . ') praktik pukul ' . implode(' & ', $this->getSessions($today)) . '.';
        }
        // Hari ini tutup: cari hari praktik berikutnya (besok, lusa, … sampai 6 hari lagi).
        for ($i = 1; $i <= 6; $i++) {
            $day = ($today + $i) % 7;
            if ($this->isOpenOn($day)) {
                $when = $i === 1 ? 'besok (' . DAYS[$day] . ')' : 'hari ' . DAYS[$day];
                $opens = explode('–', $this->getSessions($day)[0])[0];
                return "Hari ini tutup. Buka lagi $when mulai pukul $opens.";
            }
        }
        return 'Hari ini tutup.';
    }

    /** "08:00" → "08.00" (penulisan jam di Indonesia). Private: hanya dipakai di dalam class ini. */
    private function shortTime(string $time): string
    {
        return str_replace(':', '.', substr($time, 0, 5));
    }
}
```

- Pengelompokan per hari (dulu fungsi `groupHoursByDay()`) sekarang dikerjakan **sekali di constructor**. Setelah object jadi, datanya sudah rapi dan siap ditanya.
- `getTodaySummary()` memanggil method lain di class yang sama (`$this->isEmpty()`, `$this->isOpenOn()`), jadi logikanya mudah dibaca seperti kalimat.
- `shortTime()` dibuat **private** karena hanya dibutuhkan oleh `Schedule`. Halaman tidak bisa (dan tidak perlu) memanggilnya.

#### 5. `PracticeRepository`: mengambil data dari Supabase

**Fungsi class ini:** menjadi satu-satunya bagian kode yang berbicara dengan Supabase untuk halaman Profil Praktik. Halaman cukup berkata "tolong ambilkan praktik dengan kode ini", dan `PracticeRepository` yang mengurus request HTTP, key, pengecekan error, dan mengubah JSON menjadi object `Practice`. Isinya adalah fungsi `fetchPractice()` dari Week 5 yang dipindah ke dalam class.

```php
class PracticeRepository
{
    private string $url;
    private string $key;

    public function __construct(string $url, string $key)
    {
        $this->url = $url;
        $this->key = $key;
    }

    /**
     * Profil publik sebuah praktik. Yang memanggil Supabase adalah SERVER (PHP), bukan browser.
     * Mengembalikan object Practice, atau null kalau slug tidak ditemukan. Melempar RuntimeException kalau gagal.
     */
    public function findBySlug(string $slug): ?Practice
    {
        // Fungsi database yang sama dengan halaman booking (book.html): hanya data yang boleh dilihat pasien.
        $request = curl_init($this->url . '/rest/v1/rpc/get_public_practice');
        curl_setopt_array($request, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['apikey: ' . $this->key, 'Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode(['p_slug' => $slug]),
            CURLOPT_RETURNTRANSFER => true, // jawaban disimpan ke variabel, bukan langsung dicetak
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10, // jangan biarkan halaman menunggu selamanya
        ]);
        $body = curl_exec($request);
        $status = curl_getinfo($request, CURLINFO_RESPONSE_CODE);

        if ($body === false) {
            throw new RuntimeException('Supabase tidak bisa dihubungi: ' . curl_error($request));
        }
        if ($status !== 200) {
            throw new RuntimeException("Supabase menjawab HTTP $status");
        }
        // JSON → array PHP → object Practice. Slug yang tidak ada dijawab dengan null.
        $data = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
        return is_array($data) ? new Practice($data, $slug) : null;
    }
}
```

**Penjelasan baris per baris:**

| Kode | Fungsinya |
|---|---|
| `private string $url; private string $key;` | Alamat project Supabase dan *publishable key*. Dibuat private: halaman tidak bisa membaca atau mengubahnya lewat object |
| `__construct($url, $key)` | Menerima alamat dan key dari luar. Di `praktik.php` diisi dengan konstanta `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` dari `data.php` |
| `findBySlug(string $slug): ?Practice` | Tipe kembalian `?Practice` artinya hasilnya object `Practice` **atau** `null` |
| `curl_init($this->url . '/rest/v1/rpc/get_public_practice')` | Menyiapkan request HTTP ke fungsi database `get_public_practice`. Alamat lengkapnya `https://fmmudgdkyihbyxntutit.supabase.co/rest/v1/rpc/get_public_practice` |
| `CURLOPT_POST => true` | Memakai method **POST**. Di Supabase, fungsi database (RPC) dipanggil dengan POST dan parameternya dikirim di body |
| `CURLOPT_HTTPHEADER` | `apikey:` memberi tahu Supabase project mana yang dipakai (tanpa key, Supabase menolak dengan `401 Invalid API key`). `Content-Type: application/json` menandakan body berbentuk JSON |
| `CURLOPT_POSTFIELDS => json_encode(['p_slug' => $slug])` | Isi body: `{"p_slug":"4dafb47bcd"}`. `p_slug` adalah nama parameter fungsi `get_public_practice` di database |
| `CURLOPT_RETURNTRANSFER => true` | Jawaban Supabase disimpan ke variabel `$body`, tidak langsung dicetak ke halaman |
| `CURLOPT_CONNECTTIMEOUT => 5`, `CURLOPT_TIMEOUT => 10` | Batas waktu: maksimal 5 detik untuk tersambung, 10 detik total. Kalau Supabase lambat, pasien tidak menunggu selamanya |
| `$body = curl_exec($request)` | Mengirim request. Hasilnya teks JSON, atau `false` kalau tidak tersambung sama sekali |
| `curl_getinfo(…, CURLINFO_RESPONSE_CODE)` | Mengambil kode HTTP jawaban (200, 401, 404, 500, …) |
| `if ($body === false) throw …` | Gagal tersambung (internet mati, alamat salah) → lempar `RuntimeException` dengan penyebabnya |
| `if ($status !== 200) throw …` | Tersambung tetapi Supabase menolak (misalnya key salah → 401) → lempar `RuntimeException` |
| `json_decode($body, true, 512, JSON_THROW_ON_ERROR)` | Mengubah teks JSON menjadi array PHP. `true` = array asosiatif, `JSON_THROW_ON_ERROR` = kalau JSON rusak, langsung error (tidak diam-diam `null`) |
| `is_array($data) ? new Practice($data, $slug) : null` | Kalau praktik ditemukan → buat object `Practice` beserta slug-nya. Kalau slug tidak ada, Supabase menjawab `null` → kembalikan `null` |

**Contoh request dan jawaban Supabase** (praktik asli, nomor WhatsApp disingkat):

```
POST https://fmmudgdkyihbyxntutit.supabase.co/rest/v1/rpc/get_public_practice
apikey: sb_publishable_…
Content-Type: application/json

{"p_slug":"4dafb47bcd"}
```

```json
{
  "name": "Praktik Ahli Gizi Sigit Novriyanto",
  "practitioner": "Sigit Novriyanto",
  "profession": "dokter_umum",
  "specialty": null,
  "address": "JL. TIRTO",
  "phone": "0821…",
  "is_open": true,
  "booking_enabled": true,
  "hours": [
    {"day": 1, "opens": "08:00", "closes": "20:00"},
    {"day": 2, "opens": "08:00", "closes": "20:00"},
    {"day": 3, "opens": "08:00", "closes": "20:00"},
    {"day": 4, "opens": "08:00", "closes": "20:00"}
  ],
  "services": [ … ]
}
```

JSON ini langsung masuk ke `new Practice($data, '4dafb47bcd')`. Constructor `Practice` mengambil kunci yang dibutuhkan (`name`, `practitioner`, …, `hours`).

**Tiga kemungkinan hasil `findBySlug()` dan reaksi halaman:**

| Hasil `findBySlug()` | Kapan terjadi | Yang dilakukan `praktik.php` | HTTP |
|---|---|---|---|
| object `Practice` | Slug ada di database | Tampilkan profil praktik | `200` |
| `null` | Slug tidak ada (Supabase menjawab `null`) | 🔍 "Profil praktik tidak ditemukan" | `404` |
| melempar `RuntimeException` | Supabase tidak bisa dihubungi, key salah, atau JSON rusak | Tulis penyebabnya ke log server, tampilkan ⚠️ "Data praktik tidak bisa dimuat" + tombol **Coba lagi** | `503` |

**Kenapa dibuat class, bukan fungsi seperti Week 5?**

1. **Halaman tidak perlu tahu soal cURL dan JSON.** Halaman cukup menulis `$repository->findBySlug($slug)` dan langsung mendapat object `Practice`, bukan array mentah.
2. **Alamat Supabase bisa diganti tanpa mengubah kode.** Karena alamat diberikan lewat constructor, uji "Supabase mati" cukup dengan `new PracticeRepository('https://alamat-salah…', $key)`. Di Week 5, untuk uji yang sama saya harus mengubah `data.php` sementara.
3. **Siap dipakai ulang.** Kalau nanti ada fungsi lain (misalnya `findAll()` untuk daftar semua praktik), tempatnya di class yang sama dan memakai `$this->url` / `$this->key` yang sama.

> **Kenapa publishable key aman di sini?** Sama dengan Week 5: key ini memang untuk dipakai publik (sama dengan yang ada di `js/config.js`). Data dilindungi Row Level Security, dan `get_public_practice` hanya mengembalikan data yang boleh dilihat pasien. *Secret key* tidak pernah ditaruh di kode.

### Dari fungsi (Week 5) ke method (Week 6)

| Week 5: fungsi di `functions.php` | Week 6: method | Kenapa pindah ke sana |
|---|---|---|
| `professionOf($key)` | `Profession::find($key)` | Membuat object profesi |
| `titledName($fullName, $title)` | `$profession->titledName($fullName)` | Gelar milik profesi, tidak perlu dioper lagi |
| `openLabel($isOpen)` | `$practice->getOpenLabel()` | Status buka milik praktik |
| `groupHoursByDay($hours)` | `new Schedule($hours)` (constructor) | Dikerjakan sekali saat object dibuat |
| `todaySummary($hoursByDay, $today)` | `$schedule->getTodaySummary($today)` | Jadwal tidak perlu dioper lagi |
| `shortTime($time)` | `Schedule::shortTime()` (**private**) | Hanya dipakai `Schedule` |
| `fetchPractice($slug)` → array | `$repository->findBySlug($slug)` → object `Practice` | Langsung menghasilkan object |
| `e()`, `waLink()`, `indonesianDateTime()` | **tetap fungsi** di `functions.php` | Helper umum, bukan milik satu object |

> **Tidak semua harus jadi class.** `e()` (escape HTML) dipakai untuk teks apa saja, dan `indonesianDateTime()` untuk jam pembuatan halaman. Keduanya bukan perilaku praktik, jadi tetap fungsi biasa.

### Encapsulation

Semua property dibuat **`private`**. Dari luar class, data hanya bisa **dibaca** lewat method `public`, dan **tidak bisa diubah**. Hasil uji (PHP 8.5):

| Percobaan dari luar class | Hasil |
|---|---|
| `echo $bidan->name;` | `Error: Cannot access private property Practice::$name` |
| `$bidan->isOpen = false;` | `Error: Cannot access private property Practice::$isOpen` (status tetap "Sedang buka") |
| `$bidan->getSchedule()->shortTime('08:00');` | `Error: Call to private method Schedule::shortTime() from global scope` |
| `echo $repository->key;` | `Error: Cannot access private property PracticeRepository::$key` |
| `echo $bidan->getName();` | `Praktik Bidan Sehati` ✓ (lewat getter `public`) |

**Kenapa tidak ada setter?** Halaman Profil Praktik hanya **menampilkan** data. Status buka/tutup, alamat, dan jadwal diubah oleh nakes di dashboard NAKESA (tersimpan di Supabase), bukan oleh halaman publik ini. Dengan hanya getter, object `Practice` bersifat *read-only*: sekali dibuat dari data Supabase, isinya tidak bisa diubah tanpa sengaja oleh kode halaman. Kalau nanti ada fitur yang perlu mengubah data, setter bisa ditambahkan dengan validasi di dalamnya, misalnya `setPhone()` yang menolak nomor tidak valid.

### Checklist (sesuai slide Task 02)

- [x] **Property sesuai kebutuhan:** semua data yang tampil di Profil Praktik, tidak lebih.
- [x] **Method dibuat:** 26 method (di luar constructor): 15 di `Practice`, 5 di `Profession`, 5 di `Schedule`, 1 di `PracticeRepository`.
- [x] **Method dapat dipanggil:** 36 pemeriksaan lulus (lihat [Pengujian](#pengujian-yang-dilakukan)).
- [x] **Data dapat digunakan oleh halaman:** semua isi `praktik.php` sekarang diambil dari method.

---

## Task 03 — Generate Dynamic Content with Object

> Gunakan object PHP untuk menghasilkan bagian konten NAKESA secara dinamis.

### Konsep

```
PRACTICE OBJECT → METHOD          → PHP              → GENERATED HTML → NAKESA PAGE
                  getName()          memproses data      <h1>…</h1>
                  getServices()      dari object         <li>…</li>
```

### Penerapan di NAKESA

#### 1. `php/praktik.php`: persiapan data cukup lewat object

**Sebelum (Week 5):** 18 variabel lepas disiapkan dari array dan fungsi.

```php
if ($practice) {
    $profession = professionOf($practice['profession']);
    $practiceName = $practice['name'];
    $practitioner = titledName($practice['practitioner'] ?? '', $profession['title']);
    $professionLabel = $practice['specialty'] ? "{$profession['label']} {$practice['specialty']}" : $profession['label'];
    $subtitle = implode(' · ', array_filter([$practitioner, $professionLabel]));
    $address = $practice['address'];
    $phone = $practice['phone'];
    $isOpen = $practice['is_open'];
    $bookingEnabled = $practice['booking_enabled'];
    $today = (int) date('w');
    $hoursByDay = groupHoursByDay($practice['hours']);
    $todayText = todaySummary($hoursByDay, $today);
    $services = $profession['services'];
    $serviceTones = [/* … */];
    $bookingUrl = $isSample ? null : '../html/book.html?p=' . rawurlencode($slug);
    $chatUrl = $phone ? waLink($phone, "Halo $practiceName, saya ingin bertanya.") : null;
    $pageTitle = "$practiceName · Jadwal & Layanan";
    $pageDescription = implode(' · ', array_filter([$subtitle, $address])) . '. Lihat jadwal praktik dan buat janji periksa online.';
}
```

**Sesudah (Week 6):** pengolahannya sudah ada di dalam method, halaman tinggal mengambil.

```php
if ($practice) {
    /* ---------- Week 6 · Task 02: property & method → data halaman diambil lewat method object ---------- */
    $profession = $practice->getProfession(); // object Profession di dalam object Practice
    $schedule = $practice->getSchedule();     // object Schedule
    $services = $practice->getServices();
    $today = (int) date('w'); // 0 = Minggu … 6 = Sabtu, waktu WIB
    $serviceTones = ['bg-blue-soft text-blue', 'bg-green-soft text-green', 'bg-yellow-soft text-yellow', 'bg-purple-soft text-purple'];

    // Judul & deskripsi untuk tab browser dan pratinjau link saat dibagikan di WhatsApp.
    $pageTitle = $practice->getPageTitle();
    $pageDescription = $practice->getPageDescription();
}
```

#### 2. HTML memanggil method object

**Kartu identitas praktik (object `Practice`):**

```php
<span class="…" aria-hidden="true"><?= $profession->getIcon() ?></span>
<h1 class="text-2xl" id="practice-name"><?= e($practice->getName()) ?></h1>
<p class="text-muted"><?= e($practice->getSubtitle()) ?></p>

<span class="open-pill<?= $practice->isOpen() ? ' is-open' : '' ?>"><span class="live-dot" aria-hidden="true"></span><?= $practice->getOpenLabel() ?></span>
<?php if ($practice->getAddress()): ?>
        <span class="text-sm text-muted">📍 <?= e($practice->getAddress()) ?></span>
<?php endif; ?>

<?php if (!$practice->isBookingEnabled()): ?>
        <p class="…">📵 Booking online sedang ditutup. Silakan hubungi praktik langsung.</p>
<?php elseif ($practice->getBookingUrl()): ?>
        <a class="btn btn-primary btn-big" href="<?= e($practice->getBookingUrl()) ?>">📅 Buat janji periksa</a>
<?php else: ?>
        <span class="btn btn-primary btn-big pointer-events-none opacity-60" aria-disabled="true">📅 Buat janji periksa</span>
<?php endif; ?>
<?php if ($practice->getChatUrl()): ?>
        <a class="btn btn-wa" href="<?= e($practice->getChatUrl()) ?>" target="_blank" rel="noopener">💬 Chat praktik via WhatsApp</a>
<?php endif; ?>
```

**Tabel jadwal (object `Schedule`):**

```php
<?php if ($schedule->isEmpty()): ?>
      <p class="muted">Jadwal praktik belum diatur. Tanyakan langsung ke praktik.</p>
<?php else: ?>
      <table class="hours">
        <tbody>
<?php foreach (WEEK_ORDER as $day): ?>
          <tr<?= $day === $today ? ' class="is-today"' : '' ?>>
            <td><?= DAYS[$day] ?><?= $day === $today ? ' <span class="badge badge-orange ml-1">Hari ini</span>' : '' ?></td>
            <td><?= $schedule->isOpenOn($day) ? implode('<br>', $schedule->getSessions($day)) : '<span class="muted">Tutup</span>' ?></td>
          </tr>
<?php endforeach; ?>
        </tbody>
      </table>
<?php endif; ?>
```

**Daftar layanan (`getServices()`, seperti `getPrograms()` di slide):**

```php
<p class="…"><?= count($services) ?> layanan <?= e($profession->getLabel()) ?>. Pilih salah satu saat membuat janji.</p>
<ol class="m-0 grid list-none gap-2 p-0">
<?php foreach ($services as $index => $service): ?>
  <li class="…"> … <span class="font-medium text-ink"><?= e($service) ?></span></li>
<?php endforeach; ?>
</ol>
```

| Bagian halaman | Week 5 (procedural) | Week 6 (OOP) |
|---|---|---|
| Ikon profesi | `$profession['icon']` | `$profession->getIcon()` |
| Nama praktik | `$practiceName` | `$practice->getName()` |
| Nama nakes · profesi | `$subtitle` | `$practice->getSubtitle()` |
| Status | `$isOpen`, `openLabel($isOpen)` | `$practice->isOpen()`, `$practice->getOpenLabel()` |
| Alamat | `$address` | `$practice->getAddress()` |
| Kalimat hari ini | `$todayText` | `$schedule->getTodaySummary($today)` |
| Tombol booking / WhatsApp | `$bookingEnabled`, `$bookingUrl`, `$chatUrl` | `$practice->isBookingEnabled()`, `getBookingUrl()`, `getChatUrl()` |
| Jadwal | `count($hoursByDay)`, `isset($hoursByDay[$day])` | `$schedule->isEmpty()`, `$schedule->isOpenOn($day)` |
| Layanan | `$profession['services']` | `$practice->getServices()` |
| Judul tab & pratinjau | `"$practiceName · Jadwal & Layanan"` | `$practice->getPageTitle()` |

### Hasil di halaman

Hasilnya **sama persis dengan Week 5**. Contoh praktik asli `?p=4dafb47bcd` pada Selasa, 20 Oktober 2026, beserta method yang menghasilkan setiap bagian:

```
┌───────────────────────────────────────┐
│ ┌────┐ Praktik Ahli Gizi Sigit        │  ← $practice->getName()
│ │ 🩺 │ Novriyanto                     │  ← $profession->getIcon()
│ └────┘ dr. Sigit Novriyanto · Dokter  │  ← $practice->getSubtitle()
│        Umum                           │
│ ● Sedang buka   📍 JL. TIRTO          │  ← getOpenLabel(), getAddress()
│ 🕒 Hari ini (Selasa) praktik pukul    │  ← $schedule->getTodaySummary($today)
│ 08.00–20.00.                          │
│ [       📅 Buat janji periksa       ] │  ← getBookingUrl()
│ [   💬 Chat praktik via WhatsApp    ] │  ← getChatUrl()
├───────────────────────────────────────┤
│ 🗓️ Jadwal praktik                     │
│ Senin                    08.00–20.00  │  ← $schedule->getSessions(1)
│ Selasa [Hari ini]        08.00–20.00  │
│ Rabu                     08.00–20.00  │
│ Kamis                    08.00–20.00  │
│ Jumat                          Tutup  │  ← $schedule->isOpenOn(5) = false
│ Sabtu                          Tutup  │
│ Minggu                         Tutup  │
├───────────────────────────────────────┤
│ 🩺 Layanan                            │
│ 5 layanan Dokter Umum. …              │  ← $practice->getServices()
│ (1) Konsultasi Umum                   │
│ (2) Cek Kesehatan                     │
│ (3) Surat Keterangan Sehat            │
│ (4) Rawat Luka                        │
│ (5) Suntik / Injeksi                  │
└───────────────────────────────────────┘
```

### Bukti: output HTML tetap sama

Sebelum mengubah kode, saya menyimpan HTML hasil `praktik.php` versi Week 5 untuk 6 kasus. Setelah diubah ke OOP, keenam kasus dibuka lagi dan dibandingkan dengan `diff`. Komentar HTML dan jam pembuatan halaman diabaikan, karena keduanya memang berbeda.

| Kasus | URL | HTTP | Hasil `diff` |
|---|---|---|---|
| Contoh praktik | `praktik.php` | 200 | **Identik** |
| Praktik asli (dokter umum, ada jadwal) | `?p=4dafb47bcd` | 200 | **Identik** |
| Praktik asli (dokter gigi, tutup, jadwal kosong) | `?p=a763f4e5c8` | 200 | **Identik** |
| Praktik tidak ada | `?p=zzzz9999` | 404 | **Identik** |
| Slug tidak valid | `?p=BAD<slug` | 404 | **Identik** |
| Input aneh (array) | `?p[]=x` | 200 | **Identik** |

Yang berbeda hanya 3 komentar HTML yang teksnya saya sesuaikan (misalnya `<!-- Task 01: identitas praktik dari variabel PHP -->` → `<!-- Identitas praktik: dari method object Practice -->`) dan jam di bagian bawah halaman.

### Penjelasan

- **Satu object, banyak bagian halaman.** Kartu identitas, tabel jadwal, daftar layanan, tombol, judul tab, dan pratinjau WhatsApp semuanya diambil dari object `$practice` yang sama.
- **Halaman tidak lagi tahu bentuk data Supabase.** Di Week 5 halaman menulis `$practice['is_open']`, `$practice['booking_enabled']`, dst. Sekarang hanya constructor `Practice` yang tahu nama kolom itu. Kalau nanti nama kolom di Supabase berubah, cukup constructor yang diubah.
- **`e()` tetap dipakai** untuk semua teks dari database, karena method mengembalikan data apa adanya. Escape HTML adalah urusan saat mencetak ke HTML, bukan urusan object.
- **Method yang dipanggil dua kali** (misalnya `getAddress()` di `if` lalu di `echo`) tidak masalah, karena method itu hanya mengembalikan property tanpa memanggil Supabase lagi. Data Supabase diambil **sekali** di `findBySlug()`.

### Checklist (sesuai slide Task 03)

- [x] **Object digunakan:** `$practice` (Practice), `$profession` (Profession), `$schedule` (Schedule), `$repository` (PracticeRepository).
- [x] **Method digunakan:** semua isi halaman berasal dari method.
- [x] **Data berasal dari object:** tidak ada lagi `$practice['…']` di `praktik.php`.
- [x] **HTML berhasil dihasilkan:** 6 kasus diuji, kode HTTP sesuai (200/404).
- [x] **Tampilan tetap sesuai desain:** HTML identik dengan Week 5, jadi tampilan di HP, mode terang dan gelap tidak berubah.

---

## Demo: Show Your OOP Process

```
CLASS          OBJECT                          PROPERTY / METHOD            PHP PROCESS             HTML OUTPUT             NAKESA PAGE
Practice   →   new Practice($samplePractice) → $name, $schedule, …      →   method mengolah     →   <h1>…</h1> <tr>…</tr> → Profil praktik
Profession     atau findBySlug($slug)           getName(), getServices()    gelar, jadwal, link     <li>…</li>               tampil di HP
Schedule
```

| Pertanyaan (slide Demo) | Jawaban |
|---|---|
| **1. Class apa yang dibuat?** | `Practice` (data satu praktik, ≈ `President`), `Profession` (profesi nakes), `Schedule` (jadwal seminggu), dan `PracticeRepository` (mengambil praktik dari Supabase) |
| **2. Object apa yang digunakan?** | `$practice`, dibuat dengan `new Practice($samplePractice)` atau `$repository->findBySlug($slug)`. Di dalamnya ada object `Profession` dan `Schedule`, yang di halaman diambil sebagai `$profession` dan `$schedule`. Plus `$repository = new PracticeRepository(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)` |
| **3. Property apa yang dimiliki object?** | `Practice`: `$slug`, `$name`, `$practitioner`, `$specialty`, `$address`, `$phone`, `$isOpen`, `$bookingEnabled`, `$profession`, `$schedule`, semuanya `private`. `Schedule`: `$sessionsByDay`. `Profession`: `$label`, `$title`, `$icon`, `$services`. `PracticeRepository`: `$url`, `$key` |
| **4. Method apa yang dibuat?** | `Practice`: `getName()`, `getPractitioner()`, `getProfessionLabel()`, `getSubtitle()`, `getAddress()`, `getServices()`, `isOpen()`, `getOpenLabel()`, `isBookingEnabled()`, `getBookingUrl()`, `getChatUrl()`, `getPageTitle()`, `getPageDescription()`, `getProfession()`, `getSchedule()`. `Schedule`: `isEmpty()`, `isOpenOn()`, `getSessions()`, `getTodaySummary()`, private `shortTime()`. `Profession`: `find()`, `getLabel()`, `getIcon()`, `getServices()`, `titledName()`. `PracticeRepository`: `findBySlug()` |
| **5. Bagaimana object menghasilkan data pada halaman?** | `PracticeRepository` mengambil JSON dari Supabase dan membuat object `Practice`. Constructor mengisi property. Method mengolah property menjadi teks siap tampil (gelar, label status, kalimat jadwal, link WhatsApp). `praktik.php` memanggil method itu di dalam HTML (`<?= e($practice->getName()) ?>`, `foreach`), lalu server mengirim HTML jadi ke browser |

### Cara mendemokan

1. **Jalankan server:** dari folder proyek, `php -S localhost:8000`.
2. **Tunjukkan class:** buka `php/classes/Practice.php`. Tunjukkan property `private`, `__construct()`, dan method `getName()` / `getOpenLabel()` / `getServices()`.
3. **Tunjukkan object di halaman:** buka `php/praktik.php`, baris `new Practice($samplePractice)` dan `$repository->findBySlug($slug)`, lalu bagian HTML `<?= e($practice->getName()) ?>`.
4. **Buka halaman:** `http://localhost:8000/php/praktik.php` (contoh) dan `?p=4dafb47bcd` (praktik asli). Tampilannya sama dengan demo Week 5.
5. **Satu class, banyak object:** ganti menjadi `?p=a763f4e5c8`. File dan class yang sama menghasilkan object berbeda: ikon 🦷, gelar drg., "Sedang tutup", layanan dokter gigi.
6. **Encapsulation:** jalankan di Terminal dari folder proyek:

   ```bash
   php -r 'require "php/data.php"; require "php/functions.php"; foreach (glob("php/classes/*.php") as $f) require $f;
   $p = new Practice($samplePractice);
   echo $p->getName(), PHP_EOL;
   echo $p->name, PHP_EOL;'
   ```

   Baris pertama tercetak `Praktik Bidan Sehati` (lewat method public). Baris kedua gagal: `PHP Fatal error: Uncaught Error: Cannot access private property Practice::$name`.
7. **Bandingkan dengan versi procedural:** `git show ceb4855:php/praktik.php` menampilkan `praktik.php` versi Week 5 (array + fungsi) untuk dibandingkan dengan versi sekarang.

---

## Review: Is the Code Organized?

- [x] **Class jelas:** satu class satu file, dan setiap class punya satu tugas (data praktik, profesi, jadwal, ambil data).
- [x] **Object digunakan:** halaman bekerja dengan object `$practice`, `$profession`, `$schedule`.
- [x] **Property sesuai kebutuhan:** hanya data yang tampil di halaman, ditambah `slug` untuk link booking.
- [x] **Method bekerja:** 36 pemeriksaan lulus.
- [x] **Constructor digunakan jika diperlukan:** keempat class punya constructor. `Practice` mengisi property dan membuat object `Profession` + `Schedule`; `Schedule` mengelompokkan sesi per hari; `PracticeRepository` menyimpan alamat dan key.
- [x] **Encapsulation diterapkan:** semua property `private`, `shortTime()` private, tidak ada setter.
- [x] **Output tetap benar:** HTML identik dengan Week 5 untuk 6 kasus.
- [x] **Tidak ada error:** `php -l` lulus untuk 7 file, log server bersih (tidak ada *warning* / *deprecated*).

### Pertanyaan Review: Bagian mana dari NAKESA yang lebih mudah dikelola menggunakan object dibandingkan procedural PHP?

**1. Jadwal praktik (`Schedule`)** paling terasa manfaatnya. Di Week 5 jadwal adalah array `$hoursByDay` yang harus dioper ke `todaySummary()` dan dicek dengan `isset($hoursByDay[$day])` di HTML, sehingga halaman harus tahu bahwa kuncinya angka hari dan isinya array teks. Sekarang halaman cukup bertanya `$schedule->isOpenOn($day)` dan `$schedule->getTodaySummary($today)`. Kalau suatu saat format jam diganti (misalnya "08.00–12.00 WIB"), yang diubah hanya `Schedule`.

**2. Identitas praktik (`Practice`).** 18 variabel lepas menjadi satu object. Aturan seperti "gelar tidak ditulis dua kali", "link WhatsApp hanya kalau ada nomor", dan "contoh praktik tidak punya link booking" sekarang tersimpan di method dengan nama yang jelas, bukan tersebar di baris-baris `praktik.php`.

**3. Pengambilan data (`PracticeRepository`).** Urusan cURL, key Supabase, dan kode error terpisah dari halaman. Halaman berikutnya yang butuh data praktik (misalnya halaman booking versi PHP) tinggal memakai `findBySlug()`.

**Yang tetap procedural:** helper umum seperti `e()`, `waLink()`, dan `indonesianDateTime()`. Fungsi ini bukan milik satu object, jadi lebih sederhana dibiarkan sebagai fungsi. OOP bukan berarti semuanya harus class.

---

## Pengujian yang dilakukan

| Pengujian | Cara | Hasil |
|---|---|---|
| Sintaks PHP | `php -l` untuk 7 file di `php/` dan `php/classes/` (job CI `php-syntax` juga ikut memeriksa subfolder) | Lulus |
| Referensi file | `node .github/scripts/check-refs.mjs` | Lulus |
| Output HTML sama dengan Week 5 | HTML 6 kasus disimpan **sebelum** refactor, dibandingkan dengan `diff` **sesudah** refactor (komentar HTML & jam diabaikan) | 6/6 identik, kode HTTP sama (200/200/200/404/404/200) |
| Dua object dari satu class | `new Practice($samplePractice)` + `new Practice([… dokter_gigi …], 'klinik-ceria')` | Nama, gelar, status, layanan, link booking & WhatsApp masing-masing benar |
| Constructor | Spesialis (`dokter_spesialis` + "Anak"), profesi `null`, profesi tidak dikenal | "Dokter Spesialis Anak", "dr. Andi", "Lainnya" |
| `Schedule::getTodaySummary()` | Senin, Selasa, Minggu, praktik yang hanya buka Rabu (dicek hari Kamis), jadwal kosong | Kalimat sama dengan tabel Week 5 |
| Encapsulation | Baca/ubah property private, panggil method private dari luar | `Error: Cannot access private property …` / `Call to private method …`; data tidak berubah |
| `PracticeRepository::findBySlug()` | Slug asli, slug tidak ada, alamat Supabase salah | Object `Practice` / `null` / `RuntimeException: Supabase tidak bisa dihubungi: Could not resolve host: …` |
| Log server | `php -S` selama semua pengujian halaman | Bersih |
| **Total** | Skrip uji class sementara (di luar repo, 36 pemeriksaan) | **36 lulus, 0 gagal** |

---

## Sprint 05: Completion Checklist

- [x] Class
- [x] Object
- [x] Property
- [x] Method
- [x] Constructor
- [x] Encapsulation
- [x] OOP data processing (`Schedule` mengelompokkan jadwal, `Practice` menyusun gelar, label, dan link)
- [x] Dynamic HTML (halaman dibuat dari method object)
- [x] Test (36 pemeriksaan class + 6 perbandingan HTML)
- [ ] Commit
- [ ] Push
- [x] Ready for demo

**Output:** halaman Profil Praktik NAKESA yang datanya dikelola dengan object PHP, dengan tampilan yang tetap sama seperti Week 5.

---

## Catatan

- **Kenapa `require` satu per satu, bukan autoload?** Hanya ada 4 class dan satu halaman, jadi `require` lebih mudah dibaca. Kalau class bertambah banyak, bisa diganti `spl_autoload_register()` atau autoload Composer.
- **File di `php/classes/` bisa dibuka langsung di browser** (misalnya `localhost:8000/php/classes/Practice.php`), tetapi hasilnya halaman kosong (`200`, 0 byte) karena file itu hanya mendefinisikan class tanpa output. Tidak ada data yang bocor.
- **Layanan masih dari daftar bawaan profesi.** Saat pengujian ternyata `get_public_practice` di Supabase sekarang sudah ikut mengirim `services` (nama, harga, durasi). Halaman ini sengaja tetap memakai layanan bawaan profesi supaya pilihannya sama dengan form di halaman booking (`book.html`, yang juga memakai layanan bawaan). Kalau nanti keduanya mau memakai layanan yang diatur nakes, di PHP cukup method `Practice::getServices()` yang diubah; HTML tidak perlu disentuh.

---

## Ringkasan

| Task | Materi | Penerapan di NAKESA (Profil Praktik) |
|---|---|---|
| 01 — Create a Class | Class, object, `new`, constructor, `$this` | `class Practice` (+ `Profession`, `Schedule`, `PracticeRepository`); object dibuat dengan `new Practice($samplePractice)` atau `findBySlug($slug)` |
| 02 — Add Properties & Methods | Property, method, `public`/`private`, getter, `static` | 10 property private di `Practice`; 26 method di 4 class; fungsi Week 5 pindah menjadi method; encapsulation diuji |
| 03 — Generate Dynamic Content with Object | Object → method → HTML | `praktik.php` mencetak HTML dari `$practice->getName()`, `$schedule->isOpenOn()`, `$practice->getServices()`, …; HTML identik dengan Week 5 |

---

## Perubahan File: Ditambah & Dimodifikasi

### File yang ditambahkan (baru)

| File | Isi | Untuk task |
|---|---|---|
| `php/classes/Practice.php` | **CLASS** satu praktik: 10 property private, constructor dari array Supabase, 15 method | 01, 02, 03 |
| `php/classes/Profession.php` | **CLASS** profesi: label, gelar, ikon, layanan; `static find()`, `titledName()` (dulu `professionOf()` + `titledName()`) | 01, 02 |
| `php/classes/Schedule.php` | **CLASS** jadwal seminggu: constructor mengelompokkan sesi, `getTodaySummary()`, private `shortTime()` (dulu `groupHoursByDay()`, `todaySummary()`, `shortTime()`) | 02, 03 |
| `php/classes/PracticeRepository.php` | **CLASS** pengambil data: `findBySlug()` → object `Practice` (dulu `fetchPractice()`) | 01, 02 |
| `Exercise week/Week6.md` | Laporan ini | — |

### File yang dimodifikasi

#### 1. `php/praktik.php`

| Bagian | Sebelum (Week 5) | Sesudah (Week 6) |
|---|---|---|
| Komentar atas | "Week 5 · Sprint 04" | Week 5 + Week 6 (data dikelola dengan object) |
| `require` | `data.php`, `functions.php` | + 4 file di `classes/` |
| Membuat data | `$practice = $samplePractice;` / `fetchPractice($slug)` (array) | `new Practice($samplePractice)` / `$repository->findBySlug($slug)` (object) |
| Persiapan | 18 variabel dari array + fungsi | 7 variabel; data praktik diambil dari method |
| HTML | `$practiceName`, `openLabel($isOpen)`, `isset($hoursByDay[$day])`, `$profession['label']`, … | `$practice->getName()`, `$practice->getOpenLabel()`, `$schedule->isOpenOn($day)`, `$profession->getLabel()`, … |
| Komentar HTML | "Task 01/02/03: … dari variabel PHP / array" | "… dari method object Practice / Schedule / getServices()" |
| Panjang | 173 baris | 164 baris |

Bagian INPUT (`?p=`), halaman 404/503, dan footer tidak berubah.

#### 2. `php/functions.php`

**Sebelum:** 10 fungsi, 123 baris: `e()`, `professionOf()`, `titledName()`, `openLabel()`, `shortTime()`, `groupHoursByDay()`, `todaySummary()`, `waLink()`, `indonesianDateTime()`, `fetchPractice()`.

**Sesudah:** 3 fungsi helper umum, 29 baris: `e()`, `waLink()`, `indonesianDateTime()`. Isi ketiganya tidak berubah. 7 fungsi lainnya pindah menjadi method (lihat tabel [Dari fungsi ke method](#dari-fungsi-week-5-ke-method-week-6)).

Komentar atas file:

```php
// Sebelum
// PROCESS: fungsi-fungsi kecil untuk halaman PHP NAKESA (Week 5).
// Banyak yang sama dengan helper JavaScript di js/format.js dan js/professions.js, tetapi di sini
// dijalankan di server sebelum HTML dikirim ke browser.

// Sesudah
// Helper umum untuk halaman PHP NAKESA, sama dengan helper JavaScript di js/format.js.
// Week 6: fungsi yang mengolah data praktik sudah pindah menjadi method di folder classes/
// (Practice, Profession, Schedule, PracticeRepository). Yang tersisa di sini tidak milik satu object tertentu.
```

### File yang tidak diubah

- `php/data.php`: konstanta dan `$samplePractice` tetap sama. Class `Profession` membaca `PROFESSIONS`, `Schedule` membaca `DAYS`.
- CI (`.github/workflows/ci.yml`): job `php-syntax` memakai `find php -name '*.php'`, jadi file di `php/classes/` otomatis ikut diperiksa tanpa perlu diubah.
- Semua halaman NAKESA lain (`html/*.html`, `js/`) dan database Supabase.
