<?php
// Fitur & Profesi NAKESA: halaman informasi untuk calon pengguna (Week 5 · Sprint 04 · Aditiya Al Bayhaqy).
// Semua isi halaman dibuat oleh PHP di server; browser menerima HTML yang sudah jadi.
//
// Jalankan dari folder proyek:  php -S localhost:8000
//   http://localhost:8000/php/fitur.php
require __DIR__ . '/data.php';           // PROFESSIONS, DAYS, MONTHS (bersama halaman Profil Praktik)
require __DIR__ . '/functions.php';      // e(), indonesianDateTime()
require __DIR__ . '/data-fitur.php';     // $features, STATUS_*
require __DIR__ . '/functions-fitur.php'; // statusBadge(), countByStatus(), featuredOnly(), …

date_default_timezone_set('Asia/Jakarta');

/* ---------- Week 5 · Task 01: Create PHP Page (variabel → HTML) ---------- */
$appName = 'NAKESA';
$tagline = 'Digital Practice Management';
$description = 'Aplikasi untuk mengelola praktik mandiri tenaga kesehatan dari HP: booking, pasien, resep, obat, dan keuangan.';
$course = 'Pemrograman Web';
$team = ['Sigit Novriyanto', 'Aditiya Al Bayhaqy'];
$currentWeek = 5;
$isActive = true; // masih dikerjakan setiap pertemuan
$appStatus = $isActive ? 'Aktif dikembangkan' : 'Selesai';

/* ---------- Week 5 · Task 02: Process Data (array multidimensi, conditional, loop) ---------- */
$statusCounts = countByStatus($features);
$featureTotal = count($features);
// Kalimat ringkasan hanya menyebut status yang jumlahnya lebih dari 0, misalnya "13 tersedia".
$statusLabels = [STATUS_TERSEDIA => 'tersedia', STATUS_BARU => 'baru minggu ini', STATUS_REVIEW => 'sedang direview'];
$summaryParts = [];
foreach ($statusLabels as $status => $label) {
    if ($statusCounts[$status] > 0) {
        $summaryParts[] = "{$statusCounts[$status]} $label";
    }
}
$statusSummary = implode(', ', $summaryParts);
$professions = PROFESSIONS;
unset($professions['lainnya']); // "Lainnya" bukan profesi, hanya pilihan cadangan saat mendaftar
$professionCount = count($professions);
$serviceCount = totalServices($professions);

$stats = [
    ['icon' => '✅', 'label' => 'Fitur tersedia', 'value' => $statusCounts[STATUS_TERSEDIA] + $statusCounts[STATUS_BARU]],
    ['icon' => '🔍', 'label' => 'Sedang direview', 'value' => $statusCounts[STATUS_REVIEW]],
    ['icon' => '🧑‍⚕️', 'label' => 'Profesi didukung', 'value' => $professionCount],
    ['icon' => '🩺', 'label' => 'Layanan bawaan', 'value' => $serviceCount],
];

/* ---------- Week 5 · Task 03: Dynamic Server-Side Content ---------- */
$featured = featuredOnly($features);
$cardTones = ['bg-blue-soft', 'bg-green-soft', 'bg-yellow-soft', 'bg-purple-soft'];

$generatedAt = indonesianDateTime(time());
$pageTitle = "Fitur & Profesi — $appName";
$pageDescription = "$description Mendukung $professionCount profesi kesehatan.";
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

  <main class="public max-w-[880px]">
    <!-- Task 01: identitas aplikasi dari variabel PHP -->
    <section class="card grid gap-3" aria-labelledby="app-name">
      <div class="flex flex-wrap items-center gap-2">
        <span class="badge badge-green"><?= e($appStatus) ?></span>
        <span class="badge badge-gray"><?= e($course) ?> · Week <?= $currentWeek ?></span>
      </div>
      <div>
        <h1 class="font-serif text-3xl" id="app-name"><?= e($appName) ?> <span class="text-accent">✻</span></h1>
        <p class="font-medium text-muted"><?= e($tagline) ?></p>
      </div>
      <p class="text-ink"><?= e($description) ?></p>
      <p class="text-sm text-muted">Tim: <?= e(implode(' & ', $team)) ?></p>
      <div class="flex flex-wrap gap-2.5">
        <a class="btn btn-primary" href="../html/signup.html">Daftar sekarang</a>
        <a class="btn btn-ghost" href="praktik.php">👀 Lihat contoh profil praktik</a>
      </div>
    </section>

    <!-- Task 02: angka ringkasan, dihitung PHP dari array -->
    <section class="stats" aria-label="Ringkasan">
