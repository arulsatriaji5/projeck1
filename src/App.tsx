import React, { useEffect, useState } from 'react';
import { Sidebar, SidebarTabId } from './components/Sidebar';
import { HomeDashboardView } from './components/HomeDashboardView';
import { ProcessingDashboardView } from './components/ProcessingDashboardView';
import { ResultsGridView } from './components/ResultsGridView';
import { MyProjectsView } from './components/MyProjectsView';
import { ReferenceVaultView } from './components/ReferenceVaultView';
import { SettingsView } from './components/SettingsView';
import { RecipeStyleModal } from './components/RecipeStyleModal';
import { ClipCard } from './components/ClipCard';
import { VideoPlayerVertical } from './components/VideoPlayerVertical';
import { TimelineEditor } from './components/TimelineEditor';
import { CaptionEditorModal } from './components/CaptionEditorModal';
import { ExportModal } from './components/ExportModal';
import { ViralAnalysisDrawer } from './components/ViralAnalysisDrawer';
import {
  SAMPLE_VIDEOS,
  INITIAL_PROJECTS,
  CLIP_THUMBNAILS,
  SAMPLE_VIDEO_STREAM,
} from './data/sampleData';
import { getStoredReferences, saveStoredReferences } from './data/defaultReferences';
import {
  VideoData,
  ClipItem,
  AspectRatioType,
  CaptionStyleType,
  CaptionItem,
  ReferenceItem,
  RecipeStyleConfig,
  ProjectItem,
} from './types';
import { ArrowLeft, CheckCircle2, Sparkles, Flame, Youtube } from 'lucide-react';
import { extractLocalAudioWavBase64 } from './utils/audioExtractor';

