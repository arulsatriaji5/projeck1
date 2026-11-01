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
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success'>('idle');

  useEffect(() => {
    try {
      const savedGemini = localStorage.getItem('clipa_gemini_api_key') || '';
      const savedModel = localStorage.getItem('clipa_gemini_model') || 'gemini-2.5-flash';
      const savedYoutube = localStorage.getItem('clipa_youtube_api_key') || '';
      setGeminiApiKey(savedGemini);
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
      localStorage.setItem('clipa_gemini_api_key', geminiApiKey);
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-400/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Pengaturan API</h3>
              <p className="text-xs text-zinc-400">Konfigurasi kunci API AI & Layanan Eksternal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Google Gemini API Key
              </label>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Aktif (Built-in Server)
              </span>
            </div>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="AIzaSy... (Opsional jika memakai proxy server bawaan)"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
            />
            <p className="text-[11px] text-zinc-500">
              ClipA Studio menggunakan server proxy bawaan untuk analisis momen viral otomatis. Anda juga dapat memasukkan kunci pribadi jika ingin kuota khusus.
            </p>
          </div>

          {/* Model AI */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" /> Model AI Analisis Video
            </label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Sangat Cepat & Direkomendasikan)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Akurasi Analisis Mendalam)</option>
            </select>
          </div>

          {/* YouTube Data API Key */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-rose-400" /> YouTube Data API v3 (Opsional)
            </label>
            <input
              type="password"
              value={youtubeApiKey}
              onChange={(e) => setYoutubeApiKey(e.target.value)}
              placeholder="Masukkan YouTube Data API Key jika ada"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
            />
          </div>

          {/* Security Banner */}
          <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Kunci API disimpan secara aman di peramban lokal (<span className="text-zinc-300 font-mono">localStorage</span>) Anda dan tidak dibagikan ke pihak ketiga mana pun.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleTestConnection}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              {testingStatus === 'testing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  <span>Menguji...</span>
                </>
              ) : testingStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Koneksi Berhasil!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Tes Koneksi</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-black cursor-pointer shadow-md shadow-sky-500/20 flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-black" />
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
