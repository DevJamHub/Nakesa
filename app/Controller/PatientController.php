<?php
// CONTROLLER data pasien (api/patients.php). Model: tabel patients (dan prescriptions saat pasien dihapus).

class PatientController
{
    private Account $account;
    private Table $patients;

    public function __construct(Account $account)
    {
        $this->account = $account;
        $this->patients = $account->table('patients');
    }

    /** Semua pasien, urut nama. */
    public function index(): array
    {
        return sortRows($this->patients->all(), [['full_name', 'asc']]);
    }

    /** {"total": 12, "since": 3}: jumlah pasien dan pasien baru sejak tanggal itu (kartu di Beranda). */
    public function counts(string $since): array
    {
        $since = strtotime($since ?: '-7 days');
        $rows = $this->patients->all();
        return [
            'total' => count($rows),
            'since' => count(array_filter($rows, fn ($p) => strtotime($p['created_at']) >= $since)),
        ];
    }

    public function store(array $input): array
    {
        return $this->patients->insert($input);
    }

    public function update(string $id, array $changes): array
    {
        return $this->patients->update($id, $changes);
    }

    public function destroy(string $id): array
    {
        $this->account->transaction(function () use ($id) {
            $this->patients->delete($id);
            // Resep pasien ini tetap ada, hanya tautannya ke data pasien yang dilepas.
            if ($this->account->practice()) {
                $this->account->table('prescriptions')->change(fn (array $all) => array_map(
                    fn ($rx) => $rx['patient_id'] === $id ? array_merge($rx, ['patient_id' => null]) : $rx, $all));
            }
        });
        return ['ok' => true];
    }
}
