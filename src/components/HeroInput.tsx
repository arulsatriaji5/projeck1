import React, { useState } from 'react';
import { 
  Youtube, 
  Scissors, 
  Cpu, 
  Film, 
  SlidersHorizontal, 
  ArrowRight, 
  Wand2
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
  const [language] = useState('id');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url, language);
    } else {
      onOpenAutoClipInput();
    }
  };

  return (
    /* Hero Section */
    <section className="bg-[#F8F9FA] bg-grid-navy-light text-[#0B1F3A] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center">
        
        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-[#0B1F3A] leading-[1.15] max-w-3xl mx-auto text-balance">
          Kreasikan Klip Anda:{' '}
          <span className="text-[#1D4ED8]">Pilih Jalan Anda.</span>
        </h1>

        {/* Sub-headline */}
        <p className="mt-4 text-base sm:text-lg text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
          Studio video AI terpadu untuk mengubah konten panjang menjadi klip vertikal siap tayang secara cepat dan profesional.
        </p>

        {/* Quick YouTube Input Form */}
        <form onSubmit={handleSubmit} className="mt-8 sm:mt-10 max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2.5 bg-white rounded-2xl shadow-md focus-within:ring-2 focus-within:ring-[#0B1F3A]/20 transition-shadow">
            <div className="flex items-center gap-3 pl-3 pr-2 flex-1 min-w-0">
              <Youtube className="w-6 h-6 text-[#1D4ED8] shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Masukkan link YouTube di sini (misal: https://youtube.com/watch?v=...)"
                className="w-full bg-transparent text-[#0B1F3A] text-sm sm:text-base placeholder-slate-400 focus:outline-none py-2.5"
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0B1F3A] hover:bg-[#122E56] text-white font-bold text-sm transition-colors cursor-pointer shrink-0 shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Wand2 className="w-4 h-4 animate-spin text-white" />
                  <span>Memproses AI...</span>
                </>
              ) : (
                <>
                  <span>Proses Video</span>
                  <ArrowRight className="w-4 h-4 text-sky-300" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Unboxed Feature Highlights */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs sm:text-sm font-medium text-slate-500">
          <span>Otomatis Subtitle 9:16</span>
          <span aria-hidden="true">·</span>
          <span>Analisis Momen Viral AI</span>
          <span aria-hidden="true">·</span>
          <span>Ekspor MP4 Resolusi Tinggi</span>
        </div>

        {/* Mode Selection Cards Section */}
        <div id="fitur" className="mt-14 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto text-left">
          
          {/* Card 1: Klip Otomatis (AI) */}
          <article className="bg-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#EEF2F7] rounded-xl text-[#0B1F3A]">
                  <Youtube className="w-5 h-5" />
                </div>
                <div className="p-3 bg-[#EEF2F7] rounded-xl text-[#1D4ED8]">
                  <Scissors className="w-5 h-5" />
                </div>
                <div className="p-3 bg-[#EEF2F7] rounded-xl text-[#0B1F3A]">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F3A] mb-3">
                Klip Otomatis (AI)
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8">
                Otomatis ubah video YouTube panjang atau file MP4 lokal Anda menjadi klip 9:16 siap unggah lengkap dengan subtitle dinamis dan pemotongan hook terbaik.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenAutoClipInput}
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#0B1F3A] hover:bg-[#122E56] text-white font-bold text-sm sm:text-base transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              <span>Mulai Klip Otomatis</span>
              <ArrowRight className="w-4 h-4 text-sky-300" />
            </button>
          </article>

          {/* Card 2: Edit Foto & Video */}
          <article className="bg-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#EEF2F7] rounded-xl text-[#0B1F3A]">
                  <Film className="w-5 h-5" />
                </div>
                <div className="p-3 bg-[#EEF2F7] rounded-xl text-[#1D4ED8]">
                  <Scissors className="w-5 h-5" />
                </div>
                <div className="p-3 bg-[#EEF2F7] rounded-xl text-[#0B1F3A]">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F3A] mb-3">
                Edit Foto &amp; Video
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8">
                Pilih ruang kerja Edit Foto untuk thumbnail &amp; feed, atau Edit Video multi-track untuk kontrol penuh posisi teks, warna, subtitle, dan durasi klip.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenManualEdit}
              className="w-full py-3.5 px-6 rounded-xl bg-[#EEF2F7] hover:bg-[#0B1F3A] text-[#0B1F3A] hover:text-white font-bold text-sm sm:text-base transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Buka Edit Foto &amp; Video</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </article>

        </div>

      </div>
    </section>
  );
};
