<?php
// CLASS Table: satu tabel milik satu akun (misalnya pasien praktik Bidan Siti).
// Membaca, menambah, mengubah, dan menghapus baris, sambil memeriksa isian sesuai aturan di app/schema.php.
// Ini yang dulu dikerjakan Supabase (insert/update/delete + CHECK constraint).

class Table
{
    private JsonStore $store;
    private array $columns; // aturan per kolom dari SCHEMA
    private bool $timestamps;
    private ?string $unique;
    private array $fixed;   // kolom yang selalu diisi server, misalnya ['owner_id' => …]

    public function __construct(string $name, string $folder, array $fixed = [])
    {
        $this->store = new JsonStore($name, $folder);
        $this->columns = SCHEMA[$name]['columns'];
        $this->timestamps = SCHEMA[$name]['timestamps'];
        $this->unique = SCHEMA[$name]['unique'] ?? null;
        $this->fixed = $fixed;
    }

    public function all(): array
    {
        return $this->store->read();
    }

    public function find(string $id): ?array
    {
        foreach ($this->all() as $row) {
            if ($row['id'] === $id) {
                return $row;
            }
        }
        return null;
    }

    /** Baris yang cocok dengan $filter (fungsi yang mengembalikan true/false). */
    public function where(callable $filter): array
    {
        return array_values(array_filter($this->all(), $filter));
    }

    /** Tambah satu baris. id, created_at, dan kolom yang belum diisi memakai nilai awalnya. */
    public function insert(array $input): array
    {
        return $this->insertMany([$input])[0];
    }

    /** Tambah beberapa baris sekaligus (semua atau tidak sama sekali). */
    public function insertMany(array $inputs): array
    {
        $rows = array_map(fn ($input) => $this->newRow($input), $inputs);
        $this->store->change(function (array $all) use ($rows) {
            foreach ($rows as $row) {
                $this->checkUnique($all, $row);
                $all[] = $row;
            }
            return $all;
        });
        return $rows;
    }

    /** Ubah sebagian kolom satu baris. Kolom yang tidak dikirim tidak berubah. */
    public function update(string $id, array $changes): array
    {
        $clean = $this->validate($changes, true);
        return $this->store->change(function (array $all, &$saved) use ($id, $clean) {
            foreach ($all as $i => $row) {
                if ($row['id'] === $id) {
                    $saved = array_merge($row, $clean);
                    if ($this->timestamps) {
                        $saved['updated_at'] = nowISO();
                    }
                    $this->checkUnique($all, $saved);
                    $all[$i] = $saved;
                    return $all;
                }
            }
            throw new AppError('Data tidak ditemukan.', 404);
        });
    }

    public function delete(string $id): void
    {
        $this->store->change(function (array $all) use ($id) {
            $kept = array_values(array_filter($all, fn ($row) => $row['id'] !== $id));
            if (count($kept) === count($all)) {
                throw new AppError('Data tidak ditemukan.', 404);
            }
            return $kept;
        });
    }

    /** Hapus semua baris yang cocok dengan $filter. */
    public function deleteWhere(callable $filter): void
    {
        $this->store->change(fn (array $all) => array_values(array_filter($all, fn ($row) => !$filter($row))));
    }

    /** Untuk fungsi stok/resep: ubah isi tabel langsung (tanpa aturan kolom). */
    public function change(callable $change): mixed
    {
        return $this->store->change($change);
    }

    /** Baris baru yang sudah diperiksa, lengkap dengan id, nilai awal, dan waktu dibuat. */
    public function newRow(array $input): array
    {
        $row = ['id' => uuid()] + $this->fixed;
        foreach ($this->columns as $column => $rule) {
            $default = $rule['default'] ?? null;
            $row[$column] = $default === 'today' ? todayISO() : $default;
        }
        $row = array_merge($row, $this->validate($input + array_filter($row, fn ($v) => $v !== null), false));
        $row['created_at'] = nowISO();
        if ($this->timestamps) {
            $row['updated_at'] = $row['created_at'];
        }
        return $row;
    }

    /**
     * Periksa isian. $partial = true untuk update: hanya kolom yang dikirim yang diperiksa.
     * Kolom yang tidak dikenal diabaikan, jadi browser tidak bisa mengubah id, owner_id, created_at, dll.
     */
    public function validate(array $input, bool $partial): array
    {
        $clean = [];
        foreach ($this->columns as $column => $rule) {
            if ($partial && !array_key_exists($column, $input)) {
                continue;
            }
            $clean[$column] = $this->cleanValue($input[$column] ?? null, $rule);
        }
        return $clean;
    }

    private function cleanValue(mixed $value, array $rule): mixed
    {
        $label = $rule['label'] ?? null;
        if (is_string($value)) {
            $value = trim($value);
        }
        if ($value === null || $value === '') {
            if (!empty($rule['required'])) {
                throw new AppError(($label ?? 'Isian') . ' wajib diisi.');
            }
            return $rule['type'] === 'bool' ? false : null;
        }
        $invalid = fn () => new AppError($label ? "$label tidak sesuai. Periksa kembali." : 'Ada isian yang tidak sesuai. Periksa kembali.');

        switch ($rule['type']) {
            case 'text':
                if (!is_string($value) && !is_int($value) && !is_float($value)) {
                    throw $invalid();
                }
                $value = (string) $value;
                if (mb_strlen($value) > $rule['max']) {
                    throw new AppError(($label ?? 'Isian') . " paling panjang {$rule['max']} huruf.");
                }
                return $value;
            case 'int':
                if (!is_int($value) && !(is_string($value) && preg_match('/^-?\d+$/', $value))) {
                    throw $invalid();
                }
                $value = (int) $value;
                if ($value < $rule['min'] || $value > $rule['max']) {
                    throw $invalid();
                }
                return $value;
            case 'number':
                if (!is_numeric($value) || $value < $rule['min'] || $value > $rule['max']) {
                    throw $invalid();
                }
                return round((float) $value, 6);
            case 'bool':
                if (!is_bool($value)) {
                    throw $invalid();
                }
                return $value;
            case 'date':
                $date = is_string($value) ? DateTime::createFromFormat('!Y-m-d', $value) : false;
                if (!$date || $date->format('Y-m-d') !== $value) {
                    throw $invalid();
                }
                return $value;
            case 'time':
                if (!is_string($value) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $value)) {
                    throw $invalid();
                }
                return strlen($value) === 5 ? "$value:00" : $value;
            case 'enum':
                if (!in_array($value, $rule['values'], true)) {
                    throw $invalid();
                }
                return $value;
            case 'ref':
                if (!is_string($value) || strlen($value) > 64) {
                    throw $invalid();
                }
                return $value;
        }
        throw $invalid();
    }

    private function checkUnique(array $all, array $row): void
    {
        if ($this->unique === null) {
            return;
        }
        foreach ($all as $other) {
            if ($other['id'] !== $row['id'] && $other[$this->unique] === $row[$this->unique]) {
                throw new AppError('Data yang sama sudah ada.', 409);
            }
        }
    }
}
