<?php
// CLASS PublicPractice: bagian praktik yang boleh dilihat pasien tanpa login, dicari lewat kode link
// booking (book.html?p=… dan php/praktik.php?p=…). Pengganti fungsi get_public_practice dan
// create_booking di database lama: hanya kolom untuk pasien yang dikeluarkan.

class PublicPractice
{
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
        ];
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
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || $date < todayISO() || $date > todayISO(BOOKING_DAYS_AHEAD)) {
            throw new AppError('Pilih tanggal antara hari ini dan ' . BOOKING_DAYS_AHEAD . ' hari ke depan.');
        }
        $hours = $account->table('practice_hours')->all();
        $day = (int) date('w', strtotime($date));
        if ($hours && !array_filter($hours, fn ($h) => $h['day_of_week'] === $day)) {
            throw new AppError('Praktik tutup pada hari yang dipilih.');
        }

        return $account->transaction(function () use ($account, $name, $phone, $date, $input) {
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
                'booking_time' => $input['p_time'] ?? null,
                'service' => $input['p_service'] ?? null,
                'complaint' => $input['p_complaint'] ?? null,
                'status' => 'baru',
                'source' => 'online',
            ])['id'];
        });
    }
}