<?php foreach ($stats as $stat): ?>
      <div class="stat">
        <span class="stat-icon" aria-hidden="true"><?= $stat['icon'] ?></span>
        <span class="stat-value"><?= $stat['value'] ?></span>
        <span class="stat-label"><?= e($stat['label']) ?></span>
      </div>
<?php endforeach; ?>
    </section>

    <!-- Task 03: grid kartu Fitur Unggulan, setiap kartu dibuat PHP dari $features -->
    <section class="card" aria-labelledby="featured-title">
      <h2 id="featured-title">⭐ Fitur unggulan</h2>
      <p class="mb-4 mt-1 text-sm text-muted"><?= count($featured) ?> dari <?= $featureTotal ?> fitur, dipilih sebagai fitur utama NAKESA.</p>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
<?php foreach ($featured as $index => $feature): ?>
<?php $badge = statusBadge($feature['status']); ?>
        <article class="grid content-start gap-2 rounded-xl border border-line p-4">
          <div class="flex items-start justify-between gap-2">
            <span class="grid h-11 w-11 place-items-center rounded-lg text-2xl <?= $cardTones[$index % count($cardTones)] ?>" aria-hidden="true"><?= $feature['icon'] ?></span>
            <span class="badge <?= $badge['class'] ?>"><?= e($badge['label']) ?></span>
          </div>
          <h3 class="text-base font-semibold text-ink"><?= e($feature['name']) ?></h3>
          <p class="text-sm text-muted"><?= e($feature['description']) ?></p>
        </article>
<?php endforeach; ?>
      </div>
    </section>

    <!-- Task 02: semua fitur, diberi nomor dengan loop dan badge status dengan conditional -->
    <section class="card" aria-labelledby="features-title">
      <h2 id="features-title">📋 Semua fitur</h2>
      <p class="mb-3 mt-1 text-sm text-muted">
        <?= e($statusSummary) ?>.
      </p>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-[15px]">
          <thead>
            <tr class="text-sm text-muted">
              <th class="py-2 pr-2 font-medium">No</th>
              <th class="py-2 pr-2 font-medium">Fitur</th>
              <th class="hidden py-2 pr-2 font-medium sm:table-cell">Menu</th>
              <th class="py-2 pr-2 font-medium">Status</th>
              <th class="py-2 text-right font-medium">Week</th>
            </tr>
          </thead>
          <tbody>
<?php for ($i = 0; $i < $featureTotal; $i++): ?>
<?php $feature = $features[$i]; $badge = statusBadge($feature['status']); ?>
            <tr class="border-t border-line align-top">
              <td class="py-2.5 pr-2 tabular-nums text-muted"><?= $i + 1 ?></td>
              <td class="py-2.5 pr-2 font-medium text-ink"><span aria-hidden="true"><?= $feature['icon'] ?></span> <?= e($feature['name']) ?></td>
              <td class="hidden py-2.5 pr-2 text-muted sm:table-cell"><?= e($feature['menu']) ?></td>
              <td class="py-2.5 pr-2"><span class="badge <?= $badge['class'] ?>"><?= e($badge['label']) ?></span></td>
              <td class="py-2.5 text-right tabular-nums text-muted"><?= $feature['week'] ?></td>
            </tr>
<?php endfor; ?>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Task 03: grid kartu profesi, dibuat PHP dari PROFESSIONS di data.php -->
    <section class="card" aria-labelledby="professions-title">
      <h2 id="professions-title">🧑‍⚕️ Profesi yang didukung</h2>
      <p class="mb-4 mt-1 text-sm text-muted">Warna dan pilihan layanan menyesuaikan profesi yang dipilih saat mendaftar.</p>
      <div class="grid gap-3 sm:grid-cols-2">
<?php foreach ($professions as $profession): ?>
        <article class="flex items-start gap-3 rounded-xl border border-line p-3.5">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-raised text-2xl" aria-hidden="true"><?= $profession['icon'] ?></span>
          <div class="min-w-0">
            <h3 class="text-base font-semibold text-ink"><?= e($profession['label']) ?></h3>
            <p class="text-sm text-muted"><?= count($profession['services']) ?> layanan: <?= e(servicePreview($profession['services'])) ?></p>
          </div>
        </article>
<?php endforeach; ?>
      </div>
    </section>

    <p class="text-center text-sm text-muted">
      Dibuat dengan <span class="font-serif font-semibold text-ink"><?= e($appName) ?></span> <span class="text-accent">✻</span><br>
      Halaman dibuat oleh PHP di server · <?= $generatedAt ?></p>
  </main>
</body>
</html>
