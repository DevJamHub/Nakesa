<?php
// Pengaturan tetap untuk server NAKESA: lokasi data, aturan akun, profesi, kategori obat, dan contoh obat.

const DATA_DIR = __DIR__ . '/../data';     // data yang tersimpan saat aplikasi dipakai (tidak ikut di-commit)
const SEED_DIR = __DIR__ . '/data/contoh'; // data awal (6 akun demo), disalin ke DATA_DIR saat pertama kali dibuka

const MIN_PASSWORD_LENGTH = 8;   // sama dengan MIN_PASSWORD_LENGTH di js/config.js
const BOOKING_DAYS_AHEAD = 60;   // pasien bisa booking untuk hari ini sampai 60 hari ke depan
const MAX_BOOKINGS_PER_PHONE = 3; // per hari, penahan spam booking online

// Kunci profesi yang boleh dipilih (sama dengan PROFESSIONS di js/professions.js).
const PROFESSION_KEYS = ['bidan', 'dokter_umum', 'dokter_gigi', 'dokter_spesialis', 'perawat',
    'fisioterapis', 'psikolog', 'ahli_gizi', 'lainnya'];

// Kategori obat bawaan yang dilihat semua praktik (practice_id = null).
const MEDICINE_CATEGORIES = [
    ['id' => 'kategori-01', 'name' => 'Kehamilan', 'sort_order' => 10],
    ['id' => 'kategori-02', 'name' => 'Persalinan', 'sort_order' => 20],
    ['id' => 'kategori-03', 'name' => 'Nifas', 'sort_order' => 30],
    ['id' => 'kategori-04', 'name' => 'Menyusui', 'sort_order' => 40],
    ['id' => 'kategori-05', 'name' => 'Kontrasepsi', 'sort_order' => 50],
    ['id' => 'kategori-06', 'name' => 'Bayi Baru Lahir', 'sort_order' => 60],
    ['id' => 'kategori-07', 'name' => 'Vitamin & Mineral', 'sort_order' => 70],
    ['id' => 'kategori-08', 'name' => 'Analgesik/Antipiretik', 'sort_order' => 80],
    ['id' => 'kategori-09', 'name' => 'Antibiotik', 'sort_order' => 90],
    ['id' => 'kategori-10', 'name' => 'Obat Simptomatik', 'sort_order' => 100],
    ['id' => 'kategori-11', 'name' => 'Obat Kegawatdaruratan', 'sort_order' => 110],
    ['id' => 'kategori-12', 'name' => 'Cairan/Infus', 'sort_order' => 120],
    ['id' => 'kategori-13', 'name' => 'Obat Lainnya', 'sort_order' => 130],
];

// Tombol "Tambah contoh obat" di Database Obat.
// generic_name, kategori, bentuk sediaan, kekuatan, satuan, rute, golongan, stok minimum
const EXAMPLE_MEDICINES = [
    ['Paracetamol', 'Analgesik/Antipiretik', 'Tablet', '500 mg', 'tablet', 'Oral', 'bebas', 20],
    ['Tablet tambah darah (Fe + asam folat)', 'Kehamilan', 'Tablet salut', null, 'tablet', 'Oral', null, 30],
    ['Asam folat', 'Kehamilan', 'Tablet', null, 'tablet', 'Oral', null, 30],
    ['Kalsium laktat', 'Kehamilan', 'Tablet', null, 'tablet', 'Oral', null, 30],
    ['Vitamin A (kapsul merah)', 'Nifas', 'Kapsul lunak', '200.000 IU', 'kapsul', 'Oral', null, 10],
    ['Oralit', 'Obat Simptomatik', 'Serbuk (sachet)', 'Untuk 200 mL larutan', 'sachet', 'Oral', 'bebas', 10],
    ['Antasida (Al(OH)3 + Mg(OH)2)', 'Obat Simptomatik', 'Tablet kunyah', null, 'tablet', 'Oral', null, 10],
    ['Amoxicillin', 'Antibiotik', 'Kapsul', '500 mg', 'kapsul', 'Oral', 'keras', 20],
    ['Ampicillin', 'Antibiotik', 'Serbuk injeksi (vial)', '1 g', 'vial', 'IM/IV', 'keras', 5],
    ['Metronidazole', 'Antibiotik', 'Tablet', '500 mg', 'tablet', 'Oral', 'keras', 20],
    ['Oxytocin', 'Persalinan', 'Injeksi (ampul)', '10 IU/mL', 'ampul', 'IM/IV', 'keras', 10],
    ['Lidokain', 'Persalinan', 'Injeksi (ampul)', '2%', 'ampul', 'Infiltrasi lokal', 'keras', 5],
    ['Magnesium sulfat', 'Obat Kegawatdaruratan', 'Injeksi (vial)', '40%', 'vial', 'IV/IM', 'keras', 4],
    ['Vitamin K1 (fitomenadion)', 'Bayi Baru Lahir', 'Injeksi (ampul)', null, 'ampul', 'IM', 'keras', 5],
    ['Salep mata antibiotik', 'Bayi Baru Lahir', 'Salep mata', null, 'tube', 'Mata', 'keras', 3],
    ['Pil KB kombinasi', 'Kontrasepsi', 'Tablet', null, 'strip', 'Oral', 'keras', 10],
    ['Suntik KB 3 bulan (DMPA)', 'Kontrasepsi', 'Injeksi suspensi', '150 mg/mL', 'vial', 'IM', 'keras', 10],
    ['Suntik KB 1 bulan', 'Kontrasepsi', 'Injeksi', null, 'vial', 'IM', 'keras', 10],
    ['Kondom', 'Kontrasepsi', 'Alat', null, 'pcs', null, 'alkes', 20],
    ['Ringer laktat', 'Cairan/Infus', 'Cairan infus', '500 mL', 'botol', 'IV', 'keras', 5],
    ['NaCl 0,9%', 'Cairan/Infus', 'Cairan infus', '500 mL', 'botol', 'IV', 'keras', 5],
    ['Vitamin B kompleks', 'Vitamin & Mineral', 'Tablet', null, 'tablet', 'Oral', null, 20],
];
const EXAMPLE_MEDICINE_NOTE = 'Contoh data. Sesuaikan dengan produk yang tersedia. Indikasi, kontraindikasi, dan aturan pakai '
    . 'perlu divalidasi berdasarkan regulasi/SOP/tenaga kesehatan.';
