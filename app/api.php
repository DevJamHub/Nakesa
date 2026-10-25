<?php
// Dimuat oleh setiap file di folder api/. API ini dipanggil JavaScript dengan fetch (Week 4)
// dan selalu menjawab JSON:
//   berhasil → data (array/object), kode 200
//   gagal    → {"message": "pesan untuk pengguna", "code": "…"} dengan kode 4xx/5xx
//
// Alur MVC (Week 7): REQUEST → api/<nama>.php → method CONTROLLER → MODEL (app/Model) → DATA
// → respond() mengirim JSON → halaman html/*.html (VIEW) menggambarnya dengan js/pages/*.js.
require __DIR__ . '/bootstrap.php';

// CONTROLLER (Week 7): menerima request dari api/*.php, meminta data ke Model, mengembalikan hasilnya.
require __DIR__ . '/Controller/AuthController.php';
require __DIR__ . '/Controller/PracticeSettingsController.php';
require __DIR__ . '/Controller/BookingController.php';
require __DIR__ . '/Controller/PatientController.php';
require __DIR__ . '/Controller/TransactionController.php';
require __DIR__ . '/Controller/MedicineController.php';
require __DIR__ . '/Controller/StockController.php';
require __DIR__ . '/Controller/PrescriptionController.php';
require __DIR__ . '/Controller/PublicBookingController.php';

// Peringatan PHP tidak boleh ikut tercetak, karena akan merusak JSON. Cukup dicatat di log server.
ini_set('display_errors', '0');

// Semua error yang tidak ditangkap berubah menjadi jawaban JSON. Pesan AppError boleh dibaca
// pengguna; error lain (bug, file rusak) hanya dicatat di log server.
set_exception_handler(function (Throwable $error) {
    if ($error instanceof AppError) {
        respond(['message' => $error->getMessage(), 'code' => $error->getErrorCode()], $error->getStatus());
    }
    error_log('[api] ' . $error);
    respond(['message' => 'Terjadi kesalahan di server. Silakan coba lagi.', 'code' => 'server_error'], 500);
});

$auth = new Auth($userRepo);

/** GET, POST, PATCH, PUT, atau DELETE. */
function method(): string
{
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

/** Akun yang sedang login (401 kalau belum). */
function account(): Account
{
    global $auth;
    return new Account($auth->requireUser());
}

/** Parameter ?id=… yang wajib ada untuk PATCH dan DELETE. */
function requireId(): string
{
    return query('id') ?: throw new AppError('Data tidak ditemukan.', 404);
}

function methodNotAllowed(): never
{
    throw new AppError('Permintaan tidak dikenal.', 405);
}
