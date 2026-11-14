"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  UploadCloud, 
  Bookmark, 
  FolderArchive, 
  Wand2, 
  ArrowRight, 
  Cpu, 
  Database, 
  FileVideo 
} from "lucide-react";
import { ClientVideoProcessor } from "@/components/ClientVideoProcessor";
import { VideoBlueprint } from "@/hooks/useFFmpeg";

interface TursoReference {
  id: string;
  type: string;
  url_or_content: string;
  editing_notes: string;
  created_at: string;
}

export default function HomePage() {
  const [references, setReferences] = useState<TursoReference[]>([]);
  const [selectedRefId, setSelectedRefId] = useState<string>("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [blueprint, setBlueprint] = useState<VideoBlueprint | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch references from Turso via Next.js API route /api/references
  useEffect(() => {
    async function loadRefs() {
      try {
        const res = await fetch("/api/references");
        if (res.ok) {
          const data = await res.json();
          if (data.references) {
            setReferences(data.references);
          }
        }
      } catch (e) {
        console.warn("Gagal memuat referensi dari /api/references:", e);
      }
    }
    loadRefs();
  }, []);

  // Request Blueprint from Gemini 2.5 Flash API Route
  const handleAnalyzeVideo = async () => {
    if (!sourceFile) return;
    setIsAnalyzing(true);

    try {
      const selectedRef = references.find((r) => r.id === selectedRefId);
      const res = await fetch("/api/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceVideoName: sourceFile.name,
          sourceDuration: 60,
          referenceId: selectedRefId || undefined,
          editingNotes: selectedRef ? selectedRef.editing_notes : undefined,
          promptInstructions: "Potong klip 15-45 detik dengan hook terkuat dan subtitle kuning neon.",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.blueprint) {
          setBlueprint(data.blueprint);
        }
      }
    } catch (e) {
      console.error("Gagal menganalisis video:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSourceFile(file);
      setBlueprint(null);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 sm:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-sky-400">ClipA Studio</span>
              <span className="text-[10px] font-bold uppercase bg-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded-full border border-sky-400/30">
                Next.js + Vercel
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Arsitektur Client-Side Video Processing (FFmpeg.wasm) & Turso Database (libSQL).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> Turso Edge
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <Cpu className="w-3.5 h-3.5 text-sky-400" /> Gemini 2.5 Flash
            </span>
          </div>
        </div>

        {/* Ingestion & Reference Selection Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">1. Pilih Video & Gaya Referensi Turso</h2>
            <p className="text-xs text-zinc-400">
              Pilih file video MP4 dan tentukan gaya referensi dari basis data Turso untuk pemotongan konsisten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Trigger */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-sky-400/80 bg-black/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
            >
              <input 
                ref={fileInputRef}
                type="file"
                accept="video/mp4,.mp4"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-sky-400" />
              <p className="text-sm font-bold text-white">
                {sourceFile ? sourceFile.name : "Unggah Video Lokal (.MP4)"}
              </p>
              <p className="text-[11px] text-zinc-500">
                {sourceFile ? `${(sourceFile.size / (1024 * 1024)).toFixed(1)} MB` : "Klik untuk memilih berkas"}
              </p>
            </div>

            {/* Turso Reference Selector */}
            <div className="bg-black/40 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Bookmark className="w-3.5 h-3.5 text-sky-400" />
                  Gaya Referensi (Turso DB)
                </label>
                <select
                  value={selectedRefId}
                  onChange={(e) => setSelectedRefId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="">-- Tanpa Referensi (Standar AI) --</option>
                  {references.map((ref) => (
                    <option key={ref.id} value={ref.id}>
                      [{ref.type.toUpperCase()}] {ref.url_or_content.slice(0, 40)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAnalyzeVideo}
                disabled={!sourceFile || isAnalyzing}
                className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-black font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Wand2 className="w-4 h-4 animate-spin text-black" />
                    <span>Menganalisis dengan Gemini 2.5 Flash...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black fill-current" />
                    <span>Dapatkan Blueprint AI</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 2. Client-Side Video Rendering Engine Component */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">2. Pratinjau & Rendering Client-Side (FFmpeg.wasm)</h2>
          <ClientVideoProcessor 
            sourceFile={sourceFile}
            blueprint={blueprint}
            onRequestAnalyze={handleAnalyzeVideo}
            isAnalyzing={isAnalyzing}
          />
        </div>

      </div>
    </main>
  );
}
