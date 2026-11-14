import React, { useState, useRef } from 'react';
import {
  FolderArchive,
  Plus,
  FileVideo,
  Image as ImageIcon,
  FileText,
  Link2,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  X,
  UploadCloud,
  Tag,
} from 'lucide-react';
import { ReferenceItem, MediaType } from '../types';

interface ReferenceVaultViewProps {
  references: ReferenceItem[];
  activeTemplateId: string;
  onSelectAsTemplate: (item: ReferenceItem) => void;
  onAddReference: (item: ReferenceItem) => void;
  onDeleteReference: (id: string) => void;
}

export const ReferenceVaultView: React.FC<ReferenceVaultViewProps> = ({
  references,
  activeTemplateId,
  onSelectAsTemplate,
  onAddReference,
  onDeleteReference,
}) => {
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Subtitle & Pacing');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filtered = references.filter((r) =>
    filterType === 'all' ? true : r.mediaType === filterType
  );

  const handleFileChange = (file: File) => {
    setUploadedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
    if (file.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newItem: ReferenceItem = {
      id: `ref-${Date.now()}`,
      title: title.trim(),
      mediaType,
      category: category.trim() || 'Gaya Kustom',
      notes: notes.trim() || '• Ikuti gaya visual dan pacing cepat referensi ini.',
      createdAt: 'Baru saja',
      ...(mediaType === 'url' ? { url: url.trim(), platform: 'tiktok' } : {}),
      ...(uploadedFile
        ? {
            fileData: {
              name: uploadedFile.name,
              size: `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB`,
              type: uploadedFile.type || mediaType,
              previewUrl: filePreview || undefined,
            },
          }
        : {}),
    };

    onAddReference(newItem);
    setIsAddOpen(false);
    setTitle('');
    setUrl('');
    setNotes('');
    setUploadedFile(null);
    setFilePreview(null);
  };

  const handleCopy = (item: ReferenceItem) => {
    navigator.clipboard.writeText(`${item.title}\n${item.notes}`);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 sm:px-8 py-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Brand Kit &amp; Template Subtitle
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Gudang Referensi
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Simpan referensi visual, video contoh, dan gaya subtitle untuk dipakai di Resep Auto-Clip.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs cursor-pointer transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Template</span>
          </button>
        </header>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { id: 'all', label: `Semua (${references.length})` },
            { id: 'video', label: 'Video' },
            { id: 'image', label: 'Gambar' },
            { id: 'document', label: 'Dokumen' },
            { id: 'url', label: 'Tautan' },
          ] as Array<{ id: 'all' | MediaType; label: string }>).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                  : 'bg-gray-950 text-gray-400 border border-gray-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((item) => {
            const isSelected = activeTemplateId === item.id;
            return (
              <article
                key={item.id}
                className={`bg-gray-950 rounded-2xl p-5 border flex flex-col justify-between gap-4 transition-colors ${
                  isSelected ? 'border-emerald-500/70' : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono uppercase text-[11px] font-bold text-emerald-400">
                        {item.mediaType}
                      </span>
                      <span className="text-gray-600">·</span>
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <Tag className="w-3 h-3" /> {item.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteReference(item.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-gray-900 transition-colors cursor-pointer"
                      title="Hapus referensi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.mediaType === 'image' && item.fileData?.previewUrl ? (
                        <img
                          src={item.fileData.previewUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : item.mediaType === 'video' ? (
                        <FileVideo className="w-5 h-5 text-emerald-400" />
                      ) : item.mediaType === 'image' ? (
                        <ImageIcon className="w-5 h-5 text-emerald-400" />
                      ) : item.mediaType === 'document' ? (
                        <FileText className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Link2 className="w-5 h-5 text-sky-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-bold text-white line-clamp-1">{item.title}</h2>
                      {item.fileData && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate font-mono">
                          {item.fileData.name} ({item.fileData.size})
                        </p>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline mt-0.5 truncate max-w-full"
                        >
                          <span className="truncate">{item.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-gray-300 font-mono whitespace-pre-line leading-relaxed max-h-28 overflow-y-auto">
                    {item.notes}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-800 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-gray-500">Ditambahkan {item.createdAt}</span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectAsTemplate(item)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-emerald-500 text-gray-950'
                          : 'bg-gray-900 hover:bg-gray-800 border border-gray-800 text-emerald-400'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Aktif di Resep</span>
                        </>
                      ) : (
                        <span>Gunakan Gaya</span>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-12 text-center space-y-3">
            <FolderArchive className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-sm font-bold text-white">Belum ada template di kategori ini</p>
          </div>
        )}
      </div>

      {/* Add Template Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h2 className="text-base font-bold text-white">Tambah Template Referensi Baru</h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-2 rounded-lg bg-gray-900 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {(['video', 'image', 'document', 'url'] as MediaType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMediaType(t)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold uppercase cursor-pointer border ${
                      mediaType === t
                        ? 'bg-emerald-500/15 border-emerald-400 text-emerald-400'
                        : 'bg-gray-900 border-gray-800 text-gray-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {mediaType === 'url' ? (
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@creator/video/..."
                  required
                  className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-dashed border-gray-700 hover:border-emerald-400 rounded-xl p-4 text-xs text-gray-300 flex flex-col items-center gap-2 bg-gray-900 cursor-pointer"
                  >
                    <UploadCloud className="w-5 h-5 text-emerald-400" />
                    <span>{uploadedFile ? uploadedFile.name : 'Pilih berkas referensi (.mp4, .png, .pdf)'}</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nama template..."
                  required
                  className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Kategori..."
                  className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instruksi gaya subtitle, pacing, atau hook untuk AI..."
                className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-400 rounded-xl p-3 text-xs text-white font-mono focus:outline-none resize-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-gray-300 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-extrabold cursor-pointer"
                >
                  Simpan Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
