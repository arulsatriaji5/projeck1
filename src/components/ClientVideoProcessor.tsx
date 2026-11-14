import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Sparkles, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileVideo, 
  Scissors, 
  Crop, 
  Type, 
  Clock, 
  ChevronRight, 
  Flame 
} from 'lucide-react';
import { useFFmpeg, VideoBlueprint, FFmpegProcessResult } from '../hooks/useFFmpeg';

interface ClientVideoProcessorProps {
  sourceFile: File | null;
  blueprint: VideoBlueprint | null;
  onBlueprintChange?: (bp: VideoBlueprint) => void;
  onRequestAnalyze?: () => Promise<void>;
  isAnalyzing?: boolean;
}

export const ClientVideoProcessor: React.FC<ClientVideoProcessorProps> = ({
  sourceFile,
  blueprint: initialBlueprint,
  onBlueprintChange,
  onRequestAnalyze,
  isAnalyzing = false
}) => {
  const {
    isLoaded,
    isLoading: isFfmpegLoading,
    isProcessing,
    progress,
    statusMessage,
    error: ffmpegError,
    loadFFmpeg,
    processVideoClip
  } = useFFmpeg();

  // Local Blueprint State
  const [blueprint, setBlueprint] = useState<VideoBlueprint | null>(initialBlueprint);
  const [processedResult, setProcessedResult] = useState<FFmpegProcessResult | null>(null);

  // Player Preview State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialBlueprint) {
      setBlueprint(initialBlueprint);
    }
  }, [initialBlueprint]);

  // Create preview URL from local file
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

  // Video timeupdate sync for preview player
  const handleTimeUpdate = () => {
    if (!videoRef.current || !blueprint) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    // Loop within subclip segment
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

  // Determine active subtitle line
  const activeSubtitle = React.useMemo(() => {
    if (!blueprint || !blueprint.subtitles) return null;
    const relativeTime = Math.max(0, currentTime - blueprint.start_time);
    return blueprint.subtitles.find(sub => relativeTime >= sub.start && relativeTime <= sub.end);
  }, [blueprint, currentTime]);

  // Execute FFmpeg.wasm processing
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
      <div className="bg-white rounded-3xl p-8 text-center text-slate-500 space-y-3 shadow-sm">
        <FileVideo className="w-10 h-10 text-slate-400 mx-auto" />
        <h4 className="text-base font-bold text-[#0B1F3A]">Belum Ada Berkas Video Sumber</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Silakan unggah video lokal berformat .mp4 di tab atas untuk memulai pemrosesan FFmpeg di memori peramban Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-6 text-left shadow-sm relative overflow-hidden">
      
      {/* Top Banner: Client-Side Engine Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#EEF2F7] text-[#0B1F3A]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-[#0B1F3A]">Mesin Rendering FFmpeg.wasm</h3>
              <span className="text-[11px] font-semibold text-emerald-700">
                · Client-Side (Tanpa Server Timeout)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Diproses 100% pada memori browser Anda via WebAssembly — aman &amp; bebas batas timeout Vercel.
            </p>
          </div>
        </div>

        {onRequestAnalyze && (
          <button
            type="button"
            onClick={onRequestAnalyze}
            disabled={isAnalyzing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#EEF2F7] hover:bg-[#0B1F3A] text-[#0B1F3A] hover:text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
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

      {/* Main Grid: Left Blueprint & Controls, Right 9:16 Video Canvas Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Panel: Controls & Blueprint Info */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* File Info Card */}
          <div className="bg-[#F8F9FA] rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-white shadow-sm text-[#1D4ED8] shrink-0">
                <FileVideo className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0B1F3A] truncate max-w-[220px] sm:max-w-xs">{sourceFile.name}</p>
                <p className="text-[11px] text-slate-500 tabular-nums">
                  {(sourceFile.size / (1024 * 1024)).toFixed(1)} MB · Format MP4
                </p>
              </div>
            </div>

            <span className="text-[11px] text-[#0B1F3A] font-mono tabular-nums font-semibold">
              {blueprint ? `${(blueprint.end_time - blueprint.start_time).toFixed(1)}s Klip` : 'Siap'}
            </span>
          </div>

          {/* Gemini AI Blueprint Summary */}
          {blueprint ? (
            <div className="bg-[#F8F9FA] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" /> Blueprint Gemini 2.5 Flash
                </span>
                <span className="text-[11px] text-emerald-700 font-bold">
                  Skema Valid
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white shadow-sm">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold flex items-center justify-center gap-1">
                    <Scissors className="w-3 h-3 text-[#1D4ED8]" /> Titik Potong
                  </p>
                  <p className="text-xs font-bold text-[#0B1F3A] mt-1 font-mono tabular-nums">
                    {blueprint.start_time.toFixed(1)}s - {blueprint.end_time.toFixed(1)}s
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white shadow-sm">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold flex items-center justify-center gap-1">
                    <Crop className="w-3 h-3 text-emerald-600" /> Rasio Vertikal
                  </p>
                  <p className="text-xs font-bold text-[#0B1F3A] mt-1 font-mono">
                    9:16 (Center)
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white shadow-sm">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold flex items-center justify-center gap-1">
                    <Type className="w-3 h-3 text-amber-600" /> Subtitles
                  </p>
                  <p className="text-xs font-bold text-[#0B1F3A] mt-1 font-mono tabular-nums">
                    {blueprint.subtitles?.length || 0} Baris
                  </p>
                </div>
              </div>

              {/* Blueprint Subtitles List */}
              {blueprint.subtitles && blueprint.subtitles.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Pratinjau Garis Waktu Subtitle (Hormozi Style):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {blueprint.subtitles.map((sub, idx) => (
                      <div 
                        key={idx}
                        className={`p-2.5 rounded-xl text-[11px] flex items-center justify-between transition-colors ${
                          activeSubtitle?.text === sub.text 
                            ? 'bg-[#0B1F3A] text-white' 
                            : 'bg-white text-[#0B1F3A] shadow-sm'
                        }`}
                      >
                        <span className="font-medium truncate max-w-[260px] sm:max-w-xs">{sub.text}</span>
                        <span className={`text-[10px] font-mono tabular-nums shrink-0 ${activeSubtitle?.text === sub.text ? 'text-sky-300' : 'text-slate-500'}`}>
                          {sub.start.toFixed(1)}s - {sub.end.toFixed(1)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#F8F9FA] text-xs text-slate-600">
              Menunggu blueprint dari Gemini 2.5 Flash...
            </div>
          )}

          {/* Rendering Progress & Feedback */}
          {(isProcessing || isFfmpegLoading) && (
            <div className="p-4 rounded-2xl bg-[#EEF2F7] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#0B1F3A] font-bold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#1D4ED8]" />
                  {statusMessage}
                </span>
                <span className="font-mono tabular-nums text-[#1D4ED8] font-bold">{progress}%</span>
              </div>

              <div className="w-full h-2.5 bg-white rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#0B1F3A] to-[#1D4ED8] transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-mono">
                FFmpeg.wasm sedang merender subclip, memotong frame 9:16, dan mengkodekan berkas MP4 langsung pada RAM peramban Anda.
              </p>
            </div>
          )}

          {ffmpegError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{ffmpegError}</span>
            </div>
          )}

          {/* Action Execution Button */}
          <div className="flex items-center gap-3 pt-2">
            {!processedResult ? (
              <button
                type="button"
                onClick={handleRenderVideo}
                disabled={isProcessing || !blueprint}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#0B1F3A] hover:bg-[#122E56] text-white font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Mengeksekusi FFmpeg ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="w-5 h-5" />
                    <span>Render &amp; Unduh Klip (FFmpeg.wasm)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#1D4ED8] hover:bg-[#2563EB] text-white font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-2.5"
              >
                <Download className="w-5 h-5" />
                <span>Unduh {processedResult.fileName} (MP4)</span>
              </button>
            )}
          </div>

        </div>

        {/* Right Panel: Interactive 9:16 Vertical Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[260px] aspect-[9/16] bg-[#071324] rounded-3xl overflow-hidden shadow-xl flex items-center justify-center group">
            
            {previewObjectUrl && (
              <video
                ref={videoRef}
                src={previewObjectUrl}
                onTimeUpdate={handleTimeUpdate}
                playsInline
                className="w-full h-full object-contain pointer-events-none bg-[#071324]"
              />
            )}

            {/* Subtitle Overlay Simulation */}
            {activeSubtitle && (
              <div className="absolute bottom-16 inset-x-3 text-center pointer-events-none z-20 animate-in fade-in duration-100">
                <span className="inline-block bg-[#071324]/85 text-yellow-300 font-black text-sm px-2.5 py-1 rounded-lg shadow-xl uppercase tracking-wide">
                  {activeSubtitle.text}
                </span>
              </div>
            )}

            {/* 9:16 Safe Zone Overlay */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none">
              <span className="text-[10px] font-bold text-white/90 bg-[#0B1F3A]/80 backdrop-blur-md px-2 py-0.5 rounded">
                9:16 Vertikal
              </span>
            </div>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors z-10 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#0B1F3A]/95 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </div>
            </button>

          </div>

          <p className="text-[11px] text-slate-500 mt-2.5 text-center">
            Pratinjau Instan 9:16 (Klik video untuk memutar segmen klip)
          </p>
        </div>

      </div>

    </div>
  );
};
