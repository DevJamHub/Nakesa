<?php
// DATA untuk halaman PHP NAKESA (Week 5). Isinya sama dengan js/format.js dan js/professions.js.

// Indeks hari sama dengan day_of_week di database: 0 = Minggu … 6 = Sabtu.
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // jadwal ditampilkan mulai Senin
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
    'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Per profesi: label, gelar, ikon dan layanan bawaan (sama dengan PROFESSIONS di js/professions.js).
const PROFESSIONS = [
    'bidan' => [
        'label' => 'Bidan', 'title' => 'Bidan', 'icon' => '🤰',
        'services' => ['Periksa Kehamilan', 'KB', 'Imunisasi Anak', 'Periksa Bayi & Balita', 'Persalinan', 'Nifas', 'Konsultasi'],
    ],
    'dokter_umum' => [
        'label' => 'Dokter Umum', 'title' => 'dr.', 'icon' => '🩺',
        'services' => ['Konsultasi Umum', 'Cek Kesehatan', 'Surat Keterangan Sehat', 'Rawat Luka', 'Suntik / Injeksi'],
    ],
    'dokter_gigi' => [
        'label' => 'Dokter Gigi', 'title' => 'drg.', 'icon' => '🦷',
        'services' => ['Periksa Gigi', 'Tambal Gigi', 'Cabut Gigi', 'Scaling', 'Konsultasi'],
    ],
    'dokter_spesialis' => [
        'label' => 'Dokter Spesialis', 'title' => 'dr.', 'icon' => '👨‍⚕️',
        'services' => ['Konsultasi', 'Kontrol', 'Tindakan'],
    ],
    'perawat' => [
        'label' => 'Perawat', 'title' => 'Ns.', 'icon' => '💉',
        'services' => ['Rawat Luka', 'Suntik / Injeksi', 'Cek Tensi & Gula Darah', 'Home Care', 'Pasang Infus'],
    ],
    'fisioterapis' => [
        'label' => 'Fisioterapis', 'title' => '', 'icon' => '🦴',
        'services' => ['Terapi', 'Konsultasi', 'Home Visit'],
    ],
    'psikolog' => [
        'label' => 'Psikolog', 'title' => '', 'icon' => '🧠',
        'services' => ['Konseling', 'Asesmen', 'Konsultasi Online'],
    ],
    'ahli_gizi' => [
        'label' => 'Ahli Gizi', 'title' => '', 'icon' => '🥗',
        'services' => ['Konsultasi Gizi', 'Program Diet', 'Kontrol Berat Badan'],
    ],
    'lainnya' => [
        'label' => 'Lainnya', 'title' => '', 'icon' => '➕',
        'services' => ['Konsultasi', 'Pemeriksaan', 'Tindakan'],
    ],
];

// Contoh praktik, bentuknya sama persis dengan jawaban PublicPractice::find() (api/public.php).
// Dipakai saat halaman dibuka tanpa ?p=.
$samplePractice = [
    'name' => 'Praktik Bidan Sehati',
    'practitioner' => 'Siti Aminah',
    'profession' => 'bidan',
    'specialty' => null,
    'address' => 'Jl. Melati No. 12, Sleman',
    'phone' => null, // contoh tidak punya nomor WhatsApp (supaya tidak mengirim pesan ke nomor orang lain)
    'is_open' => true,
    'booking_enabled' => true,
    'hours' => [
        ['day' => 1, 'opens' => '08:00', 'closes' => '12:00'],
        ['day' => 1, 'opens' => '16:00', 'closes' => '20:00'],
        ['day' => 2, 'opens' => '08:00', 'closes' => '12:00'],
        ['day' => 3, 'opens' => '08:00', 'closes' => '12:00'],
        ['day' => 3, 'opens' => '16:00', 'closes' => '20:00'],
        ['day' => 4, 'opens' => '16:00', 'closes' => '20:00'],
        ['day' => 5, 'opens' => '08:00', 'closes' => '11:00'],
        ['day' => 6, 'opens' => '08:00', 'closes' => '12:00'],
    ],
];
