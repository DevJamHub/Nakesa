<?php
// Resep → PrescriptionController.
//   GET                         → 200 resep terbaru, masing-masing dengan prescription_items + medicines {generic_name, unit}
//   POST                        → draf resep baru {patient_name, patient_id, booking_id, notes}
//   POST ?action=complete&id=…  → selesaikan resep: stok obat berkurang (pengganti complete_prescription)
//   PATCH ?id= / DELETE ?id=    → hanya untuk draf
require __DIR__ . '/../app/api.php';

$controller = new PrescriptionController(account());
if (method() === 'GET') {
    respond($controller->index());
}
if (method() === 'POST' && query('action') === 'complete') {
    respond($controller->complete(requireId()));
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
