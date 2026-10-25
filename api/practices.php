<?php
// Praktik milik akun yang sedang login (satu akun, satu praktik) → PracticeSettingsController.
//   GET    → data praktik, atau null kalau belum dibuat
//   POST   body {name, phone, address, specialty}  (onboarding)
//   PATCH  body kolom yang diubah, misalnya {is_open: true}
require __DIR__ . '/../app/api.php';

$controller = new PracticeSettingsController(account());
if (method() === 'GET') {
    respond($controller->practice());
}
if (method() === 'POST') {
    respond($controller->createPractice(requestBody()), 201);
}
if (method() === 'PATCH') {
    respond($controller->updatePractice(requestBody()));
}
methodNotAllowed();
