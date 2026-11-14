import React from 'react';
import { 
  Type, 
  Palette, 
  Sliders, 
  Sparkles, 
  Trash2, 
  Copy, 
  Clock, 
  AlignVerticalJustifyCenter, 
  Wand2, 
  Layers,
  Check,
  Plus
} from 'lucide-react';
import { ManualSubtitleItem, SubtitleAnimationType } from '../../types';

interface PropertiesInspectorProps {
  selectedSubtitle: ManualSubtitleItem | null;
  onUpdateSubtitle: (updated: ManualSubtitleItem) => void;
  onDeleteSubtitle: (id: string) => void;
  onDuplicateSubtitle: (id: string) => void;
  onAddSubtitleAtPlayhead: () => void;
  onApplyPresetToAll: (presetType: 'hormozi' | 'montserrat' | 'karaoke') => void;
}

const FONT_OPTIONS = [
  { name: 'Montserrat (Viral Bold)', value: 'Montserrat, sans-serif' },
  { name: 'Bebas Neue (Punchy Caps)', value: '"Bebas Neue", Impact, sans-serif' },
  { name: 'Inter (Clean Modern)', value: 'Inter, sans-serif' },
  { name: 'Impact (Classic Meme)', value: 'Impact, Charcoal, sans-serif' },
  { name: 'Outfit (Tech Minimal)', value: 'Outfit, sans-serif' },
  { name: 'Poppins (Smooth Geometric)', value: 'Poppins, sans-serif' },
];

const COLOR_PRESETS = [
  { name: 'Kuning Neon', value: '#FACC15' },
  { name: 'Putih Bersih', value: '#FFFFFF' },
  { name: 'Biru Cyan', value: '#38BDF8' },
  { name: 'Hijau Neon', value: '#4ADE80' },
  { name: 'Merah Coral', value: '#F43F5E' },
  { name: 'Ungu Elektrik', value: '#C084FC' },
];

const STROKE_COLOR_PRESETS = [
  { name: 'Hitam Pekat', value: '#000000' },
  { name: 'Zinc Gelap', value: '#18181B' },
  { name: 'Biru Tua', value: '#082F49' },
  { name: 'Merah Gelap', value: '#4C0519' },
];

