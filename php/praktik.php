<?php
// Profil praktik publik untuk pasien: jadwal, layanan, dan tombol booking (Week 5 · Sprint 04).
// Semua isi halaman dibuat oleh PHP di server; browser menerima HTML yang sudah jadi.
//
// Jalankan dari folder proyek:  php -S localhost:8000
//   http://localhost:8000/php/praktik.php            → contoh praktik ($samplePractice di data.php)
//   http://localhost:8000/php/praktik.php?p=<slug>   → praktik asli dari Supabase (slug link booking)
require __DIR__ . '/data.php';
require __DIR__ . '/functions.php';

date_default_timezone_set('Asia/Jakarta');

/* ---------- INPUT: slug praktik dari URL ---------- */
$slug = is_string($_GET['p'] ?? null) ? trim($_GET['p']) : '';
$isSample = $slug === '';
$practice = null;
$error = null; // ['icon' => …, 'message' => …, 'retry' => …] kalau halaman tidak bisa ditampilkan

if ($isSample) {
    $practice = $samplePractice;
} elseif (preg_match('/^[a-z0-9-]{4,40}$/', $slug)) { // bentuk slug sama dengan aturan di database
    try {
        $practice = fetchPractice($slug);
    } catch (Throwable $exception) {
        error_log('[praktik.php] ' . $exception->getMessage()); // detail teknis hanya di log server
        http_response_code(503);
        $error = ['icon' => '⚠️', 'message' => 'Data praktik tidak bisa dimuat. Periksa koneksi internet lalu coba lagi.', 'retry' => true];
    }
}
if (!$practice && !$error) {
    http_response_code(404);
    $error = ['icon' => '🔍', 'message' => 'Profil praktik tidak ditemukan. Minta link terbaru dari praktik.', 'retry' => false];
}

$generatedAt = indonesianDateTime(time());
$pageTitle = 'Profil Praktik — NAKESA';
$pageDescription = 'Jadwal praktik dan layanan tenaga kesehatan di NAKESA.';

