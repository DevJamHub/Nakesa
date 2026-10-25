<?php
// Layanan & harga praktik → PracticeSettingsController.
//   GET  → semua layanan, urut sort_order lalu nama
//   POST body satu layanan, atau daftar layanan (tombol "Pakai layanan standar")
//   PATCH ?id= / DELETE ?id=
require __DIR__ . '/../app/api.php';

$controller = new PracticeSettingsController(account());
if (method() === 'GET') {
    respond($controller->services());
}
if (method() === 'POST') {
    respond($controller->addServices(requestBody()), 201);
}
if (method() === 'PATCH') {
    respond($controller->updateService(requireId(), requestBody()));
}
if (method() === 'DELETE') {
    respond($controller->deleteService(requireId()));
}
methodNotAllowed();
