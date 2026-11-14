import React, { useState } from 'react';
import {
  Settings,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Cpu,
  Languages,
  Save,
} from 'lucide-react';
import { AspectRatioType, RecipeStyleConfig } from '../types';

interface SettingsViewProps {
  recipe: RecipeStyleConfig;
  onUpdateRecipe: (updated: RecipeStyleConfig) => void;
  onSavedToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  recipe,
  onUpdateRecipe,
  onSavedToast,
}) => {
  const [defaultLayout, setDefaultLayout] = useState<AspectRatioType>(recipe.layout);
  const [defaultAutoHook, setDefaultAutoHook] = useState<boolean>(recipe.autoHook);
  const [subtitleLang, setSubtitleLang] = useState<'id' | 'en'>('id');
  const [exportQuality, setExportQuality] = useState<'1080p' | '4k'>('1080p');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRecipe({
      ...recipe,
      layout: defaultLayout,
      autoHook: defaultAutoHook,
    });
    onSavedToast('Pengaturan studio berhasil disimpan.');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 sm:px-8 py-8 pt-20 lg:pt-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="pb-6 border-b border-gray-800">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Konfigurasi Workspace
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Atur preferensi default pemotongan klip, subtitle, dan kualitas ekspor MP4 Anda.
          </p>
        </header>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Default Layout & Auto-Hook */}
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2.5 text-sm font-bold text-white">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Standar Pemotongan &amp; AI</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-300">
                  Rasio Layout Default
                </label>
                <select
                  value={defaultLayout}
                  onChange={(e) => setDefaultLayout(e.target.value as AspectRatioType)}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="9:16">9:16 Vertikal (TikTok / Shorts / Reels)</option>
                  <option value="1:1">1:1 Persegi (Instagram Feed)</option>
                  <option value="16:9">16:9 Lanskap (YouTube)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-emerald-400" /> Bahasa Subtitle AI
                </label>
                <select
                  value={subtitleLang}
                  onChange={(e) => setSubtitleLang(e.target.value as 'id' | 'en')}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="id">Bahasa Indonesia (Alami &amp; Kasual)</option>
                  <option value="en">English (Global Creators)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Aktifkan Auto-Hook Secara Default</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Otomatis deteksi kalimat pembuka dengan skor retensi tertinggi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={defaultAutoHook}
                onClick={() => setDefaultAutoHook(!defaultAutoHook)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  defaultAutoHook ? 'bg-emerald-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    defaultAutoHook ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Export Quality & Server AI Info */}
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-sm font-bold text-white">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Kualitas Ekspor &amp; Mesin Rendering</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-300">
                  Resolusi Ekspor MP4
                </label>
                <select
                  value={exportQuality}
                  onChange={(e) => setExportQuality(e.target.value as '1080p' | '4k')}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="1080p">1080×1920 Full HD (30 FPS)</option>
                  <option value="4k">2160×3840 Ultra HD (60 FPS)</option>
                </select>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Pipeline Server Aktif</div>
                  <div className="text-[11px] text-gray-400">
                    Endpoint /api/auto-clip &amp; Gemini 2.5 Flash terhubung
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs cursor-pointer transition-colors whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
