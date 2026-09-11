import { VideoData } from '../types';

export const SAMPLE_VIDEOS: Record<string, VideoData> = {
  'podcast-ai': {
    videoId: 'LXb3EKWsInQ',
    videoTitle: 'Masa Depan AI & Cara Kreator Menghasilkan $10,000/Bulan dari Shorts',
    channelName: 'Indo Tech Podcast',
    totalDuration: '48:15',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
    clips: [
      {
        id: 'clip-p1',
        title: '🔥 Rahasia Hook 3 Detik Pertama Yang Bikin FYP',
        hook: 'Ternyata 90% penonton scroll kalau 3 detik awal gak pancing emosi!',
        startTime: 120,
        endTime: 153,
        duration: '00:33',
        viralScore: 98,
        scoreReason: 'Hook pertanyaan tajam + data konkrit. Sangat direkomendasikan untuk TikTok & Shorts.',
        aspectRatio: '9:16',
        category: '🔥 High Virality',
        engagementRating: 'Extremely High',
        viewsEstimate: '250K - 1M+',
        captions: [
          { id: 'c1', start: 0, end: 2.5, text: 'Ternyata 90% penonton bakal scroll...', highlight: '90% penonton', emoji: '😱' },
          { id: 'c2', start: 2.5, end: 5.2, text: '...kalau 3 detik awal gak pancing emosi!', highlight: '3 detik awal', emoji: '🔥' },
          { id: 'c3', start: 5.2, end: 8.5, text: 'Gunakan kata kualifikasi ini di awal video kamu!', highlight: 'kata kualifikasi', emoji: '💡' },
          { id: 'c4', start: 8.5, end: 12.0, text: 'Simpan video ini biar gak lupa pas bikin konten besok!', highlight: 'Simpan video ini', emoji: '📌' }
        ]
      },
      {
        id: 'clip-p2',
        title: '⚡ Edit Subtitle Warna-Warni Bikin Retensi Naik 300%',
        hook: 'Satu elemen visual ini bikin orang nonton video kamu sampai habis!',
        startTime: 410,
        endTime: 448,
        duration: '00:38',
        viralScore: 95,
        scoreReason: 'Panduan visual cepat dengan pola warna acak meningkatkan retensi mata.',
        aspectRatio: '9:16',
        category: '⚡ Visual Trick',
        engagementRating: 'Very High',
        viewsEstimate: '100K - 400K',
        captions: [
          { id: 'c5', start: 0, end: 2.8, text: 'Satu trik subtitle warna-warni ini...', highlight: 'subtitle warna-warni', emoji: '🎨' },
          { id: 'c6', start: 2.8, end: 6.0, text: '...bisa menaikkan watch time kamu hingga 300%!', highlight: '300%', emoji: '🚀' },
          { id: 'c7', start: 6.0, end: 9.5, text: 'Pastikan beri background stroke hitam pekat.', highlight: 'stroke hitam pekat', emoji: '⚡' }
        ]
      },
      {
        id: 'clip-p3',
        title: '🚀 Strategi Repurposing Konten Tanpa Buang Waktu',
        hook: '1 Video Panjang YouTube = 10 Klip Viral TikTok + 5 Article Blog!',
        startTime: 890,
        endTime: 932,
        duration: '00:42',
        viralScore: 91,
        scoreReason: 'Sangat diminati solopreneur & digital marketer yang ingin hemat waktu.',
        aspectRatio: '9:16',
        category: '💡 Productivity',
        engagementRating: 'High',
        viewsEstimate: '80K - 250K',
        captions: [
          { id: 'c8', start: 0, end: 3.2, text: 'Stop bikin konten dari nol setiap hari!', highlight: 'Stop bikin konten', emoji: '🛑' },
          { id: 'c9', start: 3.2, end: 6.8, text: 'Gunakan 1 video panjang untuk jadi 10 klip Shorts.', highlight: '10 klip Shorts', emoji: '✂️' },
          { id: 'c10', start: 6.8, end: 10.5, text: 'Biarkan AI bekerja untuk otomatisasi pemotongan.', highlight: 'AI bekerja', emoji: '🤖' }
        ]
      },
      {
        id: 'clip-p4',
        title: '💰 Bisnis Faceless Shorts Beromset Puluhan Juta',
        hook: 'Gak perlu percaya kalau dibilang bikin konten itu harus pamer muka!',
        startTime: 1420,
        endTime: 1455,
        duration: '00:35',
        viralScore: 88,
        scoreReason: 'Topik kontroversial namun membakar minat pemula.',
        aspectRatio: '9:16',
        category: '💰 Monetization',
        engagementRating: 'High',
        viewsEstimate: '50K - 180K',
        captions: [
          { id: 'c11', start: 0, end: 3.0, text: 'Gak mau tampil di depan kamera?', highlight: 'Gak mau tampil', emoji: '🙈' },
          { id: 'c12', start: 3.0, end: 6.5, text: 'Akun faceless tetap bisa dapet iklan dan sponsor!', highlight: 'iklan dan sponsor', emoji: '💵' },
          { id: 'c13', start: 6.5, end: 10.0, text: 'Fokus pada nilai informasi dan b-roll yang menarik.', highlight: 'b-roll menarik', emoji: '🎬' }
        ]
      }
    ]
  },
  'tech-review': {
    videoId: 'M576WGiDBdQ',
    videoTitle: 'Review Gadget Masa Depan: AI Smartphone yang Menggantikan Laptop',
    channelName: 'GadgetInspirasi',
    totalDuration: '15:20',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    clips: [
      {
        id: 'clip-t1',
        title: '🤯 Fitur HP Ini Bikin Shock Semua Orang!',
        hook: 'HP ini bisa edit video 4K hanya dengan perintah suara!',
        startTime: 45,
        endTime: 78,
        duration: '00:33',
        viralScore: 96,
        scoreReason: 'Faktor kejutan tinggi dengan demonstrasi fitur visual instan.',
        aspectRatio: '9:16',
        category: '🤯 Mindblowing',
        engagementRating: 'Extremely High',
        viewsEstimate: '300K - 1.2M',
        captions: [
          { id: 'ct1', start: 0, end: 2.8, text: 'Kalian gak bakal percaya fitur HP ini!', highlight: 'fitur HP ini', emoji: '📱' },
          { id: 'ct2', start: 2.8, end: 5.8, text: 'Cuma dengan perintah suara, video 4K langsung ter-render!', highlight: 'perintah suara', emoji: '🗣️' },
          { id: 'ct3', start: 5.8, end: 9.0, text: 'Tonton sampai akhir buat liat hasilnya!', highlight: 'Tonton sampai akhir', emoji: '👀' }
        ]
      },
      {
        id: 'clip-t2',
        title: '⚖️ iPhone vs AI Phone: Siapa Yang Menang?',
        hook: 'Apakah iPhone akhirnya kalah canggih tahun ini?',
        startTime: 210,
        endTime: 248,
        duration: '00:38',
        viralScore: 93,
        scoreReason: 'Perbandingan brand ternama memicu perdebatan di kolom komentar.',
        aspectRatio: '9:16',
        category: '🥊 Versus',
        engagementRating: 'Very High',
        viewsEstimate: '150K - 500K',
        captions: [
          { id: 'ct4', start: 0, end: 3.0, text: 'iPhone vs AI Phone flagship terbaru!', highlight: 'iPhone vs AI Phone', emoji: '⚔️' },
          { id: 'ct5', start: 3.0, end: 6.5, text: 'Mana yang punya performa rendering lebih mantap?', highlight: 'performa rendering', emoji: '🏎️' }
        ]
      }
    ]
  }
};
