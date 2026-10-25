<?php
// CONTROLLER halaman profil praktik (Week 7): menerima request, meminta object Practice ke Model,
// lalu meneruskan datanya ke View. Controller tidak berisi HTML, dan View tidak mengambil data sendiri.
class PracticeController
{
    private PracticeModel $model;

    public function __construct(PracticeModel $model)
    {
        $this->model = $model;
    }

    /** Request halaman: tanpa ?p= menampilkan contoh praktik, dengan ?p=<kode link> membuka praktik itu. */
    public function index(array $query): void
    {
        $slug = is_string($query['p'] ?? null) ? trim($query['p']) : '';
        $this->show($slug === '' ? null : $slug);
    }

    /** Ambil praktik dari Model, lalu tampilkan profilnya atau pesan kalau gagal/tidak ditemukan. */
    public function show(?string $slug): void
    {
        try {
            $practice = $slug === null ? $this->model->sample() : $this->model->findBySlug($slug);
        } catch (Throwable $exception) {
            error_log('[PracticeController] ' . $exception->getMessage());
            $this->showError(503, '⚠️', 'Data praktik tidak bisa dimuat. Periksa koneksi lalu coba lagi.', true);
            return;
        }
        if ($practice === null) {
            $this->showError(404, '🔍', 'Profil praktik tidak ditemukan. Minta link terbaru dari praktik.', false);
            return;
        }
        $this->render($this->process($practice, $slug === null));
    }

    /** Siapkan data untuk View (tanpa markup HTML). $practice null = halaman pesan error. */
    public function process(?Practice $practice, bool $isSample, ?array $error = null): array
    {
        return [
            'practice' => $practice,
            'profession' => $practice?->getProfession(),
            'schedule' => $practice?->getSchedule(),
            'services' => $practice?->getServices() ?? [],
            'isSample' => $isSample,
            'error' => $error,
            'today' => (int) date('w'),
            'generatedAt' => indonesianDateTime(time()),
            'pageTitle' => $practice?->getPageTitle() ?? 'Profil Praktik — NAKESA',
            'pageDescription' => $practice?->getPageDescription() ?? 'Jadwal praktik dan layanan tenaga kesehatan di NAKESA.',
        ];
    }

    private function showError(int $status, string $icon, string $message, bool $retry): void
    {
        http_response_code($status);
        $this->render($this->process(null, false, ['icon' => $icon, 'message' => $message, 'retry' => $retry]));
    }

    /** Kirim data ke View: setiap kunci array menjadi variabel di practice-page.php ($practice, $schedule, …). */
    private function render(array $data): void
    {
        extract($data, EXTR_SKIP);
        require __DIR__ . '/../View/practice-page.php';
    }
}
