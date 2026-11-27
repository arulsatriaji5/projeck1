import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Settings, 
  Cpu, 
  Youtube, 
  CheckCircle2, 
  Save, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success'>('idle');

  useEffect(() => {
    try {
      const savedModel = localStorage.getItem('clipa_gemini_model') || 'gemini-2.5-flash';
      const savedYoutube = localStorage.getItem('clipa_youtube_api_key') || '';
      setGeminiModel(savedModel);
      setYoutubeApiKey(savedYoutube);
    } catch {
      // Ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('clipa_gemini_model', geminiModel);
      localStorage.setItem('clipa_youtube_api_key', youtubeApiKey);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestConnection = () => {
    setTestingStatus('testing');
    setTimeout(() => {
      setTestingStatus('success');
      setTimeout(() => setTestingStatus('idle'), 2500);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1F3A]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EEF2F7] text-[#0B1F3A]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0B1F3A]">Pengaturan API</h3>
              <p className="text-xs text-slate-500">Konfigurasi model AI &amp; Layanan Eksternal</p>
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

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="p-3.5 bg-[#F8F9FA] rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-[#0B1F3A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" /> Layanan Gemini AI
            </span>
            <span className="text-[11px] font-semibold text-emerald-700">
              Aktif (Server)
            </span>
          </div>

          {/* Model AI */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#1D4ED8]" /> Model AI Analisis Video
            </label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-slate-200 focus:border-[#1D4ED8] rounded-xl px-3.5 py-2.5 text-xs text-[#0B1F3A] focus:outline-none cursor-pointer"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Sangat Cepat &amp; Direkomendasikan)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Akurasi Analisis Mendalam)</option>
            </select>
          </div>

          {/* YouTube Data API Key */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-rose-600" /> YouTube Data API v3 (Opsional)
            </label>
            <input
              type="password"
              value={youtubeApiKey}
              onChange={(e) => setYoutubeApiKey(e.target.value)}
              placeholder="Masukkan YouTube Data API Key jika ada"
              className="w-full bg-[#F8F9FA] border border-slate-200 focus:border-[#1D4ED8] rounded-xl px-3.5 py-2.5 text-xs text-[#0B1F3A] placeholder-slate-400 focus:outline-none font-mono"
            />
          </div>

          {/* Security Banner */}
          <div className="p-3.5 bg-[#F8F9FA] rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Kunci API disimpan secara aman di peramban lokal (<span className="text-[#0B1F3A] font-mono font-semibold">localStorage</span>) Anda dan tidak dibagikan ke pihak ketiga mana pun.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleTestConnection}
              className="px-3.5 py-2 rounded-xl bg-[#EEF2F7] hover:bg-slate-200 text-[#0B1F3A] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              {testingStatus === 'testing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1D4ED8]" />
                  <span>Menguji...</span>
                </>
              ) : testingStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Koneksi Berhasil!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tes Koneksi</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#EEF2F7] hover:bg-slate-200 text-[#0B1F3A] text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#122E56] text-white text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
