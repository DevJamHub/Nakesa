<?php
// DATA untuk halaman Fitur & Profesi NAKESA (Week 5 · Aditiya Al Bayhaqy).
// Daftar profesi tidak ditulis ulang di sini: halaman ini memakai PROFESSIONS dari data.php (punya Sigit),
// jadi kalau profesi atau layanannya berubah, halaman ini ikut berubah.

// Status fitur. Kuncinya dipakai di $features, isinya dipakai untuk badge (lihat statusBadge() di functions-fitur.php).
const STATUS_TERSEDIA = 'tersedia'; // sudah ada di branch main dan bisa dipakai
const STATUS_BARU = 'baru';         // baru masuk main minggu ini
const STATUS_REVIEW = 'review';     // sudah dibuat, pull request-nya sedang direview

// Array multidimensi: satu baris = satu fitur, sesuai riwayat git dan issue di GitHub.
// 'unggulan' => true berarti fitur itu ikut tampil sebagai kartu di bagian "Fitur Unggulan".
$features = [
    [
        'name' => 'Booking online lewat link', 'icon' => '📅', 'menu' => 'Booking',
        'description' => 'Pasien membuat janji dari link yang dibagikan lewat WhatsApp, tanpa perlu login.',
        'status' => STATUS_TERSEDIA, 'week' => 2, 'unggulan' => true,
    ],
    [
        'name' => 'Data pasien', 'icon' => '👥', 'menu' => 'Pasien',
        'description' => 'Catatan pasien, pencarian, riwayat kunjungan, dan tombol hubungi lewat WhatsApp.',
        'status' => STATUS_TERSEDIA, 'week' => 2, 'unggulan' => true,
    ],
    [
        'name' => 'Jam praktik dan buka/tutup', 'icon' => '🏥', 'menu' => 'Praktik',
        'description' => 'Jadwal praktik per hari dan sakelar buka/tutup yang terlihat oleh pasien.',
        'status' => STATUS_TERSEDIA, 'week' => 2, 'unggulan' => false,
    ],
    [
        'name' => 'Keuangan dan buku kas', 'icon' => '💰', 'menu' => 'Keuangan',
        'description' => 'Uang masuk dan keluar per bulan, rincian per kategori, dan buku kas dengan saldo berjalan.',
        'status' => STATUS_TERSEDIA, 'week' => 3, 'unggulan' => true,
    ],
    [
        'name' => 'Obat dengan stok per batch', 'icon' => '💊', 'menu' => 'Obat',
        'description' => 'Stok dicatat per batch, dengan peringatan stok menipis dan obat yang akan kedaluwarsa.',
        'status' => STATUS_TERSEDIA, 'week' => 3, 'unggulan' => true,
    ],
    [
        'name' => 'Resep', 'icon' => '📝', 'menu' => 'Resep',
        'description' => 'Resep per pasien. Saat diselesaikan, stok obat berkurang otomatis.',
        'status' => STATUS_TERSEDIA, 'week' => 3, 'unggulan' => false,
    ],
    [
        'name' => 'Layanan dan harga', 'icon' => '🩺', 'menu' => 'Layanan & Harga',
        'description' => 'Daftar layanan, harga, dan durasi yang dipilih pasien.',
        'status' => STATUS_TERSEDIA, 'week' => 3, 'unggulan' => false,
    ],
    [
        'name' => 'QR code link booking', 'icon' => '🔳', 'menu' => 'Praktik',
        'description' => 'QR code untuk dicetak dan ditempel di ruang tunggu, plus profil di Nakesa Patient.',
        'status' => STATUS_TERSEDIA, 'week' => 3, 'unggulan' => false,
    ],
    [
        'name' => 'Hari libur nasional', 'icon' => '🗓️', 'menu' => 'Beranda',
        'description' => 'Libur nasional terdekat di Beranda, diambil dari API Hari Libur.',
        'status' => STATUS_TERSEDIA, 'week' => 4, 'unggulan' => false,
    ],
    [
        'name' => 'Profil praktik untuk pasien', 'icon' => '🔗', 'menu' => 'Link publik',
        'description' => 'Jadwal dan layanan praktik yang dibuat oleh PHP, jadi pratinjau link di WhatsApp ikut menampilkan nama praktik.',
        'status' => STATUS_TERSEDIA, 'week' => 5, 'unggulan' => true,
    ],
    [
        'name' => 'Jam booking mengikuti jam praktik', 'icon' => '⏰', 'menu' => 'Booking',
        'description' => 'Pasien memilih jam per 30 menit di dalam jam praktik. Jam yang sudah dipesan tidak bisa dipilih lagi.',
        'status' => STATUS_TERSEDIA, 'week' => 4, 'unggulan' => false,
    ],
    [
        'name' => 'Grafik tren keuangan 6 bulan', 'icon' => '📈', 'menu' => 'Keuangan',
        'description' => 'Perbandingan uang masuk dan keluar selama enam bulan terakhir.',
        'status' => STATUS_TERSEDIA, 'week' => 4, 'unggulan' => false,
    ],
    [
        'name' => 'Unduh buku kas (CSV)', 'icon' => '⬇️', 'menu' => 'Keuangan',
        'description' => 'Buku kas bulanan diunduh sebagai file yang bisa dibuka di Excel atau Google Sheets.',
        'status' => STATUS_TERSEDIA, 'week' => 4, 'unggulan' => true,
    ],
];
