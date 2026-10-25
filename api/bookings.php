<?php
// Booking pasien → BookingController. ?date= adalah "hari ini" menurut browser (YYYY-MM-DD).
//   GET ?view=today&date=…           → booking hari itu (selain batal), urut jam
//   GET ?view=pending_count&date=…   → {"count": 2}  booking baru yang menunggu konfirmasi
//   GET ?view=upcoming&date=…        → booking yang akan datang (baru/dikonfirmasi)
//   GET ?view=history&date=…         → 100 booking yang sudah lewat, selesai, atau batal
//   GET ?view=patient&name=…&phone=… → 10 kunjungan terakhir seorang pasien
//   POST / PATCH ?id=
require __DIR__ . '/../app/api.php';

$controller = new BookingController(account());
$date = query('date') ?: todayISO();

if (method() === 'GET') {
    $view = query('view');
    if ($view === 'today') {
        respond($controller->today($date));
    }
    if ($view === 'pending_count') {
        respond($controller->pendingCount($date));
    }
    if ($view === 'upcoming') {
        respond($controller->upcoming($date));
    }
    if ($view === 'history') {
        respond($controller->history($date));
    }
    if ($view === 'patient') {
        respond($controller->patientVisits(query('name'), query('phone')));
    }
    respond($controller->index());
}
if (method() === 'POST') {
    respond($controller->store(requestBody()), 201);
}
if (method() === 'PATCH') {
    respond($controller->update(requireId(), requestBody()));
}
methodNotAllowed();
