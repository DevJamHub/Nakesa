<?php
// CLASS Inventory: stok obat sebuah praktik. Dulu dikerjakan oleh database (view medicine_inventory
// dan fungsi receive_stock, record_stock_out, correct_stock, add_example_medicines); sekarang oleh PHP.
//
// Stok disimpan per batch (nomor batch + tanggal kedaluwarsa). Setiap perubahan stok dicatat di
// stock_movements dan tidak pernah dihapus; kesalahan diperbaiki dengan baris "koreksi".

class Inventory
{
    private Account $account;

    public function __construct(Account $account)
    {
        $this->account = $account;
    }

    /** Kategori bawaan untuk semua praktik, urut sort_order lalu nama. */
    public function categories(): array
    {
        $rows = array_map(fn ($c) => $c + ['practice_id' => null], MEDICINE_CATEGORIES);
        return sortRows($rows, [['sort_order', 'asc'], ['name', 'asc']]);
    }

    private function categoryName(?string $id): ?string
    {
        foreach (MEDICINE_CATEGORIES as $category) {
            if ($category['id'] === $id) {
                return $category['name'];
            }
        }
        return null;
    }

    /** Semua obat beserta stok dan statusnya (bentuk sama dengan view medicine_inventory), urut nama. */
    public function list(): array
    {
        $batches = $this->account->table('medicine_batches')->all();
        $rows = array_map(fn ($m) => $this->summary($m, $batches), $this->account->table('medicines')->all());
        return sortRows($rows, [['generic_name', 'asc']]);
    }

    public function find(string $id): ?array
    {
        $medicine = $this->account->table('medicines')->find($id);
        return $medicine ? $this->summary($medicine, $this->account->table('medicine_batches')->all()) : null;
    }

    /** Jumlah obat aktif yang perlu dicek: stok menipis/habis atau ada yang (akan) kedaluwarsa. */
    public function attentionCount(): int
    {
        $check = array_filter($this->list(), fn ($m) => $m['is_active']
            && ($m['stock_status'] !== 'aman' || $m['expiry_status'] !== 'aman'));
        return count($check);
    }

    private function summary(array $m, array $allBatches): array
    {
        $today = todayISO();
        $usable = $expired = $batchCount = 0;
        $nearest = null;
        foreach ($allBatches as $b) {
            if ($b['medicine_id'] !== $m['id']) {
                continue;
            }
            $isExpired = $b['expires_on'] !== null && $b['expires_on'] < $today;
            if ($isExpired) {
                $expired += $b['quantity'];
            } else {
                $usable += $b['quantity'];
            }
            if ($b['quantity'] > 0) {
                $batchCount++;
                if (!$isExpired && $b['expires_on'] !== null && ($nearest === null || $b['expires_on'] < $nearest)) {
                    $nearest = $b['expires_on'];
                }
            }
        }
        $warningDays = $this->account->requirePractice()['expiry_warning_days'];
        return [
            'id' => $m['id'],
            'practice_id' => $m['practice_id'],
            'generic_name' => $m['generic_name'],
            'brand_name' => $m['brand_name'],
            'category_id' => $m['category_id'],
            'category_name' => $this->categoryName($m['category_id']),
            'dosage_form' => $m['dosage_form'],
            'strength' => $m['strength'],
            'unit' => $m['unit'],
            'route' => $m['route'],
            'min_stock' => $m['min_stock'],
            'buy_price' => $m['buy_price'],
            'sell_price' => $m['sell_price'],
            'drug_class' => $m['drug_class'],
            'use_in_service' => $m['use_in_service'],
            'is_active' => $m['is_active'],
            'stock' => $usable,          // belum kedaluwarsa, bisa dipakai
            'expired_stock' => $expired, // sudah kedaluwarsa, harus dikeluarkan
            'batch_count' => $batchCount,
            'nearest_expiry' => $nearest,
            'stock_status' => $usable === 0 ? 'habis' : ($usable <= $m['min_stock'] ? 'menipis' : 'aman'),
            'expiry_status' => $expired > 0 ? 'kedaluwarsa'
                : ($nearest !== null && $nearest <= todayISO($warningDays) ? 'akan_kedaluwarsa' : 'aman'),
        ];
    }

