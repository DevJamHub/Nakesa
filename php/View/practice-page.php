<?php
// VIEW halaman profil praktik (Week 7): hanya menampilkan data yang dikirim PracticeController
// ($practice, $profession, $schedule, $services, $isSample, $error, $today, …). Tidak membaca file atau database.
$serviceTones = ['bg-blue-soft text-blue', 'bg-green-soft text-green', 'bg-yellow-soft text-yellow', 'bg-purple-soft text-purple'];
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

    <!-- Identitas praktik: dari method object Practice -->
    <section class="card grid gap-4" aria-labelledby="practice-name">
      <div class="flex items-center gap-3.5">
        <span class="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-raised text-3xl" aria-hidden="true"><?= $profession->getIcon() ?></span>
        <div class="min-w-0">
          <h1 class="text-2xl" id="practice-name"><?= e($practice->getName()) ?></h1>
          <p class="text-muted"><?= e($practice->getSubtitle()) ?></p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2.5">
        <span class="open-pill<?= $practice->isOpen() ? ' is-open' : '' ?>"><span class="live-dot" aria-hidden="true"></span><?= $practice->getOpenLabel() ?></span>
<?php if ($practice->getAddress()): ?>
        <span class="text-sm text-muted">📍 <?= e($practice->getAddress()) ?></span>
<?php endif; ?>
      </div>
<?php if (!$schedule->isEmpty()): ?>
      <p class="rounded-lg bg-raised px-3.5 py-2.5 text-[15px] font-medium text-ink">🕒 <?= e($schedule->getTodaySummary($today)) ?></p>
<?php endif; ?>
      <div class="grid gap-2.5">
<?php if (!$practice->isBookingEnabled()): ?>
        <p class="rounded-lg bg-yellow-soft px-3.5 py-2.5 text-sm font-medium text-yellow">📵 Booking online sedang ditutup. Silakan hubungi praktik langsung.</p>
<?php elseif ($practice->getBookingUrl()): ?>
        <a class="btn btn-primary btn-big" href="<?= e($practice->getBookingUrl()) ?>">📅 Buat janji periksa</a>
<?php else: ?>
        <span class="btn btn-primary btn-big pointer-events-none opacity-60" aria-disabled="true">📅 Buat janji periksa</span>
<?php endif; ?>
<?php if ($practice->getChatUrl()): ?>
        <a class="btn btn-wa" href="<?= e($practice->getChatUrl()) ?>" target="_blank" rel="noopener">💬 Chat praktik via WhatsApp</a>
<?php endif; ?>
      </div>
    </section>

    <!-- Jadwal mingguan: dari method object Schedule -->
    <section class="card" aria-labelledby="hours-title">
      <h2 class="mb-2" id="hours-title">🗓️ Jadwal praktik</h2>
<?php if ($schedule->isEmpty()): ?>
      <p class="muted">Jadwal praktik belum diatur. Tanyakan langsung ke praktik.</p>
<?php else: ?>
      <table class="hours">
        <tbody>
<?php foreach (WEEK_ORDER as $day): ?>
          <tr<?= $day === $today ? ' class="is-today"' : '' ?>>
            <td><?= DAYS[$day] ?><?= $day === $today ? ' <span class="badge badge-orange ml-1">Hari ini</span>' : '' ?></td>
            <td><?= $schedule->isOpenOn($day) ? implode('<br>', $schedule->getSessions($day)) : '<span class="muted">Tutup</span>' ?></td>
          </tr>
<?php endforeach; ?>
        </tbody>
      </table>
<?php endif; ?>
    </section>

    <!-- Layanan: setiap baris dibuat PHP dari method getServices() (bukan ditulis manual) -->
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
