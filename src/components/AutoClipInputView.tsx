import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Youtube, 
  Wand2, 
  ArrowRight, 
  History, 
  Trash2, 
  Play, 
  Clock, 
  UploadCloud, 
  FileVideo, 
  Bookmark, 
  Check, 
  FolderArchive, 
  X, 
  Sliders, 
  ChevronDown,
  Cpu
} from 'lucide-react';
import { ReferenceItem, MediaType } from '../types';
import { getStoredReferences } from '../data/defaultReferences';
import { ClientVideoProcessor } from './ClientVideoProcessor';
import { VideoBlueprint } from '../hooks/useFFmpeg';

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  channelName: string;
  duration: string;
  processedAt: string;
  thumbnailUrl: string;
}

const PRESET_CONSTRAINTS = [
  'Durasi 30-60 detik',
  'Hook 3 Detik Cepat',
  'Subtitle Kuning + Bayangan Hitam',
  'Pacing Cepat (Zero Silence)',
  'Zoom Dinamis 1.2x',
  'Hapus jeda > 0.4 detik'
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
  const [inputMode, setInputMode] = useState<'url' | 'local'>('url');
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=LXb3EKWsInQ');
  const [aiConstraints, setAiConstraints] = useState('');
  const [selectedRefId, setSelectedRefId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const references = propReferences && propReferences.length > 0 
    ? propReferences 
    : getStoredReferences();

  const selectedReference = references.find(r => r.id === selectedRefId) || null;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localProcessingMode, setLocalProcessingMode] = useState<'studio' | 'ffmpeg'>('ffmpeg');
  const [localBlueprint, setLocalBlueprint] = useState<VideoBlueprint | null>(null);
  const [isAnalyzingLocal, setIsAnalyzingLocal] = useState(false);

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

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const handleApplyPresetChip = (chipText: string) => {
    setAiConstraints((prev) => {
      if (!prev.trim()) return chipText;
      if (prev.includes(chipText)) return prev;
      return `${prev}\n• ${chipText}`;
    });
  };

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

  const handleRequestLocalAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzingLocal(true);
    try {
      const res = await fetch("/api/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceVideoName: selectedFile.name,
          sourceDuration: 60,
          referenceId: selectedRefId || undefined,
          editingNotes: selectedReference ? selectedReference.notes : undefined,
          promptInstructions: aiConstraints || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.blueprint) {
          setLocalBlueprint(data.blueprint);
        }
      }
    } catch (e) {
      console.warn("Gagal menganalisis video:", e);
    } finally {
      setIsAnalyzingLocal(false);
    }
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
    setLocalBlueprint(null);
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

  const getMediaLabel = (type: MediaType) => {
    switch (type) {
      case 'video': return 'Video';
      case 'image': return 'Gambar';
      case 'document': return 'Dokumen';
      case 'url': return 'Medsos';
    }
  };

  return (
    /* Auto Clip Input Section */
    <section 
      id="autoClipInputView" 
      className={`${isVisible ? 'block' : 'hidden'} w-full min-h-screen bg-[#F8F9FA] text-[#0B1F3A] py-8 sm:py-12 px-4 sm:px-6 lg:px-8`}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header Action Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#EEF2F7] text-[#0B1F3A] font-bold text-sm transition-colors cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#1D4ED8]" />
            <span>Kembali ke Beranda</span>
          </button>

          <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
            Mode Klip Otomatis AI
          </span>
        </div>

        {/* Main Input Card */}
        <article className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="space-y-6 text-left">
            
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1F3A] tracking-tight">
                Masukkan Link Video atau Unggah MP4
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                Pilih sumber video Anda, tentukan gaya instruksi AI bila perlu, lalu klik Proses Video untuk menghasilkan klip vertikal 9:16.
              </p>
            </div>

            {/* Dual Mode Selector */}
            <div className="flex items-center p-1.5 bg-[#EEF2F7] rounded-2xl gap-1 max-w-md">
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  inputMode === 'url'
                    ? 'bg-[#0B1F3A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0B1F3A]'
                }`}
              >
                <Youtube className="w-4 h-4" />
                <span>Link URL YouTube</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('local')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  inputMode === 'local'
                    ? 'bg-[#0B1F3A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0B1F3A]'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>File Lokal (.MP4)</span>
              </button>
            </div>

            {/* AI Editing Constraints Section */}
            <div className="bg-[#F8F9FA] rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#0B1F3A]">
                  <Sliders className="w-4 h-4 text-[#1D4ED8]" />
                  <label htmlFor="aiConstraintsInput" className="text-sm font-bold">
                    Instruksi & Batasan Edit AI
                  </label>
                </div>

                {aiConstraints && (
                  <button
                    type="button"
                    onClick={() => setAiConstraints('')}
                    className="text-xs text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Hapus Batasan</span>
                  </button>
                )}
              </div>

              {/* Preset Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 shrink-0 mr-1">Pintasan:</span>
                {PRESET_CONSTRAINTS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPresetChip(chip)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white hover:bg-[#0B1F3A] text-[#0B1F3A] hover:text-white shadow-xs transition-colors cursor-pointer font-medium"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                id="aiConstraintsInput"
                rows={3}
                value={aiConstraints}
                onChange={(e) => setAiConstraints(e.target.value)}
                placeholder="Contoh: Durasi 30-60 detik, buat hook 3 detik pertama yang kuat, gunakan subtitle kuning tebal."
                className="w-full bg-white rounded-xl p-3.5 text-xs sm:text-sm text-[#0B1F3A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 transition-shadow shadow-xs resize-y"
              />
            </div>

            {/* Optional Reference Dropdown Selector */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>Pilih Referensi Editan (Opsional)</span>
                </label>

                {onOpenReferenceVault && (
                  <button
                    type="button"
                    onClick={onOpenReferenceVault}
                    className="text-xs text-[#1D4ED8] hover:text-[#0B1F3A] flex items-center gap-1 font-bold cursor-pointer hover:underline"
                  >
                    <FolderArchive className="w-3.5 h-3.5" />
                    <span>Buka Gudang Referensi ({references.length})</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-all cursor-pointer ${
                  selectedReference 
                    ? 'bg-[#EEF2F7] ring-2 ring-[#0B1F3A]' 
                    : 'bg-[#F8F9FA] hover:bg-[#EEF2F7]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    selectedReference ? 'bg-[#0B1F3A] text-white' : 'bg-white text-[#1D4ED8] shadow-xs'
                  }`}>
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    {selectedReference ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#1D4ED8]">
                          {getMediaLabel(selectedReference.mediaType)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-sm font-bold text-[#0B1F3A] truncate max-w-[260px] sm:max-w-md">
                          {selectedReference.title}
                        </span>
                        <span className="text-xs text-slate-500">
                          · {selectedReference.category}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#0B1F3A]">
                          Pilih gaya referensi dari Gudang Anda...
                        </p>
                        <p className="text-xs text-slate-500">
                          Opsional: terapkan gaya pacing, visual, atau skrip tersimpan
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
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Lepas referensi"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180 text-[#0B1F3A]' : ''}`} />
                </div>
              </button>

              {selectedReference && (
                <div className="mt-2.5 p-3.5 rounded-xl bg-[#EEF2F7] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#0B1F3A] font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-[#1D4ED8]" /> Referensi aktif diterapkan ke AI
                    </span>
                    <span className="text-slate-500 font-mono">{selectedReference.createdAt}</span>
                  </div>
                  <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                    {selectedReference.notes}
                  </p>
                </div>
              )}

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 z-30 bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 p-2 max-h-72 overflow-y-auto">
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-500 border-b border-slate-100">
                    Pilihan Referensi Tersedia
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRefId('');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors mt-1 cursor-pointer ${
                      !selectedRefId ? 'bg-[#EEF2F7] text-[#0B1F3A] font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Tanpa Referensi (Gunakan Standar AI)</span>
                    {!selectedRefId && <Check className="w-4 h-4 text-[#1D4ED8]" />}
                  </button>

                  {references.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedRefId(item.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors mt-1 cursor-pointer ${
                        selectedRefId === item.id ? 'bg-[#EEF2F7] text-[#0B1F3A] font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="text-[#1D4ED8] font-bold">{getMediaLabel(item.mediaType)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-500">{item.category}</span>
                        {selectedRefId === item.id && <Check className="w-4 h-4 text-[#1D4ED8] shrink-0" />}
                      </div>
                    </button>
                  ))}

                  {onOpenReferenceVault && (
                    <div className="pt-2 mt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenReferenceVault();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-[#1D4ED8] hover:bg-[#EEF2F7] rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FolderArchive className="w-3.5 h-3.5" />
                          <span>Kelola di Gudang Referensi</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Option 1: URL Input Form */}
            {inputMode === 'url' && (
              <form onSubmit={handleUrlSubmit} className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    URL Video YouTube
                  </label>
                  <span className="text-xs text-slate-500">Mendukung video reguler & rekaman Live</span>
                </div>

                <div className="relative flex items-center bg-[#F8F9FA] rounded-2xl p-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0B1F3A]/20 transition-all">
                  <div className="pl-3 pr-2 text-[#1D4ED8] shrink-0">
                    <Youtube className="w-6 h-6" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Tempel URL YouTube di sini (misal: https://youtube.com/watch?v=...)"
                    className="w-full bg-transparent text-[#0B1F3A] text-sm sm:text-base placeholder-slate-400 focus:outline-none py-3 px-1 font-medium"
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="w-full py-4 px-6 rounded-2xl bg-[#0B1F3A] hover:bg-[#122E56] text-white font-extrabold text-base transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Wand2 className="w-5 h-5 animate-spin text-white" />
                      <span>Memproses Analisis AI...</span>
                    </>
                  ) : (
                    <>
                      <span>Proses Video</span>
                      <ArrowRight className="w-5 h-5 text-sky-300" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Option 2: Local MP4 Upload */}
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
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 ${
                      isDragging
                        ? 'border-[#0B1F3A] bg-[#EEF2F7]'
                        : 'border-slate-300 hover:border-[#0B1F3A] bg-[#F8F9FA]'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#0B1F3A]">
                      <UploadCloud className="w-7 h-7 text-[#1D4ED8]" />
                    </div>

                    <div>
                      <p className="text-base sm:text-lg font-bold text-[#0B1F3A]">
                        Tarik & Lepas File Video <span className="text-[#1D4ED8]">.MP4</span> ke Sini
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        atau klik untuk memilih file langsung dari perangkat Anda
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium pt-1">
                      <span>Format .MP4</span>
                      <span aria-hidden="true">·</span>
                      <span>Maksimal 500 MB</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-[#EEF2F7] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-12 h-12 rounded-xl bg-[#0B1F3A] flex items-center justify-center text-white shrink-0">
                          <FileVideo className="w-6 h-6 text-sky-300" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm sm:text-base font-bold text-[#0B1F3A] truncate max-w-[280px] sm:max-w-[360px]">
                            {selectedFile.name}
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5 font-mono tabular-nums">
                            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB · MP4 Valid
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-bold text-[#0B1F3A] shadow-xs transition-colors cursor-pointer"
                        >
                          Ganti File
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Hapus File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Mode Pemrosesan */}
                    <div className="flex items-center p-1 bg-[#EEF2F7] rounded-xl gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setLocalProcessingMode('ffmpeg')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          localProcessingMode === 'ffmpeg'
                            ? 'bg-[#0B1F3A] text-white shadow-xs'
                            : 'text-slate-600 hover:text-[#0B1F3A]'
                        }`}
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Rendering Browser (FFmpeg.wasm)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLocalProcessingMode('studio')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          localProcessingMode === 'studio'
                            ? 'bg-[#0B1F3A] text-white shadow-xs'
                            : 'text-slate-600 hover:text-[#0B1F3A]'
                        }`}
                      >
                        <span>Buka di Studio Timeline</span>
                      </button>
                    </div>

                    {localProcessingMode === 'ffmpeg' ? (
                      <div className="pt-2">
                        <ClientVideoProcessor
                          sourceFile={selectedFile}
                          blueprint={localBlueprint}
                          onRequestAnalyze={handleRequestLocalAnalyze}
                          isAnalyzing={isAnalyzingLocal}
                        />
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 px-6 rounded-2xl bg-[#0B1F3A] hover:bg-[#122E56] text-white font-extrabold text-base transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        <span>Proses Video Lokal</span>
                        <ArrowRight className="w-5 h-5 text-sky-300" />
                      </button>
                    )}
                  </div>
                )}
              </form>
            )}

            {/* Unboxed Footer Highlights */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
              <span>Otomatis Crop Rasio 9:16</span>
              <span>Deteksi Hook & Highlight AI</span>
              <span>Subtitle Bahasa Indonesia & Inggris</span>
            </div>

          </div>
        </article>

        {/* Video History Section */}
        <article className="bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm text-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#EEF2F7] rounded-xl text-[#0B1F3A]">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0B1F3A]">Riwayat Video</h2>
                <p className="text-xs text-slate-500">Daftar video yang pernah Anda proses sebelumnya</p>
              </div>
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                title="Hapus Semua Riwayat"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Riwayat</span>
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F8F9FA] hover:bg-[#EEF2F7] rounded-2xl p-4 transition-colors flex flex-col justify-between gap-3 group cursor-pointer"
                  onClick={() => handleSelectHistory(item.url)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-14 bg-[#0B1F3A] rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-white fill-current" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-bold text-[#0B1F3A] truncate group-hover:text-[#1D4ED8] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 truncate">{item.channelName}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1.5 font-mono tabular-nums">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#1D4ED8]" /> {item.duration}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.processedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 text-xs">
                    <span className="font-bold text-[#1D4ED8] flex items-center gap-1">
                      Gunakan Lagi <ArrowRight className="w-3 h-3" />
                    </span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[160px] font-mono">
                      {item.url}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500 space-y-2">
              <History className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-[#0B1F3A]">Belum ada riwayat video</p>
              <p className="text-xs text-slate-500">
                Video YouTube yang Anda masukkan di atas akan muncul di sini untuk akses cepat.
              </p>
            </div>
          )}
        </article>

      </div>
    </section>
  );
};
