import React, { useState, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { HeroInput } from './components/HeroInput';
import { AutoClipInputView, HistoryItem } from './components/AutoClipInputView';
import { ClipCard } from './components/ClipCard';
import { VideoPlayerVertical } from './components/VideoPlayerVertical';
import { TimelineEditor } from './components/TimelineEditor';
import { ManualEditorView } from './components/ManualEditorView';
import { CaptionEditorModal } from './components/CaptionEditorModal';
import { ExportModal } from './components/ExportModal';
import { ViralAnalysisDrawer } from './components/ViralAnalysisDrawer';
import { ReferenceVaultModal } from './components/ReferenceVaultModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { Footer } from './components/Footer';
import { SAMPLE_VIDEOS } from './data/sampleData';
import { VideoData, ClipItem, AspectRatioType, CaptionStyleType, CaptionItem, ReferenceItem } from './types';
import { getStoredReferences, saveStoredReferences } from './data/defaultReferences';
import { Sparkles, Youtube, Flame, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentView, setCurrentView] = useState<'home' | 'autoClipInput' | 'manualEditor' | 'editor'>('home');
  const [credits, setCredits] = useState(250);
  const maxCredits = 300;

  // Gudang Referensi State (Persisted in localStorage)
  const [references, setReferences] = useState<ReferenceItem[]>(getStoredReferences);
  const [isReferenceVaultOpen, setIsReferenceVaultOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddReference = (newRef: ReferenceItem) => {
    const updated = [newRef, ...references];
    setReferences(updated);
    saveStoredReferences(updated);
    showToast(`Referensi "${newRef.title}" berhasil disimpan ke Gudang.`);
  };

  const handleDeleteReference = (id: string) => {
    const updated = references.filter(r => r.id !== id);
    setReferences(updated);
    saveStoredReferences(updated);
    showToast('Referensi berhasil dihapus dari Gudang.');
  };

  const handleLogout = () => {
    showToast('Berhasil keluar dari akun kreator ClipA.');
  };


  // Video History State
  const [videoHistory, setVideoHistory] = useState<HistoryItem[]>([
    {
      id: 'hist-1',
      url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
      title: 'Masa Depan AI & Otomasi Konten 2026',
      channelName: 'TechVision Indonesia',
      duration: '24:15',
      processedAt: '6 Agt 2026',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400'
    },
    {
      id: 'hist-2',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Strategi Marketing Video Short-Form',
      channelName: 'Creator Hub',
      duration: '18:40',
      processedAt: '5 Agt 2026',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'
    }
  ]);

  // Active Video State
  const [currentVideoData, setCurrentVideoData] = useState<VideoData>(SAMPLE_VIDEOS['podcast-ai']);
  const [selectedClip, setSelectedClip] = useState<ClipItem>(SAMPLE_VIDEOS['podcast-ai'].clips[0]);
  
  // Player & Timeline State
  const [captionStyle, setCaptionStyle] = useState<CaptionStyleType>('hormozi');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('9:16');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modals & Drawers State
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [analysisClip, setAnalysisClip] = useState<ClipItem | null>(null);

  const openHomeView = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAutoClipInputView = () => {
    setCurrentView('autoClipInput');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openManualEditorView = () => {
    setCurrentView('manualEditor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditorView = () => {
    setCurrentView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Analyze YouTube URL via API or local preset
  const handleAnalyzeUrl = async (url: string, language: string = 'id', constraints?: string) => {
    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);

    // Save item to history
    const newHistItem: HistoryItem = {
      id: `hist-${Date.now()}`,
      url,
      title: url.includes('review') ? 'Tech Review Gadget 2026' : 'Podcast AI & Konten Viral',
      channelName: constraints ? `AI Constraints: ${constraints.slice(0, 30)}...` : 'ClipA Auto Generator',
      duration: '15:30',
      processedAt: 'Baru saja',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400'
    };

    setVideoHistory((prev) => [newHistItem, ...prev.filter(h => h.url !== url)]);

    openEditorView();

    try {
      const response = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, targetLanguage: language, constraints }),
      });

      if (response.ok) {
        const data: VideoData = await response.json();
        setCurrentVideoData(data);
        if (data.clips && data.clips.length > 0) {
          setSelectedClip(data.clips[0]);
        }
      } else {
        // Fallback to sample data matching query
        const fallbackKey = url.includes('review') ? 'tech-review' : 'podcast-ai';
        const fallbackData = SAMPLE_VIDEOS[fallbackKey];
        setCurrentVideoData(fallbackData);
        setSelectedClip(fallbackData.clips[0]);
      }
    } catch (err) {
      console.warn("API Error, falling back to instant preset:", err);
      const fallbackData = SAMPLE_VIDEOS['podcast-ai'];
      setCurrentVideoData(fallbackData);
      setSelectedClip(fallbackData.clips[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessLocalFile = (file: File, constraints?: string) => {
    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);

    const fileNameClean = file.name.replace(/\.[^/.]+$/, "");
    const newHistItem: HistoryItem = {
      id: `hist-${Date.now()}`,
      url: `local://${file.name}`,
      title: fileNameClean,
      channelName: constraints ? `AI: ${constraints.slice(0, 25)}...` : 'Unggahan Video Lokal (MP4)',
      duration: '04:12',
      processedAt: 'Baru saja',
      thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=400'
    };

    setVideoHistory((prev) => [newHistItem, ...prev]);

    const baseData = SAMPLE_VIDEOS['podcast-ai'];
    setCurrentVideoData({
      ...baseData,
      videoTitle: fileNameClean,
      channelName: constraints ? `AI Constraints: ${constraints}` : 'File Video Lokal (.MP4)',
      thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=400',
      totalDuration: '04:12'
    });
    setSelectedClip(baseData.clips[0]);

    setTimeout(() => {
      setIsLoading(false);
      openEditorView();
    }, 1000);
  };

  const handleClearHistory = () => {
    setVideoHistory([]);
  };

  const handleSelectClip = (clip: ClipItem) => {
    setSelectedClip(clip);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleUpdateCaptions = (updatedCaptions: CaptionItem[]) => {
    const updatedClip = { ...selectedClip, captions: updatedCaptions };
    setSelectedClip(updatedClip);
    setCurrentVideoData((prev) => ({
      ...prev,
      clips: prev.clips.map((c) => (c.id === updatedClip.id ? updatedClip : c)),
    }));
  };

  // Filter clips by category if requested
  const filteredClips = currentVideoData.clips.filter((clip) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'high-score') return clip.viralScore >= 95;
    return clip.category.toLowerCase().includes(filterCategory.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-sky-500 selection:text-black">
      
      {/* Bagian 1: Navbar Utama (Selalu di atas) */}
      <Navbar
        credits={credits}
        maxCredits={maxCredits}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          openHomeView();
        }}
        onOpenWorkspace={openEditorView}
        onOpenReferenceVault={() => setIsReferenceVaultOpen(true)}
        onOpenApiSettings={() => setIsApiSettingsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        
        {/* Tampilan 1 (id="homeView"): Berisi Hero Header utama ("Kreasikan Klip Anda: Pilih Jalan Anda") dan dua kartu pilihan ("Klip Otomatis (AI)" dan "Edit Manual") */}
        <div id="homeView" className={currentView === 'home' ? 'block' : 'hidden'}>
          <HeroInput 
            onAnalyze={handleAnalyzeUrl} 
            onOpenAutoClipInput={openAutoClipInputView}
            onOpenManualEdit={openManualEditorView}
            isLoading={isLoading} 
          />
          <Footer setActiveTab={(tab) => {
            setActiveTab(tab);
            openHomeView();
          }} />
        </div>

        {/* Tampilan 2 (id="autoClipInputView"): Halaman khusus input link YouTube & File Lokal (.mp4) */}
        <AutoClipInputView 
          isVisible={currentView === 'autoClipInput'}
          onBack={openHomeView}
          onProcess={(url, constraints) => handleAnalyzeUrl(url, 'id', constraints)}
          onProcessLocalFile={handleProcessLocalFile}
          isLoading={isLoading}
          history={videoHistory}
          onClearHistory={handleClearHistory}
          references={references}
          onOpenReferenceVault={() => setIsReferenceVaultOpen(true)}
        />


        {/* Tampilan 3 (id="manualEditorView"): Halaman editor manual responsif */}
        <ManualEditorView 
          isVisible={currentView === 'manualEditor'}
          onClose={openHomeView}
        />

        {/* BAGIAN EDITOR STUDIO: Wrapped in id="editorView" */}
        <div id="editorView" className={currentView === 'editor' ? 'block' : 'hidden'}>
          <section className="w-full bg-zinc-950 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              
              {/* Editor Workspace Header with Navigation Back to Home */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 mb-8 border-b border-zinc-800">
                <div>
                  <button
                    onClick={openHomeView}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sky-400 text-xs font-bold mb-3 transition-all cursor-pointer shadow-sm"
                  >
                    ← Kembali ke Beranda
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-400 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" /> CAPCUT-STYLE STUDIO EDITOR
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
                    Ruang Kerja Timeline & Video Editor
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Atur klip viral Anda, edit subtitle, dan potong durasi langsung pada timeline multi-track.
                  </p>
                </div>

                {/* Quick Info Badge */}
                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700">
                    <img
                      src={currentVideoData.thumbnailUrl}
                      alt={currentVideoData.videoTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white line-clamp-1">{currentVideoData.videoTitle}</p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                      <span className="text-sky-400 flex items-center gap-1 font-semibold">
                        <Youtube className="w-3 h-3 text-sky-400 fill-current" /> {currentVideoData.channelName}
                      </span>
                      <span>• {currentVideoData.totalDuration}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CapCut Web Editor Main Layout (Grid 12 Kolom) */}
              <div className="flex flex-col gap-6">
                
                {/* UPPER SECTION: Left Clip List + Center Video Player */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* PANEL KIRI (Daftar Klip Viral - 4 Kolom ~30%) */}
                  <div className="lg:col-span-4 bg-zinc-900 rounded-2xl border border-zinc-800 p-4 shadow-2xl flex flex-col h-[540px]">
                    
                    {/* Left Panel Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky-400" />
                        <h3 className="text-sm font-bold text-white">Daftar Klip Viral</h3>
                      </div>

                      <div className="flex items-center gap-1 text-xs">
                        <button
                          onClick={() => setFilterCategory('all')}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            filterCategory === 'all' ? 'bg-sky-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          Semua ({currentVideoData.clips.length})
                        </button>
                        <button
                          onClick={() => setFilterCategory('high-score')}
                          className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                            filterCategory === 'high-score' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <Flame className="w-3 h-3 text-amber-400 fill-current" /> Top
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Clip Cards List */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                      {isLoading ? (
                        Array.from({ length: 3 }).map((_, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 animate-pulse space-y-2">
                            <div className="h-4 bg-zinc-800 rounded w-3/4" />
                            <div className="h-8 bg-zinc-800/60 rounded w-full" />
                            <div className="h-3 bg-zinc-800 rounded w-1/2" />
                          </div>
                        ))
                      ) : filteredClips.length > 0 ? (
                        filteredClips.map((clip) => (
                          <ClipCard
                            key={clip.id}
                            clip={clip}
                            isSelected={selectedClip.id === clip.id}
                            onSelect={handleSelectClip}
                            onOpenAnalysis={(c) => setAnalysisClip(c)}
                          />
                        ))
                      ) : (
                        <div className="text-center py-12 text-zinc-500 text-xs">
                          Tidak ada klip ditemukan dalam kategori ini.
                        </div>
                      )}
                    </div>

                  </div>

                  {/* PANEL TENGAH (Video Preview 9:16 - 8 Kolom ~70%) */}
                  <div className="lg:col-span-8 bg-zinc-900 rounded-2xl border border-zinc-800 p-4 shadow-2xl h-[540px] flex flex-col justify-center items-center">
                    <VideoPlayerVertical
                      clip={selectedClip}
                      videoId={currentVideoData.videoId}
                      captionStyle={captionStyle}
                      setCaptionStyle={setCaptionStyle}
                      aspectRatio={aspectRatio}
                      setAspectRatio={setAspectRatio}
                      currentTime={currentTime}
                      setCurrentTime={setCurrentTime}
                      isPlaying={isPlaying}
                      setIsPlaying={setIsPlaying}
                      onOpenCaptionEditor={() => setIsCaptionModalOpen(true)}
                      onOpenExportModal={() => setIsExportModalOpen(true)}
                    />
                  </div>

                </div>

                {/* LOWER SECTION: PANEL BAWAH (Timeline Editor - Full Width 100%) */}
                <div className="w-full">
                  <TimelineEditor
                    clip={selectedClip}
                    currentTime={currentTime}
                    setCurrentTime={setCurrentTime}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                  />
                </div>

              </div>

            </div>
          </section>
        </div>

      </main>

      {/* Auxiliary Interactive Modals & Drawers */}
      <CaptionEditorModal
        clip={selectedClip}
        isOpen={isCaptionModalOpen}
        onClose={() => setIsCaptionModalOpen(false)}
        onUpdateCaptions={handleUpdateCaptions}
      />

      <ExportModal
        clip={selectedClip}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <ViralAnalysisDrawer
        clip={analysisClip}
        isOpen={Boolean(analysisClip)}
        onClose={() => setAnalysisClip(null)}
      />

      {/* Gudang Referensi Editan Multi-Modal Modal */}
      <ReferenceVaultModal
        isOpen={isReferenceVaultOpen}
        onClose={() => setIsReferenceVaultOpen(false)}
        references={references}
        onAddReference={handleAddReference}
        onDeleteReference={handleDeleteReference}
      />

      {/* Pengaturan API Modal */}
      <ApiSettingsModal
        isOpen={isApiSettingsOpen}
        onClose={() => setIsApiSettingsOpen(false)}
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-sky-400/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

    </div>
  );
}

