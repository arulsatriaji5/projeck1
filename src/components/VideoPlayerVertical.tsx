import React, { useState, useEffect, useRef } from 'react';
import { ClipItem, AspectRatioType, CaptionStyleType } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Type, 
  Sparkles, 
  Maximize2, 
  Download, 
  Edit3, 
  Layers, 
  Smartphone, 
  Monitor, 
  Square 
} from 'lucide-react';

interface VideoPlayerVerticalProps {
  clip: ClipItem;
  videoId: string;
  captionStyle: CaptionStyleType;
  setCaptionStyle: (style: CaptionStyleType) => void;
  aspectRatio: AspectRatioType;
  setAspectRatio: (ratio: AspectRatioType) => void;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenCaptionEditor: () => void;
  onOpenExportModal: () => void;
}

export const VideoPlayerVertical: React.FC<VideoPlayerVerticalProps> = ({
  clip,
  videoId,
  captionStyle,
  setCaptionStyle,
  aspectRatio,
  setAspectRatio,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  onOpenCaptionEditor,
  onOpenExportModal,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [activeCaptionIndex, setActiveCaptionIndex] = useState(0);

  // Playback timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const clipDurationSeconds = clip.endTime - clip.startTime;
          if (prev >= clipDurationSeconds) {
            return 0; // Loop back
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, clip]);

  // Find active caption based on currentTime
  useEffect(() => {
    if (clip.captions && clip.captions.length > 0) {
      const idx = clip.captions.findIndex(
        (c) => currentTime >= c.start && currentTime <= c.end
      );
      if (idx !== -1) {
        setActiveCaptionIndex(idx);
      } else {
        // Fallback to nearest
        const activeIdx = clip.captions.reduce((acc, cap, index) => {
          if (currentTime >= cap.start) return index;
          return acc;
        }, 0);
        setActiveCaptionIndex(activeIdx);
      }
    }
  }, [currentTime, clip]);

  // Caption style classes helper
  const getCaptionStyleClasses = () => {
    switch (captionStyle) {
      case 'hormozi':
        return 'font-extrabold uppercase text-yellow-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] tracking-wide bg-black/80 px-3 py-1.5 rounded-lg border-2 border-yellow-400/80 text-center text-lg sm:text-xl';
      case 'neon':
        return 'font-extrabold uppercase text-sky-300 tracking-wider bg-zinc-950/90 px-3 py-1.5 rounded-xl border border-sky-400 text-center text-lg sm:text-xl shadow-lg shadow-sky-500/20';
      case 'karaoke':
        return 'font-black uppercase text-white tracking-tight bg-sky-950/90 px-3 py-1.5 rounded-lg text-center text-lg sm:text-xl shadow-xl border border-sky-400/40';
      case 'cyberpunk':
        return 'font-extrabold text-lime-300 bg-zinc-900/90 px-3 py-1 border-l-4 border-lime-400 text-center text-lg sm:text-xl';
      default: // minimal
        return 'font-semibold text-zinc-100 bg-zinc-950/80 px-3 py-1 rounded-md text-center text-base sm:text-lg';
    }
  };

  const currentCaption = clip.captions[activeCaptionIndex];

  // Aspect ratio dimension helper
  const getAspectRatioDimensions = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square max-w-[360px]';
      case '16:9':
        return 'aspect-video max-w-[500px]';
      default: // 9:16
        return 'aspect-[9/16] max-w-[280px] sm:max-w-[320px]';
    }
  };

  const totalClipSeconds = clip.endTime - clip.startTime;

  return (
    <div className="flex flex-col items-center justify-between h-full w-full bg-zinc-950 rounded-2xl border border-zinc-800 p-4 shadow-2xl relative overflow-hidden">
      
      {/* Top Bar Controls */}
      <div className="w-full flex items-center justify-between gap-2 pb-3 border-b border-zinc-800 mb-3">
        
        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setAspectRatio('9:16')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              aspectRatio === '9:16'
                ? 'bg-sky-500 text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="TikTok / Shorts (9:16)"
          >
            <Smartphone className="w-3.5 h-3.5" /> 9:16
          </button>
          <button
            onClick={() => setAspectRatio('1:1')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              aspectRatio === '1:1'
                ? 'bg-sky-500 text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Feed Post (1:1)"
          >
            <Square className="w-3.5 h-3.5" /> 1:1
          </button>
          <button
            onClick={() => setAspectRatio('16:9')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              aspectRatio === '16:9'
                ? 'bg-sky-500 text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="YouTube Landscape (16:9)"
          >
            <Monitor className="w-3.5 h-3.5" /> 16:9
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCaptionEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sky-400 text-xs font-semibold transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-sky-400" />
            <span>Edit Subtitle</span>
          </button>
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold transition-all cursor-pointer shadow-md shadow-sky-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Clip</span>
          </button>
        </div>

      </div>

      {/* Center Player Frame Container (Framed like a phone screen) */}
      <div className="flex-1 w-full flex items-center justify-center my-2 relative">
        <div className={`relative w-full ${getAspectRatioDimensions()} rounded-[28px] overflow-hidden bg-black border-4 border-zinc-800 shadow-2xl shadow-sky-500/5 transition-all flex flex-col items-center justify-center group ring-1 ring-zinc-700/50`}>
          
          {/* Phone Top Notch Aesthetic */}
          <div className="absolute top-2 z-30 w-20 h-3 bg-zinc-900 rounded-full border border-zinc-800 opacity-80 pointer-events-none flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-zinc-800 mr-2" />
            <div className="w-4 h-1 bg-zinc-800 rounded-full" />
          </div>

          {/* YouTube Video Iframe Embed */}
          <iframe
            key={clip.id}
            src={`https://www.youtube.com/embed/${videoId}?start=${Math.floor(clip.startTime + currentTime)}&autoplay=${isPlaying ? 1 : 0}&controls=0&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&enablejsapi=1`}
            title={clip.title}
            className="absolute inset-0 w-full h-full object-cover scale-[1.35] pointer-events-none filter brightness-95"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />

          {/* Dark Vignette Overlay for TikTok look */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />

          {/* Social Media Preview UI Overlays (TikTok / Reels Style) */}
          <div className="absolute top-8 right-3 flex flex-col items-center gap-3 z-20 text-white text-xs font-bold">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-zinc-900/80 border border-white/20 flex items-center justify-center text-rose-400">
                ❤️
              </div>
              <span className="text-[10px] text-zinc-200 mt-0.5">24.5K</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-zinc-900/80 border border-white/20 flex items-center justify-center text-sky-400">
                💬
              </div>
              <span className="text-[10px] text-zinc-200 mt-0.5">1.2K</span>
            </div>
          </div>

          {/* Subtitle / Caption Dynamic Overlay */}
          {currentCaption && (
            <div className="absolute bottom-16 inset-x-4 z-20 flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              <div className={getCaptionStyleClasses()}>
                {currentCaption.emoji && <span className="mr-1.5">{currentCaption.emoji}</span>}
                {currentCaption.highlight ? (
                  <span>
                    {currentCaption.text.split(currentCaption.highlight).map((part, i, arr) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="text-sky-300 underline underline-offset-4 font-black">
                            {currentCaption.highlight}
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </span>
                ) : (
                  <span>{currentCaption.text}</span>
                )}
              </div>
            </div>
          )}

          {/* Bottom Video Info Title overlay */}
          <div className="absolute bottom-3 left-3 right-12 z-20 text-left pointer-events-none">
            <p className="text-xs font-bold text-white line-clamp-1">@{clip.category} • ClipA</p>
            <p className="text-[11px] text-zinc-300 line-clamp-1">{clip.title}</p>
          </div>

          {/* Center Play/Pause Click Handler Overlay */}
          <div 
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-14 h-14 rounded-full bg-zinc-900/90 border border-sky-400/80 flex items-center justify-center text-sky-400 shadow-2xl hover:scale-110 transition-transform">
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </div>
          </div>

        </div>
      </div>

      {/* Subtitle Style Preset Selector Bar */}
      <div className="w-full pt-2 border-t border-zinc-800/80 mt-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
          <span className="flex items-center gap-1 font-semibold text-zinc-300">
            <Type className="w-3.5 h-3.5 text-sky-400" /> Gaya Subtitle:
          </span>
          <span className="text-[11px] text-sky-400 font-medium">Otomatis Terjemah & Highlight</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => setCaptionStyle('hormozi')}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              captionStyle === 'hormozi'
                ? 'bg-yellow-400 text-black border-yellow-300 shadow-md shadow-yellow-500/20'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            ⚡ Hormozi
          </button>
          <button
            onClick={() => setCaptionStyle('neon')}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              captionStyle === 'neon'
                ? 'bg-sky-500 text-black border-sky-300 shadow-md shadow-sky-500/20'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            💎 Neon
          </button>
          <button
            onClick={() => setCaptionStyle('karaoke')}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              captionStyle === 'karaoke'
                ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-500/20'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            🎤 Karaoke
          </button>
          <button
            onClick={() => setCaptionStyle('minimal')}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              captionStyle === 'minimal'
                ? 'bg-zinc-200 text-black border-white'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            ✨ Minimal
          </button>
        </div>
      </div>

    </div>
  );
};