if ($practice) {
    /* ---------- Week 5 · Task 01: Create PHP Page (variabel → HTML) ---------- */
    $profession = professionOf($practice['profession']);
    $practiceName = $practice['name'];
    $practitioner = titledName($practice['practitioner'] ?? '', $profession['title']);
    $professionLabel = $practice['specialty'] ? "{$profession['label']} {$practice['specialty']}" : $profession['label'];
    $subtitle = implode(' · ', array_filter([$practitioner, $professionLabel])); // nama nakes bisa saja kosong
    $address = $practice['address'];
    $phone = $practice['phone'];
    $isOpen = $practice['is_open'];
    $bookingEnabled = $practice['booking_enabled'];

    /* ---------- Week 5 · Task 02: Process Data (array, conditional, loop) ---------- */
    $today = (int) date('w'); // 0 = Minggu … 6 = Sabtu, waktu WIB
    $hoursByDay = groupHoursByDay($practice['hours']);
    $todayText = todaySummary($hoursByDay, $today);

    /* ---------- Week 5 · Task 03: Dynamic Server-Side Content ---------- */
    $services = practiceServices($practice, $profession); // milik praktik (Layanan & Harga), atau standar profesi
    $serviceTones = ['bg-blue-soft text-blue', 'bg-green-soft text-green', 'bg-yellow-soft text-yellow', 'bg-purple-soft text-purple'];
    $bookingUrl = $isSample ? null : '../html/book.html?p=' . rawurlencode($slug);
    $chatUrl = $phone ? waLink($phone, "Halo $practiceName, saya ingin bertanya.") : null;

    // Judul & deskripsi untuk tab browser dan pratinjau link saat dibagikan di WhatsApp.
    $pageTitle = "$practiceName · Jadwal & Layanan";
    $pageDescription = implode(' · ', array_filter([$subtitle, $address]))
        . '. Lihat jadwal praktik dan buat janji periksa online.';
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#faf9f5">
  <title><?= e($pageTitle) ?></title>
  <meta name="description" content="<?= e($pageDescription) ?>">
  <meta property="og:type" content="website">
  <meta property="og:title" content="<?= e($pageTitle) ?>">
  <meta property="og:description" content="<?= e($pageDescription) ?>">
  <script src="../js/theme.js"></script> <!-- light/dark before the page is drawn -->
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <script src="../js/tailwind-setup.js"></script> <!-- shared Tailwind config + components -->
</head>
<body>
  <button type="button" class="icon-btn theme-toggle theme-fab" data-theme-toggle></button>

  <main class="public">
<?php if ($error): ?>
    <section class="card empty-state">
      <p class="empty-icon" aria-hidden="true"><?= $error['icon'] ?></p>
      <p><?= e($error['message']) ?></p>
<?php if ($error['retry']): ?>
      <a class="btn btn-ghost" href="">↻ Coba lagi</a>
<?php endif; ?>
    </section>
<?php else: ?>
<?php if ($isSample): ?>
    <p class="rounded-lg bg-blue-soft px-4 py-2.5 text-sm font-medium text-blue" role="note">
      👀 Ini <strong>contoh tampilan</strong>. Profil praktik asli dibuka lewat <code>praktik.php?p=</code> + kode link booking.
    </p>
<?php endif; ?>

    <!-- Task 01: identitas praktik dari variabel PHP -->
    <section class="card grid gap-4" aria-labelledby="practice-name">
      <div class="flex items-center gap-3.5">
        <span class="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-raised text-3xl" aria-hidden="true"><?= $profession['icon'] ?></span>
        <div class="min-w-0">
          <h1 class="text-2xl" id="practice-name"><?= e($practiceName) ?></h1>
          <p class="text-muted"><?= e($subtitle) ?></p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2.5">
        <span class="open-pill<?= $isOpen ? ' is-open' : '' ?>"><span class="live-dot" aria-hidden="true"></span><?= openLabel($isOpen) ?></span>
<?php if ($address): ?>
        <span class="text-sm text-muted">📍 <?= e($address) ?></span>
<?php endif; ?>
      </div>
<?php if (count($hoursByDay) > 0): ?>
      <p class="rounded-lg bg-raised px-3.5 py-2.5 text-[15px] font-medium text-ink">🕒 <?= e($todayText) ?></p>
<?php endif; ?>
      <div class="grid gap-2.5">
<?php if (!$bookingEnabled): ?>
        <p class="rounded-lg bg-yellow-soft px-3.5 py-2.5 text-sm font-medium text-yellow">📵 Booking online sedang ditutup. Silakan hubungi praktik langsung.</p>
<?php elseif ($bookingUrl): ?>
        <a class="btn btn-primary btn-big" href="<?= e($bookingUrl) ?>">📅 Buat janji periksa</a>
<?php else: ?>
        <span class="btn btn-primary btn-big pointer-events-none opacity-60" aria-disabled="true">📅 Buat janji periksa</span>
<?php endif; ?>
<?php if ($chatUrl): ?>
        <a class="btn btn-wa" href="<?= e($chatUrl) ?>" target="_blank" rel="noopener">💬 Chat praktik via WhatsApp</a>
<?php endif; ?>
      </div>
    </section>

    <!-- Task 02: jadwal mingguan, diolah dengan loop dan conditional -->
    <section class="card" aria-labelledby="hours-title">
      <h2 class="mb-2" id="hours-title">🗓️ Jadwal praktik</h2>
<?php if (count($hoursByDay) === 0): ?>
      <p class="muted">Jadwal praktik belum diatur. Tanyakan langsung ke praktik.</p>
<?php else: ?>
      <table class="hours">
        <tbody>
<?php foreach (WEEK_ORDER as $day): ?>
          <tr<?= $day === $today ? ' class="is-today"' : '' ?>>
            <td><?= DAYS[$day] ?><?= $day === $today ? ' <span class="badge badge-orange ml-1">Hari ini</span>' : '' ?></td>
            <td><?= isset($hoursByDay[$day]) ? implode('<br>', $hoursByDay[$day]) : '<span class="muted">Tutup</span>' ?></td>
          </tr>
<?php endforeach; ?>
        </tbody>
      </table>
<?php endif; ?>
    </section>

    <!-- Task 03: daftar layanan, setiap baris dibuat PHP dari array (bukan ditulis manual) -->
    <section class="card" aria-labelledby="services-title">
      <h2 id="services-title">🩺 Layanan</h2>
      <p class="mb-3 mt-1 text-sm text-muted"><?= count($services) ?> layanan. Pilih salah satu saat membuat janji.</p>
      <ol class="m-0 grid list-none gap-2 p-0">
<?php foreach ($services as $index => $service): ?>
        <li class="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3">
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold <?= $serviceTones[$index % count($serviceTones)] ?>"><?= $index + 1 ?></span>
          <span class="min-w-0">
            <span class="block font-medium text-ink"><?= e($service['name']) ?></span>
<?php if ($service['detail'] !== ''): ?>
            <span class="block text-sm text-muted"><?= e($service['detail']) ?></span>
<?php endif; ?>
          </span>
        </li>
<?php endforeach; ?>
      </ol>
    </section>
<?php endif; ?>

    <p class="text-center text-sm text-muted">
      Dibuat dengan <span class="font-serif font-semibold text-ink">NAKESA</span> <span class="text-accent">✻</span><br>
      Halaman dibuat oleh PHP di server · <?= $generatedAt ?></p>
  </main>
</body>
</html>
