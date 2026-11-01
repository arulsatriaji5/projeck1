import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Youtube, 
  Sparkles, 
  Wand2, 
  ArrowRight, 
  History, 
  Trash2, 
  Play, 
  Clock, 
  CheckCircle2, 
  UploadCloud, 
  FileVideo, 
  Bookmark, 
  Check, 
  FolderArchive, 
  Tag, 
  X, 
  Image as ImageIcon, 
  FileText, 
  Link2, 
  Sliders, 
  ChevronDown
} from 'lucide-react';
import { ReferenceItem, MediaType } from '../types';
import { getStoredReferences } from '../data/defaultReferences';

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  channelName: string;
  duration: string;
  processedAt: string;
  thumbnailUrl: string;
}

// Preset batasan edit cepat untuk kemudahan satu klik
const PRESET_CONSTRAINTS = [
  '⏱️ Durasi 30-60 detik',
  '⚡ Hook 3 Detik Cepat',
  '🟨 Subtitle Kuning Neon + Bayangan Hitam',
  '✂️ Pacing Cepat (Zero Silence Cut)',
  '🔍 Punchline Dynamic Zoom 1.2x',
  '🔇 Hilangkan jeda suara di atas 0.4 detik'
];

interface AutoClipInputViewProps {
  onBack: () => void;
  onProcess: (url: string, constraints?: string, reference?: ReferenceItem | null) => void;
  onProcessLocalFile?: (file: File, constraints?: string, reference?: ReferenceItem | null) => void;
  isLoading: boolean;
  history: HistoryItem[];
  onClearHistory: () => void;
  isVisible: boolean;
  references?: ReferenceItem[];
  onOpenReferenceVault?: () => void;
}

