<?php
// Login, daftar, keluar, dan "apakah saya sudah login?" (pengganti Supabase Auth) → AuthController.
//   GET                        → {"user": {"id", "email"}} atau {"user": null}
//   POST ?action=login         body {email, password}
//   POST ?action=signup        body {full_name, email, password}
//   POST ?action=logout
require __DIR__ . '/../app/api.php';

$controller = new AuthController($auth, $userRepo);
if (method() === 'GET') {
    respond($controller->status());
}
if (method() === 'POST') {
    $action = query('action');
    if ($action === 'login') {
        respond($controller->login(requestBody()));
    }
    if ($action === 'signup') {
        respond($controller->signup(requestBody()));
    }
    if ($action === 'logout') {
        respond($controller->logout());
    }
}
methodNotAllowed();
