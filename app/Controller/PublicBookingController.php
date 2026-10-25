<?php
// CONTROLLER untuk pasien, tanpa login: halaman html/book.html?p=… (api/public.php). Model: PublicPractice.

class PublicBookingController
{
    private PublicPractice $practices;

    public function __construct(PublicPractice $practices)
    {
        $this->practices = $practices;
    }

    /** Profil praktik untuk pasien {name, practitioner, profession, …, hours}, atau null. */
    public function profile(string $slug): ?array
    {
        return $this->practices->find($slug);
    }

    /** Jam booking satu tanggal: [{start, end, available}, …] (jam yang sudah dipesan/lewat: available false). */
    public function slots(string $slug, string $date): array
    {
        return $this->practices->slots($slug, $date);
    }

    /** Booking baru dari pasien: {p_name, p_phone, p_date, p_time, p_service, p_complaint} → {"id": …} */
    public function book(string $slug, array $input): array
    {
        return ['id' => $this->practices->book($slug, $input)];
    }
}
