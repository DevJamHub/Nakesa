<?php
// Jadwal praktik mingguan → PracticeSettingsController. Satu baris = satu sesi, misalnya Senin 08:00–12:00.
//   GET  → semua sesi, urut jam buka
//   PUT  body [{day_of_week, opens_at, closes_at}, …]  → ganti seluruh jadwal
require __DIR__ . '/../app/api.php';

$controller = new PracticeSettingsController(account());
if (method() === 'GET') {
    respond($controller->hours());
}
if (method() === 'PUT') {
    respond($controller->replaceHours(requestBody()));
}
methodNotAllowed();
