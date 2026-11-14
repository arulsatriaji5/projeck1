import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Square,
  Monitor,
  Sparkles,
  Bookmark,
  Check,
  SlidersHorizontal,
  FolderArchive,
} from 'lucide-react';
import { AspectRatioType, RecipeStyleConfig, ReferenceItem } from '../types';

interface RecipeStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: RecipeStyleConfig;
  onSaveRecipe: (updated: RecipeStyleConfig) => void;
  references: ReferenceItem[];
  onOpenReferenceVault: () => void;
}

export const RecipeStyleModal: React.FC<RecipeStyleModalProps> = ({
  isOpen,
  onClose,
  recipe,
  onSaveRecipe,
  references,
  onOpenReferenceVault,
}) => {
  const [draft, setDraft] = useState<RecipeStyleConfig>(recipe);

  useEffect(() => {
    if (isOpen) {
      setDraft(recipe);
    }
  }, [isOpen, recipe]);

  if (!isOpen) return null;

  const layoutOptions: Array<{
    value: AspectRatioType;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { value: '9:16', label: '9:16 Vertikal', desc: 'TikTok, Shorts, Reels', icon: Smartphone },
    { value: '1:1', label: '1:1 Persegi', desc: 'Feed Instagram & LinkedIn', icon: Square },
    { value: '16:9', label: '16:9 Lanskap', desc: 'YouTube & Presentasi', icon: Monitor },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRecipe(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-6 shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-emerald-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pengaturan Resep &amp; Gaya AI</h2>
              <p className="text-xs text-gray-400">
                Atur rasio layout, Auto-Hook, dan template subtitle dari Gudang Referensi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup modal resep"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* 1. Rasio Layout */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
              1. Rasio Layout Video
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {layoutOptions.map((opt) => {
                const Icon = opt.icon;
                const active = draft.layout === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, layout: opt.value })}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-400 text-white'
                        : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-gray-400'}`} />
                      {active && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-xs font-bold whitespace-nowrap">{opt.label}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 truncate">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Auto-Hook Toggle */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Auto-Hook 3 Detik Pertama</div>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  AI otomatis memilih pembuka paling memikat dan memotong jeda hening di awal klip.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={draft.autoHook}
              onClick={() => setDraft({ ...draft, autoHook: !draft.autoHook })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                draft.autoHook ? 'bg-emerald-500' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  draft.autoHook ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 3. Template Subtitle dari Gudang Referensi */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Template Subtitle (Gudang Referensi)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReferenceVault();
                }}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Kelola Brand Kit</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {references.map((ref) => {
                const isSelected = draft.subtitleTemplateId === ref.id;
                return (
                  <button
                    key={ref.id}
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        subtitleTemplateId: ref.id,
                        subtitleTemplateName: ref.title,
                      })
                    }
                    className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-400'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{ref.title}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 shrink-0">
                          {ref.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{ref.notes}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Instruksi Tambahan */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
              4. Catatan Tambahan untuk AI (Opsional)
            </label>
            <textarea
              rows={2}
              value={draft.customInstructions}
              onChange={(e) => setDraft({ ...draft, customInstructions: e.target.value })}
              placeholder="Misal: Fokus pada bagian pembahasan strategi bisnis, durasi 30-45 detik..."
              className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-400 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap"
            >
              Terapkan Resep
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
