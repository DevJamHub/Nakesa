<?php
// Fungsi kecil yang dipakai di mana-mana (Week 5): tanggal, id, dan jawaban JSON untuk API.

/** Tanggal hari ini (atau beberapa hari dari sekarang) sebagai "YYYY-MM-DD", waktu WIB. */
function todayISO(int $offsetDays = 0): string
{
    return date('Y-m-d', strtotime("$offsetDays days"));
}

/** Waktu sekarang dalam format ISO 8601, misalnya "2026-10-25T16:05:00+07:00". */
function nowISO(): string
{
    return date('c');
}

/** Id acak berbentuk UUID, sama dengan id dari database lama (gen_random_uuid). */
function uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

/** Teks dari query string (?nama=…), '' kalau tidak ada. */
function query(string $name): string
{
    $value = $_GET[$name] ?? '';
    return is_string($value) ? trim($value) : '';
}

/** Isi body request (JSON yang dikirim fetch) sebagai array. */
function requestBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new AppError('Data yang dikirim tidak bisa dibaca.', 400);
    }
    return $data;
}

/** Kirim jawaban JSON lalu berhenti. */
function respond(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Urutkan baris berdasarkan beberapa kolom: [['booking_date', 'asc'], ['booking_time', 'asc']]. Kosong (null) di akhir. */
function sortRows(array $rows, array $order): array
{
    usort($rows, function (array $a, array $b) use ($order) {
        foreach ($order as [$column, $direction]) {
            $x = $a[$column] ?? null;
            $y = $b[$column] ?? null;
            if ($x === $y) {
                continue;
            }
            if ($x === null || $y === null) {
                return $x === null ? 1 : -1; // nulls last, apa pun arahnya
            }
            $compare = is_string($x) ? strcasecmp($x, $y) : $x <=> $y;
            if ($compare !== 0) {
                return $direction === 'desc' ? -$compare : $compare;
            }
        }
        return 0;
    });
    return $rows;
}
