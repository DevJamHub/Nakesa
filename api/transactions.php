<?php
// Catatan keuangan (uang masuk / keluar) → TransactionController.
//   GET ?from=…&to=…           → catatan di antara dua tanggal, urut tanggal lalu waktu dicatat
//   GET ?view=balance&before=… → {"balance": 1500000}  saldo sebelum tanggal itu
//   POST / PATCH ?id= / DELETE ?id=
require __DIR__ . '/../app/api.php';

$controller = new TransactionController(account());
if (method() === 'GET') {
    respond(query('view') === 'balance' ? $controller->balance(query('before')) : $controller->index(query('from'), query('to')));
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
