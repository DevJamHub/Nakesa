<?php
// CLASS Schedule: jadwal praktik seminggu (Week 6 · OOP).
// Menggantikan groupHoursByDay(), todaySummary() dan shortTime() yang dulu ada di functions.php:
// data jadwal dan cara membacanya sekarang berada di satu tempat.

class Schedule
{
    /** Hari (0 = Minggu … 6 = Sabtu) → sesi praktik hari itu: [1 => ['08.00–12.00', '16.00–20.00'], …] */
    private array $sessionsByDay = [];

    /** $hours: daftar sesi dari database, [['day' => 1, 'opens' => '08:00', 'closes' => '12:00'], …] */
    public function __construct(array $hours)
    {
        foreach ($hours as $session) {
            $this->sessionsByDay[$session['day']][] = $this->shortTime($session['opens']) . '–' . $this->shortTime($session['closes']);
        }
    }

    public function isEmpty(): bool
    {
        return count($this->sessionsByDay) === 0;
    }

    public function isOpenOn(int $day): bool
    {
        return isset($this->sessionsByDay[$day]);
    }

    /** Sesi praktik pada satu hari, misalnya ['08.00–12.00', '16.00–20.00']. Kosong kalau hari itu tutup. */
    public function getSessions(int $day): array
    {
        return $this->sessionsByDay[$day] ?? [];
    }

    /** Kalimat singkat tentang jadwal hari ini, atau kapan praktik buka lagi. */
    public function getTodaySummary(int $today): string
    {
        if ($this->isEmpty()) {
            return 'Jadwal praktik belum diatur. Tanyakan langsung ke praktik.';
        }
        if ($this->isOpenOn($today)) {
            return 'Hari ini (' . DAYS[$today] . ') praktik pukul ' . implode(' & ', $this->getSessions($today)) . '.';
        }
        // Hari ini tutup: cari hari praktik berikutnya (besok, lusa, … sampai 6 hari lagi).
        for ($i = 1; $i <= 6; $i++) {
            $day = ($today + $i) % 7;
            if ($this->isOpenOn($day)) {
                $when = $i === 1 ? 'besok (' . DAYS[$day] . ')' : 'hari ' . DAYS[$day];
                $opens = explode('–', $this->getSessions($day)[0])[0];
                return "Hari ini tutup. Buka lagi $when mulai pukul $opens.";
            }
        }
        return 'Hari ini tutup.';
    }

    /** "08:00" → "08.00" (penulisan jam di Indonesia). Private: hanya dipakai di dalam class ini. */
    private function shortTime(string $time): string
    {
        return str_replace(':', '.', substr($time, 0, 5));
    }
}
