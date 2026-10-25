<?php
// CONTROLLER catatan keuangan, uang masuk / keluar (api/transactions.php). Model: tabel transactions.

class TransactionController
{
    private Table $transactions;

    public function __construct(Account $account)
    {
        $this->transactions = $account->table('transactions');
    }

    /** Catatan di antara dua tanggal (boleh kosong), urut tanggal lalu waktu dicatat. */
    public function index(string $from, string $to): array
    {
        $rows = array_filter($this->transactions->all(),
            fn ($t) => ($from === '' || $t['occurred_on'] >= $from) && ($to === '' || $t['occurred_on'] <= $to));
        return sortRows(array_values($rows), [['occurred_on', 'asc'], ['created_at', 'asc']]);
    }

    /** {"balance": 1500000}: saldo sebelum tanggal itu. */
    public function balance(string $before): array
    {
        $balance = 0;
        foreach ($this->transactions->all() as $t) {
            if ($t['occurred_on'] < $before) {
                $balance += $t['kind'] === 'masuk' ? $t['amount'] : -$t['amount'];
            }
        }
        return ['balance' => $balance];
    }

    public function store(array $input): array
    {
        return $this->transactions->insert($input);
    }

    public function update(string $id, array $changes): array
    {
        return $this->transactions->update($id, $changes);
    }

    public function destroy(string $id): array
    {
        $this->transactions->delete($id);
        return ['ok' => true];
    }
}
