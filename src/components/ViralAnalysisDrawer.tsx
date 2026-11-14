import React from 'react';
import { ClipItem } from '../types';
import { X, Flame, Lightbulb, Zap, MessageCircle, BarChart2 } from 'lucide-react';

interface ViralAnalysisDrawerProps {
  clip: ClipItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViralAnalysisDrawer: React.FC<ViralAnalysisDrawerProps> = ({
  clip,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !clip) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-950 border-l border-gray-800 h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between text-white">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-amber-400">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Analisis Virality AI</h2>
                <p className="text-xs text-gray-400">Prediksi Algoritma TikTok, Shorts &amp; Reels</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold">{clip.category}</span>
              <span className="text-gray-300 font-mono tabular-nums font-bold">
                Est. {clip.viewsEstimate || '100K+ Views'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">{clip.title}</h3>
            <p className="text-xs text-gray-400 italic">&ldquo;{clip.hook}&rdquo;</p>
          </div>

          <div className="bg-gray-900 border border-emerald-500/30 p-5 rounded-2xl text-center">
            <div className="text-4xl font-black font-mono tabular-nums text-emerald-400">
              {clip.viralScore} / 100
            </div>
            <p className="text-xs font-semibold text-gray-300 mt-1">
              Potensi Viral:{' '}
              <span className="text-emerald-400 font-bold">
                {clip.engagementRating || 'Sangat Tinggi'}
              </span>
            </p>
            <p className="text-xs text-gray-300 mt-3 leading-relaxed bg-gray-950 border border-gray-800 p-3 rounded-xl">
              &ldquo;{clip.scoreReason}&rdquo;
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-emerald-400" /> Prediksi Watch Time Retensi
              </span>
              <span className="text-emerald-400 font-mono tabular-nums font-bold">88.5%</span>
            </div>

            <div className="h-24 w-full flex items-end justify-between gap-1 pt-4 px-2 bg-gray-950 border border-gray-800 rounded-xl">
              {[98, 95, 92, 89, 94, 91, 88, 85, 87, 82, 80, 84].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-emerald-400/80 rounded-t-sm"
                    style={{ height: `${v}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono tabular-nums">
              <span>0s (Hook)</span>
              <span>15s (Inti)</span>
              <span>{clip.duration} (CTA)</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" /> Rekomendasi Optimasi
            </h4>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-gray-300">
                  <strong className="text-white">Pacing Subtitle:</strong> Gaya Hormozi menjaga mata audiens fokus di tengah frame 9:16.
                </p>
              </div>
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-start gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-gray-300">
                  <strong className="text-white">Pemicu Interaksi:</strong> Pernyataan pembuka mendorong komentar &amp; share di 5 detik pertama.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs cursor-pointer"
          >
            Tutup Analisis
          </button>
        </div>
      </div>
    </div>
  );
};
