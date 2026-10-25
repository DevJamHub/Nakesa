<?php
// Dimuat paling awal oleh setiap file PHP (api/*.php dan php/praktik.php):
// pengaturan, aturan tabel, fungsi bantu, dan semua class Model.

date_default_timezone_set('Asia/Jakarta');

require __DIR__ . '/config.php';
require __DIR__ . '/schema.php';
require __DIR__ . '/helpers.php';

// MODEL (Week 7): class yang mengelola data dan aturannya (dibuat di Week 6).
// Tidak ada class yang mewarisi class lain selain AppError, jadi urutannya bebas.
require __DIR__ . '/Model/AppError.php';
require __DIR__ . '/Model/JsonStore.php';
require __DIR__ . '/Model/Table.php';
require __DIR__ . '/Model/User.php';
require __DIR__ . '/Model/UserRepository.php';
require __DIR__ . '/Model/Auth.php';
require __DIR__ . '/Model/Account.php';
require __DIR__ . '/Model/Inventory.php';
require __DIR__ . '/Model/PrescriptionBook.php';
require __DIR__ . '/Model/PublicPractice.php';

$userRepo = new UserRepository(new JsonStore('users'));
