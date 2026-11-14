import React, { useState } from 'react';
import {
  Home,
  FolderKanban,
  FolderArchive,
  Settings,
  Menu,
  X,
  Zap,
} from 'lucide-react';

export type SidebarTabId = 'home' | 'projects' | 'references' | 'settings';

interface SidebarProps {
  activeTab: SidebarTabId;
  onSelectTab: (tab: SidebarTabId) => void;
  projectsCount: number;
  referencesCount: number;
  credits: number;
  maxCredits: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  projectsCount,
  referencesCount,
  credits,
  maxCredits,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: Array<{
    id: SidebarTabId;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'home',
      label: 'Home',
      subtitle: 'Buat klip baru',
      icon: Home,
    },
    {
      id: 'projects',
      label: 'My Projects',
      subtitle: 'Riwayat & hasil klip',
      icon: FolderKanban,
      badge: projectsCount,
    },
    {
      id: 'references',
      label: 'Gudang Referensi',
      subtitle: 'Brand Kit & Template',
      icon: FolderArchive,
      badge: referencesCount,
    },
    {
      id: 'settings',
      label: 'Settings',
      subtitle: 'Preferensi studio',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: SidebarTabId) => {
    onSelectTab(id);
    setMobileOpen(false);
  };

  const creditPercent = Math.min(100, Math.round((credits / maxCredits) * 100));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-950 text-white border-r border-gray-800 select-none">
      {/* Brand Logo */}
      <div className="px-5 py-5 border-b border-gray-800 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 text-left cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 p-1.5 flex items-center justify-center shrink-0 group-hover:border-emerald-500/50 transition-colors">
            <img
              src="/assets/aistudio/clipA_dae34944.png"
              alt="ClipA Studio"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold tracking-tight text-white leading-none">
              ClipA Studio
            </div>
            <div className="text-[11px] text-gray-400 mt-1 font-medium">
              Auto-Clip AI Workspace
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-900 cursor-pointer"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto" aria-label="Menu Utama">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-left transition-colors cursor-pointer ${
                isActive
                  ? 'bg-gray-800/90 text-white border border-gray-700/80'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-400' : 'text-gray-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold whitespace-nowrap truncate">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {typeof item.badge === 'number' && (
                <span
                  className={`text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md shrink-0 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                      : 'bg-gray-900 text-gray-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Quota Summary */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Kuota Render AI
            </span>
            <span className="font-mono tabular-nums text-emerald-400 font-bold">
              {credits}/{maxCredits} mnt
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all"
              style={{ width: `${creditPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Siap memproses video YouTube &amp; MP4 ke format 9:16.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Compact Header Trigger (only visible below lg) */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-gray-950 border-b border-gray-800 px-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 p-1 flex items-center justify-center">
            <img
              src="/assets/aistudio/clipA_dae34944.png"
              alt="ClipA"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-sm font-extrabold text-white tracking-tight">ClipA Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-200 hover:text-white cursor-pointer"
          aria-label="Buka navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
