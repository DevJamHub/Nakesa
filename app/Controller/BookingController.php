<?php
// CONTROLLER booking pasien (api/bookings.php). Model: tabel bookings milik akun yang login.
// $date adalah "hari ini" menurut browser (YYYY-MM-DD).

class BookingController
{
    private const BY_TIME = [['booking_date', 'asc'], ['booking_time', 'asc']];

    private Table $bookings;

    public function __construct(Account $account)
    {
        $this->bookings = $account->table('bookings');
    }

    /** Semua booking, urut tanggal dan jam. */
    public function index(): array
    {
        return sortRows($this->bookings->all(), self::BY_TIME);
    }

    /** Booking hari itu (selain yang batal), urut jam. */
    public function today(string $date): array
    {
        return sortRows($this->bookings->where(fn ($b) => $b['booking_date'] === $date && $b['status'] !== 'batal'), self::BY_TIME);
    }

    /** {"count": 2}: booking baru yang menunggu konfirmasi (angka merah di menu). */
    public function pendingCount(string $date): array
    {
        return ['count' => count($this->bookings->where(fn ($b) => $b['status'] === 'baru' && $b['booking_date'] >= $date))];
    }

    /** Booking yang akan datang dan belum selesai/batal. */
    public function upcoming(string $date): array
    {
        return sortRows($this->bookings->where(fn ($b) => $b['booking_date'] >= $date
            && in_array($b['status'], ['baru', 'dikonfirmasi'], true)), self::BY_TIME);
    }

    /** 100 booking yang sudah lewat, selesai, atau batal. */
    public function history(string $date): array
    {
        $past = $this->bookings->where(fn ($b) => $b['booking_date'] < $date || in_array($b['status'], ['selesai', 'batal'], true));
        return array_slice(sortRows($past, [['booking_date', 'desc']]), 0, 100);
    }

    /** 10 kunjungan terakhir seorang pasien (dicocokkan dari nama atau nomor HP). */
    public function patientVisits(string $name, string $phone): array
    {
        $visits = $this->bookings->where(fn ($b) => strcasecmp($b['patient_name'], $name) === 0 || ($phone !== '' && $b['patient_phone'] === $phone));
        return array_slice(sortRows($visits, [['booking_date', 'desc']]), 0, 10);
    }

    public function store(array $input): array
    {
        return $this->bookings->insert($input);
    }

    /** Misalnya {"status": "dikonfirmasi"} saat tombol ✓ Konfirmasi ditekan. */
    public function update(string $id, array $changes): array
    {
        return $this->bookings->update($id, $changes);
    }
}
