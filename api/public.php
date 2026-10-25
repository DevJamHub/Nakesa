<?php
// Untuk pasien, tanpa login (halaman html/book.html?p=…) → PublicBookingController.
//   GET ?slug=…   → profil praktik {name, practitioner, profession, …, hours, services}, atau null
//   GET ?slug=…&view=slots&date=YYYY-MM-DD → [{start: "08:00", end: "08:30", available: true}, …]
//   POST ?slug=…  body {p_name, p_phone, p_date, p_time, p_service, p_complaint} → {"id": …}
require __DIR__ . '/../app/api.php';

$controller = new PublicBookingController(new PublicPractice($userRepo));
if (method() === 'GET') {
    respond(query('view') === 'slots' ? $controller->slots(query('slug'), query('date')) : $controller->profile(query('slug')));
}
if (method() === 'POST') {
    respond($controller->book(query('slug'), requestBody()), 201);
}
methodNotAllowed();
