<?php
// CLASS PrescriptionBook: resep sebuah praktik beserta obat-obatnya (prescription_items).
// Resep berstatus draft masih bisa diubah atau dihapus; setelah "selesai", stok obat berkurang
// lewat Inventory::dispense() dan resep tidak bisa diubah lagi.

class PrescriptionBook
{
    private Account $account;

    public function __construct(Account $account)
    {
        $this->account = $account;
    }

    /** 200 resep terbaru, masing-masing dengan obatnya (+ nama dan satuan obat). */
    public function list(): array
    {
        $medicines = array_column($this->account->table('medicines')->all(), null, 'id');
        $items = $this->account->table('prescription_items')->all();
        $prescriptions = sortRows($this->account->table('prescriptions')->all(), [['created_at', 'desc']]);
        return array_map(fn ($rx) => $this->publicRow($rx) + [
            'prescription_items' => array_values(array_map(fn ($i) => $this->itemRow($i) + [
                'medicines' => isset($medicines[$i['medicine_id']])
                    ? ['generic_name' => $medicines[$i['medicine_id']]['generic_name'], 'unit' => $medicines[$i['medicine_id']]['unit']]
                    : null,
            ], array_filter($items, fn ($i) => $i['prescription_id'] === $rx['id']))),
        ], array_slice($prescriptions, 0, 200));
    }

    public function create(array $input): array
    {
        $this->checkLinks($input);
        return $this->publicRow($this->account->table('prescriptions')->insert($input));
    }

    public function update(string $id, array $changes): array
    {
        $this->requireDraft($id);
        $this->checkLinks($changes);
        return $this->publicRow($this->account->table('prescriptions')->update($id, $changes));
    }

    /** Hanya draf yang boleh dihapus; obat-obat di dalamnya ikut terhapus. */
    public function delete(string $id): void
    {
        $this->account->transaction(function () use ($id) {
            $this->requireDraft($id);
            $this->account->table('prescription_items')->deleteWhere(fn ($i) => $i['prescription_id'] === $id);
            $this->account->table('prescriptions')->delete($id);
        });
    }

    /** Ganti semua obat di draf resep dengan daftar baru. */
    public function replaceItems(string $prescriptionId, array $items): array
    {
        return $this->account->transaction(function () use ($prescriptionId, $items) {
            $this->requireDraft($prescriptionId);
            $table = $this->account->table('prescription_items');
            $medicines = $this->account->table('medicines');
            $rows = [];
            foreach ($items as $item) {
                $row = $table->newRow(is_array($item) ? $item : []);
                if ($medicines->find($row['medicine_id']) === null) {
                    throw new AppError('Obat di resep tidak ditemukan.');
                }
                $rows[] = $row + ['prescription_id' => $prescriptionId];
            }
            $table->change(fn (array $all) => [
                ...array_values(array_filter($all, fn ($i) => $i['prescription_id'] !== $prescriptionId)),
                ...$rows,
            ]);
            return array_map(fn ($r) => $this->itemRow($r), $rows);
        });
    }

    /** Riwayat pemakaian satu obat di resep (50 terbaru), dengan nama pasien dan status resepnya. */
    public function itemsForMedicine(string $medicineId): array
    {
        $prescriptions = array_column($this->account->table('prescriptions')->all(), null, 'id');
        $items = $this->account->table('prescription_items')->where(fn ($i) => $i['medicine_id'] === $medicineId);
        $rows = array_map(function ($i) use ($prescriptions) {
            $rx = $prescriptions[$i['prescription_id']] ?? null;
            return [
                'id' => $i['id'], 'dose' => $i['dose'], 'frequency' => $i['frequency'], 'duration' => $i['duration'],
                'quantity' => $i['quantity'], 'route' => $i['route'], 'created_at' => $i['created_at'],
                'prescriptions' => $rx ? ['patient_name' => $rx['patient_name'], 'status' => $rx['status'], 'completed_at' => $rx['completed_at'] ?? null] : null,
            ];
        }, $items);
        return array_slice(sortRows($rows, [['created_at', 'desc']]), 0, 50);
    }

    /** Selesaikan resep (complete_prescription): stok obat dikurangi, status jadi "selesai". */
    public function complete(string $id): void
    {
        $this->account->transaction(function () use ($id) {
            $rx = $this->requireDraft($id);
            $items = sortRows($this->account->table('prescription_items')->where(fn ($i) => $i['prescription_id'] === $id),
                [['created_at', 'asc']]);
            if (!$items) {
                throw new AppError('Tambahkan minimal satu obat ke resep.');
            }
            (new Inventory($this->account))->dispense($items, $rx['patient_name']);
            $this->account->table('prescriptions')->change(function (array $all) use ($id) {
                foreach ($all as $i => $row) {
                    if ($row['id'] === $id) {
                        $all[$i] = array_merge($row, ['status' => 'selesai', 'completed_at' => nowISO(), 'updated_at' => nowISO()]);
                    }
                }
                return $all;
            });
        });
    }

    private function requireDraft(string $id): array
    {
        $rx = $this->account->table('prescriptions')->find($id);
        if ($rx === null) {
            throw new AppError('Resep tidak ditemukan.', 404);
        }
        if ($rx['status'] !== 'draft') {
            throw new AppError("Resep ini sudah berstatus {$rx['status']}.", 409);
        }
        return $rx;
    }

    /** Pasien dan booking yang ditautkan ke resep harus milik praktik ini. */
    private function checkLinks(array $input): void
    {
        if (!empty($input['patient_id']) && $this->account->table('patients')->find($input['patient_id']) === null) {
            throw new AppError('Pasien tidak ditemukan di praktik ini.');
        }
        if (!empty($input['booking_id']) && $this->account->table('bookings')->find($input['booking_id']) === null) {
            throw new AppError('Booking tidak ditemukan di praktik ini.');
        }
    }

    private function publicRow(array $rx): array
    {
        return [
            'id' => $rx['id'], 'patient_id' => $rx['patient_id'], 'patient_name' => $rx['patient_name'],
            'booking_id' => $rx['booking_id'], 'status' => $rx['status'], 'notes' => $rx['notes'],
            'created_at' => $rx['created_at'], 'completed_at' => $rx['completed_at'] ?? null,
        ];
    }

    private function itemRow(array $i): array
    {
        return [
            'id' => $i['id'], 'medicine_id' => $i['medicine_id'], 'dose' => $i['dose'], 'frequency' => $i['frequency'],
            'duration' => $i['duration'], 'quantity' => $i['quantity'], 'route' => $i['route'],
            'instructions' => $i['instructions'], 'created_at' => $i['created_at'],
        ];
    }
}
