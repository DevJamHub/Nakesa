<?php
// CLASS Profession: satu profesi nakes (Week 6 · OOP).
// Datanya tetap dari PROFESSIONS di data.php. Class ini membungkusnya menjadi object, dan
// menggantikan fungsi professionOf() + titledName() yang dulu ada di functions.php.

class Profession
{
    private string $label;    // "Bidan", "Dokter Gigi", …
    private string $title;    // gelar di depan nama: "Bidan", "dr.", "drg.", "Ns." atau kosong
    private string $icon;
    private array $services;  // layanan bawaan profesi ini

    public function __construct(string $label, string $title, string $icon, array $services)
    {
        $this->label = $label;
        $this->title = $title;
        $this->icon = $icon;
        $this->services = $services;
    }

    /** Object Profession untuk kunci profesi di database ('bidan', 'dokter_gigi', …). Yang tidak dikenal dianggap "lainnya". */
    public static function find(?string $key): Profession
    {
        $data = PROFESSIONS[$key ?? 'lainnya'] ?? PROFESSIONS['lainnya'];
        return new Profession($data['label'], $data['title'], $data['icon'], $data['services']);
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function getIcon(): string
    {
        return $this->icon;
    }

    public function getServices(): array
    {
        return $this->services;
    }

    /** "Siti Aminah" → "Bidan Siti Aminah". Gelar tidak ditulis dua kali. */
    public function titledName(string $fullName): string
    {
        if ($fullName === '' || $this->title === '' || str_starts_with(strtolower($fullName), strtolower($this->title))) {
            return $fullName;
        }
        return "$this->title $fullName";
    }
}
