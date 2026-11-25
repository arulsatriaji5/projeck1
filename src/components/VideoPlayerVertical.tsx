import React, { useState, useEffect, useRef } from 'react';
import { ClipItem, AspectRatioType, CaptionStyleType } from '../types';
import { SAMPLE_VIDEO_STREAM, CLIP_THUMBNAILS } from '../data/sampleData';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Edit3,
  Smartphone,
  Monitor,
  Square,
} from 'lucide-react';

interface VideoPlayerVerticalProps {
  clip: ClipItem;
  videoId: string;
  videoSrc?: string;
  thumbnailUrl?: string;
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
  videoSrc,
  thumbnailUrl,
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
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const effectiveDirectSrc =
    clip.mp4Url || clip.videoSrc || videoSrc || SAMPLE_VIDEO_STREAM;
  const effectivePoster =
    clip.thumbnailUrl || thumbnailUrl || CLIP_THUMBNAILS[0];

  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    let lastStamp = performance.now();
    const clipDurationSeconds = Math.max(1, clip.endTime - clip.startTime || 30);

    const step = (now: number) => {
      const video = videoElementRef.current;
      if (video && !video.paused && !video.seeking && video.readyState >= 2) {
        const live = video.currentTime;
        if (live >= clipDurationSeconds) {
          video.currentTime = 0;
          setCurrentTime(0);
        } else {
          setCurrentTime(live);
        }
        lastStamp = now;
      } else if (!video || video.readyState < 2) {
        const dt = Math.min(0.1, Math.max(0, (now - lastStamp) / 1000));
        lastStamp = now;
        if (dt > 0) {
          setCurrentTime((prev) => (prev + dt >= clipDurationSeconds ? 0 : prev + dt));
        }
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, clip, setCurrentTime]);

