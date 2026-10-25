<?php
// Batch sebuah obat: nomor batch, kedaluwarsa, supplier, dan sisa stoknya → StockController.
//   GET ?medicine_id=… → [{id, batch_number, expires_on, received_on, buy_price, suppliers {name}, medicine_stock {quantity}}, …]
require __DIR__ . '/../app/api.php';

if (method() !== 'GET') {
    methodNotAllowed();
}
respond((new StockController(account()))->batches(query('medicine_id')));
