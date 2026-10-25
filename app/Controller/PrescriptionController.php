<?php
// CONTROLLER resep (api/prescriptions.php, api/prescription_items.php). Model: PrescriptionBook,
// yang memakai Inventory saat resep diselesaikan.

class PrescriptionController
{
    private PrescriptionBook $book;

    public function __construct(Account $account)
    {
        $this->book = new PrescriptionBook($account);
    }

    /** 200 resep terbaru, masing-masing dengan obatnya. */
    public function index(): array
    {
        return $this->book->list();
    }

    /** Draf resep baru: {patient_name, patient_id, booking_id, notes}. */
    public function store(array $input): array
    {
        return $this->book->create($input);
    }

    /** Hanya untuk draf. */
    public function update(string $id, array $changes): array
    {
        return $this->book->update($id, $changes);
    }

    /** Hanya untuk draf. */
    public function destroy(string $id): array
    {
        $this->book->delete($id);
        return ['ok' => true];
    }

    /** Selesaikan resep: stok obat berkurang dari batch yang paling cepat kedaluwarsa. */
    public function complete(string $id): array
    {
        $this->book->complete($id);
        return ['ok' => true];
    }

    /** Ganti semua obat di draf resep. */
    public function replaceItems(string $prescriptionId, array $items): array
    {
        return $this->book->replaceItems($prescriptionId, $items);
    }

    /** 50 pemakaian terbaru sebuah obat di resep (halaman detail obat). */
    public function itemsForMedicine(string $medicineId): array
    {
        return $this->book->itemsForMedicine($medicineId);
    }
}
