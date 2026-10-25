<?php
// Mengubah stok obat (pengganti fungsi database receive_stock, record_stock_out, correct_stock) → StockController.
//   POST ?action=receive  body {p_medicine_id, p_quantity, p_expires_on, p_batch_number, p_supplier_id, p_buy_price, p_note}
//   POST ?action=out      body {p_batch_id, p_type: keluar|rusak|kedaluwarsa, p_quantity, p_note}
//   POST ?action=correct  body {p_batch_id, p_counted, p_note}
require __DIR__ . '/../app/api.php';

if (method() !== 'POST') {
    methodNotAllowed();
}
$controller = new StockController(account());
$action = query('action');
if ($action === 'receive') {
    respond($controller->receive(requestBody()));
}
if ($action === 'out') {
    respond($controller->stockOut(requestBody()));
}
if ($action === 'correct') {
    respond($controller->correct(requestBody()));
}
methodNotAllowed();
