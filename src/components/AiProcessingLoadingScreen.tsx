import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Video, X } from 'lucide-react';

interface AiProcessingLoadingScreenProps {
  onCancel?: () => void;
  targetVideoUrl?: string;
}

export const AiProcessingLoadingScreen: React.FC<AiProcessingLoadingScreenProps> = ({
  onCancel,
  targetVideoUrl
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const steps = [
    { title: 'Mengunduh & Membaca Transkrip Video', desc: 'Mengekstrak audio dan teks pembicara secara presisi.' },
    { title: 'Mendeteksi Momen Hook & Emosi Viral', desc: 'Gemini 2.5 Flash memindai 3 detik pertama dengan retensi tinggi.' },
    { title: 'Menghitung Skor Virality & Kategori', desc: 'Mengevaluasi kesesuaian algoritma TikTok, Shorts & Reels.' },
    { title: 'Menyusun Subtitle & Re-Framing Vertikal 9:16', desc: 'Mempersiapkan potongan klip dan teks subtitle sinkron.' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    /* Loading Overlay Section */
    <section className="w-full min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8F9FA]">
      <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-10 shadow-md relative text-center">
        
        {/* Cancel Button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-[#0B1F3A] rounded-full hover:bg-[#EEF2F7] transition-colors cursor-pointer"
            title="Batalkan Proses"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Navy Spinner */}
        <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-[#EEF2F7] border-t-[#0B1F3A] border-r-[#1D4ED8] animate-spin" />
          <div className="absolute inset-3 rounded-full bg-[#EEF2F7] flex items-center justify-center">
            <img
              src="/assets/aistudio/clipA_dae34944.png"
              alt="ClipA"
              className="w-7 h-7 object-contain"
            />
          </div>
        </div>

        {/* Status Kicker */}
        <p className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8] mb-2">
          Proses Klip Otomatis AI
        </p>

        {/* Primary Requirement Text */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] tracking-tight leading-snug text-balance">
          AI sedang menganalisis video & mencari momen viral... Mohon tunggu.
        </h2>

        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Sistem sedang memindai rekaman untuk memotong jeda hening, menyusun subtitle dinamis, dan memilih bagian dengan retensi terbaik.
        </p>

        {/* Source Video Reference */}
        {targetVideoUrl && (
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EEF2F7] text-[#0B1F3A] text-xs font-medium max-w-full truncate">
            <Video className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
            <span className="truncate">{targetVideoUrl}</span>
          </div>
        )}

        {/* Progress Step Checklist */}
        <div className="mt-8 space-y-2.5 text-left bg-[#F8F9FA] rounded-2xl p-4 sm:p-5">
          {steps.map((st, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                  isCurrent
                    ? 'bg-white shadow-sm text-[#0B1F3A]'
                    : isDone
                    ? 'text-slate-600'
                    : 'text-slate-400'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#0B1F3A] border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-slate-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-bold ${isCurrent ? 'text-[#0B1F3A]' : ''}`}>
                    {st.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timer Footer */}
        <div className="mt-6 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0B1F3A]" />
            <span>Waktu berjalan: <span className="text-[#0B1F3A] font-mono font-bold tabular-nums">{secondsElapsed}s</span></span>
          </div>
          <span className="text-xs text-slate-500">Gemini 2.5 Flash</span>
        </div>

      </div>
    </section>
  );
};