export const AutoClipInputView: React.FC<AutoClipInputViewProps> = ({
  onBack,
  onProcess,
  onProcessLocalFile,
  isLoading,
  history,
  onClearHistory,
  isVisible,
  references: propReferences,
  onOpenReferenceVault
}) => {
  // Input Mode State: Dual Mode ('url' vs 'local')
  const [inputMode, setInputMode] = useState<'url' | 'local'>('url');

  // URL Input State
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=LXb3EKWsInQ');

  // AI Editing Constraints State
  const [aiConstraints, setAiConstraints] = useState('');

  // Selected Reference State
  const [selectedRefId, setSelectedRefId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // References list (either from props or localStorage)
  const references = propReferences && propReferences.length > 0 
    ? propReferences 
    : getStoredReferences();

  const selectedReference = references.find(r => r.id === selectedRefId) || null;

  // Local File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Clean up object URLs when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  // Handle preset chip click
  const handleApplyPresetChip = (chipText: string) => {
    setAiConstraints((prev) => {
      if (!prev.trim()) return chipText;
      if (prev.includes(chipText)) return prev;
      return `${prev}\n• ${chipText}`;
    });
  };

  // Helper to construct effective constraints including selected reference
  const buildEffectiveConstraints = (): string | undefined => {
    let effective = aiConstraints.trim();
    if (selectedReference) {
      const mediaBadge = selectedReference.mediaType.toUpperCase();
      const refNote = `[GAYA REFERENSI EDIT: ${selectedReference.title} (${mediaBadge})]\n${selectedReference.notes}`;
      effective = effective 
        ? `${refNote}\n\n[INSTRUKSI KHUSUS TAMBAHAN]:\n${effective}`
        : refNote;
    }
    return effective || undefined;
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    const finalConstraints = buildEffectiveConstraints();
    onProcess(url.trim(), finalConstraints, selectedReference);
  };

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isLoading || !onProcessLocalFile) return;
    const finalConstraints = buildEffectiveConstraints();
    onProcessLocalFile(selectedFile, finalConstraints, selectedReference);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.includes('mp4') || file.name.endsWith('.mp4')) {
        processSelectedFile(file);
      } else {
        alert('Mohon unggah file video dengan ekstensi .mp4');
      }
    }
  };

  const processSelectedFile = (file: File) => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setFilePreviewUrl(preview);
  };

  const handleRemoveFile = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectHistory = (historyUrl: string) => {
    if (historyUrl.startsWith('local://')) {
      setInputMode('local');
    } else {
      setInputMode('url');
      setUrl(historyUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getMediaBadge = (type: MediaType) => {
    switch (type) {
      case 'video':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-400/30">
            <FileVideo className="w-3 h-3" /> Video
          </span>
        );
      case 'image':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ImageIcon className="w-3 h-3" /> Gambar
          </span>
        );
      case 'document':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <FileText className="w-3 h-3" /> Dokumen
          </span>
        );
      case 'url':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Link2 className="w-3 h-3" /> Medsos
          </span>
        );
    }
  };

  return (
    <div 
      id="autoClipInputView" 
      className={`${isVisible ? 'block' : 'hidden'} w-full min-h-screen bg-black text-white py-10 px-4 sm:px-6 lg:px-8 font-sans`}
    >
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Top Header dengan Tombol Kembali */}
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

        {/* SECTION 1: DUAL-INPUT UI (Tabs: URL Input vs Local MP4 Upload + AI Constraints) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6 text-left">
            
            {/* Header Judul */}
            <div>
              <div className="inline-flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Dual-Mode AI Video Ingestion</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Masukkan Link Video YouTube
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 mt-2 leading-relaxed">
                Pilih metode input video: gunakan URL YouTube publik atau langsung unggah file video lokal berformat .mp4 dari komputer Anda.
              </p>
            </div>

            {/* DUAL MODE TABS SELECTOR */}
            <div className="flex items-center p-1.5 bg-black/80 rounded-2xl border border-zinc-800 gap-1 max-w-md">
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  inputMode === 'url'
                    ? 'bg-sky-500 text-black shadow-md shadow-sky-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Youtube className="w-4 h-4" />
                <span>Link URL (YouTube)</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('local')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  inputMode === 'local'
                    ? 'bg-sky-500 text-black shadow-md shadow-sky-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Unggah File Lokal (.MP4)</span>
              </button>
            </div>

            {/* AI EDITING CONSTRAINTS INPUT (INSTUKSI & BATASAN EDIT SPESIFIK) */}
            <div className="bg-black/75 border border-zinc-800 focus-within:border-sky-400 rounded-2xl p-4 sm:p-5 transition-all space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-white">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  <label htmlFor="aiConstraintsInput" className="text-sm font-bold tracking-wide">
                    Instruksi & Batasan Edit Spesifik
                  </label>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-400/30">
                    AI Prompt
                  </span>
                </div>

                {aiConstraints && (
                  <button
                    type="button"
                    onClick={() => setAiConstraints('')}
                    className="text-[11px] text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Hapus Batasan</span>
                  </button>
                )}
              </div>

              {/* Teks Penjelasan Singkat */}
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tentukan kriteria khusus pemotongan klip agar AI bekerja sesuai gaya editorial yang Anda targetkan.
              </p>

              {/* Preset Chips Cepat */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-semibold text-zinc-500 shrink-0">Pintasan Cepat:</span>
                {PRESET_CONSTRAINTS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPresetChip(chip)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-sky-300 border border-zinc-700/80 transition-all cursor-pointer hover:border-sky-500/40"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Textarea Elegan Dark Mode */}
              <div className="relative pt-1">
                <textarea
                  id="aiConstraintsInput"
                  rows={3}
                  value={aiConstraints}
                  onChange={(e) => setAiConstraints(e.target.value)}
                  placeholder="Minimal duration 30s, max 60s. Make the hook 3 seconds long. Use yellow neon subtitles with black shadows."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all leading-relaxed font-sans shadow-inner resize-y"
                />
              </div>
            </div>

            {/* PILIH REFERENSI EDITAN (OPSIONAL) DROPDOWN SELECTOR - REPLACES COBA CONTOH */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-sky-400" />
                  <span>Pilih Referensi Editan (Opsional)</span>
                </label>

                {onOpenReferenceVault && (
                  <button
                    type="button"
                    onClick={onOpenReferenceVault}
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold cursor-pointer hover:underline"
                  >
                    <FolderArchive className="w-3.5 h-3.5" />
                    <span>Buka Gudang Referensi ({references.length})</span>
                  </button>
                )}
              </div>

              {/* Selector Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between bg-black border rounded-2xl px-4 py-3.5 text-left transition-all cursor-pointer shadow-inner ${
                  selectedReference 
                    ? 'border-sky-500/80 bg-sky-950/20' 
                    : 'border-zinc-800 hover:border-sky-400/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    selectedReference ? 'bg-sky-500/20 text-sky-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    {selectedReference ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {getMediaBadge(selectedReference.mediaType)}
                        <span className="text-sm font-bold text-white truncate max-w-[260px] sm:max-w-md">
                          {selectedReference.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          • {selectedReference.category}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-300">
                          Pilih gaya referensi dari Gudang Anda...
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          (Opsional) Terapkan style pacing, visual, atau skrip yang telah disimpan
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedReference && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRefId('');
                      }}
                      className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Lepas referensi"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
                </div>
              </button>

              {/* Selected Reference Preview Note */}
              {selectedReference && (
                <div className="mt-2.5 p-3 rounded-xl bg-zinc-950 border border-sky-500/30 text-xs space-y-1 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-sky-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-sky-400" /> Referensi aktif diterapkan ke prompt AI
                    </span>
                    <span className="text-zinc-500 font-mono">{selectedReference.createdAt}</span>
                  </div>
                  <p className="text-zinc-300 font-mono text-[11px] line-clamp-2 leading-relaxed">
                    {selectedReference.notes}
                  </p>
                </div>
              )}

              {/* Dropdown Menu Items */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 z-30 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                    Pilihan Referensi Tersedia
                  </div>

                  {/* Option: Tanpa Referensi */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRefId('');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors mt-1 cursor-pointer ${
                      !selectedRefId ? 'bg-sky-500/15 text-sky-400 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-600" />
                      <span>Tanpa Referensi (Gunakan Default AI)</span>
                    </div>
                    {!selectedRefId && <Check className="w-4 h-4 text-sky-400" />}
                  </button>

                  {/* Options: List references */}
                  {references.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedRefId(item.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors mt-1 cursor-pointer ${
                        selectedRefId === item.id ? 'bg-sky-500/15 text-sky-400 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {getMediaBadge(item.mediaType)}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-zinc-500 font-medium">{item.category}</span>
                        {selectedRefId === item.id && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                      </div>
                    </button>
                  ))}

                  {/* Footer link to manage vault */}
                  {onOpenReferenceVault && (
                    <div className="pt-2 mt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenReferenceVault();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-sky-400 hover:bg-sky-500/10 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FolderArchive className="w-3.5 h-3.5" />
                          <span>Kelola / Tambah Baru di Gudang Referensi</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* OPTION 1: URL INPUT (YOUTUBE LINK) */}
            {inputMode === 'url' && (
              <form onSubmit={handleUrlSubmit} className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    URL Video YouTube
                  </label>
                  <span className="text-[11px] text-zinc-500">Mendukung YouTube biasa & Live replay</span>
                </div>

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
                  className="w-full py-4 px-6 rounded-2xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-black font-black text-base sm:text-lg transition-all duration-200 cursor-pointer shadow-xl shadow-sky-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
            )}

            {/* OPTION 2: LOCAL MP4 UPLOAD (DRAG & DROP ZONE) */}
            {inputMode === 'local' && (
              <form onSubmit={handleLocalSubmit} className="space-y-4 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,.mp4"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
                      isDragging
                        ? 'border-sky-400 bg-sky-500/10'
                        : 'border-zinc-700 hover:border-sky-400/70 bg-black/40 hover:bg-black/60'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform shadow-inner">
                      <UploadCloud className="w-8 h-8 text-sky-400" />
                    </div>

                    <div>
                      <p className="text-base sm:text-lg font-bold text-white">
                        Tarik & Lepas File Video <span className="text-sky-400">.MP4</span> ke Sini
                      </p>
                      <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                        atau klik untuk memilih file langsung dari perangkat Anda
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium pt-2">
                      <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                        Format: .MP4
                      </span>
                      <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                        Maksimal: 500 MB
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Selected File Card */}
                    <div className="bg-black border-2 border-sky-400/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-14 h-14 rounded-xl bg-sky-500/10 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0">
                          <FileVideo className="w-7 h-7 text-sky-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-bold text-white truncate max-w-[280px] sm:max-w-[360px]">
                              {selectedFile.name}
                            </h4>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                              MP4 Valid
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">
                            Ukuran: {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Tipe: {selectedFile.type || 'video/mp4'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                        >
                          Ganti File
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors cursor-pointer"
                          title="Hapus File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Tombol Eksekusi Video Lokal */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 px-6 rounded-2xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-black font-black text-base sm:text-lg transition-all duration-200 cursor-pointer shadow-xl shadow-sky-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Wand2 className="w-5 h-5 animate-spin text-black" />
                          <span>Mempersiapkan Pemrosesan File Lokal...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-black fill-current" />
                          <span>Proses Video Lokal (.MP4)</span>
                          <ArrowRight className="w-5 h-5 text-black" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Feature Badges Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>Otomatis Crop Rasio Vertikal 9:16</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>Deteksi Hook & Highlight AI Akurat</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>Subtitle Bahasa Indonesia & Inggris</span>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: BAGIAN RIWAYAT LINK VIDEO */}
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
            <div className="py-10 text-center text-zinc-500 space-y-2">
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
