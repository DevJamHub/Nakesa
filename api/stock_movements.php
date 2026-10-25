<?php
// Riwayat stok sebuah obat → StockController.
//   GET ?medicine_id=…                     → 100 perubahan stok terbaru + medicine_batches {batch_number}
//   GET ?medicine_id=…&view=usage&since=…  → jumlah yang dipakai (resep + keluar) sejak waktu itu
require __DIR__ . '/../app/api.php';

if (method() !== 'GET') {
    methodNotAllowed();
}
$controller = new StockController(account());
if (query('view') === 'usage') {
    respond($controller->usage(query('medicine_id'), query('since')));
}
respond($controller->history(query('medicine_id')));
