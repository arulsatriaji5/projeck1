import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Download, 
  RotateCcw, 
  Sparkles, 
  Code2, 
  ChevronDown, 
  Layers, 
  FileVideo 
} from 'lucide-react';
import { ManualBlueprint, ManualSubtitleItem } from '../types';
import { VideoPreviewCanvas } from './manual-editor/VideoPreviewCanvas';
import { PropertiesInspector } from './manual-editor/PropertiesInspector';
import { InteractiveTimeline } from './manual-editor/InteractiveTimeline';
import { CloudExportModal } from './manual-editor/CloudExportModal';

interface ManualEditorViewProps {
  onClose: () => void;
  isVisible?: boolean;
}

// Default Blueprint yang dihasilkan dari Gemini 2.5 Flash
const DEFAULT_GEMINI_BLUEPRINT: ManualBlueprint = {
  clip_title: '🔥 Trik Rahasia 3 Detik Pertama FYP TikTok',
  start_time: 12.0,
  end_time: 44.5,
  duration: 32.5,
  videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  aspectRatio: '9:16',
  subtitles: [
    {
      id: 'sub-1',
      start: 0.0,
      end: 2.4,
      text: 'TERNYATA 90% PENONTON BAKAL SCROLL...',
      highlight: '90% PENONTON',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 34,
      color: '#FFFFFF',
      highlightColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowBlur: 8,
      animation: 'pop',
      yOffsetPercent: 54
    },
    {
      id: 'sub-2',
      start: 2.4,
      end: 5.6,
      text: 'KALAU 3 DETIK AWAL GAK MENARIK!',
      highlight: '3 DETIK AWAL',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 36,
      color: '#FACC15',
      highlightColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 4.5,
      shadowBlur: 10,
      animation: 'pop',
      yOffsetPercent: 54
    },
    {
      id: 'sub-3',
      start: 5.6,
      end: 10.2,
      text: 'GUNAKAN FORMULA PANCINGAN EMOSI INI!',
      highlight: 'PANCINGAN EMOSI',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 32,
      color: '#38BDF8',
      highlightColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowBlur: 8,
      animation: 'karaoke',
      yOffsetPercent: 54
    },
    {
      id: 'sub-4',
      start: 10.2,
      end: 15.5,
      text: 'POTONG KLIP TANPA JEDA NAFAS SEDETIK PUN.',
      highlight: 'TANPA JEDA',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 32,
      color: '#FFFFFF',
      highlightColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowBlur: 8,
      animation: 'pop',
      yOffsetPercent: 54
    },
    {
      id: 'sub-5',
      start: 15.5,
      end: 21.0,
      text: 'DAN BERIKAN SUBTITLE KUNING NEON TEBAL.',
      highlight: 'KUNING NEON',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 35,
      color: '#FACC15',
      highlightColor: '#38BDF8',
      strokeColor: '#000000',
      strokeWidth: 4.5,
      shadowBlur: 10,
      animation: 'pop',
      yOffsetPercent: 54
    },
    {
      id: 'sub-6',
      start: 21.0,
      end: 27.5,
      text: 'VIDEO ANDA SIAP VIRAL DI SEMUA PLATFORM!',
      highlight: 'SIAP VIRAL',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 36,
      color: '#4ADE80',
      highlightColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 5,
      shadowBlur: 12,
      animation: 'karaoke',
      yOffsetPercent: 54
    },
    {
      id: 'sub-7',
      start: 27.5,
      end: 32.5,
      text: 'COBA SEKARANG DI CLIPA STUDIO!',
      highlight: 'COBA SEKARANG',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 38,
      color: '#F43F5E',
      highlightColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 5,
      shadowBlur: 12,
      animation: 'pop',
      yOffsetPercent: 54
    }
  ]
};

