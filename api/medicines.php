<?php
// Data obat (nama, kategori, golongan, harga, izin dipakai di layanan, …) → MedicineController.
//   GET ?id=…            → satu obat + medicine_categories {name}, atau null
//   POST                 → obat baru
//   POST ?action=examples → tambah contoh obat, jawab {"added": 22}
//   PATCH ?id= / DELETE ?id=  (hapus hanya kalau belum punya riwayat stok atau resep)
require __DIR__ . '/../app/api.php';

$controller = new MedicineController(account());
if (method() === 'GET') {
    respond($controller->show(requireId()));
}
if (method() === 'POST' && query('action') === 'examples') {
    respond($controller->addExamples());
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
