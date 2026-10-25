<?php
// Front controller profil praktik publik NAKESA (Week 7: Model–View–Controller).
// REQUEST praktik.php?p=… → PracticeController → PracticeModel → object Practice → View practice-page.php → HTML
//
//   http://localhost:8000/php/praktik.php            → contoh praktik ($samplePractice di data.php)
//   http://localhost:8000/php/praktik.php?p=<kode>   → praktik asli (kode link booking, misalnya praktik-bidan-sehati)
require __DIR__ . '/../app/bootstrap.php';
require __DIR__ . '/data.php';
require __DIR__ . '/functions.php';

// Model: data praktik dan aturannya
require __DIR__ . '/Model/Profession.php';
require __DIR__ . '/Model/Schedule.php';
require __DIR__ . '/Model/Practice.php';
require __DIR__ . '/Model/PracticeModel.php';
// Controller: alur request (View dimuat oleh Controller saat merender)
require __DIR__ . '/Controller/PracticeController.php';

$model = new PracticeModel(new PublicPractice($userRepo), $samplePractice);
$controller = new PracticeController($model);
$controller->index($_GET);
