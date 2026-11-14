import { VideoData, ProjectItem } from '../types';

export const CLIP_THUMBNAILS = [
  '/assets/thumbnails/clip_podcast_studio.jpg',
  '/assets/thumbnails/clip_creator_desk.jpg',
  '/assets/thumbnails/clip_startup_stage.jpg',
  '/assets/thumbnails/clip_editing_setup.jpg',
];

export const SAMPLE_VIDEO_STREAM =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export const SAMPLE_VIDEOS: Record<string, VideoData> = {
  'podcast-ai': {
    videoId: 'LXb3EKWsInQ',
    videoTitle: 'Masa Depan AI & Cara Kreator Menghasilkan Income dari Shorts',
    channelName: 'Indo Tech Podcast',
    totalDuration: '48:15',
    thumbnailUrl: '/assets/thumbnails/clip_podcast_studio.jpg',
    clips: [
      {
        id: 'clip-p1',
        title: 'Rahasia Hook 3 Detik Pertama Yang Bikin Konten Masuk FYP',
        hook: 'Ternyata 90% penonton scroll kalau 3 detik awal gak pancing emosi!',
        startTime: 120,
        endTime: 165,
        duration: '00:45',
        viralScore: 99,
        scoreReason: 'Hook pertanyaan tajam + data konkrit. Sangat direkomendasikan untuk TikTok & Shorts.',
        aspectRatio: '9:16',
        category: 'Viral Hook',
        engagementRating: 'Extremely High',
        viewsEstimate: '250K - 1M+',
        thumbnailUrl: '/assets/thumbnails/clip_podcast_studio.jpg',
        videoSrc: SAMPLE_VIDEO_STREAM,
        mp4Url: SAMPLE_VIDEO_STREAM,
        captions: [
          { id: 'c1', start: 0, end: 2.5, text: 'Ternyata 90% penonton bakal scroll...', highlight: '90% penonton', emoji: '🔥' },
          { id: 'c2', start: 2.5, end: 5.2, text: '...kalau 3 detik awal gak pancing emosi!', highlight: '3 detik awal', emoji: '⚡' },
          { id: 'c3', start: 5.2, end: 8.5, text: 'Gunakan kata kualifikasi ini di awal video kamu!', highlight: 'kata kualifikasi', emoji: '💡' },
          { id: 'c4', start: 8.5, end: 12.0, text: 'Simpan video ini biar gak lupa pas bikin konten besok!', highlight: 'Simpan video ini', emoji: '📌' }
        ]
      },
      {
        id: 'clip-p2',
        title: 'Edit Subtitle Warna-Warni Bikin Retensi Naik 300%',
        hook: 'Satu elemen visual ini bikin orang nonton video kamu sampai habis!',
        startTime: 410,
        endTime: 448,
        duration: '00:38',
        viralScore: 95,
        scoreReason: 'Panduan visual cepat dengan pola warna kontras meningkatkan retensi mata.',
        aspectRatio: '9:16',
        category: 'Visual Trick',
        engagementRating: 'Very High',
        viewsEstimate: '100K - 400K',
        thumbnailUrl: '/assets/thumbnails/clip_creator_desk.jpg',
        videoSrc: SAMPLE_VIDEO_STREAM,
        mp4Url: SAMPLE_VIDEO_STREAM,
        captions: [
          { id: 'c5', start: 0, end: 2.8, text: 'Satu trik subtitle warna-warni ini...', highlight: 'subtitle warna-warni', emoji: '🎨' },
          { id: 'c6', start: 2.8, end: 6.0, text: '...bisa menaikkan watch time kamu hingga 300%!', highlight: '300%', emoji: '🚀' },
          { id: 'c7', start: 6.0, end: 9.5, text: 'Pastikan beri stroke hitam pekat agar mudah dibaca.', highlight: 'stroke hitam pekat', emoji: '⚡' }
        ]
      },
      {
        id: 'clip-p3',
        title: 'Strategi Repurposing 1 Video Panjang Jadi 10 Klip Shorts',
        hook: '1 Video Panjang YouTube = 10 Klip Viral TikTok + 5 Reels!',
        startTime: 890,
        endTime: 932,
        duration: '00:42',
        viralScore: 92,
        scoreReason: 'Sangat diminati solopreneur & kreator yang ingin hemat waktu produksi.',
        aspectRatio: '9:16',
        category: 'Productivity',
        engagementRating: 'High',
        viewsEstimate: '80K - 250K',
        thumbnailUrl: '/assets/thumbnails/clip_startup_stage.jpg',
        videoSrc: SAMPLE_VIDEO_STREAM,
        mp4Url: SAMPLE_VIDEO_STREAM,
        captions: [
          { id: 'c8', start: 0, end: 3.2, text: 'Stop bikin konten dari nol setiap hari!', highlight: 'Stop bikin konten', emoji: '🛑' },
          { id: 'c9', start: 3.2, end: 6.8, text: 'Gunakan 1 video panjang untuk jadi 10 klip Shorts.', highlight: '10 klip Shorts', emoji: '✂️' },
          { id: 'c10', start: 6.8, end: 10.5, text: 'Biarkan AI bekerja untuk otomatisasi pemotongan.', highlight: 'AI bekerja', emoji: '🤖' }
        ]
      },
      {
        id: 'clip-p4',
        title: 'Bisnis Faceless Shorts Konsisten Tanpa Burnout',
        hook: 'Gak perlu tampil di depan kamera buat dapet jutaan views!',
        startTime: 1420,
        endTime: 1455,
        duration: '00:35',
        viralScore: 89,
        scoreReason: 'Topik kontroversial namun membakar minat pemula untuk berkomentar.',
        aspectRatio: '9:16',
        category: 'Monetization',
        engagementRating: 'High',
        viewsEstimate: '50K - 180K',
        thumbnailUrl: '/assets/thumbnails/clip_editing_setup.jpg',
        videoSrc: SAMPLE_VIDEO_STREAM,
        mp4Url: SAMPLE_VIDEO_STREAM,
        captions: [
          { id: 'c11', start: 0, end: 3.0, text: 'Gak mau tampil di depan kamera?', highlight: 'Gak mau tampil', emoji: '🙈' },
          { id: 'c12', start: 3.0, end: 6.5, text: 'Akun faceless tetap bisa monetisasi iklan & sponsor!', highlight: 'iklan & sponsor', emoji: '💵' },
          { id: 'c13', start: 6.5, end: 10.0, text: 'Fokus pada nilai informasi dan pacing subtitle cepat.', highlight: 'pacing subtitle', emoji: '🎬' }
        ]
      }
    ]
  }
};

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-seed-1',
    title: 'Masa Depan AI & Cara Kreator Menghasilkan Income dari Shorts',
    sourceUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    sourceType: 'youtube',
    createdAt: 'Hari ini',
    aspectRatio: '9:16',
    clipsCount: 4,
    topScore: 99,
    thumbnailUrl: '/assets/thumbnails/clip_podcast_studio.jpg',
    videoData: SAMPLE_VIDEOS['podcast-ai'],
  }
];
