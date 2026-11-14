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
  onOpenAnalysis,
}) => {
  return (
    <article
      onClick={() => onSelect(clip)}
      className={`group rounded-xl p-4 border transition-colors cursor-pointer ${
        isSelected
          ? 'bg-gray-900 border-emerald-400'
          : 'bg-gray-950 border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs mb-2">
        <span className="font-semibold text-emerald-400 truncate">{clip.category}</span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAnalysis(clip);
          }}
          className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer font-mono tabular-nums"
          title="Klik untuk lihat Analisis Virality AI"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span>{clip.viralScore}/100</span>
        </button>
      </div>

      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
        {clip.title}
      </h4>

      <p className="mt-2 text-xs text-gray-400 italic line-clamp-2 bg-gray-900 border border-gray-800 p-2.5 rounded-lg leading-relaxed">
        &ldquo;{clip.hook}&rdquo;
      </p>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400 pt-2.5 border-t border-gray-800">
        <div className="flex items-center gap-2 font-mono tabular-nums">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>{clip.duration}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAnalysis(clip);
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-colors cursor-pointer"
            title="Analisis AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap ${
              isSelected
                ? 'bg-emerald-500 text-gray-950'
                : 'bg-gray-900 text-gray-200 border border-gray-800'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-3 h-3" /> Aktif
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" /> Putar
              </>
            )}
          </span>
        </div>
      </div>
    </article>
  );
};
