<?php
// Supplier obat → MedicineController.
//   GET  → supplier aktif, urut nama
//   POST body {name}
require __DIR__ . '/../app/api.php';

$controller = new MedicineController(account());
if (method() === 'GET') {
    respond($controller->suppliers());
}
if (method() === 'POST') {
    respond($controller->addSupplier(requestBody()), 201);
}
methodNotAllowed();
