<?php
// CLASS PublicPractice: bagian praktik yang boleh dilihat pasien tanpa login, dicari lewat kode link
// booking (book.html?p=… dan php/praktik.php?p=…). Pengganti fungsi get_public_practice,
// get_public_slots dan create_booking di database lama: hanya kolom untuk pasien yang dikeluarkan.
//
// Jam booking dibagi per 30 menit dari jam buka setiap sesi (sama dengan js/booking-slots.js). Sebuah jam
// bisa dipesan kalau belum lewat (WIB) dan tidak bertabrakan dengan booking lain yang masih aktif.

class PublicPractice
{
    public const SLOT_MINUTES = 30;

    private UserRepository $users;

    public function __construct(UserRepository $users)
    {
        $this->users = $users;
    }

    /** Akun pemilik praktik dengan kode link ini, atau null. */
    private function findAccount(string $slug): ?Account
    {
        if (!preg_match('/^[a-z0-9-]{4,40}$/', $slug)) {
            return null;
        }
        foreach ($this->users->all() as $user) {
            $account = new Account($user);
            if (($account->practice()['booking_slug'] ?? null) === $slug) {
                return $account;
            }
        }
        return null;
    }

    /** Profil praktik untuk pasien (bentuk sama dengan get_public_practice), atau null. */
    public function find(string $slug): ?array
    {
        $account = $this->findAccount($slug);
        if ($account === null) {
            return null;
        }
        $practice = $account->practice();
        $hours = sortRows($account->table('practice_hours')->all(), [['day_of_week', 'asc'], ['opens_at', 'asc']]);
        return [
            'name' => $practice['name'],
            'practitioner' => $account->getUser()->getFullName(),
            'profession' => $account->getUser()->getProfession(),
            'specialty' => $practice['specialty'],
            'address' => $practice['address'],
            'phone' => $practice['phone'],
            'is_open' => $practice['is_open'],
            'booking_enabled' => $practice['booking_enabled'],
            'hours' => array_map(fn ($h) => [
                'day' => $h['day_of_week'],
                'opens' => substr($h['opens_at'], 0, 5),
                'closes' => substr($h['closes_at'], 0, 5),
            ], $hours),
            // Layanan aktif dari menu "Layanan & Harga". Kosong → halaman memakai layanan standar profesi.
            'services' => array_map(fn ($s) => [
                'name' => $s['name'],
                'price' => $s['price'],
                'duration_minutes' => $s['duration_minutes'],
            ], sortRows($account->table('practice_services')->where(fn ($s) => $s['is_active']), [['sort_order', 'asc'], ['name', 'asc']])),
        ];
    }

    /**
     * Jam booking satu tanggal: [['start' => '08:00', 'end' => '08:30', 'available' => true], …].
     * Kosong kalau link tidak dikenal, booking online ditutup, tanggal di luar hari ini … 60 hari, atau praktik tutup.
     */
    public function slots(string $slug, string $date): array
    {
        $account = $this->findAccount($slug);
        if ($account === null || !$account->practice()['booking_enabled'] || !$this->isBookableDate($date)) {
            return [];
        }
        return $this->slotsOn($account, $date);
    }

    private function isBookableDate(string $date): bool
    {
        return (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) && $date >= todayISO() && $date <= todayISO(BOOKING_DAYS_AHEAD);
    }

    /** "08:30" → 510 (menit sejak tengah malam). */
    private function minutes(string $time): int
    {
        return (int) substr($time, 0, 2) * 60 + (int) substr($time, 3, 2);
    }

