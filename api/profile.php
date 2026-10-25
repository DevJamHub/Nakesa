<?php
// Profil akun yang sedang login: nama lengkap dan profesi → AuthController.
//   GET    → {id, full_name, email, avatar_url, profession, created_at}
//   PATCH  body {full_name?, profession?}
require __DIR__ . '/../app/api.php';

$controller = new AuthController($auth, $userRepo);
if (method() === 'GET') {
    respond($controller->profile());
}
if (method() === 'PATCH') {
    respond($controller->updateProfile(requestBody()));
}
methodNotAllowed();
