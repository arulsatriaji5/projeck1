import React, { useState } from 'react';
import { ClipItem } from '../types';
import { X, Download, FileText, CheckCircle2, Share2, Sparkles, Film, Copy, Check } from 'lucide-react';

interface ExportModalProps {
  clip: ClipItem;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ clip, isOpen, onClose }) => {
  const [resolution, setResolution] = useState('1080p');
  const [fps, setFps] = useState('60');
  const [burnSubtitles, setBurnSubtitles] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleStartExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    setIsCompleted(false);

    let current = 0;
    const interval = setInterval(() => {
      current += 15;
      if (current >= 100) {
        setExportProgress(100);
        setIsExporting(false);
        setIsCompleted(true);
        clearInterval(interval);
      } else {
        setExportProgress(current);
      }
    }, 250);
  };

  const handleDownloadSRT = () => {
    const srtContent = clip.captions
      .map((c, i) => `${i + 1}\n00:00:${c.start.toFixed(2).replace('.', ',')} --> 00:00:${c.end.toFixed(2).replace('.', ',')}\n${c.text}\n`)
      .join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clip.id}-subtitles.srt`;
    a.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://clippulse.ai/v/${clip.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-900/40 text-cyan-400 border border-cyan-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Klip Video High-Quality</h2>
              <p className="text-xs text-slate-400">{clip.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {isCompleted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-white">Rendering Klip Selesai!</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Video <span className="text-cyan-300 font-semibold">{clip.title}</span> ({resolution} {fps}fps) siap didownload dan diunggah ke media sosial.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => alert("Mengunduh MP4 file...")}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download MP4 Video (HD)
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadSRT}
                    className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-400" /> Download SRT Subtitle
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link Klip'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isExporting ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mx-auto" />
              <h3 className="text-base font-bold text-white">Memproses Render Video AI...</h3>
              <p className="text-xs text-slate-400">
                Menyusun frame 9:16, burning subtitle gaya Hormozi, dan optimizing audio.
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-xs font-mono text-cyan-400 font-bold">{exportProgress}% Selesai</p>
            </div>
          ) : (
            <>
              {/* Export Options */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">Kualitas Resolusi Video</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setResolution('1080p')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      resolution === '1080p'
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold">1080p Full HD</p>
                    <p className="text-[10px] text-slate-500">Standar TikTok, Shorts, Reels</p>
                  </button>

                  <button
                    onClick={() => setResolution('4K')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      resolution === '4K'
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold">4K Ultra HD <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 rounded ml-1">PRO</span></p>
                    <p className="text-[10px] text-slate-500">Kualitas maksimal layar lebar</p>
                  </button>
                </div>
              </div>

              {/* FPS & Burn Toggle */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Frame Rate (FPS)</label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="30">30 FPS (Standar)</option>
                    <option value="60">60 FPS (Super Smooth)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Burn-in Subtitle</label>
                  <button
                    onClick={() => setBurnSubtitles(!burnSubtitles)}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      burnSubtitles
                        ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span>{burnSubtitles ? 'Teks Menempel' : 'Tanpa Teks'}</span>
                    <div className={`w-4 h-4 rounded-full border ${burnSubtitles ? 'bg-purple-400 border-purple-200' : 'bg-slate-800 border-slate-700'}`} />
                  </button>
                </div>
              </div>

              {/* Start Export CTA */}
              <button
                onClick={handleStartExport}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-purple-600/20 transition-all cursor-pointer mt-4"
              >
                <Sparkles className="w-4 h-4" /> Mulai Render & Render Clip
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
