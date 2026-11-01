import React, { useState, useRef } from 'react';
import { 
  X, 
  FolderArchive, 
  Plus, 
  FileVideo, 
  Image as ImageIcon, 
  FileText, 
  Link2, 
  Info, 
  Filter, 
  Bookmark, 
  Tag, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Maximize2, 
  UploadCloud, 
  AlertCircle 
} from 'lucide-react';
import { ReferenceItem, MediaType } from '../types';

interface ReferenceVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  references: ReferenceItem[];
  onAddReference: (item: ReferenceItem) => void;
  onDeleteReference: (id: string) => void;
  onSelectReference?: (item: ReferenceItem) => void;
}

export const ReferenceVaultModal: React.FC<ReferenceVaultModalProps> = ({
  isOpen,
  onClose,
  references,
  onAddReference,
  onDeleteReference,
  onSelectReference
}) => {
  // Filter state
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add Reference Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalMediaType, setModalMediaType] = useState<MediaType>('video');
  const [modalTitle, setModalTitle] = useState('');
  const [modalCategory, setModalCategory] = useState('Hook 3 Detik');
  const [modalUrl, setModalUrl] = useState('');
  const [modalPlatform, setModalPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | 'lainnya'>('tiktok');
  const [modalNotes, setModalNotes] = useState('');
  const [modalUploadedFile, setModalUploadedFile] = useState<File | null>(null);
  const [modalFilePreview, setModalFilePreview] = useState<string | null>(null);
  const [modalIsDragging, setModalIsDragging] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);

  // Lightbox preview for image
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenAddModal = (type: MediaType = 'video') => {
    setModalMediaType(type);
    setModalTitle('');
    setModalCategory(type === 'video' ? 'Komposisi & Pacing' : type === 'image' ? 'Palet Warna & Mood' : type === 'document' ? 'Struktur Skrip' : 'Hook Viral');
    setModalUrl('');
    setModalPlatform('tiktok');
    setModalNotes('');
    setModalUploadedFile(null);
    setModalFilePreview(null);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    if (modalFilePreview) {
      URL.revokeObjectURL(modalFilePreview);
      setModalFilePreview(null);
    }
    setModalUploadedFile(null);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setModalIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessModalFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcessModalFile = (file: File) => {
    setModalUploadedFile(file);
    if (!modalTitle) {
      setModalTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setModalFilePreview(url);
    } else {
      setModalFilePreview(null);
    }
  };

  const handleSaveReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    let fileDataObj;
    if (modalUploadedFile) {
      fileDataObj = {
        name: modalUploadedFile.name,
        size: `${(modalUploadedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        type: modalUploadedFile.type || modalMediaType,
        previewUrl: modalFilePreview || undefined
      };
    }

    const newRef: ReferenceItem = {
      id: `ref-${Date.now()}`,
      title: modalTitle.trim(),
      mediaType: modalMediaType,
      category: modalCategory,
      notes: modalNotes.trim() || '• Tidak ada catatan khusus.',
      createdAt: 'Baru saja',
      ...(modalMediaType === 'url' ? { url: modalUrl.trim(), platform: modalPlatform } : {}),
      ...(fileDataObj ? { fileData: fileDataObj } : {})
    };

    onAddReference(newRef);
    handleCloseAddModal();
  };

  const handleCopyNotes = (refItem: ReferenceItem) => {
    const mediaBadge = refItem.mediaType.toUpperCase();
    navigator.clipboard.writeText(`[Referensi ${mediaBadge}] ${refItem.title}\nKategori: ${refItem.category}\n\nCatatan Editing:\n${refItem.notes}`);
    setCopiedId(refItem.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredReferences = references.filter(item => {
    if (filterType === 'all') return true;
    return item.mediaType === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-left my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-800 gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/10 border border-sky-400/30 rounded-2xl text-sky-400">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Gudang Referensi Editan
                </h2>
                <span className="text-[10px] font-bold uppercase bg-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded-full border border-sky-400/30">
                  Multi-Modal Vault
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Koleksi referensi video, visual frame, skrip, dan URL untuk menjaga konsistensi gaya AI ClipA Studio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => handleOpenAddModal('video')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs transition-all cursor-pointer shadow-md shadow-sky-500/20 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>Tambah Referensi</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-700"
              title="Tutup Gudang"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          
          {/* Helper Kapabilitas AI */}
          <div className="bg-black/60 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <Info className="w-4 h-4" />
              <span>Kapabilitas Multi-Modal AI ClipA Studio:</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-400/20 shrink-0">
                  <FileVideo className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Video (.mp4)</div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    AI meniru <span className="text-sky-300 font-medium">style & visual gerak</span> serta pacing potongan klip.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Gambar (.png/.jpg)</div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    AI meniru <span className="text-emerald-300 font-medium">visual & palet warna</span>, layout frame, dan gaya subtitle.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Dokumen (.pdf/.txt)</div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    AI menyimpulkan <span className="text-amber-300 font-medium">konteks teks menjadi visual</span> dan alur retensi narasi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-500 font-semibold text-xs shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Format:
            </span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-sky-500 text-black font-bold'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              Semua ({references.length})
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterType === 'video'
                  ? 'bg-sky-500 text-black font-bold'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              <FileVideo className="w-3.5 h-3.5" />
              <span>Video ({references.filter(r => r.mediaType === 'video').length})</span>
            </button>
            <button
              onClick={() => setFilterType('image')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterType === 'image'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Gambar ({references.filter(r => r.mediaType === 'image').length})</span>
            </button>
            <button
              onClick={() => setFilterType('document')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterType === 'document'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dokumen ({references.filter(r => r.mediaType === 'document').length})</span>
            </button>
            <button
              onClick={() => setFilterType('url')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterType === 'url'
                  ? 'bg-purple-500 text-white font-bold'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Tautan Medsos ({references.filter(r => r.mediaType === 'url').length})</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReferences.map((item) => {
              const isVideo = item.mediaType === 'video';
              const isImage = item.mediaType === 'image';
              const isDoc = item.mediaType === 'document';
              const isUrl = item.mediaType === 'url';

              return (
                <div 
                  key={item.id}
                  className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between gap-4 group relative"
                >
                  <div className="space-y-3">
                    {/* Top Row: Media Badge + Category + Delete */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isVideo && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-400/30">
                            <FileVideo className="w-3 h-3" /> Video .MP4
                          </span>
                        )}
                        {isImage && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <ImageIcon className="w-3 h-3" /> Gambar Visual
                          </span>
                        )}
                        {isDoc && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <FileText className="w-3 h-3" /> Dokumen .PDF/.TXT
                          </span>
                        )}
                        {isUrl && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <Link2 className="w-3 h-3" /> {item.platform ? item.platform.toUpperCase() : 'URL'}
                          </span>
                        )}

                        <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-zinc-500" />
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onDeleteReference(item.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Hapus referensi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Judul & Media Thumbnail */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                        {isImage && item.fileData?.previewUrl ? (
                          <div 
                            onClick={() => setPreviewImageSrc(item.fileData!.previewUrl!)}
                            className="w-full h-full cursor-pointer relative group/img"
                          >
                            <img src={item.fileData.previewUrl} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : isVideo ? (
                          <FileVideo className="w-6 h-6 text-sky-400" />
                        ) : isImage ? (
                          <ImageIcon className="w-6 h-6 text-emerald-400" />
                        ) : isDoc ? (
                          <FileText className="w-6 h-6 text-amber-400" />
                        ) : (
                          <Link2 className="w-6 h-6 text-purple-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                          {item.title}
                        </h4>

                        {item.fileData && (
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                            File: {item.fileData.name} ({item.fileData.size})
                          </p>
                        )}

                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline mt-0.5 truncate max-w-full"
                          >
                            <span className="truncate">{item.url}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Catatan Editing Box */}
                    <div className="bg-zinc-900/80 rounded-xl p-3 border border-zinc-800/80 text-xs text-zinc-300 font-mono whitespace-pre-line leading-relaxed max-h-28 overflow-y-auto">
                      {item.notes}
                    </div>
                  </div>

                  {/* Footer Card: Salin Catatan & Terapkan ke Edit */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                    <span className="text-[11px] text-zinc-500">
                      Ditambahkan {item.createdAt}
                    </span>

                    <div className="flex items-center gap-2">
                      {onSelectReference && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectReference(item);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-black border border-sky-400/30 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Pilih Gaya Ini
                        </button>
                      )}

                      <button
                        onClick={() => handleCopyNotes(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          copiedId === item.id
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-zinc-400" />
                            <span>Salin Catatan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredReferences.length === 0 && (
            <div className="text-center py-12 text-zinc-500 space-y-3 bg-zinc-950/60 rounded-2xl border border-zinc-800">
              <FolderArchive className="w-10 h-10 text-zinc-700 mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">Belum ada referensi dalam kategori ini</p>
              <button
                onClick={() => handleOpenAddModal(filterType === 'all' ? 'video' : (filterType as MediaType))}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs transition-all cursor-pointer"
              >
                + Tambah Referensi Sekarang
              </button>
            </div>
          )}

        </div>

      </div>

      {/* SUB-MODAL: FORM TAMBAH REFERENSI MULTI-MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-left my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-400/20">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tambah Referensi Multi-Modal Baru</h3>
                  <p className="text-xs text-zinc-400">Unggah aset video, visual frame, naskah skrip, atau link medsos</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseAddModal}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveReference} className="space-y-4">
              
              {/* Pilihan Modalitas */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  1. Pilih Jenis Modalitas Referensi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMediaType('video')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      modalMediaType === 'video'
                        ? 'border-sky-400 bg-sky-500/10 text-sky-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <FileVideo className="w-5 h-5" />
                    <span>Video (.mp4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalMediaType('image')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      modalMediaType === 'image'
                        ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span>Gambar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalMediaType('document')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      modalMediaType === 'document'
                        ? 'border-amber-400 bg-amber-500/10 text-amber-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span>Dokumen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalMediaType('url')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      modalMediaType === 'url'
                        ? 'border-purple-400 bg-purple-500/10 text-purple-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <Link2 className="w-5 h-5" />
                    <span>Link Medsos</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Zone for File (Video, Image, Document) */}
              {modalMediaType !== 'url' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    2. Unggah Berkas ({modalMediaType === 'video' ? '.MP4' : modalMediaType === 'image' ? '.PNG / .JPG' : '.PDF / .TXT'})
                  </label>
                  
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept={
                      modalMediaType === 'video' 
                        ? 'video/mp4' 
                        : modalMediaType === 'image' 
                        ? 'image/png,image/jpeg,image/webp' 
                        : '.pdf,.txt,application/pdf,text/plain'
                    }
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessModalFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {!modalUploadedFile ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setModalIsDragging(true); }}
                      onDragLeave={() => setModalIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => modalFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                        modalIsDragging
                          ? 'border-sky-400 bg-sky-500/10'
                          : 'border-zinc-700 hover:border-sky-400/70 bg-zinc-950/60 hover:bg-zinc-950'
                      }`}
                    >
                      <UploadCloud className="w-7 h-7 text-sky-400" />
                      <p className="text-xs sm:text-sm font-semibold text-white">
                        Tarik & Lepas berkas ke sini, atau <span className="text-sky-400">jelajahi file</span>
                      </p>
                      <p className="text-[11px] text-zinc-500">Maksimal 100 MB per berkas</p>
                    </div>
                  ) : (
                    <div className="bg-zinc-950 border border-sky-400/60 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {modalFilePreview ? (
                          <img src={modalFilePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-zinc-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                            {modalMediaType === 'video' ? <FileVideo className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{modalUploadedFile.name}</p>
                          <p className="text-[11px] text-zinc-400">{(modalUploadedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setModalUploadedFile(null); setModalFilePreview(null); }}
                        className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* URL Field for URL Type */}
              {modalMediaType === 'url' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    2. Tautan Link Medsos
                  </label>
                  <input
                    type="url"
                    value={modalUrl}
                    onChange={(e) => setModalUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@creator/video/..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
                    required={modalMediaType === 'url'}
                  />
                </div>
              )}

              {/* Judul & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    3. Judul Referensi
                  </label>
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    placeholder="Contoh: Hook 3 Detik Hormozi"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    4. Kategori Gaya
                  </label>
                  <input
                    type="text"
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    placeholder="Contoh: Hook, Subtitle, Warna"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Catatan Editing untuk AI */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  5. Catatan Detail Editing (Instruksi untuk AI)
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="• Hook 3 detik provokatif&#10;• Subtitle kuning neon bayangan tebal&#10;• Auto zoom tiap kata penekanan"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-400 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none font-mono resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!modalTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-black cursor-pointer shadow-md shadow-sky-500/20 disabled:opacity-50"
                >
                  Simpan ke Gudang
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL UNTUK PREVIEW GAMBAR */}
      {previewImageSrc && (
        <div 
          onClick={() => setPreviewImageSrc(null)}
          className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-zinc-700 shadow-2xl">
            <img src={previewImageSrc} alt="Preview Lightbox" className="w-full h-full object-contain" />
            <button
              onClick={() => setPreviewImageSrc(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
