<?php
// Untuk pasien, tanpa login (halaman html/book.html?p=…) → PublicBookingController.
//   GET ?slug=…   → profil praktik {name, practitioner, profession, …, hours}, atau null
//   POST ?slug=…  body {p_name, p_phone, p_date, p_time, p_service, p_complaint} → {"id": …}
require __DIR__ . '/../app/api.php';

$controller = new PublicBookingController(new PublicPractice($userRepo));
if (method() === 'GET') {
    respond($controller->profile(query('slug')));
}
if (method() === 'POST') {
    respond($controller->book(query('slug'), requestBody()), 201);
}
methodNotAllowed();