export const ManualEditorView: React.FC<ManualEditorViewProps> = ({ 
  onClose, 
  isVisible = false 
}) => {
  // Central Non-Destructive State
  const [blueprint, setBlueprint] = useState<ManualBlueprint>(DEFAULT_GEMINI_BLUEPRINT);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>('sub-1');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Playhead sync is driven at 60fps via VideoPreviewCanvas requestAnimationFrame locked to <video>.currentTime

  // Spacebar hotkey to toggle playback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'TEXTAREA' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // Find currently selected subtitle object
  const selectedSubtitle = blueprint.subtitles.find(
    (s) => s.id === selectedSubtitleId
  ) || null;

  // Subtitle Updates (Non-destructive update to JSON state)
  const handleUpdateSubtitle = (updated: ManualSubtitleItem) => {
    setBlueprint((prev) => ({
      ...prev,
      subtitles: prev.subtitles.map((s) => (s.id === updated.id ? updated : s))
    }));
  };

  const handleDeleteSubtitle = (id: string) => {
    setBlueprint((prev) => ({
      ...prev,
      subtitles: prev.subtitles.filter((s) => s.id !== id)
    }));
    if (selectedSubtitleId === id) {
      setSelectedSubtitleId(null);
    }
  };

  const handleDuplicateSubtitle = (id: string) => {
    const original = blueprint.subtitles.find((s) => s.id === id);
    if (!original) return;

    const newSub: ManualSubtitleItem = {
      ...original,
      id: `sub-${Date.now()}`,
      start: Math.min(blueprint.duration - 1, original.end + 0.2),
      end: Math.min(blueprint.duration, original.end + (original.end - original.start) + 0.2),
      text: `${original.text} (Copy)`
    };

    setBlueprint((prev) => ({
      ...prev,
      subtitles: [...prev.subtitles, newSub].sort((a, b) => a.start - b.start)
    }));
    setSelectedSubtitleId(newSub.id);
  };

  const handleAddSubtitleAtPlayhead = () => {
    const newStart = Math.round(currentTime * 10) / 10;
    const newEnd = Math.min(blueprint.duration, Math.round((newStart + 2.5) * 10) / 10);

    const newSub: ManualSubtitleItem = {
      id: `sub-${Date.now()}`,
      start: newStart,
      end: newEnd,
      text: 'TEKS SUBTITLE BARU',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 34,
      color: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowBlur: 8,
      animation: 'pop',
      yOffsetPercent: 54
    };

    setBlueprint((prev) => ({
      ...prev,
      subtitles: [...prev.subtitles, newSub].sort((a, b) => a.start - b.start)
    }));
    setSelectedSubtitleId(newSub.id);
  };

  const handleSplitSubtitleAtPlayhead = () => {
    const active = blueprint.subtitles.find(
      (s) => currentTime > s.start + 0.3 && currentTime < s.end - 0.3
    );
    if (!active) return;

    const splitTime = Math.round(currentTime * 10) / 10;
    const firstHalf: ManualSubtitleItem = {
      ...active,
      end: splitTime
    };

    const secondHalf: ManualSubtitleItem = {
      ...active,
      id: `sub-${Date.now()}`,
      start: splitTime
    };

    setBlueprint((prev) => ({
      ...prev,
      subtitles: prev.subtitles
        .map((s) => (s.id === active.id ? firstHalf : s))
        .concat(secondHalf)
        .sort((a, b) => a.start - b.start)
    }));
    setSelectedSubtitleId(secondHalf.id);
  };

  // Batch Presets
  const handleApplyPresetToAll = (presetType: 'hormozi' | 'montserrat' | 'karaoke') => {
    setBlueprint((prev) => ({
      ...prev,
      subtitles: prev.subtitles.map((s) => {
        if (presetType === 'hormozi') {
          return {
            ...s,
            fontFamily: 'Montserrat, sans-serif',
            color: '#FACC15',
            strokeColor: '#000000',
            strokeWidth: 4.5,
            shadowBlur: 10,
            animation: 'pop'
          };
        } else if (presetType === 'karaoke') {
          return {
            ...s,
            animation: 'karaoke',
            highlightColor: '#FACC15'
          };
        } else {
          return {
            ...s,
            fontFamily: 'Montserrat, sans-serif'
          };
        }
      })
    }));
  };

  const handleResetBlueprint = () => {
    setBlueprint(DEFAULT_GEMINI_BLUEPRINT);
    setCurrentTime(0);
    setSelectedSubtitleId('sub-1');
  };

  return (
    <div 
      id="manualEditorView" 
      className={`${isVisible ? 'flex' : 'hidden'} fixed inset-0 z-50 bg-[#F8F9FA] text-[#0B1F3A] flex-col font-sans select-none overflow-hidden`}
    >
      
      {/* Header Studio Manual */}
      <header className="w-full h-16 bg-[#0B1F3A] text-white flex justify-between items-center px-4 sm:px-6 shrink-0 z-20 shadow-md">
        
        {/* Left: Back/Close & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 text-slate-200 hover:text-white rounded-xl hover:bg-[#122E56] transition-colors cursor-pointer inline-flex items-center justify-center"
            title="Tutup"
            aria-label="Tutup"
          >
            <X className="w-4 h-4 text-sky-400" />
          </button>
          
          <div className="h-5 w-px bg-white/15 shrink-0" />
          
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-white p-1 shadow-sm flex items-center justify-center shrink-0">
              <img 
                src="/assets/aistudio/clipA_dae34944.png" 
                alt="ClipA Logo" 
                className="w-full h-full object-contain" 
              />
            </span>
            <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight whitespace-nowrap">
              Editor Video
            </h1>
            <span className="text-[11px] text-slate-300 hidden md:inline truncate">
              · {blueprint.clip_title}
            </span>
          </div>
        </div>

        {/* Right: Reset AI Blueprint & Prominent Export Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetBlueprint}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#122E56] hover:bg-[#1B4278] text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            title="Kembalikan pengaturan awal AI"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span>Reset AI</span>
          </button>

          {/* Export Button */}
          <button 
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#2563EB] text-white font-bold text-xs transition-all duration-150 cursor-pointer shadow-md whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor MP4</span>
          </button>
        </div>

      </header>

      {/* Main Workspace Section */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden min-h-0">
        
        {/* Top Left: Video Preview Canvas */}
        <div className="col-span-12 lg:col-span-7 h-full min-h-0">
          <VideoPreviewCanvas
            videoSrc={blueprint.videoSrc}
            currentTime={currentTime}
            duration={blueprint.duration}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onSeek={(t) => setCurrentTime(t)}
            onVideoTimeUpdate={(t) => setCurrentTime(t)}
            subtitles={blueprint.subtitles}
            selectedSubtitleId={selectedSubtitleId}
            onSelectSubtitle={(id) => setSelectedSubtitleId(id)}
          />
        </div>

        {/* Top Right: Properties Inspector */}
        <div className="col-span-12 lg:col-span-5 h-full min-h-0">
          <PropertiesInspector
            selectedSubtitle={selectedSubtitle}
            onUpdateSubtitle={handleUpdateSubtitle}
            onDeleteSubtitle={handleDeleteSubtitle}
            onDuplicateSubtitle={handleDuplicateSubtitle}
            onAddSubtitleAtPlayhead={handleAddSubtitleAtPlayhead}
            onApplyPresetToAll={handleApplyPresetToAll}
          />
        </div>

      </div>

      {/* Bottom Half: Interactive Horizontal Timeline */}
      <div className="h-44 sm:h-52 px-4 pb-4 shrink-0">
        <InteractiveTimeline
          duration={blueprint.duration}
          currentTime={currentTime}
          onSeek={(t) => setCurrentTime(t)}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          subtitles={blueprint.subtitles}
          selectedSubtitleId={selectedSubtitleId}
          onSelectSubtitle={(id) => setSelectedSubtitleId(id)}
          onUpdateSubtitle={handleUpdateSubtitle}
          onAddSubtitleAtPlayhead={handleAddSubtitleAtPlayhead}
          onSplitSubtitleAtPlayhead={handleSplitSubtitleAtPlayhead}
        />
      </div>

      {/* Cloud Export Modal */}
      <CloudExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        blueprint={blueprint}
      />

    </div>
  );
};
