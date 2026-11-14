import { ReferenceItem } from '../types';

export const DEFAULT_REFERENCES: ReferenceItem[] = [
  {
    id: 'ref-1',
    title: 'Hormozi Kuning Neon (Hook 3 Detik)',
    mediaType: 'url',
    url: 'https://www.tiktok.com/@clipmaster/video/7381928371',
    platform: 'tiktok',
    category: 'Subtitle & Pacing',
    notes: '• Potong jeda nafas pembicara 100% (zero silence).\n• Detik 0-2: Mulai dengan statement kontroversial atau pertanyaan retoris.\n• Subtitle: 1-2 kata per baris, warna kuning neon (#FACC15) + shadow hitam tebal.\n• Sound effect: "whoosh" tiap transisi zoom-in.',
    createdAt: 'Baru saja'
  },
  {
    id: 'ref-2',
    title: 'Neon Cyberpunk & Sorotan Karaoke',
    mediaType: 'image',
    fileData: {
      name: 'aesthetic_neon_cyberpunk.jpg',
      size: '1.8 MB',
      type: 'image/jpeg',
      previewUrl: '/assets/thumbnails/clip_editing_setup.jpg'
    },
    category: 'Visual & Palet Warna',
    notes: '• Tiru grading warna kontras tinggi: tone shadow gelap & highlight cyan/emerald.\n• Sorotan kata kunci bergantian warna secara sinkron (Karaoke).\n• Cocok untuk video ringkasan teknologi & startup futuristik.',
    createdAt: 'Kemarin'
  },
  {
    id: 'ref-3',
    title: 'Podcast Talking Head 9:16 Dinamis',
    mediaType: 'video',
    fileData: {
      name: 'dynamic_punchline_cut.mp4',
      size: '14.8 MB',
      type: 'video/mp4'
    },
    category: 'Komposisi 9:16',
    notes: '• Komposisi 9:16 vertikal: Wajah subjek selalu berada di 35% tinggi layar atas.\n• Auto-zoom 1.18x setiap kali punchline atau poin penting diucapkan.\n• Subtitle putih bersih tebal dengan stroke hitam.',
    createdAt: '2 hari lalu'
  },
  {
    id: 'ref-4',
    title: 'Minimalist Documentary & Story Arc 60s',
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

export const STORAGE_KEY_REFERENCES = 'clipa_reference_vault_v3';

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
