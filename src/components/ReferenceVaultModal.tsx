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
    <div className="fixed inset-0 z-50 bg-[#0B1F3A]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-left my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#EEF2F7] rounded-2xl text-[#0B1F3A]">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] tracking-tight">
                  Gudang Referensi Editan
                </h2>
                <span className="text-[11px] font-semibold text-[#1D4ED8]">
                  · Multi-Modal Vault
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Koleksi referensi video, visual frame, skrip, dan URL untuk menjaga konsistensi gaya AI ClipA Studio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => handleOpenAddModal('video')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#122E56] text-white font-bold text-xs transition-all cursor-pointer shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Referensi</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[#EEF2F7] hover:bg-slate-200 text-slate-600 hover:text-[#0B1F3A] transition-colors cursor-pointer"
              title="Tutup Gudang"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          
          {/* Helper Kapabilitas AI */}
          <div className="bg-[#F8F9FA] rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3 text-[#0B1F3A] text-xs font-bold uppercase tracking-wider">
              <Info className="w-4 h-4 text-[#1D4ED8]" />
              <span>Kapabilitas Multi-Modal AI ClipA Studio</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white shadow-sm">
                <div className="p-2 rounded-lg bg-[#E6EDF7] text-[#1D4ED8] shrink-0">
                  <FileVideo className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0B1F3A]">Video (.mp4)</div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    AI meniru <span className="text-[#0B1F3A] font-semibold">style &amp; visual gerak</span> serta pacing potongan klip.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white shadow-sm">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0B1F3A]">Gambar (.png/.jpg)</div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    AI meniru <span className="text-[#0B1F3A] font-semibold">visual &amp; palet warna</span>, layout frame, dan gaya subtitle.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white shadow-sm">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0B1F3A]">Dokumen (.pdf/.txt)</div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    AI menyimpulkan <span className="text-[#0B1F3A] font-semibold">konteks teks menjadi visual</span> dan alur retensi narasi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 font-semibold text-xs shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Format:
            </span>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-[#0B1F3A] text-white font-bold shadow-sm'
                  : 'bg-[#EEF2F7] text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              Semua ({references.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('video')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'video'
                  ? 'bg-[#0B1F3A] text-white font-bold shadow-sm'
                  : 'bg-[#EEF2F7] text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              <FileVideo className="w-3.5 h-3.5" />
              <span>Video ({references.filter(r => r.mediaType === 'video').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('image')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'image'
                  ? 'bg-[#0B1F3A] text-white font-bold shadow-sm'
                  : 'bg-[#EEF2F7] text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Gambar ({references.filter(r => r.mediaType === 'image').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('document')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'document'
                  ? 'bg-[#0B1F3A] text-white font-bold shadow-sm'
                  : 'bg-[#EEF2F7] text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dokumen ({references.filter(r => r.mediaType === 'document').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('url')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'url'
                  ? 'bg-[#0B1F3A] text-white font-bold shadow-sm'
                  : 'bg-[#EEF2F7] text-slate-600 hover:text-[#0B1F3A]'
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

              return (
                <article 
                  key={item.id}
                  className="bg-[#F8F9FA] hover:bg-[#F2F6FB] rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between gap-4 group relative"
                >
                  <div className="space-y-3">
                    {/* Top Row: Media Type & Category */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 flex-wrap">
                        <span className="text-[#1D4ED8] font-bold uppercase tracking-wider">
                          {isVideo ? 'Video .MP4' : isImage ? 'Gambar Visual' : isDoc ? 'Dokumen' : (item.platform ? item.platform.toUpperCase() : 'URL')}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {item.category}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteReference(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus referensi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title & Thumbnail */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative">
                        {isImage && item.fileData?.previewUrl ? (
                          <div 
                            onClick={() => setPreviewImageSrc(item.fileData!.previewUrl!)}
                            className="w-full h-full cursor-pointer relative group/img"
                          >
                            <img src={item.fileData.previewUrl} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-[#0B1F3A]/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : isVideo ? (
                          <FileVideo className="w-6 h-6 text-[#1D4ED8]" />
                        ) : isImage ? (
                          <ImageIcon className="w-6 h-6 text-emerald-600" />
                        ) : isDoc ? (
                          <FileText className="w-6 h-6 text-amber-600" />
                        ) : (
                          <Link2 className="w-6 h-6 text-[#0B1F3A]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[#0B1F3A] group-hover:text-[#1D4ED8] transition-colors line-clamp-1">
                          {item.title}
                        </h4>

                        {item.fileData && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            File: {item.fileData.name} ({item.fileData.size})
                          </p>
                        )}

                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-[11px] text-[#1D4ED8] hover:underline mt-0.5 truncate max-w-full"
                          >
                            <span className="truncate">{item.url}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Editing Notes Box */}
                    <div className="bg-white rounded-xl p-3.5 shadow-sm text-xs text-slate-700 font-mono whitespace-pre-line leading-relaxed max-h-28 overflow-y-auto">
                      {item.notes}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                    <span className="text-[11px] text-slate-500">
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
                          className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#122E56] text-white text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Pilih Gaya Ini
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyNotes(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          copiedId === item.id
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-white hover:bg-[#EEF2F7] text-[#0B1F3A] shadow-sm'
                        }`}
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Salin Catatan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredReferences.length === 0 && (
            <div className="text-center py-12 text-slate-500 space-y-3 bg-[#F8F9FA] rounded-2xl">
              <FolderArchive className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-[#0B1F3A]">Belum ada referensi dalam kategori ini</p>
              <button
                type="button"
                onClick={() => handleOpenAddModal(filterType === 'all' ? 'video' : (filterType as MediaType))}
                className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#122E56] text-white font-bold text-xs transition-all cursor-pointer"
              >
                + Tambah Referensi Sekarang
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Sub-Modal: Add Multi-Modal Reference */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 bg-[#0B1F3A]/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-left my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#EEF2F7] text-[#0B1F3A]">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0B1F3A]">Tambah Referensi Multi-Modal Baru</h3>
                  <p className="text-xs text-slate-500">Unggah aset video, visual frame, naskah skrip, atau link medsos</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseAddModal}
                className="p-2 rounded-xl bg-[#EEF2F7] hover:bg-slate-200 text-slate-600 hover:text-[#0B1F3A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveReference} className="space-y-4">
              
              {/* Media Type Selector */}
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-2">
                  1. Pilih Jenis Modalitas Referensi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMediaType('video')}
                    className={`p-2.5 rounded-xl flex flex-col items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      modalMediaType === 'video'
                        ? 'bg-[#0B1F3A] text-white shadow-sm'
                        : 'bg-[#EEF2F7] text-[#0B1F3A] hover:bg-slate-200'
                    }`}
                  >
                    <FileVideo className="w-5 h-5" />
                    <span>Video (.mp4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalMediaType('image')}
                    className={`p-2.5 rounded-xl flex flex-col items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      modalMediaType === 'image'
                        ? 'bg-[#0B1F3A] text-white shadow-sm'
                        : 'bg-[#EEF2F7] text-[#0B1F3A] hover:bg-slate-200'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span>Gambar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalMediaType('document')}
                    className={`p-2.5 rounded-xl flex flex-col items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      modalMediaType === 'document'
                        ? 'bg-[#0B1F3A] text-white shadow-sm'
                        : 'bg-[#EEF2F7] text-[#0B1F3A] hover:bg-slate-200'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span>Dokumen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalMediaType('url')}
                    className={`p-2.5 rounded-xl flex flex-col items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      modalMediaType === 'url'
                        ? 'bg-[#0B1F3A] text-white shadow-sm'
                        : 'bg-[#EEF2F7] text-[#0B1F3A] hover:bg-slate-200'
                    }`}
                  >
                    <Link2 className="w-5 h-5" />
                    <span>Link Medsos</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Zone */}
              {modalMediaType !== 'url' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
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
                          ? 'border-[#1D4ED8] bg-[#E6EDF7]'
                          : 'border-slate-300 hover:border-[#1D4ED8] bg-[#F8F9FA]'
                      }`}
                    >
                      <UploadCloud className="w-7 h-7 text-[#1D4ED8]" />
                      <p className="text-xs sm:text-sm font-semibold text-[#0B1F3A]">
                        Tarik &amp; Lepas berkas ke sini, atau <span className="text-[#1D4ED8] underline">jelajahi file</span>
                      </p>
                      <p className="text-[11px] text-slate-500">Maksimal 100 MB per berkas</p>
                    </div>
                  ) : (
                    <div className="bg-[#F8F9FA] rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {modalFilePreview ? (
                          <img src={modalFilePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#E6EDF7] text-[#1D4ED8] flex items-center justify-center">
                            {modalMediaType === 'video' ? <FileVideo className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0B1F3A] truncate">{modalUploadedFile.name}</p>
                          <p className="text-[11px] text-slate-500 tabular-nums">{(modalUploadedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setModalUploadedFile(null); setModalFilePreview(null); }}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
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
                  <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    2. Tautan Link Medsos
                  </label>
                  <input
                    type="url"
                    value={modalUrl}
                    onChange={(e) => setModalUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@creator/video/..."
                    className="w-full bg-[#F8F9FA] border border-slate-200 focus:border-[#1D4ED8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#0B1F3A] placeholder-slate-400 focus:outline-none"
                    required={modalMediaType === 'url'}
                  />
                </div>
              )}

              {/* Judul & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    3. Judul Referensi
                  </label>
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    placeholder="Contoh: Hook 3 Detik Hormozi"
                    className="w-full bg-[#F8F9FA] border border-slate-200 focus:border-[#1D4ED8] rounded-xl px-3.5 py-2.5 text-xs text-[#0B1F3A] placeholder-slate-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                    4. Kategori Gaya
                  </label>
                  <input
                    type="text"
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    placeholder="Contoh: Hook, Subtitle, Warna"
                    className="w-full bg-[#F8F9FA] border border-slate-200 focus:border-[#1D4ED8] rounded-xl px-3.5 py-2.5 text-xs text-[#0B1F3A] placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Editing Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                  5. Catatan Detail Editing (Instruksi untuk AI)
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="• Hook 3 detik provokatif&#10;• Subtitle kuning neon bayangan tebal&#10;• Auto zoom tiap kata penekanan"
                  className="w-full bg-[#F8F9FA] border border-slate-200 focus:border-[#1D4ED8] rounded-xl p-3 text-xs text-[#0B1F3A] placeholder-slate-400 focus:outline-none font-mono resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-4 py-2 rounded-xl bg-[#EEF2F7] hover:bg-slate-200 text-[#0B1F3A] text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!modalTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#122E56] text-white text-xs font-bold cursor-pointer shadow-sm disabled:opacity-50"
                >
                  Simpan ke Gudang
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {previewImageSrc && (
        <div 
          onClick={() => setPreviewImageSrc(null)}
          className="fixed inset-0 z-70 bg-[#0B1F3A]/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl">
            <img src={previewImageSrc} alt="Preview Lightbox" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => setPreviewImageSrc(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-[#0B1F3A]/80 hover:bg-[#0B1F3A] text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
