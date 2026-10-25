<?php
// CLASS Auth: masuk, keluar, dan "siapa yang sedang login". Pengganti Supabase Auth.
//
// Di luar materi Week 1–6: session PHP (session_start, $_SESSION). Setelah login, server menyimpan
// id akun di $_SESSION; browser hanya membawa cookie berisi nomor acak (bukan email atau kata sandi).

class Auth
{
    private UserRepository $users;
    private ?User $user = null;

    public function __construct(UserRepository $users)
    {
        $this->users = $users;
        if (session_status() !== PHP_SESSION_ACTIVE) {
            // httponly: cookie tidak bisa dibaca JavaScript. samesite Lax: tidak ikut terkirim dari form situs lain.
            session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'path' => '/']);
            session_name('nakesa_session');
            session_start();
        }
    }

    /** Cek email + kata sandi, lalu login. Salah → AppError dengan kode invalid_credentials. */
    public function signIn(string $email, string $password): User
    {
        $user = $this->users->findByEmail($email);
        if ($user === null || !$user->verifyPassword($password)) {
            throw new AppError('Email atau kata sandi salah.', 401, 'invalid_credentials');
        }
        $this->login($user);
        return $user;
    }

    public function login(User $user): void
    {
        session_regenerate_id(true); // nomor session baru setiap login
        $_SESSION['user_id'] = $user->getId();
        $this->user = $user;
    }

    public function logout(): void
    {
        $_SESSION = [];
        setcookie(session_name(), '', ['expires' => 1, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
        session_destroy();
        $this->user = null;
    }

    /** Akun yang sedang login, atau null. */
    public function currentUser(): ?User
    {
        if ($this->user === null && isset($_SESSION['user_id'])) {
            $this->user = $this->users->find($_SESSION['user_id']);
        }
        return $this->user;
    }

    /** Untuk API yang butuh login: belum login → jawaban 401. */
    public function requireUser(): User
    {
        return $this->currentUser() ?? throw new AppError('Sesi Anda sudah berakhir. Silakan masuk lagi.', 401, 'not_signed_in');
    }
}
