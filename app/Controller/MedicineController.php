<?php
// CONTROLLER Database Obat: daftar obat + stoknya, data obat, kategori, dan supplier
// (api/medicine_inventory.php, api/medicines.php, api/medicine_categories.php, api/suppliers.php).
// Model: Inventory (stok & status) dan tabel medicines / suppliers.

class MedicineController
{
    private Account $account;
    private Inventory $inventory;

    public function __construct(Account $account)
    {
        $this->account = $account;
        $this->inventory = new Inventory($account);
    }

    /** Semua obat beserta stok dan statusnya ("menipis", "akan kedaluwarsa", …), urut nama. */
    public function index(): array
    {
        return $this->inventory->list();
    }

    /** Satu baris daftar obat (dengan stok), atau null. */
    public function inventoryItem(string $id): ?array
    {
        return $this->inventory->find($id);
    }

    /** {"count": 3}: obat yang perlu dicek (badge merah di menu Obat). */
    public function attentionCount(): array
    {
        return ['count' => $this->inventory->attentionCount()];
    }

    /** Data lengkap satu obat + nama kategorinya, atau null. */
    public function show(string $id): ?array
    {
        return $this->inventory->medicine($id);
    }

    public function store(array $input): array
    {
        return $this->account->table('medicines')->insert($input);
    }

    public function update(string $id, array $changes): array
    {
        return $this->account->table('medicines')->update($id, $changes);
    }

    /** Hanya bisa kalau obat belum punya riwayat stok atau resep. */
    public function destroy(string $id): array
    {
        $this->inventory->deleteMedicine($id);
        return ['ok' => true];
    }

    /** Tombol "Tambah contoh obat": {"added": 22}. */
    public function addExamples(): array
    {
        return ['added' => $this->inventory->addExamples()];
    }

    /** Kategori obat bawaan (sama untuk semua praktik). */
    public function categories(): array
    {
        return $this->inventory->categories();
    }

    /** Supplier aktif, urut nama. */
    public function suppliers(): array
    {
        return sortRows($this->account->table('suppliers')->where(fn ($s) => $s['is_active']), [['name', 'asc']]);
    }

    public function addSupplier(array $input): array
    {
        return $this->account->table('suppliers')->insert($input);
    }
}