  useEffect(() => {
    if (videoElementRef.current) {
      if (isPlaying) {
        videoElementRef.current.play().catch(() => {});
      } else {
        videoElementRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoElementRef.current;
    if (video && Math.abs(video.currentTime - currentTime) > 0.35) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    if (clip.captions && clip.captions.length > 0) {
      const idx = clip.captions.findIndex(
        (c) => currentTime >= c.start && currentTime <= c.end
      );
      if (idx !== -1) {
        setActiveCaptionIndex(idx);
      } else {
        setActiveCaptionIndex(-1);
      }
    } else {
      setActiveCaptionIndex(-1);
    }
  }, [currentTime, clip]);

  const getCaptionStyleClasses = () => {
    switch (captionStyle) {
      case 'hormozi':
        return 'font-extrabold uppercase text-yellow-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] tracking-wide bg-black/80 px-3 py-1.5 rounded-lg text-center text-base sm:text-lg';
      case 'neon':
        return 'font-extrabold uppercase text-emerald-300 tracking-wider bg-gray-950/90 px-3 py-1.5 rounded-xl text-center text-base sm:text-lg shadow-lg';
      case 'karaoke':
        return 'font-black uppercase text-white tracking-tight bg-gray-950/95 px-3 py-1.5 rounded-lg text-center text-base sm:text-lg shadow-xl';
      default:
        return 'font-semibold text-white bg-black/80 px-3 py-1 rounded-md text-center text-sm sm:text-base';
    }
  };

  const currentCaption = activeCaptionIndex >= 0 ? clip.captions[activeCaptionIndex] : undefined;

  const renderHighlightedCaptionText = (text: string, subStart: number, subEnd: number) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return null;
    const progress = Math.max(0, Math.min(1, (currentTime - subStart) / Math.max(0.1, subEnd - subStart)));
    const activeWordIndex = Math.min(words.length - 1, Math.max(0, Math.floor(progress * words.length)));
    return (
      <span className="flex flex-wrap justify-center items-center gap-x-[0.3em] gap-y-1 max-w-[86%] mx-auto text-center">
        {words.map((word, wIdx) => {
          const isHighlight = wIdx === activeWordIndex;
          return (
            <span
              key={wIdx}
              style={{ paintOrder: 'stroke fill' }}
              className={
                isHighlight
                  ? 'inline-block whitespace-nowrap text-yellow-300 scale-105 transition-transform duration-100'
                  : 'inline-block whitespace-nowrap text-white'
              }
            >
              {word}{' '}
            </span>
          );
        })}
      </span>
    );
  };

  const getAspectRatioDimensions = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square h-full max-h-[380px] w-auto';
      case '16:9':
        return 'aspect-video w-full max-w-[500px] h-auto';
      default:
        return 'aspect-[9/16] h-full max-h-[410px] w-auto';
    }
  };

  const totalClipSeconds = Math.max(1, clip.endTime - clip.startTime || 30);

  return (
    <div className="flex flex-col items-center justify-between h-full w-full bg-gray-950 rounded-2xl p-4 relative overflow-hidden">
      {/* Top Bar Controls */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-800 mb-2">
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setAspectRatio('9:16')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              aspectRatio === '9:16'
                ? 'bg-emerald-500 text-gray-950'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> 9:16
          </button>
          <button
            type="button"
            onClick={() => setAspectRatio('1:1')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              aspectRatio === '1:1'
                ? 'bg-emerald-500 text-gray-950'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Square className="w-3.5 h-3.5" /> 1:1
          </button>
          <button
            type="button"
            onClick={() => setAspectRatio('16:9')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              aspectRatio === '16:9'
                ? 'bg-emerald-500 text-gray-950'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> 16:9
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCaptionEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Edit Subtitle</span>
          </button>
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor MP4</span>
          </button>
        </div>
      </div>

      {/* Center Player Frame Container (object-contain prevents 9:16 cropping) */}
      <div className="flex-1 w-full h-full flex items-center justify-center my-1 relative min-h-0">
        <div
          className={`relative ${getAspectRatioDimensions()} rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-lg flex flex-col items-center justify-center group`}
        >
          <video
            ref={videoElementRef}
            src={effectiveDirectSrc}
            poster={effectivePoster}
            playsInline
            muted={isMuted}
            loop
            className={`absolute inset-0 w-full h-full bg-black ${aspectRatio === '9:16' ? 'object-cover' : 'object-contain'}`}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />

          {currentCaption && (
            <div className="absolute top-[56%] -translate-y-1/2 inset-x-4 z-20 flex flex-col items-center justify-center pointer-events-none">
              <div className={getCaptionStyleClasses()}>
                {currentCaption.emoji && <span className="mr-1.5">{currentCaption.emoji}</span>}
                {renderHighlightedCaptionText(
                  currentCaption.text,
                  currentCaption.start,
                  currentCaption.end
                )}
              </div>
            </div>
          )}

          {clip.hook && clip.hook.trim().length > 0 && (
            <div className="absolute top-[76%] -translate-y-1/2 left-1/2 -translate-x-1/2 max-w-[88%] max-h-[36%] overflow-hidden w-max z-20 pointer-events-none text-center">
              <div className="bg-black/80 text-white font-extrabold text-[11px] px-3.5 py-2.5 rounded-xl shadow-lg border border-white/15 leading-snug line-clamp-3 text-center whitespace-normal break-words overflow-hidden">
                {clip.hook}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-white text-gray-950 flex items-center justify-center shadow-xl">
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Transport & Caption Style Bar */}
      <div className="w-full pt-3 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentTime(0)}
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 cursor-pointer"
            title="Ulang dari awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isPlaying ? 'Jeda' : 'Putar'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 cursor-pointer"
            title={isMuted ? 'Aktifkan Suara' : 'Bisukan'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 p-1 rounded-xl">
          {(['hormozi', 'neon', 'karaoke', 'minimal'] as CaptionStyleType[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setCaptionStyle(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                captionStyle === st
                  ? 'bg-emerald-500 text-gray-950'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <span className="font-mono tabular-nums text-xs font-bold text-gray-300">
          {currentTime.toFixed(1)}s / {totalClipSeconds.toFixed(1)}s
        </span>
      </div>
    </div>
  );
};
