import React from 'react';
import { ClipItem } from '../types';
import { Flame, Play, Clock, Sparkles, Check } from 'lucide-react';

interface ClipCardProps {
  clip: ClipItem;
  isSelected: boolean;
  onSelect: (clip: ClipItem) => void;
  onOpenAnalysis: (clip: ClipItem) => void;
}

export const ClipCard: React.FC<ClipCardProps> = ({
  clip,
  isSelected,
  onSelect,
  onOpenAnalysis
}) => {
  // Score badge color helper
  const getScoreBadgeColor = (score: number) => {
    if (score >= 95) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    if (score >= 90) return 'bg-sky-500/20 text-sky-400 border-sky-500/40';
    if (score >= 80) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
  };

  return (
    <div
      onClick={() => onSelect(clip)}
      className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer ${
        isSelected
          ? 'bg-zinc-900 border-sky-400 shadow-lg shadow-sky-500/10 ring-1 ring-sky-400/50'
          : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Top Bar: Category & Viral Score */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
          {clip.category}
        </span>

        {/* Viral Score Badge */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onOpenAnalysis(clip);
          }}
          className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border cursor-pointer hover:scale-105 transition-transform ${getScoreBadgeColor(clip.viralScore)}`}
          title="Klik untuk lihat Analisis Virality AI"
        >
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>{clip.viralScore}/100</span>
        </div>
      </div>

      {/* Main Title */}
      <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
        {clip.title}
      </h3>

      {/* Hook Line Quote */}
      <p className="mt-1.5 text-xs text-zinc-400 italic line-clamp-2 bg-zinc-950/80 p-2 rounded-lg border border-zinc-800/80">
        "{clip.hook}"
      </p>

      {/* Metadata Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>{clip.duration}</span>
        </div>

        {clip.viewsEstimate && (
          <span className="text-[11px] text-sky-400 font-medium">
            Est. {clip.viewsEstimate}
          </span>
        )}

        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onOpenAnalysis(clip);
            }}
            className="p-1 rounded text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 transition-colors"
            title="Analisis AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          
          <button
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
              isSelected
                ? 'bg-sky-500 text-black font-bold'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-3 h-3" /> Active
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" /> Preview
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

