<?php
// Data pasien → PatientController.
//   GET                          → semua pasien, urut nama
//   GET ?view=counts&since=…     → {"total": 12, "since": 3}  (pasien baru sejak tanggal itu)
//   POST / PATCH ?id= / DELETE ?id=
require __DIR__ . '/../app/api.php';

$controller = new PatientController(account());
if (method() === 'GET') {
    respond(query('view') === 'counts' ? $controller->counts(query('since')) : $controller->index());
}
if (method() === 'POST') {
    respond($controller->store(requestBody()), 201);
}
if (method() === 'PATCH') {
    respond($controller->update(requireId(), requestBody()));
}
if (method() === 'DELETE') {
    respond($controller->destroy(requireId()));
}
methodNotAllowed();
