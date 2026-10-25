<?php
// CLASS Practice: satu praktik nakes, seperti class President di slide Week 6 (OOP).
// Week 7: bagian dari MODEL halaman profil praktik (dibuat oleh PracticeModel, ditampilkan oleh View).
// Property menyimpan data praktik dan dibuat private, jadi hanya bisa diisi oleh constructor.
// Method menyiapkan data itu untuk halaman: nama bergelar, status, layanan, link booking & WhatsApp.

class Practice
{
    private ?string $slug;          // kode link booking; null untuk contoh praktik
    private string $name;
    private string $practitioner;   // nama nakes tanpa gelar
    private ?string $specialty;
    private ?string $address;
    private ?string $phone;
    private bool $isOpen;
    private bool $bookingEnabled;
    private Profession $profession; // object di dalam object
    private Schedule $schedule;

    /**
     * $data: bentuknya sama dengan jawaban PublicPractice::find() (dan $samplePractice di data.php).
     * $slug: kode link booking praktik ini, kosongkan untuk contoh praktik.
     */
    public function __construct(array $data, ?string $slug = null)
    {
        $this->slug = $slug;
        $this->name = $data['name'];
        $this->practitioner = $data['practitioner'] ?? '';
        $this->specialty = $data['specialty'];
        $this->address = $data['address'];
        $this->phone = $data['phone'];
        $this->isOpen = $data['is_open'];
        $this->bookingEnabled = $data['booking_enabled'];
        $this->profession = Profession::find($data['profession']);
        $this->schedule = new Schedule($data['hours']);
    }

    public function getName(): string
    {
        return $this->name;
    }

    /** Nama nakes dengan gelar profesinya: "Bidan Siti Aminah", "dr. Andi". */
    public function getPractitioner(): string
    {
        return $this->profession->titledName($this->practitioner);
    }

    /** "Bidan", atau "Dokter Spesialis Anak" kalau spesialisasinya diisi. */
    public function getProfessionLabel(): string
    {
        return $this->specialty ? "{$this->profession->getLabel()} $this->specialty" : $this->profession->getLabel();
    }

    /** "Bidan Siti Aminah · Bidan" (nama nakes bisa saja kosong). */
    public function getSubtitle(): string
    {
        return implode(' · ', array_filter([$this->getPractitioner(), $this->getProfessionLabel()]));
    }

    public function getAddress(): ?string
    {
        return $this->address;
    }

    public function getProfession(): Profession
    {
        return $this->profession;
    }

    public function getSchedule(): Schedule
    {
        return $this->schedule;
    }

    /** Layanan yang bisa dipilih pasien (seperti getPrograms() di slide). */
    public function getServices(): array
    {
        return $this->profession->getServices();
    }

    public function isOpen(): bool
    {
        return $this->isOpen;
    }

    /** Label untuk tombol "Buka / tutup" yang diatur nakes di NAKESA. */
    public function getOpenLabel(): string
    {
        if ($this->isOpen) {
            return 'Sedang buka';
        }
        return 'Sedang tutup';
    }

    public function isBookingEnabled(): bool
    {
        return $this->bookingEnabled;
    }

    /** Link ke halaman booking (dilihat dari halaman di folder php/). Contoh praktik tidak punya link. */
    public function getBookingUrl(): ?string
    {
        return $this->slug === null ? null : '../html/book.html?p=' . rawurlencode($this->slug);
    }

    /** Link chat WhatsApp ke praktik, atau null kalau praktik tidak mengisi nomor. */
    public function getChatUrl(): ?string
    {
        return $this->phone ? waLink($this->phone, "Halo $this->name, saya ingin bertanya.") : null;
    }

    /** Judul untuk tab browser dan pratinjau link saat dibagikan di WhatsApp. */
    public function getPageTitle(): string
    {
        return "$this->name · Jadwal & Layanan";
    }

    public function getPageDescription(): string
    {
        return implode(' · ', array_filter([$this->getSubtitle(), $this->address]))
            . '. Lihat jadwal praktik dan buat janji periksa online.';
    }
}
