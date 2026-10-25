<?php
// CLASS Account: akun yang sedang login beserta semua datanya di folder data/akun-<id>/.
// Setiap tabel yang dibuka lewat class ini otomatis milik akun tersebut. Inilah pengganti
// Row Level Security di Supabase: tidak ada cara untuk membaca folder akun lain.

class Account
{
    // Tabel yang barisnya ditandai owner_id (id akun) atau practice_id (id praktik), sama seperti dulu.
    private const OWNER_TABLES = ['practices', 'patients', 'transactions', 'practice_hours', 'bookings'];

    private User $user;
    private ?array $practice = null;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    /** Satu tabel milik akun ini. */
    public function table(string $name): Table
    {
        $fixed = in_array($name, self::OWNER_TABLES, true)
            ? ['owner_id' => $this->user->getId()]
            : ['practice_id' => $this->requirePractice()['id']];
        return new Table($name, $this->user->getDataFolder(), $fixed);
    }

    /** Praktik milik akun ini, atau null kalau belum dibuat (masih di halaman onboarding). */
    public function practice(): ?array
    {
        return $this->practice ??= $this->table('practices')->all()[0] ?? null;
    }

    public function requirePractice(): array
    {
        return $this->practice() ?? throw new AppError('Lengkapi data praktik Anda dulu.', 409);
    }

    /** Buat praktik (onboarding). Setiap akun punya satu praktik dengan kode link booking acak. */
    public function createPractice(array $input): array
    {
        if ($this->practice() !== null) {
            throw new AppError('Data yang sama sudah ada.', 409);
        }
        $practices = new Table('practices', $this->user->getDataFolder(), [
            'owner_id' => $this->user->getId(),
            'booking_slug' => substr(str_replace('-', '', uuid()), 0, 10),
        ]);
        return $this->practice = $practices->insert($input);
    }

    public function updatePractice(array $changes): array
    {
        $practice = $this->requirePractice();
        $after = array_merge($practice, $changes);
        if (($after['latitude'] ?? null) === null xor ($after['longitude'] ?? null) === null) {
            throw new AppError('Lokasi praktik belum lengkap.');
        }
        return $this->practice = $this->table('practices')->update($practice['id'], $changes);
    }

    /**
     * Jalankan beberapa perubahan sebagai satu kesatuan (misalnya stok + riwayat stok), dengan satu kunci
     * untuk seluruh folder akun, supaya tidak ada dua penyimpanan yang saling bertabrakan.
     */
    public function transaction(callable $work): mixed
    {
        $folder = DATA_DIR . '/' . $this->user->getDataFolder();
        if (!is_dir($folder)) {
            mkdir($folder, 0775, true);
        }
        $lock = fopen("$folder/.lock", 'c');
        flock($lock, LOCK_EX);
        try {
            return $work();
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}
