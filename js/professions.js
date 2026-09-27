// Per-profession label, title, icon, colour and services.
// The colour tints the whole app; services fill the booking and finance choices.
export const PROFESSIONS = {
  bidan: {
    label: 'Bidan', title: 'Bidan', icon: '🤰', color: '#b8456e',
    services: ['Periksa Kehamilan', 'KB', 'Imunisasi Anak', 'Periksa Bayi & Balita', 'Persalinan', 'Nifas', 'Konsultasi'],
  },
  dokter_umum: {
    label: 'Dokter Umum', title: 'dr.', icon: '🩺', color: '#236f9f',
    services: ['Konsultasi Umum', 'Cek Kesehatan', 'Surat Keterangan Sehat', 'Rawat Luka', 'Suntik / Injeksi'],
  },
  dokter_gigi: {
    label: 'Dokter Gigi', title: 'drg.', icon: '🦷', color: '#12839a',
    services: ['Periksa Gigi', 'Tambal Gigi', 'Cabut Gigi', 'Scaling', 'Konsultasi'],
  },
  dokter_spesialis: {
    label: 'Dokter Spesialis', title: 'dr.', icon: '👨‍⚕️', color: '#4c5fd5',
    specialtyLabel: 'Spesialis apa?', specialtyHint: 'Misal: Anak, Kandungan, Penyakit Dalam',
    services: ['Konsultasi', 'Kontrol', 'Tindakan'],
  },
  perawat: {
    label: 'Perawat', title: 'Ns.', icon: '💉', color: '#1f8a6a',
    services: ['Rawat Luka', 'Suntik / Injeksi', 'Cek Tensi & Gula Darah', 'Home Care', 'Pasang Infus'],
  },
  fisioterapis: {
    label: 'Fisioterapis', title: '', icon: '🦴', color: '#b8661a',
    services: ['Terapi', 'Konsultasi', 'Home Visit'],
  },
  psikolog: {
    label: 'Psikolog', title: '', icon: '🧠', color: '#7159c0',
    services: ['Konseling', 'Asesmen', 'Konsultasi Online'],
  },
  ahli_gizi: {
    label: 'Ahli Gizi', title: '', icon: '🥗', color: '#4a8a2a',
    services: ['Konsultasi Gizi', 'Program Diet', 'Kontrol Berat Badan'],
  },
  lainnya: {
    label: 'Lainnya', title: '', icon: '➕', color: '#236f9f',
    specialtyLabel: 'Profesi Anda', specialtyHint: 'Misal: Apoteker, Terapis Wicara',
    services: ['Konsultasi', 'Pemeriksaan', 'Tindakan'],
  },
};

export const professionOf = (key) => PROFESSIONS[key] ?? PROFESSIONS.lainnya;

/** "Bidan Siti", "dr. Andi" — skips the title when the name already starts with it. */
export function titledName(fullName, professionKey) {
  const { title } = professionOf(professionKey);
  if (!title || fullName.toLowerCase().startsWith(title.toLowerCase())) return fullName;
  return `${title} ${fullName}`;
}

/** Money categories: the profession's services for income, common costs for expenses. */
export function financeCategories(professionKey, kind) {
  if (kind === 'masuk') return [...professionOf(professionKey).services, 'Penjualan Obat', 'Lainnya'];
  return ['Beli Obat', 'Alat & Bahan', 'Listrik & Air', 'Sewa Tempat', 'Gaji', 'Transport', 'Lainnya'];
}
