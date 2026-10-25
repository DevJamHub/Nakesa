<?php
// CONTROLLER pengaturan praktik milik akun yang login: data praktik, jadwal mingguan, layanan & harga
// (api/practices.php, api/practice_hours.php, api/practice_services.php).
// Namanya bukan PracticeController, karena nama itu dipakai halaman profil publik di php/Controller/.

class PracticeSettingsController
{
    private Account $account;

    public function __construct(Account $account)
    {
        $this->account = $account;
    }

    /** Data praktik, atau null kalau belum dibuat (masih onboarding). */
    public function practice(): ?array
    {
        return $this->account->practice();
    }

    /** Onboarding: {name, phone, address, specialty}. */
    public function createPractice(array $input): array
    {
        return $this->account->createPractice($input);
    }

    /** Kolom yang diubah, misalnya {"is_open": true}. */
    public function updatePractice(array $changes): array
    {
        return $this->account->updatePractice($changes);
    }

    /** Semua sesi jadwal (satu baris = satu sesi, misalnya Senin 08:00–12:00), urut jam buka. */
    public function hours(): array
    {
        return sortRows($this->account->table('practice_hours')->all(), [['opens_at', 'asc']]);
    }

    /** Ganti seluruh jadwal dengan [{day_of_week, opens_at, closes_at}, …]. */
    public function replaceHours(array $sessions): array
    {
        $hours = $this->account->table('practice_hours');
        $rows = [];
        foreach ($sessions as $session) {
            $row = $hours->newRow(is_array($session) ? $session : []);
            if ($row['closes_at'] <= $row['opens_at']) {
                throw new AppError('Jam tutup harus setelah jam buka.');
            }
            foreach ($rows as $other) {
                if ($other['day_of_week'] === $row['day_of_week'] && $other['opens_at'] === $row['opens_at']) {
                    throw new AppError('Data yang sama sudah ada.', 409);
                }
            }
            $rows[] = $row;
        }
        $hours->change(fn () => $rows);
        return $rows;
    }

    /** Semua layanan, urut sort_order lalu nama. */
    public function services(): array
    {
        return sortRows($this->account->table('practice_services')->all(), [['sort_order', 'asc'], ['name', 'asc']]);
    }

    /** Satu layanan, atau daftar layanan (tombol "Pakai layanan standar"). */
    public function addServices(array $input): array
    {
        $services = $this->account->table('practice_services');
        return array_is_list($input) ? $services->insertMany($input) : $services->insert($input);
    }

    public function updateService(string $id, array $changes): array
    {
        return $this->account->table('practice_services')->update($id, $changes);
    }

    public function deleteService(string $id): array
    {
        $this->account->table('practice_services')->delete($id);
        return ['ok' => true];
    }
}
