<?php
// PROCESS: fungsi untuk halaman Fitur & Profesi NAKESA (Week 5 · Aditiya Al Bayhaqy).
// Fungsi umum seperti e() ada di functions.php; file ini hanya berisi fungsi khusus halaman fitur.

/**
 * Status fitur → teks dan warna badge (seperti getProgramStatus() di slide).
 * Conditional if / elseif / else: setiap status punya label dan kelas badge sendiri.
 */
function statusBadge(string $status): array
{
    if ($status === STATUS_TERSEDIA) {
        return ['label' => 'Tersedia', 'class' => 'badge-green'];
    } elseif ($status === STATUS_BARU) {
        return ['label' => 'Baru minggu ini', 'class' => 'badge-blue'];
    } elseif ($status === STATUS_REVIEW) {
        return ['label' => 'Sedang direview', 'class' => 'badge-orange'];
    }
    return ['label' => 'Belum diketahui', 'class' => 'badge-gray']; // status yang salah ketik tetap tampil
}

/** Hitung jumlah fitur per status dengan loop: ['tersedia' => 9, 'baru' => 1, 'review' => 3]. */
function countByStatus(array $features): array
{
    $counts = [STATUS_TERSEDIA => 0, STATUS_BARU => 0, STATUS_REVIEW => 0];
    foreach ($features as $feature) {
        $counts[$feature['status']] = ($counts[$feature['status']] ?? 0) + 1;
    }
    return $counts;
}

/** Ambil fitur yang ditandai 'unggulan' => true, urutannya tetap sama dengan $features. */
function featuredOnly(array $features): array
{
    $featured = [];
    foreach ($features as $feature) {
        if ($feature['unggulan']) {
            $featured[] = $feature;
        }
    }
    return $featured;
}

/** Jumlah semua layanan bawaan dari setiap profesi (array di dalam array). */
function totalServices(array $professions): int
{
    $total = 0;
    foreach ($professions as $profession) {
        $total += count($profession['services']);
    }
    return $total;
}

/** "Periksa Kehamilan, KB, Imunisasi Anak +4 lainnya": cukup beberapa layanan pertama untuk kartu profesi. */
function servicePreview(array $services, int $shown = 3): string
{
    $text = implode(', ', array_slice($services, 0, $shown));
    $rest = count($services) - $shown;
    if ($rest > 0) {
        $text .= " +$rest lainnya";
    }
    return $text;
}
