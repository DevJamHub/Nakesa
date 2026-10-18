<?php
// PROCESS: fungsi-fungsi kecil untuk halaman PHP NAKESA (Week 5).
// Banyak yang sama dengan helper JavaScript di js/format.js dan js/professions.js, tetapi di sini
// dijalankan di server sebelum HTML dikirim ke browser.

/** Amankan teks sebelum dimasukkan ke HTML (mencegah XSS), seperti escapeHtml() di js/format.js. */
function e(?string $text): string
{
    return htmlspecialchars($text ?? '', ENT_QUOTES);
}

/** Data profesi; profesi yang tidak dikenal dianggap "lainnya". */
function professionOf(?string $key): array
{
    return PROFESSIONS[$key ?? 'lainnya'] ?? PROFESSIONS['lainnya'];
}

/** "Siti Aminah" + "Bidan" → "Bidan Siti Aminah". Gelar tidak ditulis dua kali. */
function titledName(string $fullName, string $title): string
{
    if ($fullName === '' || $title === '' || str_starts_with(strtolower($fullName), strtolower($title))) {
        return $fullName;
    }
    return "$title $fullName";
}

/** Label status untuk tombol "Buka / tutup" yang diatur nakes di NAKESA. */
function openLabel(bool $isOpen): string
{
    if ($isOpen) {
        return 'Sedang buka';
    }
    return 'Sedang tutup';
}

/** 150000 → "Rp 150.000", seperti rupiah() di js/format.js. */
function rupiah(int $amount): string
{
    return 'Rp ' . number_format($amount, 0, ',', '.');
}

/**
 * Layanan yang ditampilkan ke pasien: daftar dari get_public_practice (menu Layanan & Harga, sama
 * dengan Nakesa Patient), atau layanan standar profesi kalau datanya belum ada (migrasi belum
 * dijalankan, atau contoh praktik). Setiap layanan: ['name' => …, 'detail' => "Rp 150.000 · 30 menit"].
 */
function practiceServices(array $practice, array $profession): array
{
    $services = [];
    foreach ($practice['services'] ?? [] as $service) {
        $price = $service['price'] === null ? 'Tanya harga ke praktik' : rupiah((int) $service['price']);
        $services[] = ['name' => $service['name'], 'detail' => "$price · {$service['duration_minutes']} menit"];
    }
    if (count($services) > 0) {
        return $services;
    }
    foreach ($profession['services'] as $name) {
        $services[] = ['name' => $name, 'detail' => ''];
    }
    return $services;
}

/** "08:00" → "08.00" (penulisan jam di Indonesia). */
function shortTime(string $time): string
{
    return str_replace(':', '.', substr($time, 0, 5));
}

/**
 * Kelompokkan sesi praktik per hari.
 * [['day' => 1, 'opens' => '08:00', 'closes' => '12:00'], …] → [1 => ['08.00–12.00', '16.00–20.00'], …]
 */
function groupHoursByDay(array $hours): array
{
    $byDay = [];
    foreach ($hours as $session) {
        $byDay[$session['day']][] = shortTime($session['opens']) . '–' . shortTime($session['closes']);
    }
    return $byDay;
}

/** Kalimat singkat tentang jadwal hari ini, atau kapan praktik buka lagi. */
function todaySummary(array $hoursByDay, int $today): string
{
    if (count($hoursByDay) === 0) {
        return 'Jadwal praktik belum diatur. Tanyakan langsung ke praktik.';
    }
    if (isset($hoursByDay[$today])) {
        return 'Hari ini (' . DAYS[$today] . ') praktik pukul ' . implode(' & ', $hoursByDay[$today]) . '.';
    }
    // Hari ini tutup: cari hari praktik berikutnya (besok, lusa, … sampai 6 hari lagi).
    for ($i = 1; $i <= 6; $i++) {
        $day = ($today + $i) % 7;
        if (isset($hoursByDay[$day])) {
            $when = $i === 1 ? 'besok (' . DAYS[$day] . ')' : 'hari ' . DAYS[$day];
            $opens = explode('–', $hoursByDay[$day][0])[0];
            return "Hari ini tutup. Buka lagi $when mulai pukul $opens.";
        }
    }
    return 'Hari ini tutup.';
}

/** "0812-3456 789" → link chat WhatsApp ke 628123456789, seperti waLink() di js/format.js. */
function waLink(string $phone, string $message = ''): string
{
    $digits = preg_replace('/\D/', '', $phone);
    if (str_starts_with($digits, '0')) {
        $digits = '62' . substr($digits, 1);
    } elseif (str_starts_with($digits, '8')) {
        $digits = '62' . $digits;
    }
    return "https://wa.me/$digits" . ($message !== '' ? '?text=' . rawurlencode($message) : '');
}

/** Selasa, 13 Oktober 2026, 10.15 WIB */
function indonesianDateTime(int $timestamp): string
{
    return DAYS[date('w', $timestamp)] . ', ' . date('j', $timestamp) . ' ' . MONTHS[date('n', $timestamp) - 1]
        . ' ' . date('Y', $timestamp) . ', ' . date('H.i', $timestamp) . ' WIB';
}

/**
 * Ambil profil publik sebuah praktik dari Supabase. Yang memanggil adalah SERVER (PHP), bukan browser.
 * Mengembalikan array, atau null kalau slug tidak ditemukan. Melempar RuntimeException kalau gagal.
 */
function fetchPractice(string $slug): ?array
{
    // Fungsi database yang sama dengan halaman booking (book.html): hanya data yang boleh dilihat pasien.
    $request = curl_init(SUPABASE_URL . '/rest/v1/rpc/get_public_practice');
    curl_setopt_array($request, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['apikey: ' . SUPABASE_PUBLISHABLE_KEY, 'Content-Type: application/json'],
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
    // JSON → array PHP. Slug yang tidak ada dijawab dengan null.
    $practice = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
    return is_array($practice) ? $practice : null;
}
