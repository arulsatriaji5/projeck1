import React, { useState, useRef } from 'react';
import {
  Link2,
  UploadCloud,
  SlidersHorizontal,
  Sparkles,
  FileVideo,
  X,
  ArrowRight,
  Play,
  Clock,
} from 'lucide-react';
import { RecipeStyleConfig, ProjectItem } from '../types';

interface HomeDashboardViewProps {
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  recipe: RecipeStyleConfig;
  onOpenRecipeModal: () => void;
  onProcessVideo: () => void;
  isProcessing: boolean;
  recentProjects: ProjectItem[];
  onOpenProject: (project: ProjectItem) => void;
}

const QUICK_SAMPLE_LINKS = [
  {
    label: 'Podcast AI & Kreator',
    url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
  },
  {
    label: 'Review Teknologi 2026',
    url: 'https://www.youtube.com/watch?v=M576WGiDBdQ',
  },
];

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  videoUrl,
  setVideoUrl,
  uploadedFile,
  setUploadedFile,
  recipe,
  onOpenRecipeModal,
  onProcessVideo,
  isProcessing,
  recentProjects,
  onOpenProject,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = (file: File) => {
    setFileError(null);
    const lowerName = file.name.toLowerCase();
    const lowerType = (file.type || '').toLowerCase();
    const isSupportedVideo =
      lowerType.includes('mp4') ||
      lowerType.includes('quicktime') ||
      lowerType.includes('webm') ||
      lowerName.endsWith('.mp4') ||
      lowerName.endsWith('.mov') ||
      lowerName.endsWith('.webm');

    if (isSupportedVideo) {
      setUploadedFile(file);
    } else {
      setFileError('Format berkas tidak didukung. Mohon pilih video berformat .MP4, .MOV, atau .WEBM.');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    if (!uploadedFile && !videoUrl.trim()) return;
    onProcessVideo();
  };

  const canSubmit = Boolean(uploadedFile || videoUrl.trim()) && !isProcessing;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center px-4 sm:px-8 py-12 pt-20 lg:pt-12">
      <div className="w-full max-w-3xl mx-auto space-y-8">
        {/* Centered Header */}
        <div className="text-center space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Studio Klip Otomatis 1-Klik
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white text-balance leading-tight">
            Ubah Video Panjang Jadi Klip Viral Dalam Sekejap
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            Tempel tautan YouTube atau jatuhkan file MP4 lokal Anda. AI akan memotong momen terbaik, menambahkan Auto-Hook, dan merender subtitle {recipe.layout}.
          </p>
        </div>

        {/* Single Unified Input Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-950 border border-gray-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {/* Unified Dropzone + URL Input Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-xl border transition-colors p-3 sm:p-4 ${
              isDragging
                ? 'border-emerald-400 bg-emerald-500/10'
                : 'border-gray-800 bg-gray-900 focus-within:border-emerald-500/70'
            }`}
          >
            {uploadedFile ? (
              <div className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileVideo className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-400 font-mono tabular-nums">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB · File MP4 Siap Diproses
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white cursor-pointer shrink-0"
                  title="Hapus file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Link2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => {
                      setFileError(null);
                      setVideoUrl(e.target.value);
                    }}
                    placeholder="Drop a YouTube link or Upload local MP4"
                    aria-label="Drop a YouTube link or Upload local MP4"
                    className="w-full bg-transparent text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none py-1.5"
                    disabled={isProcessing}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  <span>Unggah MP4</span>
                </button>
              </div>
            )}
          </div>

          {fileError && (
            <p className="text-xs text-rose-400 font-medium px-1">{fileError}</p>
          )}

          {/* Primary Action Row: 1-Click CTA + Recipe/Style Settings Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-800 disabled:text-gray-500 text-gray-950 font-extrabold text-sm sm:text-base transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2.5 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Proses Klip Otomatis (1-Click)</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={onOpenRecipeModal}
              className="py-3.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
              title="Atur Rasio, Auto-Hook, & Template Subtitle"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Resep &amp; Gaya</span>
              <span className="font-mono tabular-nums text-[11px] px-2 py-0.5 rounded bg-gray-800 text-emerald-400">
                {recipe.layout}
              </span>
            </button>
          </div>

          {/* Active Recipe & Quick Samples Bar */}
          <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-500">Resep aktif:</span>
              <span className="text-gray-200 font-semibold">{recipe.layout}</span>
              <span aria-hidden="true">·</span>
              <span className="text-gray-200 font-semibold">
                {recipe.autoHook ? 'Auto-Hook Aktif' : 'Auto-Hook Nonaktif'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-semibold truncate max-w-[180px]">
                {recipe.subtitleTemplateName}
              </span>
            </div>

            {!uploadedFile && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Contoh:</span>
                {QUICK_SAMPLE_LINKS.map((sample) => (
                  <button
                    key={sample.url}
                    type="button"
                    onClick={() => setVideoUrl(sample.url)}
                    className="text-xs text-gray-300 hover:text-emerald-400 underline underline-offset-4 cursor-pointer whitespace-nowrap"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Recent Projects Quick Access */}
        {recentProjects.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <h2 className="font-bold uppercase tracking-wider text-gray-400">
                Proyek Terakhir Anda
              </h2>
              <span className="font-mono tabular-nums text-gray-500">
                {recentProjects.length} Proyek
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentProjects.slice(0, 2).map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => onOpenProject(proj)}
                  className="bg-gray-950 hover:bg-gray-800/70 border border-gray-800 rounded-xl p-3 flex items-center gap-3.5 text-left transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-900 shrink-0 relative">
                    <img
                      src={proj.thumbnailUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                      {proj.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 font-mono tabular-nums">
                      <span className="text-emerald-400 font-bold">Skor {proj.topScore}</span>
                      <span aria-hidden="true">·</span>
                      <span>{proj.clipsCount} Klip</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {proj.createdAt}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
