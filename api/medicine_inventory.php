<?php
// Daftar obat beserta stok dan statusnya (pengganti view medicine_inventory) → MedicineController.
//   GET                       → semua obat, urut nama
//   GET ?id=…                 → satu obat, atau null
//   GET ?view=attention_count → {"count": 3}  obat aktif yang stoknya menipis/habis atau (akan) kedaluwarsa
require __DIR__ . '/../app/api.php';

if (method() !== 'GET') {
    methodNotAllowed();
}
$controller = new MedicineController(account());
if (query('view') === 'attention_count') {
    respond($controller->attentionCount());
}
if (query('id') !== '') {
    respond($controller->inventoryItem(query('id')));
}
respond($controller->index());
