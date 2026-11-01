import { ReferenceItem } from '../types';

export const DEFAULT_REFERENCES: ReferenceItem[] = [
  {
    id: 'ref-1',
    title: 'Hook 3 Detik Kontroversial & Pacing Cepat',
    mediaType: 'url',
    url: 'https://www.tiktok.com/@clipmaster/video/7381928371',
    platform: 'tiktok',
    category: 'Hook & Pacing',
    notes: '• Potong jeda nafas pembicara 100% (zero silence).\n• Detik 0-2: Mulai dengan statement kontroversial atau pertanyaan retoris.\n• Subtitle: 1-2 kata per baris, warna kuning neon (#FACC15) + shadow hitam tebal.\n• Sound effect: "whoosh" tiap transisi zoom-in.',
    createdAt: 'Baru saja'
  },
  {
    id: 'ref-2',
    title: 'Palet & Kontras Visual Neon (Moodboard)',
    mediaType: 'image',
    fileData: {
      name: 'aesthetic_neon_cyberpunk.png',
      size: '2.4 MB',
      type: 'image/png',
      previewUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600'
    },
    category: 'Visual & Palet Warna',
    notes: '• Tiru grading warna kontras tinggi: tone shadow kebiruan & highlight warm amber.\n• Gunakan kartu teks berbingkai tipis semi-transparan dengan glow halus.\n• Cocok untuk video ringkasan teknologi & startup futuristik.',
    createdAt: 'Kemarin'
  },
  {
    id: 'ref-3',
    title: 'Transisi Punchline & Talking Head 9:16',
    mediaType: 'video',
    fileData: {
      name: 'dynamic_punchline_cut.mp4',
      size: '14.8 MB',
      type: 'video/mp4'
    },
    category: 'Komposisi 9:16',
    notes: '• Komposisi 9:16 vertikal: Wajah subjek selalu berada di 35% tinggi layar atas.\n• Auto-zoom 1.18x setiap kali punchline atau poin penting diucapkan.\n• Tambahkan sound effect pop kecil saat teks statis muncul.',
    createdAt: '2 hari lalu'
  },
  {
    id: 'ref-4',
    title: 'Formula Script Hook & Story Arc 60 Detik',
    mediaType: 'document',
    fileData: {
      name: 'formula_retensi_60s.pdf',
      size: '420 KB',
      type: 'application/pdf'
    },
    category: 'Struktur Retensi',
    notes: '• 0-3s: Hook provokatif (Problem).\n• 3-20s: Eskalasi rasa ingin tahu (Agitation).\n• 20-50s: Pemaparan inti solusi secara terstruktur (Solution).\n• 50-60s: Call-to-Action cepat tanpa basa-basi (Payoff).',
    createdAt: '3 hari lalu'
  }
];

export const STORAGE_KEY_REFERENCES = 'clipa_reference_vault_v2';

export function getStoredReferences(): ReferenceItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_REFERENCES);
    return saved ? JSON.parse(saved) : DEFAULT_REFERENCES;
  } catch {
    return DEFAULT_REFERENCES;
  }
}

export function saveStoredReferences(items: ReferenceItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REFERENCES, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save references to localStorage:', err);
  }
}
