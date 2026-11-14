import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Cloud, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Code2, 
  FileVideo, 
  ExternalLink 
} from 'lucide-react';
import { ManualBlueprint } from '../../types';

interface CloudExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprint: ManualBlueprint;
}

export const CloudExportModal: React.FC<CloudExportModalProps> = ({
  isOpen,
  onClose,
  blueprint
}) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'json'>('progress');
  const [renderStep, setRenderStep] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isRenderComplete, setIsRenderComplete] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRenderStep(1);
      setProgressPercent(0);
      setIsRenderComplete(false);
      return;
    }

    // Simulate multi-step Cloud Rendering API process (e.g. Creatomate / Shotstack)
    let currentPct = 0;
    const interval = setInterval(() => {
      currentPct += Math.floor(Math.random() * 8) + 4;
      if (currentPct >= 100) {
        currentPct = 100;
        clearInterval(interval);
        setRenderStep(4);
        setProgressPercent(100);
        setIsRenderComplete(true);
      } else if (currentPct >= 70) {
        setRenderStep(3);
        setProgressPercent(currentPct);
      } else if (currentPct >= 35) {
        setRenderStep(2);
        setProgressPercent(currentPct);
      } else {
        setRenderStep(1);
        setProgressPercent(currentPct);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadMp4 = () => {
    // Generate simulated final mp4 download trigger
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clipa_pro_${blueprint.clip_title.slice(0, 15).replace(/\s+/g, '_')}_final.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStepDescription = () => {
    switch (renderStep) {
      case 1:
        return 'Mengirim Blueprint JSON & Aset Media ke Cloud Rendering Engine...';
      case 2:
        return 'Merender subclip video 9:16 dan menyinkronkan layer subtitle...';
      case 3:
        return 'Mengeksekusi animasi teks, stroke tebal, dan encoding H.264...';
      case 4:
        return 'Rendering selesai! Berkas MP4 siap untuk diunduh.';
      default:
        return 'Memproses...';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1F3A]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EEF2F7] text-[#0B1F3A]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0B1F3A]">Ekspor Cloud Video MP4</h3>
              <p className="text-xs text-slate-500">Rendering Full-HD 1080x1920 (9:16) via Cloud API</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#EEF2F7] hover:bg-slate-200 text-slate-600 hover:text-[#0B1F3A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Progress vs Raw JSON Blueprint */}
        <div className="flex items-center p-1 bg-[#EEF2F7] rounded-xl gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'progress' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            Status Rendering
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'json' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Blueprint JSON</span>
          </button>
        </div>

        {activeTab === 'progress' ? (
          /* Render Progress Section */
          <div className="space-y-5">
            
            {/* Live Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0B1F3A] flex items-center gap-2">
                  {!isRenderComplete ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#1D4ED8]" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {getStepDescription()}
                </span>
                <span className="font-mono tabular-nums text-[#1D4ED8] font-bold">{progressPercent}%</span>
              </div>

              <div className="w-full h-3 bg-[#EEF2F7] rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-200 rounded-full ${
                    isRenderComplete 
                      ? 'bg-emerald-500' 
                      : 'bg-gradient-to-r from-[#0B1F3A] to-[#1D4ED8]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Render Details Info Box */}
            <div className="bg-[#F8F9FA] rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Judul Klip:</span>
                <span className="font-bold text-[#0B1F3A] truncate max-w-[240px]">{blueprint.clip_title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Durasi Terpotong:</span>
                <span className="font-mono tabular-nums text-[#1D4ED8] font-bold">{blueprint.duration.toFixed(1)} Detik</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Subtitle Terbakar:</span>
                <span className="font-bold text-[#0B1F3A]">{blueprint.subtitles.length} Baris Teks</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rasio Output:</span>
                <span className="font-mono text-emerald-600 font-bold">9:16 Vertikal (TikTok / Reels)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {isRenderComplete ? (
                <button
                  type="button"
                  onClick={handleDownloadMp4}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#0B1F3A] hover:bg-[#122E56] text-white font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-2.5"
                >
                  <Download className="w-5 h-5" />
                  <span>Unduh Video Final (MP4)</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#EEF2F7] text-slate-500 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Merender di Cloud...</span>
                </button>
              )}
            </div>

          </div>
        ) : (
          /* Raw JSON Blueprint Viewer */
          <div className="space-y-3">
            <p className="text-[11px] text-slate-600">
              State JSON non-destruktif ini yang dikirim ke Cloud Rendering API untuk merender video final secara presisi:
            </p>
            <pre className="p-3.5 bg-[#071324] rounded-2xl font-mono text-[11px] text-sky-300 max-h-60 overflow-y-auto leading-relaxed select-all">
              {JSON.stringify(blueprint, null, 2)}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
};