export const PropertiesInspector: React.FC<PropertiesInspectorProps> = ({
  selectedSubtitle,
  onUpdateSubtitle,
  onDeleteSubtitle,
  onDuplicateSubtitle,
  onAddSubtitleAtPlayhead,
  onApplyPresetToAll
}) => {
  if (!selectedSubtitle) {
    return (
      <div className="h-full bg-white rounded-3xl p-6 flex flex-col justify-between shadow-sm text-left select-none">
        
        {/* Empty State Header */}
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-xs font-bold text-[#0B1F3A]">
            <Sliders className="w-4 h-4 text-[#1D4ED8]" />
            <span>Panel Properti (Inspector)</span>
          </div>

          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF2F7] flex items-center justify-center text-[#0B1F3A] mx-auto">
              <Type className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0B1F3A]">Tidak Ada Subtitle Terpilih</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
                Klik salah satu balok subtitle pada timeline di bawah untuk mengedit font, warna, stroke, dan gaya animasi.
              </p>
            </div>

            <button
              type="button"
              onClick={onAddSubtitleAtPlayhead}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#122E56] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Subtitle Baru</span>
            </button>
          </div>
        </div>

        {/* Global Batch Presets Box */}
        <div className="bg-[#F8F9FA] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F3A]">
            <Wand2 className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>Preset Cepat Seluruh Video</span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              type="button"
              onClick={() => onApplyPresetToAll('hormozi')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#EEF2F7] text-[#0B1F3A] shadow-sm transition-colors cursor-pointer flex items-center justify-between"
            >
              <span className="font-semibold">Gaya Hormozi (Kuning Neon)</span>
              <span className="text-[11px] font-semibold text-[#1D4ED8]">Terapkan</span>
            </button>

            <button
              type="button"
              onClick={() => onApplyPresetToAll('karaoke')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#EEF2F7] text-[#0B1F3A] shadow-sm transition-colors cursor-pointer flex items-center justify-between"
            >
              <span className="font-semibold">Efek Highlight Karaoke</span>
              <span className="text-[11px] font-semibold text-[#1D4ED8]">Terapkan</span>
            </button>

            <button
              type="button"
              onClick={() => onApplyPresetToAll('montserrat')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#EEF2F7] text-[#0B1F3A] shadow-sm transition-colors cursor-pointer flex items-center justify-between"
            >
              <span className="font-semibold">Font Montserrat Bold</span>
              <span className="text-[11px] font-semibold text-[#1D4ED8]">Terapkan</span>
            </button>
          </div>
        </div>

      </div>
    );
  }

  // Handle Updates
  const updateField = <K extends keyof ManualSubtitleItem>(field: K, value: ManualSubtitleItem[K]) => {
    onUpdateSubtitle({
      ...selectedSubtitle,
      [field]: value
    });
  };

  return (
    <div className="h-full bg-white rounded-3xl p-5 flex flex-col shadow-sm text-left select-none overflow-hidden">
      
      {/* Inspector Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F3A]">
          <Sliders className="w-4 h-4 text-[#1D4ED8]" />
          <span>Inspektor Subtitle</span>
          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
            · {selectedSubtitle.id}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDuplicateSubtitle(selectedSubtitle.id)}
            className="p-2 rounded-lg bg-[#EEF2F7] hover:bg-slate-200 text-[#0B1F3A] transition-colors cursor-pointer"
            title="Duplikasi Subtitle"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteSubtitle(selectedSubtitle.id)}
            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
            title="Hapus Subtitle"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Inspector Fields */}
      <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 text-xs">
        
        {/* 1. Konten Teks Subtitle */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center justify-between">
            <span>Teks Subtitle</span>
            <span className="text-slate-500 font-mono tabular-nums">{selectedSubtitle.text.length} Karakter</span>
          </label>
          <textarea
            rows={2}
            value={selectedSubtitle.text}
            onChange={(e) => updateField('text', e.target.value)}
            className="w-full bg-[#F8F9FA] border border-slate-200 focus:border-[#1D4ED8] rounded-xl p-3 text-xs text-[#0B1F3A] focus:outline-none font-bold leading-relaxed resize-none"
            placeholder="Tuliskan kata-kata subtitle..."
          />
        </div>

        {/* 2. Tipografi: Font Family & Ukuran */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Font Family
            </label>
            <select
              value={selectedSubtitle.fontFamily}
              onChange={(e) => updateField('fontFamily', e.target.value)}
              className="w-full bg-[#F8F9FA] border border-slate-200 focus:border-[#1D4ED8] rounded-xl px-2.5 py-2 text-xs text-[#0B1F3A] focus:outline-none cursor-pointer"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              <span>Ukuran Font</span>
              <span className="text-[#1D4ED8] font-mono tabular-nums">{selectedSubtitle.fontSize}px</span>
            </div>
            <input
              type="range"
              min={20}
              max={64}
              step={1}
              value={selectedSubtitle.fontSize}
              onChange={(e) => updateField('fontSize', Number(e.target.value))}
              className="w-full accent-[#0B1F3A] cursor-pointer mt-2"
            />
          </div>
        </div>

        {/* 3. Palet Warna Teks */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Warna Teks Utama</span>
            <span className="font-mono text-slate-500">{selectedSubtitle.color}</span>
          </label>

          <div className="flex items-center gap-1.5 flex-wrap">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => updateField('color', color.value)}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  selectedSubtitle.color === color.value 
                    ? 'border-[#0B1F3A] ring-2 ring-[#1D4ED8]/60 scale-110' 
                    : 'border-slate-200 hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {selectedSubtitle.color === color.value && (
                  <Check className={`w-3.5 h-3.5 ${color.value === '#FFFFFF' || color.value === '#FACC15' ? 'text-[#0B1F3A]' : 'text-white'}`} />
                )}
              </button>
            ))}

            <input
              type="color"
              value={selectedSubtitle.color}
              onChange={(e) => updateField('color', e.target.value)}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 cursor-pointer p-0.5"
              title="Pilih Warna Kustom"
            />
          </div>
        </div>

        {/* 4. Stroke Tebal & Bayangan */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              <span>Tebal Stroke</span>
              <span className="text-[#1D4ED8] font-mono tabular-nums">{selectedSubtitle.strokeWidth}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={8}
              step={0.5}
              value={selectedSubtitle.strokeWidth}
              onChange={(e) => updateField('strokeWidth', Number(e.target.value))}
              className="w-full accent-[#0B1F3A] cursor-pointer mt-1"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              <span>Shadow Blur</span>
              <span className="text-[#1D4ED8] font-mono tabular-nums">{selectedSubtitle.shadowBlur}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={selectedSubtitle.shadowBlur}
              onChange={(e) => updateField('shadowBlur', Number(e.target.value))}
              className="w-full accent-[#0B1F3A] cursor-pointer mt-1"
            />
          </div>
        </div>

        {/* 5. Gaya Animasi Teks */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Gaya Animasi Teks
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateField('animation', 'pop')}
              className={`p-2.5 rounded-xl text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSubtitle.animation === 'pop'
                  ? 'bg-[#0B1F3A] text-white font-bold shadow-sm'
                  : 'bg-[#EEF2F7] text-[#0B1F3A] hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Pop Hormozi</span>
            </button>

            <button
              type="button"
              onClick={() => updateField('animation', 'karaoke')}
              className={`p-2.5 rounded-xl text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSubtitle.animation === 'karaoke'
                  ? 'bg-[#0B1F3A] text-white font-bold shadow-sm'
                  : 'bg-[#EEF2F7] text-[#0B1F3A] hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Karaoke</span>
            </button>

            <button
              type="button"
              onClick={() => updateField('animation', 'fade')}
              className={`p-2.5 rounded-xl text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSubtitle.animation === 'fade'
                  ? 'bg-[#0B1F3A] text-white font-bold shadow-sm'
                  : 'bg-[#EEF2F7] text-[#0B1F3A] hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Fade Lembut</span>
            </button>

            <button
              type="button"
              onClick={() => updateField('animation', 'none')}
              className={`p-2.5 rounded-xl text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSubtitle.animation === 'none'
                  ? 'bg-[#0B1F3A] text-white font-bold shadow-sm'
                  : 'bg-[#EEF2F7] text-[#0B1F3A] hover:bg-slate-200'
              }`}
            >
              <span>Statis</span>
            </button>
          </div>
        </div>

        {/* 6. Posisi Vertikal Y */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            <span>Posisi Vertikal Y (Tinggi Layar)</span>
            <span className="text-[#1D4ED8] font-mono tabular-nums">{selectedSubtitle.yOffsetPercent}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateField('yOffsetPercent', 25)}
              className="px-2.5 py-1 rounded-lg bg-[#EEF2F7] hover:bg-slate-200 text-[11px] font-semibold text-[#0B1F3A] cursor-pointer"
            >
              Atas (25%)
            </button>
            <button
              type="button"
              onClick={() => updateField('yOffsetPercent', 50)}
              className="px-2.5 py-1 rounded-lg bg-[#EEF2F7] hover:bg-slate-200 text-[11px] font-semibold text-[#0B1F3A] cursor-pointer"
            >
              Tengah (50%)
            </button>
            <button
              type="button"
              onClick={() => updateField('yOffsetPercent', 78)}
              className="px-2.5 py-1 rounded-lg bg-[#E6EDF7] hover:bg-slate-200 text-[11px] text-[#0B1F3A] font-bold cursor-pointer"
            >
              Bawah (78%)
            </button>
          </div>

          <input
            type="range"
            min={15}
            max={85}
            step={1}
            value={selectedSubtitle.yOffsetPercent}
            onChange={(e) => updateField('yOffsetPercent', Number(e.target.value))}
            className="w-full accent-[#0B1F3A] cursor-pointer mt-1"
          />
        </div>

        {/* 7. Rentang Waktu Presisi */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#1D4ED8]" /> Waktu Mulai
            </label>
            <div className="flex items-center bg-[#F8F9FA] border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => updateField('start', Math.max(0, Math.round((selectedSubtitle.start - 0.1) * 10) / 10))}
                className="px-2.5 py-1.5 text-[#0B1F3A] bg-[#EEF2F7] hover:bg-slate-200 font-bold cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                step={0.1}
                min={0}
                value={selectedSubtitle.start}
                onChange={(e) => updateField('start', Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-center text-xs text-[#0B1F3A] font-mono tabular-nums focus:outline-none"
              />
              <button
                type="button"
                onClick={() => updateField('start', Math.round((selectedSubtitle.start + 0.1) * 10) / 10)}
                className="px-2.5 py-1.5 text-[#0B1F3A] bg-[#EEF2F7] hover:bg-slate-200 font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#1D4ED8]" /> Waktu Selesai
            </label>
            <div className="flex items-center bg-[#F8F9FA] border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => updateField('end', Math.max(selectedSubtitle.start + 0.2, Math.round((selectedSubtitle.end - 0.1) * 10) / 10))}
                className="px-2.5 py-1.5 text-[#0B1F3A] bg-[#EEF2F7] hover:bg-slate-200 font-bold cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                step={0.1}
                min={selectedSubtitle.start + 0.2}
                value={selectedSubtitle.end}
                onChange={(e) => updateField('end', Math.max(selectedSubtitle.start + 0.2, parseFloat(e.target.value) || selectedSubtitle.start + 1))}
                className="w-full bg-transparent text-center text-xs text-[#0B1F3A] font-mono tabular-nums focus:outline-none"
              />
              <button
                type="button"
                onClick={() => updateField('end', Math.round((selectedSubtitle.end + 0.1) * 10) / 10)}
                className="px-2.5 py-1.5 text-[#0B1F3A] bg-[#EEF2F7] hover:bg-slate-200 font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
