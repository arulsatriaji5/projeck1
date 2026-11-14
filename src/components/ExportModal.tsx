import React, { useState } from 'react';
import { ClipItem } from '../types';
import { SAMPLE_VIDEO_STREAM } from '../data/sampleData';
import { X, Download, FileText, CheckCircle2, Sparkles, Copy, Check } from 'lucide-react';

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
      current += 20;
      if (current >= 100) {
        setExportProgress(100);
        setIsExporting(false);
        setIsCompleted(true);
        clearInterval(interval);
      } else {
        setExportProgress(current);
      }
    }, 200);
  };

  const handleDownloadSRT = () => {
    const srtContent = clip.captions
      .map(
        (c, i) =>
          `${i + 1}\n00:00:${c.start.toFixed(2).replace('.', ',')} --> 00:00:${c.end.toFixed(2).replace('.', ',')}\n${c.text}\n`
      )
      .join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clip.id}-subtitles.srt`;
    a.click();
  };

  const handleCopyLink = () => {
    const link = clip.mp4Url || clip.videoSrc || SAMPLE_VIDEO_STREAM;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadMP4 = () => {
    const downloadUrl = clip.mp4Url || clip.videoSrc || SAMPLE_VIDEO_STREAM;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `[ClipA]_${clip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ekspor Klip Video MP4</h2>
              <p className="text-xs text-gray-400 line-clamp-1">{clip.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {isCompleted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-white">Rendering Klip Selesai</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Video <span className="text-white font-semibold">{clip.title}</span> ({resolution} {fps}fps) siap diunduh.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadMP4}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Unduh Video MP4 (HD)
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSRT}
                    className="py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" /> Unduh SRT
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isExporting ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin mx-auto" />
              <h3 className="text-base font-bold text-white">Memproses Render Video AI...</h3>
              <div className="w-full bg-gray-900 border border-gray-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-xs font-mono tabular-nums text-emerald-400 font-bold">
                {exportProgress}% Selesai
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-gray-300 block">Kualitas Resolusi Video</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setResolution('1080p')}
                    className={`p-3.5 rounded-xl border text-left text-xs cursor-pointer ${
                      resolution === '1080p'
                        ? 'bg-emerald-500/15 border-emerald-400 text-white font-bold'
                        : 'bg-gray-900 border-gray-800 text-gray-300'
                    }`}
                  >
                    <p className="font-bold">1080p Full HD</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Standar TikTok, Shorts, Reels</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolution('4K')}
                    className={`p-3.5 rounded-xl border text-left text-xs cursor-pointer ${
                      resolution === '4K'
                        ? 'bg-emerald-500/15 border-emerald-400 text-white font-bold'
                        : 'bg-gray-900 border-gray-800 text-gray-300'
                    }`}
                  >
                    <p className="font-bold">4K Ultra HD</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Kualitas maksimal tajam</p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">Frame Rate</label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded-xl p-2.5 focus:outline-none cursor-pointer"
                  >
                    <option value="30">30 FPS (Standar)</option>
                    <option value="60">60 FPS (Smooth)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">Burn-in Subtitle</label>
                  <button
                    type="button"
                    onClick={() => setBurnSubtitles(!burnSubtitles)}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      burnSubtitles
                        ? 'bg-emerald-500/15 border-emerald-400 text-white'
                        : 'bg-gray-900 border-gray-800 text-gray-400'
                    }`}
                  >
                    <span>{burnSubtitles ? 'Teks Menempel' : 'Tanpa Teks'}</span>
                    <div className={`w-3.5 h-3.5 rounded-full ${burnSubtitles ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartExport}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Sparkles className="w-4 h-4" /> Mulai Render Klip
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
