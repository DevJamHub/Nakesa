<?php
// CONTROLLER stok obat: batch, riwayat stok, stok masuk / keluar / koreksi
// (api/medicine_batches.php, api/stock_movements.php, api/stock.php). Model: Inventory.

class StockController
{
    private Inventory $inventory;

    public function __construct(Account $account)
    {
        $this->inventory = new Inventory($account);
    }

    /** Batch sebuah obat: nomor batch, kedaluwarsa, supplier, dan sisa stoknya. */
    public function batches(string $medicineId): array
    {
        return $this->inventory->batches($medicineId);
    }

    /** 100 perubahan stok terbaru sebuah obat. */
    public function history(string $medicineId): array
    {
        return $this->inventory->history($medicineId);
    }

    /** Jumlah yang dipakai (resep + keluar) sejak waktu itu. */
    public function usage(string $medicineId, string $since): array
    {
        return $this->inventory->usageSince($medicineId, $since);
    }

    /** Stok masuk: {p_medicine_id, p_quantity, p_expires_on, p_batch_number, p_supplier_id, p_buy_price, p_note} */
    public function receive(array $input): array
    {
        return ['batch_id' => $this->inventory->receive($input)];
    }

    /** Stok keluar: {p_batch_id, p_type: keluar|rusak|kedaluwarsa, p_quantity, p_note} */
    public function stockOut(array $input): array
    {
        $this->inventory->stockOut($input);
        return ['ok' => true];
    }

    /** Hasil hitung stok (stock opname): {p_batch_id, p_counted, p_note} → selisihnya. */
    public function correct(array $input): array
    {
        return ['difference' => $this->inventory->correct($input)];
    }
}
