<?php
// MODEL halaman profil praktik (Week 7): tempat Controller meminta data praktik.
// Data praktik asli diambil dari server NAKESA sendiri (class PublicPractice di app/Model, yang juga
// dipakai api/public.php untuk halaman booking); contoh praktik diambil dari $samplePractice di data.php.
// Hasilnya selalu object Practice (Week 6), bukan array, jadi View cukup memanggil method-nya.
// (Menggantikan class PracticeRepository di Week 6.)

class PracticeModel
{
    private PublicPractice $source;
    private array $sampleData;

    public function __construct(PublicPractice $source, array $sampleData)
    {
        $this->source = $source;
        $this->sampleData = $sampleData;
    }

    /** Contoh praktik, untuk halaman yang dibuka tanpa ?p=. */
    public function sample(): Practice
    {
        return new Practice($this->sampleData);
    }

    /** Praktik dengan kode link booking ini, atau null kalau tidak ditemukan. */
    public function findBySlug(string $slug): ?Practice
    {
        // Data yang sama dengan halaman booking (book.html): hanya yang boleh dilihat pasien.
        $data = $this->source->find($slug);
        return $data === null ? null : new Practice($data, $slug);
    }
}