    private function slotsOn(Account $account, string $date): array
    {
        $day = (int) date('w', strtotime($date));
        $now = $date === todayISO() ? $this->minutes(date('H:i')) : -1;
        // Booking yang masih aktif di tanggal itu, masing-masing dianggap 30 menit.
        $taken = array_map(fn ($b) => $this->minutes($b['booking_time']), $account->table('bookings')->where(
            fn ($b) => $b['booking_date'] === $date && $b['booking_time'] !== null && in_array($b['status'], ['baru', 'dikonfirmasi'], true)));
        $slots = [];
        foreach ($account->table('practice_hours')->where(fn ($h) => $h['day_of_week'] === $day) as $session) {
            $closes = $this->minutes($session['closes_at']);
            for ($t = $this->minutes($session['opens_at']); $t + self::SLOT_MINUTES <= $closes; $t += self::SLOT_MINUTES) {
                $overlaps = array_filter($taken, fn ($b) => $b < $t + self::SLOT_MINUTES && $b + self::SLOT_MINUTES > $t);
                $slots[$t] = [
                    'start' => sprintf('%02d:%02d', intdiv($t, 60), $t % 60),
                    'end' => sprintf('%02d:%02d', intdiv($t + self::SLOT_MINUTES, 60), ($t + self::SLOT_MINUTES) % 60),
                    'available' => $t > $now && count($overlaps) === 0,
                ];
            }
        }
        ksort($slots);
        return array_values($slots);
    }

    /** Booking dari pasien (create_booking). Pesan error ditampilkan apa adanya ke pasien. */
    public function book(string $slug, array $input): string
    {
        $account = $this->findAccount($slug) ?? throw new AppError('Praktik tidak ditemukan.', 404);
        if (!$account->practice()['booking_enabled']) {
            throw new AppError('Booking online sedang ditutup. Silakan hubungi praktik langsung.');
        }
        $name = trim((string) ($input['p_name'] ?? ''));
        $phone = trim((string) ($input['p_phone'] ?? ''));
        if ($name === '' || $phone === '') {
            throw new AppError('Nama dan nomor WhatsApp wajib diisi.');
        }
        $date = (string) ($input['p_date'] ?? '');
        if (!$this->isBookableDate($date)) {
            throw new AppError('Pilih tanggal antara hari ini dan ' . BOOKING_DAYS_AHEAD . ' hari ke depan.');
        }
        $hours = $account->table('practice_hours')->all();
        $day = (int) date('w', strtotime($date));
        $sessions = array_filter($hours, fn ($h) => $h['day_of_week'] === $day);
        if ($hours && !$sessions) {
            throw new AppError('Praktik tutup pada hari yang dipilih.');
        }
        $now = date('H:i');
        if ($hours && $date === todayISO() && !array_filter($sessions, fn ($h) => substr($h['closes_at'], 0, 5) > $now)) {
            throw new AppError('Jam praktik hari ini sudah selesai. Pilih hari lain.');
        }
        $time = $input['p_time'] ?? null;
        if ($time !== null && (!is_string($time) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d(:00)?$/', $time))) {
            throw new AppError('Jam tidak sesuai. Periksa kembali.');
        }
        $time = $time === null ? null : substr($time, 0, 5);
        if ($time !== null && $date === todayISO() && $time <= $now) {
            throw new AppError('Jam yang dipilih sudah lewat. Pilih jam lain.');
        }

        return $account->transaction(function () use ($account, $name, $phone, $date, $time, $hours, $input) {
            // Di dalam transaction (kunci folder akun), supaya dua pasien tidak mendapat jam yang sama.
            if ($time !== null && $hours) {
                $slot = array_values(array_filter($this->slotsOn($account, $date), fn ($s) => $s['start'] === $time))[0] ?? null;
                if ($slot === null) {
                    throw new AppError('Jam yang dipilih di luar jam praktik. Pilih jam lain.');
                }
                if (!$slot['available']) {
                    throw new AppError('Jam ini sudah dipesan pasien lain. Pilih jam lain.', 409, 'slot_taken');
                }
            }
            $bookings = $account->table('bookings');
            // Penahan spam sederhana: paling banyak 3 booking per nomor dalam sehari.
            $dayAgo = time() - 86400;
            $recent = $bookings->where(fn ($b) => $b['patient_phone'] === $phone && strtotime($b['created_at']) > $dayAgo);
            if (count($recent) >= MAX_BOOKINGS_PER_PHONE) {
                throw new AppError('Terlalu banyak booking dari nomor ini. Silakan hubungi praktik langsung.', 429);
            }
            return $bookings->insert([
                'patient_name' => $name,
                'patient_phone' => $phone,
                'booking_date' => $date,
                'booking_time' => $time,
                'service' => $input['p_service'] ?? null,
                'complaint' => $input['p_complaint'] ?? null,
                'status' => 'baru',
                'source' => 'online',
            ])['id'];
        });
    }
}
