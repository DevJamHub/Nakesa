<?php
// Router untuk server bawaan PHP. Jalankan dari folder proyek:
//   php -S localhost:8000 router.php
// Folder app/ (kode & data contoh) dan data/ (akun, pasien, …) tidak boleh dibuka dari browser,
// karena berisi hash kata sandi dan data pasien. File lain dilayani seperti biasa.
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
if (preg_match('#(^|/)(app|data)(/|$)#', $path)) {
    http_response_code(404);
    echo 'Halaman tidak ditemukan.';
    return true;
}
return false;
