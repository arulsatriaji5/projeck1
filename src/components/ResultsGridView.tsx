import React, { useState } from 'react';
import {
  Play,
  Download,
  Scissors,
  ArrowLeft,
  Flame,
  X,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { VideoData, ClipItem } from '../types';
import { CLIP_THUMBNAILS, SAMPLE_VIDEO_STREAM } from '../data/sampleData';

interface ResultsGridViewProps {
  videoData: VideoData;
  onDownloadClip: (clip: ClipItem) => void;
  onEditManual: (clip: ClipItem) => void;
  onBackToHome: () => void;
  onOpenAnalysis: (clip: ClipItem) => void;
}

function formatSecondsRange(start: number, end: number): string {
  const fmt = (sec: number) => {
    const safe = Math.max(0, Math.round(sec));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

export const ResultsGridView: React.FC<ResultsGridViewProps> = ({
  videoData,
  onDownloadClip,
  onEditManual,
  onBackToHome,
  onOpenAnalysis,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'top'>('all');
  const [previewClip, setPreviewClip] = useState<ClipItem | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const visibleClips = videoData.clips.filter((c) =>
    filterMode === 'top' ? c.viralScore >= 95 : true
  );

  const getClipThumbnail = (clip: ClipItem, index: number) => {
    return clip.thumbnailUrl || CLIP_THUMBNAILS[index % CLIP_THUMBNAILS.length];
  };

  const getClipVideoUrl = (clip: ClipItem) => {
    return clip.mp4Url || clip.videoSrc || SAMPLE_VIDEO_STREAM;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 sm:px-8 py-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Bar Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800">
          <div className="space-y-1.5 min-w-0">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Proses Video Baru</span>
            </button>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white line-clamp-1">
              {videoData.videoTitle}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              {videoData.channelName} ·{' '}
              <span className="font-mono tabular-nums text-emerald-400 font-bold">
                {videoData.clips.length} Klip Dihasilkan
              </span>
            </p>
          </div>

          {/* Filter Switch */}
          <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 p-1 rounded-xl shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Semua ({videoData.clips.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('top')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterMode === 'top'
                  ? 'bg-gray-800 text-emerald-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Skor ≥ 95</span>
            </button>
          </div>
        </header>

        {/* Strict 3-4 Column Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visibleClips.map((clip, index) => {
            const thumb = getClipThumbnail(clip, index);
            const timeRange = formatSecondsRange(clip.startTime, clip.endTime);

            return (
              <article
                key={clip.id}
                className="bg-gray-950 border border-gray-800 hover:border-gray-700 rounded-2xl overflow-hidden flex flex-col transition-colors group"
              >
                {/* 9:16 Vertical Thumbnail + Absolute Center Play Button + Top-Left Viral Score */}
                <div className="relative aspect-[9/16] w-full bg-gray-950 overflow-hidden">
                  <img
                    src={thumb}
                    alt={clip.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-black/15 to-black/45 pointer-events-none" />

                  {/* Top-Left Large Colored Viral Score */}
                  <button
                    type="button"
                    onClick={() => onOpenAnalysis(clip)}
                    className="absolute top-3 left-3 z-20 px-2.5 py-1.5 rounded-xl bg-gray-950/90 border border-emerald-500/40 backdrop-blur-xs flex items-baseline gap-1 cursor-pointer hover:border-emerald-400 transition-colors"
                    title="Lihat analisis skor viral AI"
                  >
                    <span className="text-2xl font-black font-mono tabular-nums text-emerald-400 leading-none">
                      {clip.viralScore}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-emerald-300/80">
                      Skor
                    </span>
                  </button>

                  {/* Top-Right Duration Badge */}
                  <div className="absolute top-3 right-3 z-20 px-2 py-1 rounded-lg bg-gray-950/85 border border-gray-800 text-[11px] font-mono tabular-nums text-gray-200 font-semibold">
                    {clip.duration}
                  </div>

                  {/* Prominent Clickable Play Overlay in Absolute Center */}
                  <button
                    type="button"
                    onClick={() => setPreviewClip(clip)}
                    aria-label={`Putar pratinjau ${clip.title}`}
                    className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/95 hover:bg-emerald-400 text-gray-950 flex items-center justify-center shadow-2xl transition-all group-hover:scale-110">
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>
                  </button>

                  {/* Bottom Subtitle Preview Hint */}
                  {clip.captions && clip.captions.length > 0 && (
                    <div className="absolute bottom-3 inset-x-3 z-10 text-center pointer-events-none">
                      <span className="inline-block bg-black/80 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase text-yellow-300 truncate max-w-full">
                        {clip.captions[0].text}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Bottom Section: Clamped 2-Line Title + Time Range + Action Icons */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {clip.title}
                    </h2>
                    <p className="text-xs font-mono tabular-nums text-gray-400 mt-1.5">
                      {timeRange}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenAnalysis(clip)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analisis</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onDownloadClip(clip)}
                        className="p-2 rounded-lg bg-gray-900 hover:bg-emerald-500 text-gray-200 hover:text-gray-950 border border-gray-800 transition-colors cursor-pointer"
                        title="Unduh Video MP4"
                        aria-label="Unduh Video MP4"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditManual(clip)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white border border-gray-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                        title="Buka Editor Timeline"
                      >
                        <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Playable 9:16 Video Preview Modal */}
      {previewClip && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-800">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono tabular-nums font-bold text-emerald-400">
                    Skor {previewClip.viralScore}
                  </span>
                  <span className="text-xs text-gray-500">·</span>
                  <span className="text-xs font-mono tabular-nums text-gray-400">
                    {previewClip.duration}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white line-clamp-1 mt-0.5">
                  {previewClip.title}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 cursor-pointer"
                  title={isMuted ? 'Aktifkan suara' : 'Bisukan'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewClip(null)}
                  className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white cursor-pointer"
                  aria-label="Tutup pratinjau"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative w-full aspect-[9/16] max-h-[520px] bg-black rounded-xl overflow-hidden flex items-center justify-center">
              <video
                src={getClipVideoUrl(previewClip)}
                poster={previewClip.thumbnailUrl || CLIP_THUMBNAILS[0]}
                playsInline
                autoPlay
                controls
                muted={isMuted}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onDownloadClip(previewClip)}
                className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Unduh MP4</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = previewClip;
                  setPreviewClip(null);
                  onEditManual(target);
                }}
                className="py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Scissors className="w-4 h-4 text-emerald-400" />
                <span>Edit Timeline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
