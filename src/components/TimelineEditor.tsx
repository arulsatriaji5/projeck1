import React, { useState } from 'react';
import { ClipItem } from '../types';
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
  EyeOff 
} from 'lucide-react';

interface TimelineEditorProps {
  clip: ClipItem;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  clip,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showCaptionsTrack, setShowCaptionsTrack] = useState(true);

  const totalDurationSeconds = clip.endTime - clip.startTime || 30;

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    setCurrentTime(newProgress * totalDurationSeconds);
  };

  const playheadPercentage = Math.min(100, Math.max(0, (currentTime / totalDurationSeconds) * 100));

  return (
    <div className="w-full bg-zinc-950 rounded-2xl border border-zinc-800 p-4 shadow-2xl flex flex-col gap-3">
      
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        
        {/* Left Playback & Edit Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTime(0)}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            title="Reset ke awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Play Preview
              </>
            )}
          </button>

          <button
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold transition-colors"
            title="Potong klip pada playhead (Split Cut)"
          >
            <Scissors className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Split Cut</span>
          </button>
        </div>

        {/* Center Timecode Display */}
        <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-sky-400 font-bold flex items-center gap-2">
          <span>{formatTime(currentTime)}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400">{formatTime(totalDurationSeconds)}</span>
        </div>

        {/* Right Controls: Zoom & Mute */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isAudioMuted
                ? 'bg-rose-950/40 text-rose-400 border-rose-800'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
            title="Mute Audio Track"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.2))}
              className="p-1 text-zinc-400 hover:text-zinc-200"
              title="Zoom out timeline"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-zinc-400 px-1">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.2))}
              className="p-1 text-zinc-400 hover:text-zinc-200"
              title="Zoom in timeline"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Multi-Track Editor Timeline Container */}
      <div className="relative w-full overflow-x-auto bg-zinc-900/90 rounded-xl border border-zinc-800 p-3 flex flex-col gap-2.5">
        
        {/* Timeline Ruler / Time Indicators */}
        <div className="flex items-center gap-2">
          <div className="w-28 sm:w-36 shrink-0 text-xs font-mono text-zinc-500 font-semibold px-2">
            TIMECODE
          </div>
          <div 
            onClick={handleTimelineClick}
            className="relative flex-1 h-7 bg-zinc-950 rounded-lg border border-zinc-800/80 px-3 flex items-center justify-between text-[10px] text-zinc-400 font-mono cursor-pointer select-none"
          >
            <span>00:00.0</span>
            <span>00:05.0</span>
            <span>00:10.0</span>
            <span>00:15.0</span>
            <span>00:20.0</span>
            <span>{formatTime(totalDurationSeconds)}</span>

            {/* Interactive Sky-Blue Playhead Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-sky-400 z-30 pointer-events-none transition-all duration-75"
              style={{ left: `${playheadPercentage}%` }}
            >
              <div className="w-3.5 h-3.5 -ml-1.5 -top-1 absolute bg-sky-400 rotate-45 rounded-sm shadow-md shadow-sky-400/50" />
            </div>
          </div>
        </div>

        {/* TRACK 1: 🎬 Video Track */}
        <div className="flex items-center gap-2">
          {/* Track Header */}
          <div className="w-28 sm:w-36 shrink-0 flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-xs font-semibold text-zinc-300">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Film className="w-3.5 h-3.5 text-sky-400" /> Track Video
            </span>
            <Lock className="w-3 h-3 text-zinc-600 cursor-pointer hover:text-zinc-400" />
          </div>

          {/* Track Content Blocks */}
          <div 
            onClick={handleTimelineClick}
            className="relative flex-1 h-12 bg-zinc-950 rounded-lg border border-zinc-800/80 p-1 flex items-center overflow-hidden cursor-pointer"
          >
            {/* Active Video Clip Segment Block (Solid Sky Blue Tint) */}
            <div 
              className="h-full bg-sky-950/70 border-2 border-sky-400/80 rounded-md flex items-center justify-between px-3 relative shadow-md shadow-sky-500/10"
              style={{ width: '100%' }}
            >
              {/* Left Trim Handle */}
              <div className="w-2 h-7 bg-sky-400 rounded-full cursor-ew-resize hover:scale-110 shadow" />

              <span className="text-xs font-bold text-sky-200 truncate mx-2 flex items-center gap-2">
                <span>🎬 {clip.title}</span>
                <span className="text-[10px] text-sky-400/80 bg-sky-900/60 px-1.5 py-0.5 rounded">({clip.duration})</span>
              </span>

              {/* Right Trim Handle */}
              <div className="w-2 h-7 bg-sky-400 rounded-full cursor-ew-resize hover:scale-110 shadow" />
            </div>

            {/* Playhead Marker Overlay */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-sky-400 z-30 pointer-events-none"
              style={{ left: `${playheadPercentage}%` }}
            />
          </div>
        </div>

        {/* TRACK 2: 🎵 Audio Track */}
        <div className="flex items-center gap-2">
          {/* Track Header */}
          <div className="w-28 sm:w-36 shrink-0 flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-xs font-semibold text-zinc-300">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Music className="w-3.5 h-3.5 text-zinc-400" /> Track Audio
            </span>
            <button 
              onClick={() => setIsAudioMuted(!isAudioMuted)} 
              className="text-zinc-500 hover:text-zinc-300"
            >
              {isAudioMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3" />}
            </button>
          </div>

          {/* Track Content Waveform Blocks */}
          <div 
            onClick={handleTimelineClick}
            className="relative flex-1 h-10 bg-zinc-950 rounded-lg border border-zinc-800/80 p-1 flex items-center overflow-hidden cursor-pointer"
          >
            <div className={`w-full h-full rounded-md border flex items-center px-2 transition-opacity ${
              isAudioMuted 
                ? 'bg-zinc-900 border-zinc-800 opacity-40' 
                : 'bg-zinc-900/80 border-zinc-700/60'
            }`}>
              {/* Simulated Audio Waveform bars */}
              <div className="w-full flex items-center gap-0.5 h-6 overflow-hidden">
                {Array.from({ length: 64 }).map((_, i) => {
                  const height = Math.floor(Math.sin(i * 0.4) * 45 + 50);
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full ${isAudioMuted ? 'bg-zinc-700' : 'bg-sky-500/60'}`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Playhead Marker Overlay */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-sky-400 z-30 pointer-events-none"
              style={{ left: `${playheadPercentage}%` }}
            />
          </div>
        </div>

        {/* TRACK 3: 💬 Subtitle / Caption Track */}
        <div className="flex items-center gap-2">
          {/* Track Header */}
          <div className="w-28 sm:w-36 shrink-0 flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-xs font-semibold text-zinc-300">
            <span className="flex items-center gap-1.5 text-sky-300">
              <MessageSquareText className="w-3.5 h-3.5 text-sky-400" /> Track Subtitle
            </span>
            <button 
              onClick={() => setShowCaptionsTrack(!showCaptionsTrack)} 
              className="text-zinc-500 hover:text-zinc-300"
            >
              {showCaptionsTrack ? <Eye className="w-3 h-3 text-sky-400" /> : <EyeOff className="w-3 h-3 text-zinc-600" />}
            </button>
          </div>

          {/* Track Content Captions Segments */}
          <div 
            onClick={handleTimelineClick}
            className="relative flex-1 h-10 bg-zinc-950 rounded-lg border border-zinc-800/80 p-1 flex items-center gap-1.5 overflow-hidden cursor-pointer"
          >
            {showCaptionsTrack && clip.captions && clip.captions.map((cap, i) => {
              const startPct = (cap.start / totalDurationSeconds) * 100;
              const widthPct = ((cap.end - cap.start) / totalDurationSeconds) * 100;
              const isActive = currentTime >= cap.start && currentTime <= cap.end;

              return (
                <div
                  key={cap.id || i}
                  className={`h-full rounded-md border text-[11px] font-bold px-2 flex items-center justify-center truncate transition-all ${
                    isActive
                      ? 'bg-sky-500 text-black border-sky-300 font-extrabold shadow-md shadow-sky-500/20'
                      : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-zinc-700'
                  }`}
                  style={{ width: `${Math.max(12, widthPct)}%` }}
                  title={`${cap.start}s - ${cap.end}s: ${cap.text}`}
                >
                  <span className="truncate">{cap.text}</span>
                </div>
              );
            })}

            {/* Playhead Marker Overlay */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-sky-400 z-30 pointer-events-none"
              style={{ left: `${playheadPercentage}%` }}
            />
          </div>
        </div>

      </div>

    </div>
  );
};

