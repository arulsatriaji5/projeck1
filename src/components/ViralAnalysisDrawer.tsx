import React from 'react';
import { ClipItem } from '../types';
import { X, Flame, TrendingUp, Sparkles, Lightbulb, Zap, MessageCircle, BarChart2 } from 'lucide-react';

interface ViralAnalysisDrawerProps {
  clip: ClipItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViralAnalysisDrawer: React.FC<ViralAnalysisDrawerProps> = ({
  clip,
  isOpen,
  onClose
}) => {
  if (!isOpen || !clip) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
        
        {/* Top Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Analisis Virality AI</h2>
                <p className="text-xs text-slate-400">Prediksi Performa Algoritma TikTok & Shorts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Clip Info Summary */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-400 font-semibold">{clip.category}</span>
              <span className="text-xs text-emerald-400 font-bold">Est. {clip.viewsEstimate || '100K+ Views'}</span>
            </div>
            <h3 className="text-sm font-bold text-white">{clip.title}</h3>
            <p className="text-xs text-slate-400 italic">"{clip.hook}"</p>
          </div>

          {/* Big Score Gauge Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/40 p-5 rounded-2xl border border-purple-500/30 text-center relative overflow-hidden">
            <div className="text-4xl font-extrabold bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 bg-clip-text text-transparent">
              {clip.viralScore} / 100
            </div>
            <p className="text-xs font-semibold text-slate-300 mt-1">
              Potensi Viral: <span className="text-emerald-400 font-bold">{clip.engagementRating || 'Extremely High'}</span>
            </p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              "{clip.scoreReason}"
            </p>
          </div>

          {/* Simulated Retention Curve Chart */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-cyan-400" /> Prediksi Watch Time Retensi
              </span>
              <span className="text-cyan-400 font-mono font-bold">88.5% Retensi</span>
            </div>

            {/* Custom Visual Retention Graph */}
            <div className="h-24 w-full relative flex items-end justify-between gap-1 pt-4 px-2 bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="w-full h-full absolute inset-0 flex items-center justify-between px-2 pointer-events-none opacity-20">
                <div className="w-full border-t border-dashed border-slate-500" />
              </div>
              {[98, 95, 92, 89, 94, 91, 88, 85, 87, 82, 80, 84].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 z-10">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-sm transition-all"
                    style={{ height: `${v}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>0s (Hook)</span>
              <span>15s (Core Point)</span>
              <span>{clip.duration} (CTA)</span>
            </div>
          </div>

          {/* AI Tips to Boost Views */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" /> Rekomendasi AI Untuk Dongkrak Reach
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-slate-300">
                  <strong className="text-white">Pacing Subtitle:</strong> Gunakan style <span className="text-cyan-300">Hormozi</span> dengan font tebal agar mata penonton terus berfokus di tengah layar.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <MessageCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-slate-300">
                  <strong className="text-white">Pemicu Komentar:</strong> Pertanyaan di detik ke-5 memancing netizen berdebat di kolom komentar.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Close Button */}
        <div className="pt-4 border-t border-slate-800 mt-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Tutup Analisis
          </button>
        </div>

      </div>
    </div>
  );
};
