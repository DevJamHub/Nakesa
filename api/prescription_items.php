<?php
// Obat di dalam resep → PrescriptionController.
//   GET ?medicine_id=…      → 50 pemakaian terbaru obat itu di resep + prescriptions {patient_name, status, completed_at}
//   PUT ?prescription_id=…  body [{medicine_id, dose, frequency, duration, quantity, route, instructions}, …]
//                           → ganti semua obat di draf resep itu
require __DIR__ . '/../app/api.php';

$controller = new PrescriptionController(account());
if (method() === 'GET') {
    respond($controller->itemsForMedicine(query('medicine_id')));
}
if (method() === 'PUT') {
    respond($controller->replaceItems(query('prescription_id'), requestBody()));
}
methodNotAllowed();
