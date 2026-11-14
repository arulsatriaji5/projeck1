import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Plus, 
  Scissors, 
  ZoomIn, 
  ZoomOut, 
  Film, 
  MessageSquareText, 
  Lock, 
  Eye, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ManualSubtitleItem } from '../../types';

interface InteractiveTimelineProps {
  duration: number; // total seconds of clip
  currentTime: number; // current playhead time
  onSeek: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  subtitles: ManualSubtitleItem[];
  selectedSubtitleId: string | null;
  onSelectSubtitle: (id: string) => void;
  onUpdateSubtitle: (updated: ManualSubtitleItem) => void;
  onAddSubtitleAtPlayhead: () => void;
  onSplitSubtitleAtPlayhead?: () => void;
}

export const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({
  duration,
  currentTime,
  onSeek,
  isPlaying,
  onTogglePlay,
  subtitles,
  selectedSubtitleId,
  onSelectSubtitle,
  onUpdateSubtitle,
  onAddSubtitleAtPlayhead,
  onSplitSubtitleAtPlayhead
}) => {
  const [zoomLevel, setZoomLevel] = useState(1); // 1x to 3x
  const tracksContainerRef = useRef<HTMLDivElement | null>(null);

  // Dragging & Resizing State
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize-left' | 'resize-right' | 'scrub-playhead';
    subtitleId?: string;
    startX: number;
    initialStart?: number;
    initialEnd?: number;
  } | null>(null);

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs}.${ms}`;
  };

  // Convert client X to seconds relative to track container
  const getTimeFromClientX = useCallback((clientX: number): number => {
    if (!tracksContainerRef.current) return 0;
    const rect = tracksContainerRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = offsetX / rect.width;
    return Math.max(0, Math.min(duration, percent * duration));
  }, [duration]);

  // Handle Playhead Scrubbing on Ruler
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const newTime = getTimeFromClientX(e.clientX);
    onSeek(newTime);
    setDragState({
      type: 'scrub-playhead',
      startX: e.clientX
    });
  };

  // Handle Drag / Resize on Subtitle Block
  const handleBlockMouseDown = (
    e: React.MouseEvent,
    sub: ManualSubtitleItem,
    actionType: 'move' | 'resize-left' | 'resize-right'
  ) => {
    e.stopPropagation();
    onSelectSubtitle(sub.id);

    setDragState({
      type: actionType,
      subtitleId: sub.id,
      startX: e.clientX,
      initialStart: sub.start,
      initialEnd: sub.end
    });
  };

  // Global mousemove and mouseup listeners for smooth dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !tracksContainerRef.current) return;

      const rect = tracksContainerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragState.startX;
      const deltaTime = (deltaX / rect.width) * duration;

      if (dragState.type === 'scrub-playhead') {
        const newTime = getTimeFromClientX(e.clientX);
        onSeek(newTime);
        return;
      }

      if (!dragState.subtitleId || dragState.initialStart === undefined || dragState.initialEnd === undefined) {
        return;
      }

      const targetSub = subtitles.find(s => s.id === dragState.subtitleId);
      if (!targetSub) return;

      if (dragState.type === 'move') {
        const subDuration = dragState.initialEnd - dragState.initialStart;
        let newStart = Math.max(0, Math.min(duration - subDuration, dragState.initialStart + deltaTime));
        let newEnd = newStart + subDuration;
        newStart = Math.round(newStart * 10) / 10;
        newEnd = Math.round(newEnd * 10) / 10;

        onUpdateSubtitle({
          ...targetSub,
          start: newStart,
          end: newEnd
        });
      } else if (dragState.type === 'resize-left') {
        let newStart = Math.max(0, Math.min(dragState.initialEnd - 0.3, dragState.initialStart + deltaTime));
        newStart = Math.round(newStart * 10) / 10;

        onUpdateSubtitle({
          ...targetSub,
          start: newStart
        });
      } else if (dragState.type === 'resize-right') {
        let newEnd = Math.max(dragState.initialStart + 0.3, Math.min(duration, dragState.initialEnd + deltaTime));
        newEnd = Math.round(newEnd * 10) / 10;

        onUpdateSubtitle({
          ...targetSub,
          end: newEnd
        });
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
  }, [dragState, duration, getTimeFromClientX, onSeek, onUpdateSubtitle, subtitles]);

  // Generate ruler tick marks
  const rulerTicks = [];
  const tickStep = duration > 40 ? 5 : duration > 20 ? 2 : 1;
  for (let t = 0; t <= duration; t += tickStep) {
    rulerTicks.push(t);
  }

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="h-full bg-white rounded-3xl p-4 flex flex-col justify-between shadow-sm select-none relative overflow-hidden">
      
      {/* Timeline Top Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-3 text-xs shrink-0">
        
        {/* Left: Timecode & Transport */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onTogglePlay}
            className="px-3.5 py-1.5 rounded-xl bg-[#0B1F3A] hover:bg-[#122E56] text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm whitespace-nowrap"
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

          <div className="flex items-center gap-2 bg-[#EEF2F7] px-3 py-1.5 rounded-xl font-mono tabular-nums text-xs">
            <span className="text-[#1D4ED8] font-bold">{formatTimecode(currentTime)}</span>
            <span className="text-slate-400">/</span>
            <span className="text-[#0B1F3A] font-medium">{formatTimecode(duration)}</span>
          </div>

          {onSplitSubtitleAtPlayhead && (
            <button
              type="button"
              onClick={onSplitSubtitleAtPlayhead}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EEF2F7] hover:bg-slate-200 text-[#0B1F3A] font-semibold transition-colors cursor-pointer whitespace-nowrap"
              title="Potong subtitle di posisi playhead"
            >
              <Scissors className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Split (Pisahkan Teks)</span>
            </button>
          )}
        </div>

        {/* Right: Add Subtitle & Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddSubtitleAtPlayhead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E6EDF7] hover:bg-[#1D4ED8] text-[#0B1F3A] hover:text-white font-bold transition-all cursor-pointer text-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Subtitle di Kursor</span>
          </button>

          <div className="hidden md:flex items-center gap-1 bg-[#EEF2F7] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.25))}
              className="p-1 rounded-lg text-slate-600 hover:text-[#0B1F3A] hover:bg-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono tabular-nums text-[#0B1F3A] font-semibold px-1.5">{zoomLevel.toFixed(1)}x</span>
            <button
              type="button"
              onClick={() => setZoomLevel(Math.min(2.5, zoomLevel + 0.25))}
              className="p-1 rounded-lg text-slate-600 hover:text-[#0B1F3A] hover:bg-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Timeline Tracks Area */}
      <div className="flex-1 flex flex-col pt-2 min-h-0 relative">
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Track Headers */}
          <div className="w-36 sm:w-44 shrink-0 flex flex-col border-r border-slate-100 pr-2 space-y-2">
            
            {/* Header spacer for Ruler */}
            <div className="h-6 flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
              <span>Track / Waktu</span>
            </div>

            {/* Track 1 Label: Subtitles */}
            <div className="h-14 bg-[#F8F9FA] rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-[#E6EDF7] text-[#1D4ED8] shrink-0">
                  <MessageSquareText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#0B1F3A] truncate">Subtitle Teks</p>
                  <p className="text-[9px] text-slate-500 tabular-nums">{subtitles.length} Balok</p>
                </div>
              </div>
            </div>

            {/* Track 2 Label: Main Video */}
            <div className="h-14 bg-[#F8F9FA] rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-[#0B1F3A] text-white shrink-0">
                  <Film className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#0B1F3A] truncate">Video Utama</p>
                  <p className="text-[9px] text-slate-500">9:16 Subclipped</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Tracks Container */}
          <div 
            ref={tracksContainerRef}
            className="flex-1 relative overflow-hidden pl-3 flex flex-col space-y-2 cursor-pointer"
          >
            
            {/* Time Ruler Bar */}
            <div 
              onMouseDown={handleRulerMouseDown}
              className="h-6 relative border-b border-slate-200 cursor-ew-resize flex items-end select-none"
            >
              {rulerTicks.map((t) => {
                const percent = (t / duration) * 100;
                return (
                  <div
                    key={t}
                    className="absolute bottom-0 transform -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${percent}%` }}
                  >
                    <span className="text-[9px] text-slate-500 font-mono tabular-nums leading-none mb-1">
                      {formatTimecode(t).slice(3)}
                    </span>
                    <div className="h-1.5 w-px bg-slate-300" />
                  </div>
                );
              })}
            </div>

            {/* Track 1: Subtitle Track (Draggable & Resizable Blocks) */}
            <div className="h-14 bg-[#F8F9FA] rounded-xl relative overflow-hidden">
              {subtitles.map((sub) => {
                const isSelected = selectedSubtitleId === sub.id;
                const leftPercent = (sub.start / duration) * 100;
                const widthPercent = Math.max(1.5, ((sub.end - sub.start) / duration) * 100);

                return (
                  <div
                    key={sub.id}
                    onMouseDown={(e) => handleBlockMouseDown(e, sub, 'move')}
                    className={`absolute top-1.5 bottom-1.5 rounded-lg transition-shadow cursor-move flex items-center justify-between group overflow-hidden select-none ${
                      isSelected
                        ? 'bg-[#0B1F3A] text-white ring-2 ring-[#1D4ED8] shadow-md z-10'
                        : 'bg-[#E6EDF7] hover:bg-[#D5E2F4] text-[#0B1F3A]'
                    }`}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                    title={`"${sub.text}" (${sub.start.toFixed(1)}s - ${sub.end.toFixed(1)}s)`}
                  >
                    {/* Left Resize Handle */}
                    <div
                      onMouseDown={(e) => handleBlockMouseDown(e, sub, 'resize-left')}
                      className={`w-2.5 h-full cursor-ew-resize shrink-0 transition-colors flex items-center justify-center ${
                        isSelected ? 'bg-[#122E56] hover:bg-[#1D4ED8]' : 'bg-slate-300/60 hover:bg-[#1D4ED8]'
                      }`}
                    >
                      <div className={`w-0.5 h-3 ${isSelected ? 'bg-white/70' : 'bg-slate-500'}`} />
                    </div>

                    {/* Block Text Content Preview */}
                    <div className="flex-1 px-1.5 truncate text-[10px] font-bold flex items-center gap-1">
                      <span className="truncate">{sub.text}</span>
                    </div>

                    {/* Right Resize Handle */}
                    <div
                      onMouseDown={(e) => handleBlockMouseDown(e, sub, 'resize-right')}
                      className={`w-2.5 h-full cursor-ew-resize shrink-0 transition-colors flex items-center justify-center ${
                        isSelected ? 'bg-[#122E56] hover:bg-[#1D4ED8]' : 'bg-slate-300/60 hover:bg-[#1D4ED8]'
                      }`}
                    >
                      <div className={`w-0.5 h-3 ${isSelected ? 'bg-white/70' : 'bg-slate-500'}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Track 2: Main Video Track */}
            <div className="h-14 bg-[#F8F9FA] rounded-xl relative overflow-hidden flex items-center">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F3A] via-[#122E56] to-[#0B1F3A] rounded-xl flex items-center px-3 justify-between overflow-hidden">
                <div className="flex items-center gap-2 text-[11px] font-bold text-white">
                  <Film className="w-3.5 h-3.5 text-sky-300" />
                  <span>Klip Video Utama (9:16 Center Crop)</span>
                </div>

                {/* Filmstrip Frames */}
                <div className="flex items-center gap-1 opacity-30">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="h-6 w-5 bg-white/30 rounded-sm shrink-0" />
                  ))}
                </div>
              </div>
            </div>

            {/* Playhead Cursor */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-30 transition-transform duration-75"
              style={{
                left: `calc(12px + ${playheadPercent}%)`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="w-4 h-4 bg-[#1D4ED8] rounded-sm flex items-center justify-center shadow-md -mt-1 transform rotate-45 pointer-events-auto cursor-ew-resize" />
              <div className="w-0.5 h-full bg-[#1D4ED8] shadow-[0_0_8px_rgba(29,78,216,0.6)] mx-auto" />
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
