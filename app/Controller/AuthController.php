<?php
// CONTROLLER akun: masuk, daftar, keluar, dan profil (api/auth.php, api/profile.php).
// Controller tidak menyimpan data sendiri; ia meminta Model Auth dan UserRepository, lalu
// mengembalikan data yang akan dikirim sebagai JSON ke halaman (View).

class AuthController
{
    private Auth $auth;
    private UserRepository $users;

    public function __construct(Auth $auth, UserRepository $users)
    {
        $this->auth = $auth;
        $this->users = $users;
    }

    /** "Apakah saya sudah login?" → {"user": {"id", "email"}} atau {"user": null} */
    public function status(): array
    {
        return $this->sessionUser($this->auth->currentUser());
    }

    public function login(array $body): array
    {
        return $this->sessionUser($this->auth->signIn((string) ($body['email'] ?? ''), (string) ($body['password'] ?? '')));
    }

    /** Daftar akun baru, lalu langsung login. */
    public function signup(array $body): array
    {
        $user = $this->users->register((string) ($body['full_name'] ?? ''), (string) ($body['email'] ?? ''), (string) ($body['password'] ?? ''));
        $this->auth->login($user);
        return $this->sessionUser($user);
    }

    public function logout(): array
    {
        $this->auth->logout();
        return ['user' => null];
    }

    /** Profil akun yang login: {id, full_name, email, avatar_url, profession, created_at} */
    public function profile(): array
    {
        return $this->auth->requireUser()->toProfile();
    }

    public function updateProfile(array $changes): array
    {
        return $this->users->updateProfile($this->auth->requireUser()->getId(), $changes)->toProfile();
    }

    private function sessionUser(?User $user): array
    {
        return ['user' => $user ? ['id' => $user->getId(), 'email' => $user->getEmail()] : null];
    }
}
