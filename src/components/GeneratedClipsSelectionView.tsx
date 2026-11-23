import React, { useState, useRef } from 'react';
import { 
  Flame, 
  Clock, 
  Download, 
  SlidersHorizontal, 
  ArrowLeft, 
  Youtube, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  MessageSquareQuote,
  Smartphone
} from 'lucide-react';
import { VideoData, ClipItem } from '../types';

interface GeneratedClipsSelectionViewProps {
  videoData: VideoData;
  onEditManual: (clip: ClipItem) => void;
  onDownloadClip: (clip: ClipItem) => void;
  onBackToInput: () => void;
  onOpenAnalysis?: (clip: ClipItem) => void;
}

export const GeneratedClipsSelectionView: React.FC<GeneratedClipsSelectionViewProps> = ({
  videoData,
  onEditManual,
  onDownloadClip,
  onBackToInput,
  onOpenAnalysis,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high-score'>('all');
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);

  // Playable Preview State
  const [activePlayingClipId, setActivePlayingClipId] = useState<string | null>(null);
  const [previewModalClip, setPreviewModalClip] = useState<ClipItem | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const [clipPlaybackTimes, setClipPlaybackTimes] = useState<Record<string, number>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const filteredClips = videoData.clips.filter((clip) => {
    if (selectedFilter === 'all') return true;
    return clip.viralScore >= 95;
  });

  const handleDownload = (clip: ClipItem) => {
    setDownloadingClipId(clip.id);
    onDownloadClip(clip);
    setTimeout(() => {
      setDownloadingClipId(null);
    }, 1500);
  };

  const toggleInlinePlay = (clipId: string) => {
    if (activePlayingClipId === clipId) {
      const v = videoRefs.current[clipId];
      if (v) v.pause();
      setActivePlayingClipId(null);
    } else {
      if (activePlayingClipId && videoRefs.current[activePlayingClipId]) {
        videoRefs.current[activePlayingClipId]?.pause();
      }
      setActivePlayingClipId(clipId);
      const v = videoRefs.current[clipId];
      if (v) {
        v.play().catch(() => {});
      }
    }
  };

  const handleTimeUpdate = (clipId: string, currentTime: number) => {
    setClipPlaybackTimes((prev) => ({ ...prev, [clipId]: currentTime }));
  };

  const getActiveSubtitleForClip = (clip: ClipItem, currentTime: number) => {
    if (!clip.captions || clip.captions.length === 0) return null;
    return clip.captions.find(c => currentTime >= c.start && currentTime <= c.end) || clip.captions[0];
  };

  const getEffectiveVideoSrc = (clip: ClipItem) => {
    return clip.videoSrc || clip.mp4Url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  };

  return (
    /* Selection Dashboard Section */
    <section className="w-full min-h-screen bg-[#F8F9FA] text-[#0B1F3A] py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Navigation & Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 mb-8 border-b border-slate-200">
          <div>
            <button
              type="button"
              onClick={onBackToInput}
              title="Kembali"
              aria-label="Kembali"
              className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-white hover:bg-[#EEF2F7] text-[#0B1F3A] mb-4 transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-[#1D4ED8]" />
            </button>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B1F3A] tracking-tight text-balance">
              Hasil Klip: <span className="text-[#1D4ED8]">{videoData.clips.length} Klip Siap Putar</span>
            </h1>

            <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Putar pratinjau langsung di bawah, lalu unduh MP4 atau buka <strong className="text-[#0B1F3A]">Edit Foto &amp; Video</strong>.
            </p>
          </div>

          {/* Source Video Summary Card */}
          <div className="flex items-center gap-3.5 bg-white p-3.5 rounded-2xl shadow-sm shrink-0 max-w-md w-full md:w-auto">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0B1F3A] shrink-0 flex items-center justify-center text-white">
              <img
                src={videoData.thumbnailUrl}
                alt={videoData.videoTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0B1F3A] line-clamp-1">{videoData.videoTitle}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span className="text-[#1D4ED8] flex items-center gap-1 font-semibold truncate">
                  <Youtube className="w-3.5 h-3.5 shrink-0" /> {videoData.channelName}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{videoData.totalDuration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1.5 bg-[#EEF2F7] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                selectedFilter === 'all'
                  ? 'bg-[#0B1F3A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              Semua Klip ({videoData.clips.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('high-score')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                selectedFilter === 'high-score'
                  ? 'bg-[#0B1F3A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>Skor Tertinggi (≥95)</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Format Output: <span className="text-[#0B1F3A] font-bold">9:16 Vertikal (1080×1920 MP4)</span>
          </p>
        </div>

        {/* Generated Clips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredClips.map((clip, index) => {
            const isDownloading = downloadingClipId === clip.id;
            const isCurrentlyPlaying = activePlayingClipId === clip.id;
            const currentClipTime = clipPlaybackTimes[clip.id] || 0;
            const activeSub = getActiveSubtitleForClip(clip, currentClipTime);
            const videoSource = getEffectiveVideoSrc(clip);

            return (
              <article
                key={clip.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 ${
                  isCurrentlyPlaying
                    ? 'shadow-lg ring-2 ring-[#0B1F3A]'
                    : 'shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  {/* Unboxed Clean Metadata Row */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-3">
                    <span className="font-semibold text-[#1D4ED8] truncate">
                      Klip #{index + 1} · {clip.category}
                    </span>

                    <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {clip.duration}
                      </span>
                      <span aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={() => onOpenAnalysis && onOpenAnalysis(clip)}
                        className="inline-flex items-center gap-1 font-bold text-[#0B1F3A] hover:text-[#1D4ED8] cursor-pointer"
                        title="Klik untuk lihat Analisis Virality"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
                        <span>{clip.viralScore}/100</span>
                      </button>
                    </div>
                  </div>

                  {/* Playable Mini Video Player Frame */}
                  <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-[#071324] mb-4 group/video select-none">
                    <video
                      ref={(el) => { videoRefs.current[clip.id] = el; }}
                      src={videoSource}
                      poster={videoData.thumbnailUrl}
                      playsInline
                      muted={isMuted}
                      loop
                      onTimeUpdate={(e) => handleTimeUpdate(clip.id, e.currentTarget.currentTime)}
                      onError={(e) => {
                        if (e.currentTarget.src !== 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4') {
                          e.currentTarget.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                        }
                      }}
                      className="w-full h-full object-contain bg-[#071324]"
                    />

                    {/* Contrast Scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />

                    {/* Top Right Video Controls */}
                    <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewModalClip(clip);
                        }}
                        className="p-1.5 rounded-lg bg-black/65 hover:bg-[#0B1F3A] text-white transition-colors cursor-pointer"
                        title="Buka Pratinjau Layar Penuh 9:16"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMuted(!isMuted);
                        }}
                        className="p-1.5 rounded-lg bg-black/65 hover:bg-[#0B1F3A] text-white transition-colors cursor-pointer"
                        title={isMuted ? "Aktifkan Suara" : "Bisukan"}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-300" /> : <Volume2 className="w-3.5 h-3.5 text-sky-300" />}
                      </button>
                    </div>

                    {/* Play / Pause Overlay */}
                    {!isCurrentlyPlaying ? (
                      <button
                        type="button"
                        onClick={() => toggleInlinePlay(clip.id)}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 hover:bg-black/15 transition-colors cursor-pointer z-10"
                      >
                        <div className="w-12 h-12 rounded-full bg-white text-[#0B1F3A] flex items-center justify-center shadow-lg transform group-hover/video:scale-105 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                        <span className="mt-2 text-[11px] font-bold text-white bg-[#0B1F3A]/90 px-3 py-1 rounded-full">
                          Putar Pratinjau
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleInlinePlay(clip.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover/video:opacity-100 transition-opacity cursor-pointer z-10"
                      >
                        <div className="w-11 h-11 rounded-full bg-[#0B1F3A]/90 text-white flex items-center justify-center shadow-lg">
                          <Pause className="w-5 h-5 fill-current" />
                        </div>
                      </button>
                    )}

                    {/* Dynamic Live Subtitle */}
                    {activeSub && (
                      <div className="absolute bottom-3 inset-x-2 text-center pointer-events-none z-20">
                        <span className="inline-block bg-black/85 px-2.5 py-1 rounded-lg text-yellow-300 font-extrabold text-[11px] uppercase max-w-[95%] truncate">
                          {activeSub.text}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Clip Title */}
                  <h3 className="text-base sm:text-lg font-bold text-[#0B1F3A] line-clamp-2 leading-snug">
                    {clip.title}
                  </h3>

                  {/* Hook Highlight */}
                  <div className="mt-3 bg-[#F8F9FA] rounded-2xl p-3.5">
                    <div className="flex items-center gap-1.5 text-[#1D4ED8] text-xs font-bold mb-1">
                      <MessageSquareQuote className="w-3.5 h-3.5 shrink-0" />
                      <span>Hook Pembuka (3 Detik Pertama)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium italic line-clamp-2 leading-relaxed">
                      "{clip.hook}"
                    </p>
                  </div>

                  {/* Virality Note */}
                  <p className="mt-3 text-xs text-slate-500 line-clamp-1">
                    {clip.scoreReason}
                  </p>
                </div>

                {/* Two Distinct Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDownload(clip)}
                    disabled={isDownloading}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#0B1F3A] hover:bg-[#122E56] text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50 whitespace-nowrap"
                    title="Unduh langsung video MP4 yang sudah dipotong & diberi subtitle"
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengunduh...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-sky-300 shrink-0" />
                        <span>Unduh Video</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditManual(clip)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#EEF2F7] hover:bg-[#DCE5F2] text-[#0B1F3A] font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
                    title="Buka Ruang Kerja Timeline & Video Editor"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-[#1D4ED8] shrink-0" />
                    <span>Buka di Edit Foto &amp; Video</span>
                  </button>
                </div>

              </article>
            );
          })}
        </div>

      </div>

      {/* Fullscreen 9:16 Modal Preview */}
      {previewModalClip && (
        <div className="fixed inset-0 z-50 bg-[#061224]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full bg-white rounded-3xl p-5 shadow-2xl flex flex-col items-center">
            
            <button
              type="button"
              onClick={() => setPreviewModalClip(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-[#0B1F3A] hover:bg-[#122E56] text-white flex items-center justify-center shadow-lg cursor-pointer z-50"
              title="Tutup Pratinjau"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-full text-center pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-bold text-[#1D4ED8] flex items-center justify-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> Pratinjau Vertikal 9:16
              </span>
              <h4 className="text-sm font-bold text-[#0B1F3A] line-clamp-1 mt-0.5">
                {previewModalClip.title}
              </h4>
            </div>

            <div className="relative w-full aspect-[9/16] max-h-[500px] bg-[#071324] rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
              <video
                src={getEffectiveVideoSrc(previewModalClip)}
                playsInline
                autoPlay
                controls
                className="w-full h-full object-contain"
              />

              {previewModalClip.captions && previewModalClip.captions.length > 0 && (
                <div className="absolute bottom-16 inset-x-3 pointer-events-none text-center z-20">
                  <span className="inline-block bg-black/85 px-3 py-1.5 rounded-xl text-yellow-300 font-extrabold text-xs uppercase">
                    {previewModalClip.captions[0].text}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  handleDownload(previewModalClip);
                  setPreviewModalClip(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-[#0B1F3A] hover:bg-[#122E56] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-300" />
                <span>Unduh MP4</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onEditManual(previewModalClip);
                  setPreviewModalClip(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-[#EEF2F7] hover:bg-[#DCE5F2] text-[#0B1F3A] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>Buka di Edit Foto &amp; Video</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