    /** Satu obat lengkap + nama kategorinya (medicine_categories.name), atau null. */
    public function medicine(string $id): ?array
    {
        $medicine = $this->account->table('medicines')->find($id);
        if ($medicine === null) {
            return null;
        }
        $name = $this->categoryName($medicine['category_id']);
        return $medicine + ['medicine_categories' => $name === null ? null : ['name' => $name]];
    }

    /** Batch sebuah obat beserta nama supplier dan jumlah stoknya. */
    public function batches(string $medicineId): array
    {
        $suppliers = array_column($this->account->table('suppliers')->all(), 'name', 'id');
        $rows = array_map(fn ($b) => [
            'id' => $b['id'],
            'batch_number' => $b['batch_number'],
            'expires_on' => $b['expires_on'],
            'received_on' => $b['received_on'],
            'buy_price' => $b['buy_price'],
            'suppliers' => $b['supplier_id'] !== null && isset($suppliers[$b['supplier_id']])
                ? ['name' => $suppliers[$b['supplier_id']]] : null,
            'medicine_stock' => ['quantity' => $b['quantity']],
        ], $this->account->table('medicine_batches')->where(fn ($b) => $b['medicine_id'] === $medicineId));
        return sortRows($rows, [['expires_on', 'asc'], ['received_on', 'asc']]);
    }

    /** Riwayat stok sebuah obat (terbaru dulu), dengan nomor batchnya. */
    public function history(string $medicineId, int $limit = 100): array
    {
        $numbers = array_column($this->account->table('medicine_batches')->all(), 'batch_number', 'id');
        $rows = array_map(fn ($m) => [
            'id' => $m['id'],
            'movement_type' => $m['movement_type'],
            'quantity' => $m['quantity'],
            'stock_after' => $m['stock_after'],
            'note' => $m['note'],
            'created_at' => $m['created_at'],
            'created_by' => $m['created_by'],
            'medicine_batches' => ['batch_number' => $numbers[$m['batch_id']] ?? null],
        ], $this->account->table('stock_movements')->where(fn ($m) => $m['medicine_id'] === $medicineId));
        return array_slice(sortRows($rows, [['created_at', 'desc']]), 0, $limit);
    }

    /** Pemakaian (resep + keluar) sebuah obat sejak waktu tertentu: [['quantity' => -2], …]. */
    public function usageSince(string $medicineId, string $since): array
    {
        $from = strtotime($since);
        $rows = $this->account->table('stock_movements')->where(fn ($m) => $m['medicine_id'] === $medicineId
            && in_array($m['movement_type'], ['resep', 'keluar'], true) && strtotime($m['created_at']) >= $from);
        return array_map(fn ($m) => ['quantity' => $m['quantity']], $rows);
    }

    /* ---------- Mengubah stok ---------- */

    /** Stok masuk (receive_stock). Batch dengan nomor + tanggal kedaluwarsa yang sama dipakai lagi. */
    public function receive(array $input): string
    {
        $quantity = (int) ($input['p_quantity'] ?? 0);
        if ($quantity <= 0) {
            throw new AppError('Jumlah stok masuk harus lebih dari 0.');
        }
        $medicineId = (string) ($input['p_medicine_id'] ?? '');
        if ($this->account->table('medicines')->find($medicineId) === null) {
            throw new AppError('Obat tidak ditemukan.');
        }
        $number = trim((string) ($input['p_batch_number'] ?? '')) ?: null;
        $expires = $this->optionalDate($input['p_expires_on'] ?? null);
        $supplier = $input['p_supplier_id'] ?? null;
        $buyPrice = isset($input['p_buy_price']) ? max(0, (int) $input['p_buy_price']) : null;

        return $this->account->transaction(function () use ($medicineId, $number, $expires, $supplier, $buyPrice, $quantity, $input) {
            $batch = $this->account->table('medicine_batches')->where(fn ($b) => $b['medicine_id'] === $medicineId
                && $b['batch_number'] === $number && $b['expires_on'] === $expires)[0] ?? null;
            if ($batch === null) {
                $batch = [
                    'id' => uuid(),
                    'practice_id' => $this->account->requirePractice()['id'],
                    'medicine_id' => $medicineId,
                    'batch_number' => $number,
                    'expires_on' => $expires,
                    'supplier_id' => $supplier,
                    'buy_price' => $buyPrice,
                    'received_on' => todayISO(),
                    'quantity' => 0,
                    'created_at' => nowISO(),
                ];
                $this->account->table('medicine_batches')->change(fn (array $all) => [...$all, $batch]);
            }
            $this->applyMovements([[$batch['id'], 'masuk', $quantity, $this->note($input['p_note'] ?? null), null]]);
            return $batch['id'];
        });
    }

