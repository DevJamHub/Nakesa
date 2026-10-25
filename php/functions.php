<?php
// Helper umum untuk halaman PHP NAKESA, sama dengan helper JavaScript di js/format.js.
// Week 6: fungsi yang mengolah data praktik sudah pindah menjadi method class (sejak Week 7 di folder Model/:
// Practice, Profession, Schedule, PracticeModel). Yang tersisa di sini tidak milik satu object tertentu.

/** Amankan teks sebelum dimasukkan ke HTML (mencegah XSS), seperti escapeHtml() di js/format.js. */
function e(?string $text): string
{
    return htmlspecialchars($text ?? '', ENT_QUOTES);
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
