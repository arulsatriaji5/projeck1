import React from 'react';
import {
  FolderKanban,
  Play,
  Trash2,
  Clock,
  ArrowRight,
  Plus,
  Youtube,
  FileVideo,
} from 'lucide-react';
import { ProjectItem } from '../types';

interface MyProjectsViewProps {
  projects: ProjectItem[];
  onOpenProject: (project: ProjectItem) => void;
  onDeleteProject: (id: string) => void;
  onCreateNew: () => void;
}

export const MyProjectsView: React.FC<MyProjectsViewProps> = ({
  projects,
  onOpenProject,
  onDeleteProject,
  onCreateNew,
}) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 sm:px-8 py-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Riwayat Produksi
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              My Projects
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Semua proyek pemotongan klip otomatis dan hasil analisis skor viral Anda.
            </p>
          </div>

          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs cursor-pointer transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Proyek Baru</span>
          </button>
        </header>

        {projects.length === 0 ? (
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 mx-auto">
              <FolderKanban className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Belum Ada Proyek Tersimpan</h2>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                Mulai dengan menempelkan tautan YouTube atau mengunggah MP4 lokal di menu Home.
              </p>
            </div>
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs cursor-pointer"
            >
              <span>Mulai Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((proj) => (
              <article
                key={proj.id}
                className="bg-gray-950 border border-gray-800 hover:border-gray-700 rounded-2xl overflow-hidden flex flex-col justify-between transition-colors group"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      onClick={() => onOpenProject(proj)}
                      className="w-16 h-24 rounded-xl overflow-hidden bg-gray-900 shrink-0 relative cursor-pointer"
                    >
                      <img
                        src={proj.thumbnailUrl}
                        alt={proj.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-white fill-current" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                          {proj.sourceType === 'youtube' ? (
                            <Youtube className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <FileVideo className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>{proj.aspectRatio}</span>
                        </span>

                        <span className="font-mono tabular-nums text-xs font-extrabold text-emerald-400">
                          Skor {proj.topScore}
                        </span>
                      </div>

                      <h2
                        onClick={() => onOpenProject(proj)}
                        className="text-sm font-bold text-white line-clamp-2 leading-snug cursor-pointer group-hover:text-emerald-400 transition-colors"
                      >
                        {proj.title}
                      </h2>

                      <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono tabular-nums">
                        <span>{proj.clipsCount} Klip</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {proj.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between gap-2 bg-gray-950">
                  <button
                    type="button"
                    onClick={() => onDeleteProject(proj.id)}
                    className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-gray-900 transition-colors cursor-pointer"
                    title="Hapus proyek"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenProject(proj)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-bold text-white transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Buka Klip</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
