import React, { useState } from 'react';
import { 
  X, 
  Search, 
  ChevronDown, 
  Download, 
  Undo2, 
  Redo2, 
  Maximize2, 
  VolumeX, 
  Scissors, 
  Image as ImageIcon, 
  Music, 
  Type, 
  Sparkles, 
  Layers, 
  MessageSquareText,
  Play,
  Pause,
  Film,
  Sliders,
  Wand2,
  Lock,
  Eye,
  EyeOff,
  Plus
} from 'lucide-react';

interface ManualEditorViewProps {
  onClose: () => void;
  isVisible?: boolean;
}

export const ManualEditorView: React.FC<ManualEditorViewProps> = ({ onClose, isVisible = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalDuration = 18; // 18s sample clip
  const [activeTool, setActiveTool] = useState<string>('klip-ai');
  const [isMuted, setIsMuted] = useState(false);
  const [captionStyle, setCaptionStyle] = useState('hormozi');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const playheadPercentage = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  return (
    <div 
      id="manualEditorView" 
      className={`${isVisible ? 'flex' : 'hidden'} w-full h-screen bg-black flex-col font-sans overflow-hidden`}
    >
      {/* 1. TOP NAVBAR EDITOR */}
      <div className="w-full h-16 bg-[#111111] border-b border-zinc-800 flex justify-between items-center px-6 shrink-0 z-20">
        {/* Kiri: Tombol kembali/tutup (X) dan teks judul proyek */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold border border-zinc-800"
            title="Tutup / Kembali ke Beranda"
          >
            <X className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline text-zinc-200">Tutup Editor</span>
          </button>
          
          <div className="h-5 w-px bg-zinc-800" />
          
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse shadow-sm shadow-sky-400" />
            <h1 className="text-sm font-black text-white tracking-tight">ClipA Pro Manual Studio</h1>
            <span className="text-xs text-zinc-500 hidden md:inline font-mono">• Proyek Vertikal 9:16</span>
          </div>
        </div>

        {/* Kanan: Dropdown resolusi ("UHD AI") dan tombol utama "Ekspor" */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700/80 text-xs text-zinc-200 font-bold cursor-pointer transition-all">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>UHD AI (4K)</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </div>

          <button 
            onClick={() => alert('Mengekspor video vertikal UHD AI...')}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs transition-all cursor-pointer shadow-md shadow-sky-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Video</span>
          </button>
        </div>
      </div>

      {/* 2. WORKSPACE UTAMA (Grid 3 Kolom Responsif - Full Width Layar Penuh) */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        
        {/* SIDEBAR KIRI (col-span-3 - Tool Edit Sidebar) */}
        <div className="col-span-12 md:col-span-3 bg-[#111111] border-r border-zinc-800 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Menu Alat Edit</h3>
            <div className="grid grid-cols-2 gap-2">
              
              {/* Klip AI (Aktif, Biru Langit Solid) */}
              <button 
                onClick={() => setActiveTool('klip-ai')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                  activeTool === 'klip-ai'
                    ? 'bg-sky-500 text-black border-sky-400 shadow-md shadow-sky-500/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>Klip AI</span>
              </button>

              {/* Bisukan */}
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                  isMuted 
                    ? 'bg-rose-950/80 border-rose-800 text-rose-300' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <VolumeX className="w-4 h-4" />
                <span>{isMuted ? 'Bisu' : 'Bisukan'}</span>
              </button>

              {/* Sampul */}
              <button 
                onClick={() => setActiveTool('sampul')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                  activeTool === 'sampul'
                    ? 'bg-sky-500 text-black border-sky-400 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Sampul</span>
              </button>

              {/* Audio */}
              <button 
                onClick={() => setActiveTool('audio')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                  activeTool === 'audio'
                    ? 'bg-sky-500 text-black border-sky-400 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>Audio</span>
              </button>

              {/* Teks */}
              <button 
                onClick={() => setActiveTool('teks')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                  activeTool === 'teks'
                    ? 'bg-sky-500 text-black border-sky-400 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Teks</span>
              </button>

              {/* Efek */}
              <button 
                onClick={() => setActiveTool('efek')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                  activeTool === 'efek'
                    ? 'bg-sky-500 text-black border-sky-400 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Efek</span>
              </button>

              {/* Overlay */}
              <button 
                onClick={() => setActiveTool('overlay')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                  activeTool === 'overlay'
                    ? 'bg-sky-500 text-black border-sky-400 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Overlay</span>
              </button>

              {/* Keterangan */}
              <button 
                onClick={() => setActiveTool('keterangan')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                  activeTool === 'keterangan'
                    ? 'bg-sky-500 text-black border-sky-400 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <MessageSquareText className="w-4 h-4" />
                <span>Keterangan</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/80">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Preset Subtitle Viral</h4>
            <div className="space-y-2">
              <button 
                onClick={() => setCaptionStyle('hormozi')}
                className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                  captionStyle === 'hormozi'
                    ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                ⚡ Hormozi Style (Teks Kuning)
              </button>
              <button 
                onClick={() => setCaptionStyle('neon')}
                className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                  captionStyle === 'neon'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                💎 Neon Cyber (Sky Blue Glow)
              </button>
            </div>
          </div>
        </div>

        {/* AREA PREVIEW VIDEO DI TENGAH (col-span-6 - Player Vertikal 9:16) */}
        <div className="col-span-12 md:col-span-9 lg:col-span-6 bg-black flex flex-col items-center justify-center relative p-4 overflow-hidden select-none">
          
          {/* Player Video Vertikal (Rasio 9:16 Proporsional Layar Komputer) */}
          <div className="relative aspect-[9/16] h-full max-h-[440px] bg-zinc-950 rounded-2xl border-2 border-zinc-800 shadow-2xl flex items-center justify-center group ring-1 ring-zinc-700/50 overflow-hidden">
            
            {/* Background Simulated Video Image */}
            <img 
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop" 
              alt="Video Preview"
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Live Subtitle Overlay Preview */}
            <div className="absolute bottom-12 inset-x-6 text-center z-10">
              <span className="inline-block bg-black/85 text-yellow-300 font-extrabold text-sm sm:text-base px-3.5 py-1.5 rounded-xl border-2 border-yellow-400 uppercase tracking-wide shadow-xl">
                ⚡ Cara Cepat Bikin <span className="text-sky-300 underline font-black">Konten Viral</span> AI!
              </span>
            </div>

            {/* Play / Pause Toggle Center Button */}
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-zinc-900/90 border-2 border-sky-400 text-sky-400 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </div>
            </button>
          </div>

          {/* Baris Kontrol Waktu & Transport Control */}
          <div className="w-full max-w-[400px] mt-3 flex items-center justify-between text-xs text-zinc-400 px-2">
            <button className="p-1.5 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors" title="Layar Penuh">
              <Maximize2 className="w-4 h-4" />
            </button>

            <div className="font-mono text-xs font-bold text-zinc-200 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              <span className="text-sky-400">{formatTime(currentTime)}</span>
              <span className="text-zinc-600 mx-1.5">/</span>
              <span>{formatTime(totalDuration)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors" title="Urungkan (Undo)">
                <Undo2 className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors" title="Ulangi (Redo)">
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* SIDEBAR KANAN / PANEL PROPERTI (col-span-3 - Property Inspector) */}
        <div className="col-span-3 bg-[#111111] border-l border-zinc-800 p-4 hidden lg:flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Panel Properti</h3>
            </div>
            <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-400/20 font-mono">Teks Aktif</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Auto Reframe AI */}
            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-sky-400" /> Auto-Reframe AI
                </span>
                <span className="text-[10px] font-bold text-sky-400">Aktif</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Subjek utama dilacak otomatis di tengah bingkai vertikal (9:16).
              </p>
            </div>

            {/* Pengaturan Subtitle */}
            <div className="space-y-2">
              <label className="text-zinc-400 font-semibold block">Gaya Ukuran Teks</label>
              <input type="range" min="12" max="32" defaultValue="20" className="w-full accent-sky-400 cursor-pointer" />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-400 font-semibold block">Animasi Subtitle</label>
              <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-zinc-200 font-medium">
                <option>Pop In Word-by-Word</option>
                <option>Karaoke Highlight</option>
                <option>Slide Up Smooth</option>
              </select>
            </div>

            <div className="p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl">
              <p className="text-[11px] text-sky-300 font-semibold">
                ✨ Tip Studio: Subtitle warna kuning & cyan meningkatkan retention rate hingga +34% di TikTok & Shorts.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 3. TIMELINE MULTI-TRACK DI BAGIAN BAWAH (Memanjang Layar Penuh) */}
      <div className="w-full h-44 bg-[#0a0a0a] border-t border-zinc-800 flex flex-col p-3 shrink-0 relative overflow-hidden select-none">
        
        {/* Timecode Ruler Bar */}
        <div className="h-6 bg-zinc-950 rounded-lg border border-zinc-800/80 px-4 flex items-center justify-between text-[10px] text-zinc-500 font-mono mb-2 relative">
          <span>00:00.0</span>
          <span>00:04.0</span>
          <span>00:08.0</span>
          <span>00:12.0</span>
          <span>00:16.0</span>
          <span>00:18.0</span>

          {/* Playhead Marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-sky-400 z-30 pointer-events-none transition-all duration-75"
            style={{ left: `${playheadPercentage}%` }}
          >
            <div className="w-3.5 h-3.5 -ml-1.5 -top-1 absolute bg-sky-400 rotate-45 rounded-xs shadow-md shadow-sky-400/50" />
          </div>
        </div>

        {/* Tracks Container */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
          
          {/* TRACK 1: Video Track */}
          <div className="h-12 bg-zinc-950 rounded-xl border border-zinc-800 p-1 flex items-center overflow-hidden relative">
            <div className="w-24 shrink-0 px-2 flex items-center gap-1.5 text-xs font-bold text-sky-400 border-r border-zinc-800">
              <Film className="w-3.5 h-3.5" /> Track Video
            </div>
            
            <div className="flex-1 h-full ml-2 bg-sky-950/70 border-2 border-sky-400/80 rounded-lg flex items-center justify-between px-2 relative">
              <div className="w-1.5 h-7 bg-sky-400 rounded-full" />
              <div className="flex items-center gap-1.5 overflow-hidden mx-2">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="w-10 h-8 bg-zinc-800 rounded shrink-0 overflow-hidden border border-zinc-700">
                    <img 
                      src={`https://picsum.photos/seed/fullclip${idx}/100/150`} 
                      alt="frame" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="w-1.5 h-7 bg-sky-400 rounded-full" />
            </div>

            {/* Playhead Overlay Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-sky-400 z-30 pointer-events-none"
              style={{ left: `${playheadPercentage}%` }}
            />
          </div>

          {/* TRACK 2: Audio Track */}
          <div className="h-9 bg-zinc-950 rounded-xl border border-zinc-800 p-1 flex items-center overflow-hidden relative">
            <div className="w-24 shrink-0 px-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-400 border-r border-zinc-800">
              <Music className="w-3.5 h-3.5" /> Audio
            </div>

            <div className="flex-1 h-full ml-2 bg-zinc-900 rounded-lg border border-dashed border-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white text-xs font-normal gap-1.5 cursor-pointer">
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-medium">+ Tambahkan musik latar atau voiceover</span>
            </div>

            {/* Playhead Overlay Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-sky-400 z-30 pointer-events-none"
              style={{ left: `${playheadPercentage}%` }}
            />
          </div>

          {/* TRACK 3: Subtitle Track */}
          <div className="h-9 bg-zinc-950 rounded-xl border border-zinc-800 p-1 flex items-center overflow-hidden relative">
            <div className="w-24 shrink-0 px-2 flex items-center gap-1.5 text-xs font-semibold text-sky-300 border-r border-zinc-800">
              <MessageSquareText className="w-3.5 h-3.5 text-sky-400" /> Subtitle
            </div>

            <div className="flex-1 h-full ml-2 flex items-center gap-1.5">
              <div className="h-full bg-sky-500 text-black font-extrabold text-[11px] px-3 rounded-lg border border-sky-300 flex items-center truncate">
                ⚡ Cara Cepat Bikin Konten
              </div>
              <div className="h-full bg-zinc-900 text-zinc-200 font-bold text-[11px] px-3 rounded-lg border border-zinc-800 flex items-center truncate">
                Viral AI Sekarang!
              </div>
            </div>

            {/* Playhead Overlay Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-sky-400 z-30 pointer-events-none"
              style={{ left: `${playheadPercentage}%` }}
            />
          </div>

        </div>

      </div>

    </div>
  );
};