type ActiveWorkspaceView =
  | 'home'
  | 'processing'
  | 'results'
  | 'editor'
  | 'projects'
  | 'references'
  | 'settings';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveWorkspaceView>('home');
  const [sidebarTab, setSidebarTab] = useState<SidebarTabId>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('clipa_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('clipa_sidebar_collapsed', String(isSidebarCollapsed));
    } catch {
      // ignore storage errors
    }
  }, [isSidebarCollapsed]);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const [credits] = useState(250);
  const maxCredits = 300;

  // Input & Recipe State
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=LXb3EKWsInQ');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [references, setReferences] = useState<ReferenceItem[]>(getStoredReferences);

  const [recipe, setRecipe] = useState<RecipeStyleConfig>(() => {
    const firstRef = getStoredReferences()[0];
    return {
      layout: '9:16',
      autoHook: true,
      subtitleTemplateId: firstRef?.id || 'ref-1',
      subtitleTemplateName: firstRef?.title || 'Hormozi Kuning Neon',
      customInstructions: '',
    };
  });
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  // Projects & Results State
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [currentVideoData, setCurrentVideoData] = useState<VideoData>(SAMPLE_VIDEOS['podcast-ai']);
  const [selectedClip, setSelectedClip] = useState<ClipItem>(SAMPLE_VIDEOS['podcast-ai'].clips[0]);
  const [processingLabel, setProcessingLabel] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Editor State
  const [captionStyle, setCaptionStyle] = useState<CaptionStyleType>('hormozi');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('9:16');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Auxiliary Modals & Toast
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [analysisClip, setAnalysisClip] = useState<ClipItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Sidebar Navigation Handler
  const handleSelectSidebarTab = (tab: SidebarTabId) => {
    setSidebarTab(tab);
    setIsPlaying(false);
    if (tab === 'home') {
      setActiveView(isProcessing ? 'processing' : 'home');
    } else if (tab === 'projects') {
      setActiveView('projects');
    } else if (tab === 'edit-manual') {
      setActiveView('editor');
    } else if (tab === 'references') {
      setActiveView('references');
    } else if (tab === 'settings') {
      setActiveView('settings');
    } else {
      setActiveView('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reference Vault CRUD
  const handleAddReference = (newRef: ReferenceItem) => {
    const updated = [newRef, ...references];
    setReferences(updated);
    saveStoredReferences(updated);
    showToast(`Template "${newRef.title}" berhasil ditambahkan ke Gudang Referensi.`);
  };

  const handleDeleteReference = (id: string) => {
    const updated = references.filter((r) => r.id !== id);
    setReferences(updated);
    saveStoredReferences(updated);
    showToast('Template berhasil dihapus dari Gudang Referensi.');
  };

  const handleSelectTemplateFromVault = (item: ReferenceItem) => {
    setRecipe((prev) => ({
      ...prev,
      subtitleTemplateId: item.id,
      subtitleTemplateName: item.title,
    }));
    showToast(`Gaya "${item.title}" diterapkan ke Resep Auto-Clip.`);
  };

  // Execute Automation: POST /api/auto-clip
  const handleProcessVideo = async () => {
    const targetUrl = uploadedFile ? `local://${uploadedFile.name}` : videoUrl.trim();
    if (!targetUrl) return;

    const label = uploadedFile ? uploadedFile.name : videoUrl.trim();
    const localObjectUrl = uploadedFile ? URL.createObjectURL(uploadedFile) : null;
    const activeRef = references.find((r) => r.id === recipe.subtitleTemplateId);

    setProcessingLabel(label);
    setIsProcessing(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setSidebarTab('home');
    setActiveView('processing');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const referenceInstructions = [
      activeRef ? `[Template ${activeRef.title}]: ${activeRef.notes}` : '',
      recipe.customInstructions,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const extractedAudio = uploadedFile ? await extractLocalAudioWavBase64(uploadedFile) : null;

      const response = await fetch('/api/auto-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: uploadedFile ? 'local' : 'youtube',
          sourceVideoUrl: uploadedFile ? '' : targetUrl,
          fileName: uploadedFile?.name,
          videoDuration: extractedAudio?.duration,
          audioBase64: extractedAudio?.audioBase64,
          audioMimeType: extractedAudio?.audioMimeType,
          audioOffsetSeconds: extractedAudio?.audioOffsetSeconds ?? 0,
          recipe,
          referenceInstructions,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Gagal memproses klip otomatis.');
      }

      let resolvedVideoData: VideoData;

      if (payload.videoData && Array.isArray(payload.videoData.clips) && payload.videoData.clips.length > 0) {
        const mappedClips: ClipItem[] = payload.videoData.clips
          .map((c: ClipItem, idx: number) => ({
            ...c,
            aspectRatio: c.aspectRatio || recipe.layout,
            thumbnailUrl: c.thumbnailUrl || CLIP_THUMBNAILS[idx % CLIP_THUMBNAILS.length],
            mp4Url: localObjectUrl || c.mp4Url || payload.mp4Url || SAMPLE_VIDEO_STREAM,
            videoSrc: localObjectUrl || c.videoSrc || payload.mp4Url || SAMPLE_VIDEO_STREAM,
          }))
          .sort((a: ClipItem, b: ClipItem) => (Number(b.viralScore) || 0) - (Number(a.viralScore) || 0));

        resolvedVideoData = {
          ...payload.videoData,
          thumbnailUrl: payload.videoData.thumbnailUrl || CLIP_THUMBNAILS[0],
          clips: mappedClips,
        };
      } else if (Array.isArray(payload.clips) && payload.clips.length > 0) {
        const mappedClips: ClipItem[] = payload.clips
          .map((c: any, idx: number) => {
            const startSec = Number(c.start_sec ?? c.start_seconds ?? c.startTime) || 0;
            const endSec = Number(c.end_sec ?? c.end_seconds ?? c.endTime) || startSec + 30;
            const rawSubs = Array.isArray(c.subtitles) ? c.subtitles : [];
            const captions: CaptionItem[] = rawSubs.map((s: any, sIdx: number) => {
              const relStart = typeof s.start === 'number' ? s.start : Math.max(0, (Number(s.start_sec) || startSec) - startSec);
              const relEnd = typeof s.end === 'number' ? s.end : Math.max(relStart + 0.2, (Number(s.end_sec) || startSec + 1.2) - startSec);
              const hw = String(s.highlightWord || s.highlight || '').trim();
              return {
                id: String(s.id || `sub-${idx + 1}-${sIdx + 1}`),
                start: relStart,
                end: relEnd,
                text: String(s.text || '').trim(),
                highlight: hw || undefined,
                highlightWord: hw || undefined,
              };
            });

            return {
              id: String(c.id || `clip-${Date.now()}-${idx + 1}`),
              title: String(c.title || `Klip #${idx + 1}`),
              hook: String(c.hook_headline || c.hook || 'Momen terbaik pilihan AI.'),
              startTime: startSec,
              endTime: endSec,
              duration: String(c.duration || '00:30'),
              viralScore: Number(c.viral_score ?? c.score ?? c.viralScore) || 85,
              scoreReason: String(c.alasan_viral || c.scoreReason || 'Dipilih otomatis oleh AI Auto-Clip Pipeline.'),
              aspectRatio: recipe.layout,
              category: 'Viral Hook',
              captions,
              thumbnailUrl: c.thumbnailUrl || c.coverImage || CLIP_THUMBNAILS[idx % CLIP_THUMBNAILS.length],
              mp4Url: localObjectUrl || c.mp4Url || payload.mp4Url || SAMPLE_VIDEO_STREAM,
              videoSrc: localObjectUrl || c.videoSrc || payload.mp4Url || SAMPLE_VIDEO_STREAM,
            };
          })
          .sort((a: ClipItem, b: ClipItem) => (Number(b.viralScore) || 0) - (Number(a.viralScore) || 0));

        const totalSec = Math.max(1, Math.round(Number(payload.videoDurationSec) || extractedAudio?.duration || 60));
        const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const secs = Math.floor(totalSec % 60).toString().padStart(2, '0');

        resolvedVideoData = {
          videoId: payload.videoId || targetUrl,
          videoTitle: payload.videoTitle || (uploadedFile ? uploadedFile.name.replace(/\.[^/.]+$/, '') : 'Video Analisis AI'),
          channelName: uploadedFile ? 'File Video Lokal' : 'YouTube Source',
          totalDuration: `${mins}:${secs}`,
          thumbnailUrl: mappedClips[0]?.thumbnailUrl || CLIP_THUMBNAILS[0],
          clips: mappedClips,
        };
      } else {
        // Map single blueprint response if returned
        const bp = payload.blueprint;
        const singleClip: ClipItem = {
          id: `clip-${Date.now()}`,
          title: bp?.clip_title || 'Klip Sorotan AI',
          hook: bp?.hook_summary || 'Momen terbaik pilihan AI.',
          startTime: Number(bp?.start_time) || 0,
          endTime: Number(bp?.end_time) || 40,
          duration: `00:${Math.max(10, Math.round(Number(bp?.duration) || 35))
            .toString()
            .padStart(2, '0')}`,
          viralScore: 98,
          scoreReason: 'Dipilih otomatis oleh AI Auto-Clip Pipeline.',
          aspectRatio: recipe.layout,
          category: 'Viral Hook',
          thumbnailUrl: CLIP_THUMBNAILS[0],
          mp4Url: localObjectUrl || payload.mp4Url || SAMPLE_VIDEO_STREAM,
          videoSrc: localObjectUrl || payload.mp4Url || SAMPLE_VIDEO_STREAM,
          captions: (bp?.subtitles || []).map((s: { text: string; start: number; end: number; highlightWord?: string; highlight?: string }, idx: number) => ({
            id: `c-${idx}`,
            start: s.start,
            end: s.end,
            text: s.text,
            highlight: s.highlightWord || s.highlight,
            highlightWord: s.highlightWord || s.highlight,
          })),
        };

        resolvedVideoData = {
          videoId: targetUrl,
          videoTitle: uploadedFile ? uploadedFile.name.replace(/\.[^/.]+$/, '') : singleClip.title,
          channelName: uploadedFile ? 'File Video Lokal' : 'YouTube Source',
          totalDuration: singleClip.duration,
          thumbnailUrl: CLIP_THUMBNAILS[0],
          clips: [singleClip],
        };
      }

      setCurrentVideoData(resolvedVideoData);
      setSelectedClip(resolvedVideoData.clips[0]);
      setAspectRatio(recipe.layout);

      const newProject: ProjectItem = {
        id: `proj-${Date.now()}`,
        title: resolvedVideoData.videoTitle,
        sourceUrl: targetUrl,
        sourceType: uploadedFile ? 'local' : 'youtube',
        createdAt: 'Baru saja',
        aspectRatio: recipe.layout,
        clipsCount: resolvedVideoData.clips.length,
        topScore: Math.max(...resolvedVideoData.clips.map((c) => c.viralScore)),
        thumbnailUrl: resolvedVideoData.thumbnailUrl || CLIP_THUMBNAILS[0],
        videoData: resolvedVideoData,
      };

      setProjects((prev) => [newProject, ...prev]);
      setActiveView('results');
      showToast(`${resolvedVideoData.clips.length} klip viral berhasil dibuat otomatis!`);
    } catch (err: any) {
      console.error('handleProcessVideo error:', err);
      showToast(err?.message || 'Terjadi kendala saat memproses video. Silakan coba lagi.');
      setActiveView('home');
    } finally {
      setIsProcessing(false);
    }
  };

  // Clip Actions
  const handleDownloadClip = (clip: ClipItem) => {
    const downloadUrl = clip.mp4Url || clip.videoSrc || SAMPLE_VIDEO_STREAM;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `[ClipA]_${clip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Mengunduh klip "${clip.title.slice(0, 32)}..." (MP4)`);
  };

  const handleOpenManualEditor = (clip: ClipItem) => {
    setSelectedClip(clip);
    setAspectRatio(clip.aspectRatio || '9:16');
    setCurrentTime(0);
    setIsPlaying(false);
    setActiveView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCaptions = (updatedCaptions: CaptionItem[]) => {
    const updatedClip = { ...selectedClip, captions: updatedCaptions };
    setSelectedClip(updatedClip);
    setCurrentVideoData((prev) => ({
      ...prev,
      clips: prev.clips.map((c) => (c.id === updatedClip.id ? updatedClip : c)),
    }));
  };

  const handleOpenProject = (project: ProjectItem) => {
    setCurrentVideoData(project.videoData);
    if (project.videoData.clips.length > 0) {
      setSelectedClip(project.videoData.clips[0]);
    }
    setSidebarTab('home');
    setActiveView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    showToast('Proyek dihapus dari riwayat.');
  };

  const editorFilteredClips = currentVideoData.clips.filter((clip) => {
    if (filterCategory === 'all') return true;
    return clip.viralScore >= 95;
  });

  return (
    <div className="min-h-screen lg:flex bg-gray-900 text-white font-sans selection:bg-emerald-500 selection:text-gray-950">
      {/* Collapsible Left Sidebar (Zero Top Navbar on Desktop) */}
      <Sidebar
        activeTab={sidebarTab}
        onSelectTab={handleSelectSidebarTab}
        projectsCount={projects.length}
        referencesCount={references.length}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Fluid Main Content Area */}
      <main className="flex-1 min-w-0 min-h-screen transition-all duration-300">
        {activeView === 'home' && (
          <HomeDashboardView
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            recipe={recipe}
            onOpenRecipeModal={() => setIsRecipeModalOpen(true)}
            onProcessVideo={handleProcessVideo}
            isProcessing={isProcessing}
            recentProjects={projects}
            onOpenProject={handleOpenProject}
          />
        )}

        {activeView === 'processing' && (
          <ProcessingDashboardView
            sourceLabel={processingLabel}
            recipe={recipe}
            isUploadingLocal={Boolean(uploadedFile)}
            onCancel={() => {
              setIsProcessing(false);
              setActiveView('home');
            }}
          />
        )}

        {activeView === 'results' && (
          <ResultsGridView
            videoData={currentVideoData}
            onDownloadClip={handleDownloadClip}
            onEditManual={handleOpenManualEditor}
            onBackToHome={() => {
              setSidebarTab('home');
              setActiveView('home');
            }}
            onOpenAnalysis={(clip) => setAnalysisClip(clip)}
          />
        )}

        {activeView === 'projects' && (
          <MyProjectsView
            projects={projects}
            onOpenProject={handleOpenProject}
            onDeleteProject={handleDeleteProject}
            onCreateNew={() => {
              setSidebarTab('home');
              setActiveView('home');
            }}
          />
        )}

        {activeView === 'references' && (
          <ReferenceVaultView
            references={references}
            activeTemplateId={recipe.subtitleTemplateId}
            onSelectAsTemplate={handleSelectTemplateFromVault}
            onAddReference={handleAddReference}
            onDeleteReference={handleDeleteReference}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView
            recipe={recipe}
            onUpdateRecipe={setRecipe}
            onSavedToast={showToast}
          />
        )}

        {activeView === 'editor' && (
          <div className="min-h-screen bg-gray-900 px-4 sm:px-6 lg:px-8 py-6 pt-20 lg:pt-6">
            <div className="w-full max-w-[1440px] mx-auto space-y-6">
              {/* Editor Header */}
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-800">
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveView('results')}
                    title="Kembali ke Hasil"
                    aria-label="Kembali ke Hasil"
                    className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-gray-950 hover:bg-gray-800 border border-gray-800 text-white transition-colors cursor-pointer mb-3"
                  >
                    <ArrowLeft className="w-4 h-4 text-emerald-400" />
                  </button>

                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Editor Video
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                    Mengedit: <strong className="text-emerald-400">{selectedClip.title}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-gray-950 border border-gray-800 p-3 rounded-xl max-w-sm">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-900 shrink-0">
                    <img
                      src={selectedClip.thumbnailUrl || currentVideoData.thumbnailUrl || CLIP_THUMBNAILS[0]}
                      alt={currentVideoData.videoTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white line-clamp-1">
                      {currentVideoData.videoTitle}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5 font-mono tabular-nums">
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold truncate">
                        <Youtube className="w-3 h-3 shrink-0" /> {currentVideoData.channelName}
                      </span>
                      <span>· {selectedClip.duration}</span>
                    </div>
                  </div>
                </div>
              </header>

              {/* Editor Grid: Clip List + 9:16 Video Player */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <aside className="lg:col-span-4 bg-gray-950 border border-gray-800 rounded-2xl p-4 flex flex-col h-[560px]">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-sm font-bold text-white">Daftar Klip</h2>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 p-1 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setFilterCategory('all')}
                        className={`px-2.5 py-1 rounded-lg cursor-pointer whitespace-nowrap ${
                          filterCategory === 'all'
                            ? 'bg-emerald-500 text-gray-950 font-bold'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Semua ({currentVideoData.clips.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterCategory('high-score')}
                        className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                          filterCategory === 'high-score'
                            ? 'bg-emerald-500 text-gray-950 font-bold'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Flame className="w-3 h-3" /> Top
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                    {editorFilteredClips.map((clip) => (
                      <ClipCard
                        key={clip.id}
                        clip={clip}
                        isSelected={selectedClip.id === clip.id}
                        onSelect={(c) => {
                          setSelectedClip(c);
                          setCurrentTime(0);
                          setIsPlaying(true);
                        }}
                        onOpenAnalysis={(c) => setAnalysisClip(c)}
                      />
                    ))}
                  </div>
                </aside>

                <div className="lg:col-span-8 bg-gray-950 border border-gray-800 rounded-2xl p-4 h-[560px] flex flex-col justify-center items-center">
                  <VideoPlayerVertical
                    clip={selectedClip}
                    videoId={currentVideoData.videoId}
                    videoSrc={selectedClip.videoSrc}
                    thumbnailUrl={selectedClip.thumbnailUrl || currentVideoData.thumbnailUrl}
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

              {/* Interactive Timeline */}
              <TimelineEditor
                clip={selectedClip}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                onUpdateCaptions={handleUpdateCaptions}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <RecipeStyleModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        recipe={recipe}
        onSaveRecipe={(updated) => {
          setRecipe(updated);
          showToast(`Resep diperbarui (${updated.layout}, ${updated.subtitleTemplateName}).`);
        }}
        references={references}
        onOpenReferenceVault={() => {
          setSidebarTab('references');
          setActiveView('references');
        }}
      />

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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-950 border border-emerald-500/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
