import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ClipItem, CaptionItem } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Volume2,
  VolumeX,
  MessageSquareText,
  Film,
  Music,
  ZoomIn,
  ZoomOut,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  GripHorizontal,
} from 'lucide-react';

interface TimelineEditorProps {
  clip: ClipItem;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  onUpdateCaptions?: (updatedCaptions: CaptionItem[]) => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  clip,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  onUpdateCaptions,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showCaptionsTrack, setShowCaptionsTrack] = useState(true);
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);

  const timelineTrackContainerRef = useRef<HTMLDivElement | null>(null);

  const [dragState, setDragState] = useState<{
    type: 'scrub-playhead' | 'move-subtitle' | 'trim-left' | 'trim-right';
    captionId?: string;
    startX: number;
    initialStart?: number;
    initialEnd?: number;
    initialCurrentTime?: number;
  } | null>(null);

  const totalDurationSeconds = Math.max(5, clip.endTime - clip.startTime || 30);

  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, secs);
    const m = Math.floor(safeSecs / 60);
    const s = Math.floor(safeSecs % 60);
    const ms = Math.floor((safeSecs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const getSecondsFromClientX = useCallback(
    (clientX: number): number => {
      if (!timelineTrackContainerRef.current) return 0;
      const rect = timelineTrackContainerRef.current.getBoundingClientRect();
      const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const ratio = offsetX / rect.width;
      return Math.max(0, Math.min(totalDurationSeconds, ratio * totalDurationSeconds));
    },
    [totalDurationSeconds]
  );

  const handleRulerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const newSeconds = getSecondsFromClientX(e.clientX);
    setCurrentTime(newSeconds);
    setDragState({
      type: 'scrub-playhead',
      startX: e.clientX,
      initialCurrentTime: newSeconds,
    });
  };

  const handleSubtitleMouseDown = (
    e: React.MouseEvent,
    caption: CaptionItem,
    action: 'move-subtitle' | 'trim-left' | 'trim-right'
  ) => {
    e.stopPropagation();
    setSelectedCaptionId(caption.id);

    setDragState({
      type: action,
      captionId: caption.id,
      startX: e.clientX,
      initialStart: caption.start,
      initialEnd: caption.end,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !timelineTrackContainerRef.current) return;

      const rect = timelineTrackContainerRef.current.getBoundingClientRect();
      const deltaPixels = e.clientX - dragState.startX;
      const deltaTimeSeconds = (deltaPixels / rect.width) * totalDurationSeconds;

      if (dragState.type === 'scrub-playhead') {
        const newTime = getSecondsFromClientX(e.clientX);
        setCurrentTime(newTime);
        return;
      }

      if (!dragState.captionId || !clip.captions) return;
      const targetCaption = clip.captions.find((c) => c.id === dragState.captionId);
      if (!targetCaption || dragState.initialStart === undefined || dragState.initialEnd === undefined)
        return;

      const currentDuration = dragState.initialEnd - dragState.initialStart;
      let newStart = targetCaption.start;
      let newEnd = targetCaption.end;

      if (dragState.type === 'move-subtitle') {
        newStart = Math.max(
          0,
          Math.min(totalDurationSeconds - currentDuration, dragState.initialStart + deltaTimeSeconds)
        );
        newEnd = newStart + currentDuration;
      } else if (dragState.type === 'trim-left') {
        newStart = Math.max(0, Math.min(dragState.initialEnd - 0.3, dragState.initialStart + deltaTimeSeconds));
      } else if (dragState.type === 'trim-right') {
        newEnd = Math.min(
          totalDurationSeconds,
          Math.max(dragState.initialStart + 0.3, dragState.initialEnd + deltaTimeSeconds)
        );
      }

      newStart = Math.round(newStart * 10) / 10;
      newEnd = Math.round(newEnd * 10) / 10;

      const updatedCaptions = clip.captions.map((c) =>
        c.id === dragState.captionId ? { ...c, start: newStart, end: newEnd } : c
      );

      if (onUpdateCaptions) {
        onUpdateCaptions(updatedCaptions);
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        setDragState(null);
      }
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, clip.captions, totalDurationSeconds, getSecondsFromClientX, setCurrentTime, onUpdateCaptions]);

  const handleAddSubtitleAtPlayhead = () => {
    if (!onUpdateCaptions) return;
    const playheadTime = Math.round(currentTime * 10) / 10;
    const newCap: CaptionItem = {
      id: `c-new-${Date.now()}`,
      start: playheadTime,
      end: Math.min(totalDurationSeconds, Math.round((playheadTime + 2.5) * 10) / 10),
      text: 'TEKS SUBTITLE BARU',
      highlight: 'SUBTITLE BARU',
    };

    const updated = [...(clip.captions || []), newCap].sort((a, b) => a.start - b.start);
    onUpdateCaptions(updated);
    setSelectedCaptionId(newCap.id);
  };

  const handleSplitSubtitleAtPlayhead = () => {
    if (!onUpdateCaptions || !clip.captions) return;
    const activeSub = clip.captions.find(
      (c) => currentTime > c.start + 0.3 && currentTime < c.end - 0.3
    );
    if (!activeSub) return;

    const splitTime = Math.round(currentTime * 10) / 10;
    const firstHalf: CaptionItem = { ...activeSub, end: splitTime };
    const secondHalf: CaptionItem = {
      id: `c-split-${Date.now()}`,
      start: splitTime,
      end: activeSub.end,
      text: activeSub.text + ' (Lanjutan)',
      highlight: activeSub.highlight,
    };

    const updated = clip.captions
      .filter((c) => c.id !== activeSub.id)
      .concat([firstHalf, secondHalf])
      .sort((a, b) => a.start - b.start);

    onUpdateCaptions(updated);
    setSelectedCaptionId(secondHalf.id);
  };

  const handleDeleteSelectedCaption = () => {
    if (!selectedCaptionId || !onUpdateCaptions || !clip.captions) return;
    const updated = clip.captions.filter((c) => c.id !== selectedCaptionId);
    onUpdateCaptions(updated);
    setSelectedCaptionId(null);
  };

  const playheadPercentage = Math.min(100, Math.max(0, (currentTime / totalDurationSeconds) * 100));

  return (
    <div className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 select-none">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentTime(0)}
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 cursor-pointer"
            title="Reset ke awal klip"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs cursor-pointer whitespace-nowrap"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" /> Jeda
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" /> Putar Pratinjau
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleAddSubtitleAtPlayhead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tambah Teks</span>
          </button>

          <button
            type="button"
            onClick={handleSplitSubtitleAtPlayhead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            <Scissors className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Split Teks</span>
          </button>

          {selectedCaptionId && (
            <button
              type="button"
              onClick={handleDeleteSelectedCaption}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Hapus</span>
            </button>
          )}
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-gray-900 border border-gray-800 font-mono tabular-nums text-xs text-white font-bold flex items-center gap-2">
          <span className="text-emerald-400">{formatTime(currentTime)}</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400">{formatTime(totalDurationSeconds)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`p-2 rounded-lg text-xs border border-gray-800 cursor-pointer ${
              isAudioMuted ? 'bg-rose-500/15 text-rose-400' : 'bg-gray-900 text-gray-300 hover:text-white'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setZoomLevel(Math.max(0.8, Math.round((zoomLevel - 0.2) * 10) / 10))}
              className="p-1 text-gray-400 hover:text-white cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-white px-1 font-mono font-bold tabular-nums">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(Math.min(2.5, Math.round((zoomLevel + 0.2) * 10) / 10))}
              className="p-1 text-gray-400 hover:text-white cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Track Timeline Surface */}
      <div
        className="relative w-full overflow-x-auto bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-col gap-2.5"
        style={{ minWidth: `${zoomLevel * 100}%` }}
      >
        {/* Ruler & Playhead */}
        <div className="flex items-center gap-2">
          <div className="w-28 sm:w-36 shrink-0 text-[11px] font-mono text-gray-400 font-bold px-2 flex items-center justify-between">
            <span>Waktu</span>
            <span className="text-[10px] text-gray-500">Geser</span>
          </div>

          <div
            ref={timelineTrackContainerRef}
            onMouseDown={handleRulerMouseDown}
            className="relative flex-1 h-8 bg-gray-950 border border-gray-800 rounded-lg px-3 flex items-center justify-between text-[11px] text-gray-400 font-mono tabular-nums cursor-pointer select-none"
          >
            <span>00:00.0</span>
            <span>{formatTime(totalDurationSeconds * 0.2)}</span>
            <span>{formatTime(totalDurationSeconds * 0.4)}</span>
            <span>{formatTime(totalDurationSeconds * 0.6)}</span>
            <span>{formatTime(totalDurationSeconds * 0.8)}</span>
            <span>{formatTime(totalDurationSeconds)}</span>

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-40 pointer-events-auto cursor-ew-resize group/playhead"
              style={{ left: `${playheadPercentage}%` }}
              onMouseDown={handleRulerMouseDown}
            >
              <div className="w-3.5 h-3.5 -ml-[6px] -top-1.5 absolute bg-emerald-400 rotate-45 rounded-xs shadow-md" />
            </div>
          </div>
        </div>

        {/* Track 1: Video */}
        <div className="flex items-center gap-2">
          <div className="w-28 sm:w-36 shrink-0 flex items-center justify-between bg-gray-950 border border-gray-800 p-2 rounded-lg text-xs font-bold text-white">
            <span className="flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-emerald-400" /> Video
            </span>
            <Lock className="w-3 h-3 text-gray-500" />
          </div>

          <div
            onMouseDown={handleRulerMouseDown}
            className="relative flex-1 h-12 bg-gray-950 border border-gray-800 rounded-lg p-1 flex items-center overflow-hidden cursor-pointer"
          >
            <div className="h-full w-full bg-gray-800 text-white rounded-md flex items-center justify-between px-3">
              <div className="w-1.5 h-6 bg-emerald-400 rounded-full" />
              <span className="text-xs font-bold truncate mx-2 flex items-center gap-2">
                <span>{clip.title}</span>
                <span className="text-[11px] text-emerald-400 font-mono">({clip.duration})</span>
              </span>
              <div className="w-1.5 h-6 bg-emerald-400 rounded-full" />
            </div>

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-30 pointer-events-none"
              style={{ left: `${playheadPercentage}%` }}
            />
          </div>
        </div>

        {/* Track 2: Audio */}
        <div className="flex items-center gap-2">
          <div className="w-28 sm:w-36 shrink-0 flex items-center justify-between bg-gray-950 border border-gray-800 p-2 rounded-lg text-xs font-bold text-gray-300">
            <span className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-gray-400" /> Audio
            </span>
            <button
              type="button"
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              {isAudioMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3" />}
            </button>
          </div>

          <div
            onMouseDown={handleRulerMouseDown}
            className="relative flex-1 h-10 bg-gray-950 border border-gray-800 rounded-lg p-1 flex items-center overflow-hidden cursor-pointer"
          >
            <div
              className={`w-full h-full rounded-md flex items-center px-2 bg-gray-900 ${
                isAudioMuted ? 'opacity-40' : ''
              }`}
            >
              <div className="w-full flex items-center gap-0.5 h-6 overflow-hidden">
                {Array.from({ length: 64 }).map((_, i) => {
                  const height = Math.floor(Math.sin(i * 0.4) * 45 + 50);
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full ${
                        isAudioMuted ? 'bg-gray-600' : 'bg-emerald-500/50'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
            </div>

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-30 pointer-events-none"
              style={{ left: `${playheadPercentage}%` }}
            />
          </div>
        </div>

        {/* Track 3: Interactive Subtitle Blocks */}
        <div className="flex items-center gap-2">
          <div className="w-28 sm:w-36 shrink-0 flex items-center justify-between bg-gray-950 border border-gray-800 p-2 rounded-lg text-xs font-bold text-white">
            <span className="flex items-center gap-1.5">
              <MessageSquareText className="w-3.5 h-3.5 text-emerald-400" /> Subtitle
            </span>
            <button
              type="button"
              onClick={() => setShowCaptionsTrack(!showCaptionsTrack)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              {showCaptionsTrack ? (
                <Eye className="w-3 h-3 text-emerald-400" />
              ) : (
                <EyeOff className="w-3 h-3 text-gray-500" />
              )}
            </button>
          </div>

          <div
            onMouseDown={handleRulerMouseDown}
            className="relative flex-1 h-12 bg-gray-950 border border-gray-800 rounded-lg p-1 flex items-center overflow-hidden cursor-crosshair"
          >
            {showCaptionsTrack &&
              clip.captions &&
              clip.captions.map((cap) => {
                const startPct = Math.max(0, Math.min(100, (cap.start / totalDurationSeconds) * 100));
                const endPct = Math.max(0, Math.min(100, (cap.end / totalDurationSeconds) * 100));
                const widthPct = Math.max(2.5, endPct - startPct);
                const isSelected = selectedCaptionId === cap.id;
                const isPlayheadOver = currentTime >= cap.start && currentTime <= cap.end;

                return (
                  <div
                    key={cap.id}
                    onMouseDown={(e) => handleSubtitleMouseDown(e, cap, 'move-subtitle')}
                    className={`absolute h-10 rounded-lg text-[11px] font-bold flex items-center justify-between px-1.5 transition-colors select-none cursor-grab active:cursor-grabbing ${
                      isSelected
                        ? 'bg-emerald-500 text-gray-950 ring-2 ring-white z-20'
                        : isPlayheadOver
                        ? 'bg-emerald-500/80 text-gray-950 z-15'
                        : 'bg-gray-800 text-white hover:bg-gray-700 z-10'
                    }`}
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                    }}
                    title={`Geser untuk atur waktu: ${cap.start}s - ${cap.end}s`}
                  >
                    <div
                      onMouseDown={(e) => handleSubtitleMouseDown(e, cap, 'trim-left')}
                      className="w-1.5 h-6 rounded-sm bg-current opacity-40 hover:opacity-100 cursor-ew-resize shrink-0 mr-1"
                    />
                    <div className="flex-1 min-w-0 flex items-center gap-1 overflow-hidden pointer-events-none">
                      <GripHorizontal className="w-3 h-3 opacity-60 shrink-0" />
                      <span className="truncate font-bold text-[10px] sm:text-[11px] uppercase">
                        {cap.text}
                      </span>
                    </div>
                    <div
                      onMouseDown={(e) => handleSubtitleMouseDown(e, cap, 'trim-right')}
                      className="w-1.5 h-6 rounded-sm bg-current opacity-40 hover:opacity-100 cursor-ew-resize shrink-0 ml-1"
                    />
                  </div>
                );
              })}

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-30 pointer-events-none"
              style={{ left: `${playheadPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