    /** Stok keluar karena dipakai, rusak, atau kedaluwarsa (record_stock_out). */
    public function stockOut(array $input): void
    {
        $type = $input['p_type'] ?? '';
        if (!in_array($type, ['keluar', 'rusak', 'kedaluwarsa'], true)) {
            throw new AppError('Jenis pengeluaran tidak dikenal.');
        }
        $quantity = (int) ($input['p_quantity'] ?? 0);
        if ($quantity <= 0) {
            throw new AppError('Jumlah harus lebih dari 0.');
        }
        $this->account->transaction(fn () => $this->applyMovements([
            [(string) ($input['p_batch_id'] ?? ''), $type, -$quantity, $this->note($input['p_note'] ?? null), null],
        ]));
    }

    /** Stock opname: samakan stok batch dengan hasil hitung (correct_stock). Mengembalikan selisihnya. */
    public function correct(array $input): int
    {
        $counted = $input['p_counted'] ?? null;
        if (!is_int($counted) || $counted < 0) {
            throw new AppError('Isi jumlah stok yang sebenarnya.');
        }
        $note = $this->note($input['p_note'] ?? null);
        if ($note === null) {
            throw new AppError('Tulis alasan koreksi stok.');
        }
        $batchId = (string) ($input['p_batch_id'] ?? '');
        return $this->account->transaction(function () use ($batchId, $counted, $note) {
            $batch = $this->account->table('medicine_batches')->find($batchId);
            $current = $batch['quantity'] ?? 0;
            if ($counted === $current) {
                throw new AppError('Stok sudah sesuai, tidak ada yang dikoreksi.');
            }
            $this->applyMovements([[$batchId, 'koreksi', $counted - $current, $note, null]]);
            return $counted - $current;
        });
    }

    /**
     * Keluarkan stok untuk resep, batch yang paling cepat kedaluwarsa lebih dulu (FEFO).
     * $items: [['id' =>, 'medicine_id' =>, 'quantity' =>], …]. Semua dicek dulu; kalau ada yang kurang,
     * tidak ada stok yang berubah. Dipanggil oleh PrescriptionBook::complete() di dalam transaction().
     */
    public function dispense(array $items, string $patientName): void
    {
        $medicines = array_column($this->account->table('medicines')->all(), null, 'id');
        $batches = $this->account->table('medicine_batches')->all();
        $left = array_column($batches, 'quantity', 'id'); // sisa per batch selama perhitungan
        $today = todayISO();
        $plan = [];
        foreach ($items as $item) {
            $medicine = $medicines[$item['medicine_id']] ?? null;
            if ($medicine === null) {
                throw new AppError('Obat di resep tidak ditemukan.');
            }
            if (!$medicine['is_active']) {
                throw new AppError("{$medicine['generic_name']} sudah dinonaktifkan.");
            }
            if (!$medicine['use_in_service']) {
                throw new AppError("{$medicine['generic_name']} belum diizinkan dipakai di layanan. Admin perlu meninjaunya sesuai kewenangan dan SOP.");
            }
            $usable = array_filter($batches, fn ($b) => $b['medicine_id'] === $medicine['id']
                && ($b['expires_on'] === null || $b['expires_on'] >= $today));
            $usable = sortRows($usable, [['expires_on', 'asc'], ['received_on', 'asc'], ['created_at', 'asc']]);
            $need = $item['quantity'];
            foreach ($usable as $b) {
                $take = min($need, $left[$b['id']]);
                if ($take > 0) {
                    $plan[] = [$b['id'], 'resep', -$take, "Resep: $patientName", $item['id']];
                    $left[$b['id']] -= $take;
                    $need -= $take;
                }
                if ($need === 0) {
                    break;
                }
            }
            if ($need > 0) {
                throw new AppError("Stok {$medicine['generic_name']} tidak cukup: kurang $need {$medicine['unit']}.");
            }
        }
        $this->applyMovements($plan);
    }

