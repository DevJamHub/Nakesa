<?php
// CLASS JsonStore: satu "tabel" disimpan sebagai satu file JSON, misalnya data/akun-…/patients.json.
// Ini pengganti database. Semua class lain membaca dan menulis data lewat class ini.
//
// Di luar materi Week 1–6: membaca/menulis file (fopen, flock, rename) dan json_encode/json_decode.
// - Menulis ke file sementara lalu rename(): kalau server mati di tengah penyimpanan, file lama tetap utuh.
// - flock() pada file .lock: dua orang yang menyimpan bersamaan tidak saling menimpa.

class JsonStore
{
    private string $file;     // data/[<folder>/]<nama>.json
    private string $seedFile; // app/data/contoh/[<folder>/]<nama>.json

    /** $folder: folder milik satu akun ("akun-…"); kosong untuk data bersama seperti users.json. */
    public function __construct(string $name, string $folder = '')
    {
        $path = $folder === '' ? $name : "$folder/$name";
        $this->file = DATA_DIR . "/$path.json";
        $this->seedFile = SEED_DIR . "/$path.json";
    }

    /** Semua baris di file. */
    public function read(): array
    {
        $this->ensureFile();
        $json = file_get_contents($this->file);
        return $json === '' ? [] : json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    }

    /**
     * Baca → ubah → tulis di dalam satu kunci. $change menerima semua baris dan mengembalikan baris yang baru.
     * Nilai yang diisi ke $result (parameter kedua) dikembalikan oleh method ini.
     */
    public function change(callable $change): mixed
    {
        $this->ensureFile();
        $lock = fopen($this->file . '.lock', 'c');
        flock($lock, LOCK_EX);
        try {
            $result = null;
            $rows = $change($this->read(), $result);
            $this->write($rows);
            return $result;
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    private function write(array $rows): void
    {
        $temp = $this->file . '.' . bin2hex(random_bytes(4)) . '.tmp';
        file_put_contents($temp, json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        rename($temp, $this->file);
    }

    /** Saat pertama kali dibuka, salin data contoh dari app/data/contoh/ (kalau ada) ke data/. */
    private function ensureFile(): void
    {
        if (is_file($this->file)) {
            return;
        }
        if (!is_dir(dirname($this->file))) {
            mkdir(dirname($this->file), 0775, true);
        }
        $seed = is_file($this->seedFile)
            ? json_decode(file_get_contents($this->seedFile), true, 512, JSON_THROW_ON_ERROR)
            : [];
        $temp = $this->file . '.' . bin2hex(random_bytes(4)) . '.tmp';
        file_put_contents($temp, json_encode($this->resolveDates($seed), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        if (!is_file($this->file)) {
            rename($temp, $this->file);
        } else {
            unlink($temp); // request lain sudah lebih dulu membuatnya
        }
    }

    /**
     * Data contoh memakai tanggal relatif supaya selalu terlihat baru: "hari+1" = besok,
     * "hari-3 09:15" = tiga hari lalu jam 09.15 (jadi format ISO lengkap dengan zona waktu).
     */
    private function resolveDates(mixed $value): mixed
    {
        if (is_array($value)) {
            return array_map(fn ($item) => $this->resolveDates($item), $value);
        }
        if (is_string($value) && preg_match('/^hari([+-]\d+)?(?: (\d{2}:\d{2}))?$/', $value, $match)) {
            $date = todayISO((int) ($match[1] ?? 0));
            return isset($match[2]) ? date('c', strtotime("$date {$match[2]}:00")) : $date;
        }
        return $value;
    }
}
