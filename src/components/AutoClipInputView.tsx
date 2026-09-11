import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Youtube, 
  Sparkles, 
  Wand2, 
  ArrowRight, 
  History, 
  Trash2, 
  ExternalLink,
  Play,
  Clock,
  CheckCircle2
} from 'lucide-react';

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  channelName: string;
  duration: string;
  processedAt: string;
  thumbnailUrl: string;
}

interface AutoClipInputViewProps {
  onBack: () => void;
  onProcess: (url: string) => void;
  isLoading: boolean;
  history: HistoryItem[];
  onClearHistory: () => void;
  isVisible: boolean;
}

export const AutoClipInputView: React.FC<AutoClipInputViewProps> = ({
  onBack,
  onProcess,
  isLoading,
  history,
  onClearHistory,
  isVisible
}) => {
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=LXb3EKWsInQ');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onProcess(url);
    }
  };

  const handleSelectHistory = (itemUrl: string) => {
    setUrl(itemUrl);
    onProcess(itemUrl);
  };

  return (
    <div 
      id="autoClipInputView" 
      className={`${isVisible ? 'block' : 'hidden'} w-full min-h-screen bg-black text-white py-10 px-4 sm:px-6 lg:px-8 font-sans`}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header dengan Tombol Kembali */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sky-400 font-bold text-sm transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest bg-sky-500/10 px-3 py-1 rounded-full border border-sky-400/30">
              Klip Otomatis AI Mode
            </span>
          </div>
        </div>

        {/* Form Input URL YouTube */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6 text-left">
            <div>
              <div className="inline-flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>AI Video Generator</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Masukkan Link Video YouTube
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 mt-2 leading-relaxed">
                Sistem AI kami akan menganalisis transkrip, mendeteksi momen puncak paling menarik, dan memotongnya menjadi klip 9:16 siap viral dalam hitungan detik.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                URL Video YouTube
              </label>

              {/* Kolom Input Text Besar */}
              <div className="relative flex items-center bg-black border-2 border-zinc-800 focus-within:border-sky-400 rounded-2xl p-2 transition-all shadow-inner">
                <div className="pl-3 pr-2 text-sky-400 shrink-0">
                  <Youtube className="w-7 h-7" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste URL YouTube di sini (misal: https://youtube.com/watch?v=...)"
                  className="w-full bg-transparent text-white text-base sm:text-lg placeholder-zinc-600 focus:outline-none py-3 px-1 font-medium"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Tombol Utama "Proses Video" (Warna Biru Langit Solid) */}
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-black font-black text-base sm:text-lg transition-all duration-200 cursor-pointer shadow-xl shadow-sky-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Wand2 className="w-5 h-5 animate-spin text-black" />
                    <span>Memproses Analisis AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-black fill-current" />
                    <span>Proses Video</span>
                    <ArrowRight className="w-5 h-5 text-black" />
                  </>
                )}
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>Mendukung durasi hingga 3 jam</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>Subtitle Bahasa Indonesia & Inggris</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bagian Riwayat Link Video */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 text-left">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-800 rounded-xl border border-zinc-700 text-sky-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Riwayat Link Video</h3>
                <p className="text-xs text-zinc-400">Daftar video yang pernah Anda proses sebelumnya</p>
              </div>
            </div>

            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 p-2 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="Hapus Semua Riwayat"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Riwayat</span>
              </button>
            )}
          </div>

          {/* List atau Empty State */}
          {history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-950 border border-zinc-800 hover:border-sky-500/60 rounded-2xl p-4 transition-all flex flex-col justify-between gap-4 group cursor-pointer"
                  onClick={() => handleSelectHistory(item.url)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-14 bg-zinc-800 rounded-xl overflow-hidden shrink-0 relative border border-zinc-700">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-sky-400 fill-current" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-sky-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-1 truncate">{item.channelName}</p>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-2 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" /> {item.duration}
                        </span>
                        <span>• {item.processedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                    <span className="text-[11px] font-semibold text-sky-400 flex items-center gap-1">
                      Buka Ulang Video <ArrowRight className="w-3 h-3" />
                    </span>
                    <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                      {item.url}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <History className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-sm font-semibold text-zinc-400">Belum ada riwayat video</p>
              <p className="text-xs text-zinc-600">
                Video YouTube yang Anda masukkan di atas akan muncul di sini untuk akses cepat.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
