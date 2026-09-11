import React, { useState } from 'react';
import { 
  Youtube, 
  Scissors, 
  Cpu, 
  Film, 
  SlidersHorizontal, 
  ArrowRight, 
  Wand2, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface HeroInputProps {
  onAnalyze: (url: string, language: string) => void;
  onOpenAutoClipInput: () => void;
  onOpenManualEdit: () => void;
  isLoading: boolean;
}

export const HeroInput: React.FC<HeroInputProps> = ({ 
  onAnalyze,
  onOpenAutoClipInput, 
  onOpenManualEdit, 
  isLoading 
}) => {
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=LXb3EKWsInQ');
  const [language, setLanguage] = useState('id');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url, language);
    } else {
      onOpenAutoClipInput();
    }
  };

  return (
    <section className="relative overflow-hidden bg-black text-white py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-grid-pattern border-b border-zinc-800/80">
      
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        
        {/* Teks Utama (Putih, besar) */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
          Kreasikan Klip Anda: <span className="text-sky-400 font-black">Pilih Jalan Anda.</span>
        </h1>

        {/* Teks Sub-header (Putih, sedang) */}
        <p className="mt-4 text-base sm:text-xl text-white font-medium max-w-2xl mx-auto leading-relaxed">
          Studio Video AI Terpadu untuk Kreator Konten.
        </p>

        {/* Quick Youtube Input Bar */}
        <form onSubmit={handleSubmit} className="mt-8 max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 focus-within:border-sky-400 rounded-2xl shadow-2xl transition-all">
            <div className="flex items-center gap-3 pl-3 w-full">
              <Youtube className="w-6 h-6 text-sky-400 shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Masukkan link YouTube di sini (misal: https://youtube.com/watch?v=...)"
                className="w-full bg-transparent text-white text-sm sm:text-base placeholder-zinc-500 focus:outline-none py-2"
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-sm transition-all cursor-pointer shrink-0 shadow-lg shadow-sky-500/20"
            >
              {isLoading ? (
                <>
                  <Wand2 className="w-4 h-4 animate-spin text-black" />
                  <span>Memproses AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black fill-current" />
                  <span>Proses Video</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Feature Highlights */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-zinc-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>Otomatis Subtitle 9:16</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>Skor Virality AI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>Multi-Format Export</span>
          </div>
        </div>

        {/* Bagian Pilihan (Dua Kartu Sejajar di Desktop, Tumpuk di Mobile) */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
          
          {/* KARTU 1: Klip Otomatis (AI) */}
          <div className="bg-zinc-900 border border-zinc-800 hover:border-sky-500/50 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group shadow-xl">
            <div>
              {/* Ikon Group (Biru langit solid) */}
              <div className="flex items-center gap-3 text-sky-400 mb-6">
                <div className="p-3 bg-sky-500/10 border border-sky-400/30 rounded-xl">
                  <Youtube className="w-6 h-6 text-sky-400" />
                </div>
                <div className="p-3 bg-sky-500/10 border border-sky-400/30 rounded-xl">
                  <Scissors className="w-6 h-6 text-sky-400" />
                </div>
                <div className="p-3 bg-sky-500/10 border border-sky-400/30 rounded-xl">
                  <Cpu className="w-6 h-6 text-sky-400" />
                </div>
              </div>

              {/* Teks Judul (Putih) */}
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-sky-400 transition-colors">
                Klip Otomatis (AI)
              </h2>

              {/* Teks Deskripsi (Putih) */}
              <p className="text-sm sm:text-base text-zinc-300 font-normal leading-relaxed mb-8">
                Otomatis ubah video YouTube panjang Anda menjadi puluhan klip 9:16 viral (TikTok/Reels) dengan subtitle, re-framing, dan skor virality bertenaga AI.
              </p>
            </div>

            {/* Tombol (Solid biru langit, teks putih/gelap kontras tinggi) */}
            <button
              onClick={onOpenAutoClipInput}
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer text-center shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              <span>Mulai Klip Otomatis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* KARTU 2: Edit Manual */}
          <div className="bg-zinc-900 border border-zinc-800 hover:border-sky-500/50 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group shadow-xl">
            <div>
              {/* Ikon Group (Biru langit solid) */}
              <div className="flex items-center gap-3 text-sky-400 mb-6">
                <div className="p-3 bg-sky-500/10 border border-sky-400/30 rounded-xl">
                  <Film className="w-6 h-6 text-sky-400" />
                </div>
                <div className="p-3 bg-sky-500/10 border border-sky-400/30 rounded-xl">
                  <Scissors className="w-6 h-6 text-sky-400" />
                </div>
                <div className="p-3 bg-sky-500/10 border border-sky-400/30 rounded-xl">
                  <SlidersHorizontal className="w-6 h-6 text-sky-400" />
                </div>
              </div>

              {/* Teks Judul (Putih) */}
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-sky-400 transition-colors">
                Edit Manual
              </h2>

              {/* Teks Deskripsi (Putih) */}
              <p className="text-sm sm:text-base text-zinc-300 font-normal leading-relaxed mb-8">
                Gunakan editor timeline canggih kami untuk kontrol penuh. Edit, potong, tambahkan subtitle, dan efek sendiri.
              </p>
            </div>

            {/* Tombol (Solid biru langit) */}
            <button
              onClick={onOpenManualEdit}
              className="w-full py-3.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer text-center shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              <span>Buka Editor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
