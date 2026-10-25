<?php
// Bentuk setiap "tabel" (file JSON) dan aturan isiannya. Ini pengganti CREATE TABLE + CHECK di database
// Supabase yang lama: nama kolom dan aturannya sama, jadi JavaScript menerima data dengan bentuk yang sama.
//
// Per kolom: type (text, int, bool, date, time, enum, ref, number), lalu aturan tambahan:
//   max = panjang teks maksimal, min/max untuk angka, required = wajib diisi, values = pilihan enum,
//   label = nama kolom di pesan error, default = isi awal saat baris baru dibuat.
// Kolom yang tidak tertulis di sini (id, created_at, owner_id, …) diisi server, bukan oleh browser.
// 'timestamps' => true menambah created_at dan updated_at; 'unique' = kolom yang tidak boleh kembar.

const SCHEMA = [
    'practices' => [
        'columns' => [
            'name' => ['type' => 'text', 'max' => 120, 'required' => true, 'label' => 'Nama praktik'],
            'specialty' => ['type' => 'text', 'max' => 120, 'label' => 'Spesialisasi'],
            'address' => ['type' => 'text', 'max' => 300, 'label' => 'Alamat'],
            'phone' => ['type' => 'text', 'max' => 30, 'label' => 'Nomor WhatsApp'],
            'is_open' => ['type' => 'bool', 'default' => false],
            'booking_enabled' => ['type' => 'bool', 'default' => true],
            'expiry_warning_days' => ['type' => 'int', 'min' => 1, 'max' => 365, 'default' => 90, 'label' => 'Batas peringatan kedaluwarsa'],
            'description' => ['type' => 'text', 'max' => 1000, 'label' => 'Tentang praktik'],
            'city' => ['type' => 'text', 'max' => 80, 'label' => 'Kota'],
            'province' => ['type' => 'text', 'max' => 80, 'label' => 'Provinsi'],
            'latitude' => ['type' => 'number', 'min' => -90, 'max' => 90],
            'longitude' => ['type' => 'number', 'min' => -180, 'max' => 180],
            'is_listed' => ['type' => 'bool', 'default' => false],
        ],
        'timestamps' => true,
    ],
    'patients' => [
        'columns' => [
            'full_name' => ['type' => 'text', 'max' => 120, 'required' => true, 'label' => 'Nama pasien'],
            'gender' => ['type' => 'enum', 'values' => ['L', 'P']],
            'birth_date' => ['type' => 'date', 'label' => 'Tanggal lahir'],
            'phone' => ['type' => 'text', 'max' => 30, 'label' => 'Nomor HP'],
            'address' => ['type' => 'text', 'max' => 300, 'label' => 'Alamat'],
            'notes' => ['type' => 'text', 'max' => 2000, 'label' => 'Catatan'],
        ],
        'timestamps' => true,
    ],
    'transactions' => [
        'columns' => [
            'kind' => ['type' => 'enum', 'values' => ['masuk', 'keluar'], 'required' => true],
            'amount' => ['type' => 'int', 'min' => 1, 'max' => 999999999999, 'required' => true, 'label' => 'Jumlah uang'],
            'category' => ['type' => 'text', 'max' => 60, 'required' => true, 'label' => 'Untuk apa'],
            'note' => ['type' => 'text', 'max' => 300, 'label' => 'Catatan'],
            'occurred_on' => ['type' => 'date', 'required' => true, 'default' => 'today', 'label' => 'Tanggal'],
        ],
        'timestamps' => false,
    ],
    'practice_hours' => [
        'columns' => [
            'day_of_week' => ['type' => 'int', 'min' => 0, 'max' => 6, 'required' => true],
            'opens_at' => ['type' => 'time', 'required' => true, 'label' => 'Jam buka'],
            'closes_at' => ['type' => 'time', 'required' => true, 'label' => 'Jam tutup'],
        ],
        'timestamps' => false,
    ],
    'bookings' => [
        'columns' => [
            'patient_name' => ['type' => 'text', 'max' => 120, 'required' => true, 'label' => 'Nama pasien'],
            'patient_phone' => ['type' => 'text', 'max' => 30, 'required' => true, 'label' => 'Nomor HP'],
            'booking_date' => ['type' => 'date', 'required' => true, 'label' => 'Tanggal'],
            'booking_time' => ['type' => 'time', 'label' => 'Jam'],
            'service' => ['type' => 'text', 'max' => 80, 'label' => 'Layanan'],
            'complaint' => ['type' => 'text', 'max' => 500, 'label' => 'Keluhan'],
            'status' => ['type' => 'enum', 'values' => ['baru', 'dikonfirmasi', 'selesai', 'batal'], 'default' => 'baru'],
            'source' => ['type' => 'enum', 'values' => ['online', 'manual'], 'default' => 'manual'],
        ],
        'timestamps' => true,
    ],
    'practice_services' => [
        'columns' => [
            'name' => ['type' => 'text', 'max' => 80, 'required' => true, 'label' => 'Nama layanan'],
            'description' => ['type' => 'text', 'max' => 500, 'label' => 'Keterangan'],
            'price' => ['type' => 'int', 'min' => 0, 'max' => 999999999999, 'label' => 'Harga'],
            'duration_minutes' => ['type' => 'int', 'min' => 5, 'max' => 480, 'default' => 30, 'label' => 'Durasi'],
            'is_active' => ['type' => 'bool', 'default' => true],
            'sort_order' => ['type' => 'int', 'min' => -32768, 'max' => 32767, 'default' => 100],
        ],
        'timestamps' => true,
        'unique' => 'name',
    ],
    'suppliers' => [
        'columns' => [
            'name' => ['type' => 'text', 'max' => 120, 'required' => true, 'label' => 'Nama supplier'],
            'phone' => ['type' => 'text', 'max' => 30],
            'address' => ['type' => 'text', 'max' => 300],
            'notes' => ['type' => 'text', 'max' => 500],
            'is_active' => ['type' => 'bool', 'default' => true],
        ],
        'timestamps' => true,
        'unique' => 'name',
    ],
    'medicines' => [
        'columns' => [
            'category_id' => ['type' => 'ref'],
            'generic_name' => ['type' => 'text', 'max' => 120, 'required' => true, 'label' => 'Nama generik'],
            'brand_name' => ['type' => 'text', 'max' => 120, 'label' => 'Nama dagang'],
            'dosage_form' => ['type' => 'text', 'max' => 60, 'label' => 'Bentuk sediaan'],
            'strength' => ['type' => 'text', 'max' => 60, 'label' => 'Kekuatan'],
            'unit' => ['type' => 'text', 'max' => 20, 'required' => true, 'default' => 'pcs', 'label' => 'Satuan'],
            'route' => ['type' => 'text', 'max' => 60, 'label' => 'Rute'],
            'indications' => ['type' => 'text', 'max' => 1000, 'label' => 'Indikasi'],
            'contraindications' => ['type' => 'text', 'max' => 1000, 'label' => 'Kontraindikasi'],
            'usage_instructions' => ['type' => 'text', 'max' => 1000, 'label' => 'Aturan pakai'],
            'min_stock' => ['type' => 'int', 'min' => 0, 'max' => 2147483647, 'default' => 5, 'label' => 'Stok minimum'],
            'buy_price' => ['type' => 'int', 'min' => 0, 'max' => 999999999999, 'label' => 'Harga beli'],
            'sell_price' => ['type' => 'int', 'min' => 0, 'max' => 999999999999, 'label' => 'Harga jual'],
            'drug_class' => ['type' => 'enum', 'values' => ['bebas', 'bebas_terbatas', 'keras', 'narkotika_psikotropika', 'alkes']],
            'use_in_service' => ['type' => 'bool', 'default' => false],
            'is_active' => ['type' => 'bool', 'default' => true],
            'notes' => ['type' => 'text', 'max' => 1000, 'label' => 'Catatan'],
        ],
        'timestamps' => true,
    ],
    'medicine_batches' => [
        // Diisi lewat fungsi stok (Inventory), bukan langsung dari browser.
        'columns' => [],
        'timestamps' => false,
    ],
    'stock_movements' => [
        'columns' => [],
        'timestamps' => false,
    ],
    'prescriptions' => [
        'columns' => [
            'patient_id' => ['type' => 'ref'],
            'patient_name' => ['type' => 'text', 'max' => 120, 'required' => true, 'label' => 'Nama pasien'],
            'booking_id' => ['type' => 'ref'],
            'status' => ['type' => 'enum', 'values' => ['draft', 'selesai', 'batal'], 'default' => 'draft'],
            'notes' => ['type' => 'text', 'max' => 1000, 'label' => 'Catatan'],
        ],
        'timestamps' => true,
    ],
    'prescription_items' => [
        'columns' => [
            'medicine_id' => ['type' => 'ref', 'required' => true, 'label' => 'Obat'],
            'dose' => ['type' => 'text', 'max' => 60, 'required' => true, 'label' => 'Dosis'],
            'frequency' => ['type' => 'text', 'max' => 60, 'required' => true, 'label' => 'Frekuensi'],
            'duration' => ['type' => 'text', 'max' => 60, 'label' => 'Lama pemakaian'],
            'quantity' => ['type' => 'int', 'min' => 1, 'max' => 2147483647, 'required' => true, 'label' => 'Jumlah'],
            'route' => ['type' => 'text', 'max' => 60, 'label' => 'Rute'],
            'instructions' => ['type' => 'text', 'max' => 300, 'label' => 'Petunjuk'],
        ],
        'timestamps' => false,
    ],
];