    /**
     * Catat perubahan stok: [[batch_id, jenis, jumlah (+/-), catatan, prescription_item_id], …].
     * Stok batch ikut berubah, dan stock_after diisi stok batch setelahnya.
     */
    private function applyMovements(array $moves): void
    {
        $batches = $this->account->table('medicine_batches')->all();
        $index = array_flip(array_column($batches, 'id'));
        $rows = [];
        foreach ($moves as [$batchId, $type, $quantity, $note, $itemId]) {
            if (!isset($index[$batchId])) {
                throw new AppError('Batch obat tidak ditemukan.');
            }
            $batch = &$batches[$index[$batchId]];
            if ($batch['quantity'] + $quantity < 0) {
                throw new AppError("Stok tidak cukup. Sisa stok di batch ini: {$batch['quantity']}.");
            }
            $batch['quantity'] += $quantity;
            $rows[] = [
                'id' => uuid(),
                'practice_id' => $batch['practice_id'],
                'medicine_id' => $batch['medicine_id'],
                'batch_id' => $batchId,
                'movement_type' => $type,
                'quantity' => $quantity,
                'stock_after' => $batch['quantity'],
                'note' => $note,
                'prescription_item_id' => $itemId,
                'created_by' => $this->account->getUser()->getId(),
                'created_at' => nowISO(),
            ];
            unset($batch);
        }
        $this->account->table('medicine_batches')->change(fn () => $batches);
        $this->account->table('stock_movements')->change(fn (array $all) => [...$all, ...$rows]);
    }

    /* ---------- Data obat ---------- */

    /** Tombol "Tambah contoh obat": obat yang namanya belum ada ditambahkan. Mengembalikan jumlahnya. */
    public function addExamples(): int
    {
        $medicines = $this->account->table('medicines');
        $existing = array_map('mb_strtolower', array_column($medicines->all(), 'generic_name'));
        $categories = array_column(MEDICINE_CATEGORIES, 'id', 'name');
        $rows = [];
        foreach (EXAMPLE_MEDICINES as [$name, $category, $form, $strength, $unit, $route, $class, $minStock]) {
            if (!in_array(mb_strtolower($name), $existing, true)) {
                $rows[] = [
                    'generic_name' => $name, 'category_id' => $categories[$category], 'dosage_form' => $form,
                    'strength' => $strength, 'unit' => $unit, 'route' => $route, 'drug_class' => $class,
                    'min_stock' => $minStock, 'notes' => EXAMPLE_MEDICINE_NOTE,
                ];
            }
        }
        $medicines->insertMany($rows);
        return count($rows);
    }

    /** Obat hanya bisa dihapus kalau belum punya riwayat stok atau resep. */
    public function deleteMedicine(string $id): void
    {
        $used = $this->account->table('medicine_batches')->where(fn ($b) => $b['medicine_id'] === $id)
            || $this->account->table('prescription_items')->where(fn ($i) => $i['medicine_id'] === $id);
        if ($used) {
            throw new AppError('Data ini masih dipakai di catatan lain, jadi tidak bisa dihapus.', 409);
        }
        $this->account->table('medicines')->delete($id);
    }

    private function note(mixed $note): ?string
    {
        $note = trim((string) $note);
        if (mb_strlen($note) > 300) {
            throw new AppError('Catatan paling panjang 300 huruf.');
        }
        return $note === '' ? null : $note;
    }

    private function optionalDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $date = DateTime::createFromFormat('!Y-m-d', (string) $value);
        if (!$date || $date->format('Y-m-d') !== $value) {
            throw new AppError('Tanggal kedaluwarsa tidak sesuai.');
        }
        return $value;
    }
}
