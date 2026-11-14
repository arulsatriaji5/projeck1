"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Sparkles, 
  Cpu, 
  AlertCircle, 
  RefreshCw, 
  FileVideo, 
  Scissors, 
  Crop, 
  Type
} from 'lucide-react';
import { useFFmpeg, VideoBlueprint, FFmpegProcessResult } from '../hooks/useFFmpeg';

interface ClientVideoProcessorProps {
  sourceFile: File | null;
  blueprint: VideoBlueprint | null;
  onRequestAnalyze?: () => Promise<void>;
  isAnalyzing?: boolean;
}

export const ClientVideoProcessor: React.FC<ClientVideoProcessorProps> = ({
  sourceFile,
  blueprint: initialBlueprint,
  onRequestAnalyze,
  isAnalyzing = false
}) => {
  const {
    isProcessing,
    isLoaded,
    isLoading: isFfmpegLoading,
    progress,
    statusMessage,
    error: ffmpegError,
    processVideoClip
  } = useFFmpeg();

  const [blueprint, setBlueprint] = useState<VideoBlueprint | null>(initialBlueprint);
  const [processedResult, setProcessedResult] = useState<FFmpegProcessResult | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialBlueprint) {
      setBlueprint(initialBlueprint);
    }
  }, [initialBlueprint]);

  useEffect(() => {
    if (sourceFile) {
      const url = URL.createObjectURL(sourceFile);
      setPreviewObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewObjectUrl(null);
    }
  }, [sourceFile]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || !blueprint) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    if (current >= blueprint.end_time) {
      videoRef.current.currentTime = blueprint.start_time;
      if (!isPlaying) {
        videoRef.current.pause();
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current || !blueprint) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime < blueprint.start_time || videoRef.current.currentTime >= blueprint.end_time) {
        videoRef.current.currentTime = blueprint.start_time;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const activeSubtitle = React.useMemo(() => {
    if (!blueprint || !blueprint.subtitles) return null;
    const relativeTime = Math.max(0, currentTime - blueprint.start_time);
    return blueprint.subtitles.find(sub => relativeTime >= sub.start && relativeTime <= sub.end);
  }, [blueprint, currentTime]);

  const handleRenderVideo = async () => {
    if (!sourceFile || !blueprint) return;
    try {
      const result = await processVideoClip(sourceFile, blueprint);
      setProcessedResult(result);
    } catch (err) {
      console.error('Rendering gagal:', err);
    }
  };

  const handleDownload = () => {
    if (!processedResult) return;
    const a = document.createElement('a');
    a.href = processedResult.url;
    a.download = processedResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!sourceFile) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-500 space-y-3">
        <FileVideo className="w-10 h-10 text-zinc-700 mx-auto" />
        <h4 className="text-base font-bold text-zinc-300">Belum Ada Berkas Video Sumber</h4>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          Silakan pilih atau unggah file video .mp4 untuk memulai pemrosesan FFmpeg client-side.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 text-left shadow-2xl relative overflow-hidden">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-400/30 text-sky-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Mesin Rendering FFmpeg.wasm</h3>
              <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Client-Side (Vercel Serverless Ready)
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Diproses 100% pada memori browser Anda via WebAssembly — aman & bebas batas timeout Vercel.
            </p>
          </div>
        </div>

        {onRequestAnalyze && (
          <button
            type="button"
            onClick={onRequestAnalyze}
            disabled={isAnalyzing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500 border border-sky-400/40 text-sky-400 hover:text-black font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analisis Gemini 2.5 Flash...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Perbarui Blueprint AI</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Info & Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-black/70 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-zinc-800 text-sky-400 shrink-0">
                <FileVideo className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate max-w-[220px] sm:max-w-xs">{sourceFile.name}</p>
                <p className="text-[11px] text-zinc-400">
                  {(sourceFile.size / (1024 * 1024)).toFixed(1)} MB • Format MP4
                </p>
              </div>
            </div>

            <span className="text-[11px] text-zinc-500 font-mono">
              {blueprint ? `${(blueprint.end_time - blueprint.start_time).toFixed(1)}s Klip` : 'Siap'}
            </span>
          </div>

          {blueprint && (
            <div className="bg-black/50 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Blueprint Gemini 2.5 Flash
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                  Skema Valid
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center justify-center gap-1">
                    <Scissors className="w-3 h-3 text-sky-400" /> Titik Potong
                  </p>
                  <p className="text-xs font-bold text-white mt-1 font-mono">
                    {blueprint.start_time.toFixed(1)}s - {blueprint.end_time.toFixed(1)}s
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center justify-center gap-1">
                    <Crop className="w-3 h-3 text-emerald-400" /> Rasio Vertikal
                  </p>
                  <p className="text-xs font-bold text-white mt-1 font-mono">
                    9:16 (Center Crop)
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center justify-center gap-1">
                    <Type className="w-3 h-3 text-amber-400" /> Subtitles
                  </p>
                  <p className="text-xs font-bold text-white mt-1 font-mono">
                    {blueprint.subtitles?.length || 0} Baris
                  </p>
                </div>
              </div>
            </div>
          )}

          {(isProcessing || isFfmpegLoading) && (
            <div className="p-4 rounded-2xl bg-black border border-sky-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sky-400 font-bold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {statusMessage}
                </span>
                <span className="font-mono text-zinc-300 font-bold">{progress}%</span>
              </div>

              <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {ffmpegError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{ffmpegError}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {!processedResult ? (
              <button
                type="button"
                onClick={handleRenderVideo}
                disabled={isProcessing || !blueprint}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-black font-black text-sm sm:text-base transition-all duration-200 cursor-pointer shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-black" />
                    <span>Mengeksekusi FFmpeg ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="w-5 h-5 text-black" />
                    <span>Render & Unduh Klip (FFmpeg.wasm)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm sm:text-base transition-all duration-200 cursor-pointer shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2.5"
              >
                <Download className="w-5 h-5 text-black" />
                <span>Unduh {processedResult.fileName} (MP4)</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[260px] aspect-[9/16] bg-black rounded-3xl border-4 border-zinc-800 overflow-hidden shadow-2xl flex items-center justify-center group">
            {previewObjectUrl && (
              <video
                ref={videoRef}
                src={previewObjectUrl}
                onTimeUpdate={handleTimeUpdate}
                playsInline
                className="w-full h-full object-cover pointer-events-none"
              />
            )}

            {activeSubtitle && (
              <div className="absolute bottom-16 inset-x-3 text-center pointer-events-none z-20 animate-in fade-in duration-100">
                <span className="inline-block bg-black/85 text-yellow-300 font-black text-sm px-2.5 py-1 rounded-lg border border-yellow-400/40 shadow-2xl uppercase tracking-wide">
                  {activeSubtitle.text}
                </span>
              </div>
            )}

            <div className="absolute top-3 left-3 z-20 pointer-events-none">
              <span className="text-[10px] font-bold text-white/80 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                9:16 Vertikal
              </span>
            </div>

            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors z-10 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-sky-500/90 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </div>
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 text-center">
            Pratinjau Instan 9:16 (Klik video untuk memutar segmen klip)
          </p>
        </div>

      </div>
    </div>
  );
};
