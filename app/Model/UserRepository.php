<?php
// CLASS UserRepository: membaca dan menyimpan akun (data/users.json) sebagai object User.

class UserRepository
{
    private JsonStore $store;

    public function __construct(JsonStore $store)
    {
        $this->store = $store;
    }

    public function find(string $id): ?User
    {
        foreach ($this->store->read() as $row) {
            if ($row['id'] === $id) {
                return new User($row);
            }
        }
        return null;
    }

    /** Akun dengan email ini (huruf besar/kecil tidak dibedakan), atau null. */
    public function findByEmail(string $email): ?User
    {
        $row = $this->rowByEmail($this->store->read(), $email);
        return $row ? new User($row) : null;
    }

    /** Semua akun, untuk mencari praktik dari kode link booking. @return User[] */
    public function all(): array
    {
        return array_map(fn ($row) => new User($row), $this->store->read());
    }

    /** Daftar akun baru. Pesan error memakai kode yang sama dengan Supabase Auth dulu (lihat js/errors.js). */
    public function register(string $fullName, string $email, string $password): User
    {
        $fullName = trim($fullName);
        $email = mb_strtolower(trim($email));
        if ($fullName === '' || mb_strlen($fullName) > 120) {
            throw new AppError('Nama lengkap wajib diisi.', 422, 'validation_failed');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new AppError('Format email belum benar.', 422, 'email_address_invalid');
        }
        if (mb_strlen($password) < MIN_PASSWORD_LENGTH) {
            throw new AppError('Kata sandi minimal ' . MIN_PASSWORD_LENGTH . ' karakter.', 422, 'weak_password');
        }
        // Cek email dan simpan di dalam satu kunci file, supaya dua pendaftaran
        // dengan email yang sama di detik yang sama tidak lolos dua-duanya.
        $row = $this->store->change(function (array $rows, &$saved) use ($fullName, $email, $password) {
            if ($this->rowByEmail($rows, $email) !== null) {
                throw new AppError('Email ini sudah terdaftar. Silakan masuk.', 409, 'user_already_exists');
            }
            $saved = [
                'id' => uuid(),
                'email' => $email,
                'full_name' => $fullName,
                'profession' => null,
                'avatar_url' => null,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                'created_at' => nowISO(),
                'updated_at' => nowISO(),
            ];
            $rows[] = $saved;
            return $rows;
        });
        return new User($row);
    }

    /** Ubah nama lengkap dan/atau profesi (satu-satunya kolom yang boleh diubah pengguna). */
    public function updateProfile(string $id, array $changes): User
    {
        $clean = [];
        if (array_key_exists('full_name', $changes)) {
            $name = trim((string) $changes['full_name']);
            if ($name === '' || mb_strlen($name) > 120) {
                throw new AppError('Nama lengkap wajib diisi, paling panjang 120 huruf.');
            }
            $clean['full_name'] = $name;
        }
        if (array_key_exists('profession', $changes)) {
            if (!in_array($changes['profession'], PROFESSION_KEYS, true)) {
                throw new AppError('Pilih salah satu profesi.');
            }
            $clean['profession'] = $changes['profession'];
        }
        $row = $this->store->change(function (array $rows, &$saved) use ($id, $clean) {
            foreach ($rows as $i => $row) {
                if ($row['id'] === $id) {
                    $rows[$i] = $saved = array_merge($row, $clean, ['updated_at' => nowISO()]);
                }
            }
            return $rows;
        });
        return new User($row);
    }

    private function rowByEmail(array $rows, string $email): ?array
    {
        foreach ($rows as $row) {
            if (strcasecmp($row['email'], trim($email)) === 0) {
                return $row;
            }
        }
        return null;
    }
}
