<?php
// CLASS User: satu akun nakes (data/users.json). Kata sandi hanya disimpan sebagai hash
// (password_hash) dan tidak pernah dikirim ke browser.

class User
{
    private string $id;
    private string $email;
    private ?string $fullName;
    private ?string $profession;
    private ?string $avatarUrl;
    private string $passwordHash;
    private string $createdAt;

    public function __construct(array $row)
    {
        $this->id = $row['id'];
        $this->email = $row['email'];
        $this->fullName = $row['full_name'] ?? null;
        $this->profession = $row['profession'] ?? null;
        $this->avatarUrl = $row['avatar_url'] ?? null;
        $this->passwordHash = $row['password_hash'];
        $this->createdAt = $row['created_at'];
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getFullName(): ?string
    {
        return $this->fullName;
    }

    public function getProfession(): ?string
    {
        return $this->profession;
    }

    /** Folder data praktik akun ini di dalam data/. */
    public function getDataFolder(): string
    {
        return 'akun-' . $this->id;
    }

    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->passwordHash);
    }

    /** Data yang boleh dilihat browser (sama dengan tabel profiles di database lama). */
    public function toProfile(): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->fullName,
            'email' => $this->email,
            'avatar_url' => $this->avatarUrl,
            'profession' => $this->profession,
            'created_at' => $this->createdAt,
        ];
    }
}
