<?php
// CLASS PracticeRepository: mengambil data praktik dari Supabase lalu menjadikannya object Practice (Week 6 · OOP).
// Menggantikan fungsi fetchPractice() yang dulu ada di functions.php. Alamat dan key Supabase diberikan lewat
// constructor dan disimpan private, jadi halaman cukup memanggil findBySlug() tanpa mengurus cURL.

class PracticeRepository
{
    private string $url;
    private string $key;

    public function __construct(string $url, string $key)
    {
        $this->url = $url;
        $this->key = $key;
    }

    /**
     * Profil publik sebuah praktik. Yang memanggil Supabase adalah SERVER (PHP), bukan browser.
     * Mengembalikan object Practice, atau null kalau slug tidak ditemukan. Melempar RuntimeException kalau gagal.
     */
    public function findBySlug(string $slug): ?Practice
    {
        // Fungsi database yang sama dengan halaman booking (book.html): hanya data yang boleh dilihat pasien.
        $request = curl_init($this->url . '/rest/v1/rpc/get_public_practice');
        curl_setopt_array($request, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['apikey: ' . $this->key, 'Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode(['p_slug' => $slug]),
            CURLOPT_RETURNTRANSFER => true, // jawaban disimpan ke variabel, bukan langsung dicetak
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10, // jangan biarkan halaman menunggu selamanya
        ]);
        $body = curl_exec($request);
        $status = curl_getinfo($request, CURLINFO_RESPONSE_CODE);

        if ($body === false) {
            throw new RuntimeException('Supabase tidak bisa dihubungi: ' . curl_error($request));
        }
        if ($status !== 200) {
            throw new RuntimeException("Supabase menjawab HTTP $status");
        }
        // JSON → array PHP → object Practice. Slug yang tidak ada dijawab dengan null.
        $data = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
        return is_array($data) ? new Practice($data, $slug) : null;
    }
}
