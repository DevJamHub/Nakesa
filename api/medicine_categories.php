<?php
// Kategori obat (bawaan, sama untuk semua praktik) → MedicineController.
//   GET → [{id, name, practice_id: null, sort_order}, …]
require __DIR__ . '/../app/api.php';

if (method() !== 'GET') {
    methodNotAllowed();
}
respond((new MedicineController(account()))->categories());
