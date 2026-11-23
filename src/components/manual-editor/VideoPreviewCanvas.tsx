import React, { useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { ManualSubtitleItem } from '../../types';

interface VideoPreviewCanvasProps {
  videoSrc: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVideoTimeUpdate?: (time: number) => void;
  subtitles: ManualSubtitleItem[];
  selectedSubtitleId: string | null;
  onSelectSubtitle: (id: string) => void;
}

export const VideoPreviewCanvas: React.FC<VideoPreviewCanvasProps> = ({
  videoSrc,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onVideoTimeUpdate,
  subtitles,
  selectedSubtitleId,
  onSelectSubtitle
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = React.useState(false);

  // Guarantee valid playable MP4 stream to avoid broken media icons
  const effectiveVideoSrc = React.useMemo(() => {
    if (!videoSrc) return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    if (videoSrc.startsWith('blob:') || videoSrc.includes('.mp4') || videoSrc.includes('sample')) {
      return videoSrc;
    }
    // If it's a YouTube URL or invalid string, fallback to reliable sample MP4
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }, [videoSrc]);

  // Sync video currentTime with parent state on explicit seeks
  useEffect(() => {
    if (videoRef.current) {
      if (Math.abs(videoRef.current.currentTime - currentTime) > 0.3) {
        videoRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime]);

  // Sync play/pause with parent state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const latestTimeRef = useRef<number>(currentTime);
  useEffect(() => {
    latestTimeRef.current = currentTime;
  }, [currentTime]);

  // 60fps requestAnimationFrame loop reading directly from <video>.currentTime while actively playing
  useEffect(() => {
    if (!isPlaying || !onVideoTimeUpdate) return;
    let rafId = 0;
    let lastStamp = performance.now();

    const tick = (now: number) => {
      const video = videoRef.current;
      if (video && !video.paused && !video.seeking && video.readyState >= 2) {
        const live = video.currentTime;
        if (live >= duration) {
          video.currentTime = 0;
          latestTimeRef.current = 0;
          onVideoTimeUpdate(0);
        } else {
          latestTimeRef.current = live;
          onVideoTimeUpdate(live);
        }
        lastStamp = now;
      } else if (!video || video.readyState < 2) {
        const dt = Math.min(0.1, Math.max(0, (now - lastStamp) / 1000));
        lastStamp = now;
        if (dt > 0) {
          const prev = latestTimeRef.current;
          const next = prev + dt >= duration ? 0 : prev + dt;
          latestTimeRef.current = next;
          onVideoTimeUpdate(next);
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, duration, onVideoTimeUpdate]);

  // Find active subtitle at current playhead
  const activeSubtitle = subtitles.find(
    (sub) => currentTime >= sub.start && currentTime <= sub.end
  );

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs}.${ms}`;
  };

  // Render Subtitle with selected font, stroke, shadow, and animation
  const renderSubtitleText = (sub: ManualSubtitleItem) => {
    const isSelected = selectedSubtitleId === sub.id;

    // Animation classes based on animation type
    let animationClass = '';
    if (sub.animation === 'pop') {
      animationClass = 'animate-in zoom-in-75 duration-150 ease-out';
    } else if (sub.animation === 'fade') {
      animationClass = 'animate-in fade-in duration-300';
    } else if (sub.animation === 'karaoke') {
      animationClass = 'animate-pulse duration-1000';
    }

    // Split text into words for syllable/char-weighted karaoke highlight
    const words = sub.text.trim().split(/\s+/).filter(Boolean);
    const relativeTime = Math.max(0, currentTime - sub.start);
    const subDuration = Math.max(0.35, sub.end - sub.start);
    const weights = words.map((w) => {
      const clean = w.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '');
      const vowels = (clean.match(/[aeiouyAEIOUY]/g) || []).length;
      return Math.max(1.2, vowels * 1.15 + clean.length * 0.25);
    });
    const totalWeight = weights.reduce((sum, val) => sum + val, 0) || 1;
    const targetWeight = Math.min(1, relativeTime / subDuration) * totalWeight;
    let accWeight = 0;
    let wordProgressIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      accWeight += weights[i];
      if (targetWeight <= accWeight || i === weights.length - 1) {
        wordProgressIndex = i;
        break;
      }
    }

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelectSubtitle(sub.id);
        }}
        className={`cursor-pointer transition-all ${animationClass} ${
          isSelected ? 'ring-2 ring-sky-400/80 ring-offset-2 ring-offset-black rounded-lg p-1' : ''
        }`}
        style={{
          fontFamily: sub.fontFamily,
          fontSize: `${sub.fontSize}px`,
          color: sub.color,
          WebkitTextStroke: `${sub.strokeWidth}px ${sub.strokeColor}`,
          textShadow: sub.shadowBlur > 0 ? `0 4px ${sub.shadowBlur * 2}px rgba(0,0,0,0.9)` : 'none',
          lineHeight: 1.15,
          fontWeight: 900,
          textAlign: 'center',
          letterSpacing: '-0.02em',
          textTransform: 'uppercase'
        }}
      >
        {sub.animation === 'karaoke' ? (
          words.map((word, wIdx) => {
            const isHighlight = wIdx === wordProgressIndex;
            return (
              <span
                key={wIdx}
                className="inline-block mx-1 transition-all"
                style={{
                  color: isHighlight ? (sub.highlightColor || '#FACC15') : sub.color,
                  transform: isHighlight ? 'scale(1.15)' : 'scale(1)',
                  textShadow: isHighlight
                    ? '0 0 15px rgba(250,204,21,0.8), 0 4px 10px rgba(0,0,0,0.9)'
                    : undefined
                }}
              >
                {word}
              </span>
            );
          })
        ) : (sub.highlightWord || sub.highlight) ? (
          words.map((word, wIdx) => {
            const target = (sub.highlightWord || sub.highlight || '').trim().toLowerCase().replace(/[^\w\u00C0-\u024F]/g, '');
            const cleanWord = word.toLowerCase().replace(/[^\w\u00C0-\u024F]/g, '');
            const isTarget = Boolean(target && (cleanWord === target || target.split(/\s+/).includes(cleanWord)));
            return (
              <span
                key={wIdx}
                className="inline-block mx-1"
                style={{
                  color: isTarget ? (sub.highlightColor || '#FACC15') : sub.color,
                }}
              >
                {word}
              </span>
            );
          })
        ) : (
          <span>{sub.text}</span>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-white rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden select-none">
      
      {/* Top Header of Preview Panel */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#1D4ED8]" />
          <span className="font-bold text-[#0B1F3A] tracking-wide">
            Kanvas Video 9:16 (Vertikal)
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            · 1080×1920
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#0B1F3A] font-mono tabular-nums text-[11px] bg-[#EEF2F7] px-2.5 py-1 rounded-lg font-semibold">
            {formatTimecode(currentTime)} / {formatTimecode(duration)}
          </span>
        </div>
      </div>

      {/* Center 9:16 Video Player Container */}
      <div className="flex-1 flex items-center justify-center p-2 min-h-0 relative bg-[#F8F9FA] rounded-2xl my-3">
        <div className="relative h-full max-h-[380px] sm:max-h-[420px] aspect-[9/16] bg-[#071324] rounded-2xl shadow-lg overflow-hidden flex items-center justify-center group">
          
          {/* Native HTML5 Video with Subclip (Uncropped object-contain) */}
          <video
            ref={videoRef}
            src={effectiveVideoSrc}
            poster="/assets/thumbnails/clip_podcast_studio.jpg"
            playsInline
            muted={isMuted}
            loop
            onError={(e) => {
              if (e.currentTarget.src !== 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4') {
                e.currentTarget.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                e.currentTarget.play().catch(() => {});
              }
            }}
            className="w-full h-full object-contain pointer-events-none bg-[#071324]"
          />

          {/* Subtitle Overlay Layer */}
          {activeSubtitle && (
            <div 
              className="absolute inset-x-3 pointer-events-auto z-20 flex justify-center"
              style={{
                top: `${activeSubtitle.yOffsetPercent || 54}%`,
                transform: 'translateY(-50%)'
              }}
            >
              {renderSubtitleText(activeSubtitle)}
            </div>
          )}

          {/* Play/Pause Hover Overlay */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-[#0B1F3A]/95 text-white flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-transform">
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </div>
          </button>

          {/* 9:16 Safe Area Watermark */}
          <div className="absolute top-2.5 left-2.5 pointer-events-none z-10">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 bg-[#0B1F3A]/80 backdrop-blur-md px-2 py-0.5 rounded">
              Safe Zone
            </span>
          </div>

        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSeek(Math.max(0, currentTime - 1))}
            className="p-2 rounded-xl bg-[#EEF2F7] hover:bg-slate-200 text-[#0B1F3A] transition-colors cursor-pointer"
            title="Mundur 1 Detik"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#122E56] text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm whitespace-nowrap"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Putar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSeek(Math.min(duration, currentTime + 1))}
            className="p-2 rounded-xl bg-[#EEF2F7] hover:bg-slate-200 text-[#0B1F3A] transition-colors cursor-pointer"
            title="Maju 1 Detik"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current Active Subtitle */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-600 truncate max-w-[220px]">
          {activeSubtitle ? (
            <span className="text-[#1D4ED8] font-semibold truncate">
              &ldquo;{activeSubtitle.text}&rdquo;
            </span>
          ) : (
            <span className="text-slate-400">Tidak ada subtitle aktif</span>
          )}
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-[#EEF2F7] hover:bg-slate-200 text-[#0B1F3A] transition-colors cursor-pointer"
            title={isMuted ? "Bunyikan Suara" : "Bisukan Suara"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

    </div>
  );
};
