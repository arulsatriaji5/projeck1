import React, { useState } from 'react';
import {
  Home,
  FolderKanban,
  ImagePlay,
  FileText,
  FolderArchive,
  CalendarCheck2,
  Settings,
  Menu,
  X,
  PanelLeftClose,
} from 'lucide-react';

export type SidebarTabId =
  | 'home'
  | 'projects'
  | 'edit-manual'
  | 'transcribe'
  | 'references'
  | 'auto-publish'
  | 'settings';

interface SidebarProps {
  activeTab: SidebarTabId;
  onSelectTab: (tab: SidebarTabId) => void;
  projectsCount: number;
  referencesCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  projectsCount,
  referencesCount,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainNavItems: Array<{
    id: SidebarTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'projects',
      label: 'My Projects',
      icon: FolderKanban,
      badge: projectsCount,
    },
    {
      id: 'edit-manual',
      label: 'Edit Foto & Video',
      icon: ImagePlay,
    },
    {
      id: 'transcribe',
      label: 'Auto Script',
      icon: FileText,
    },
    {
      id: 'references',
      label: 'Gudang Referensi',
      icon: FolderArchive,
      badge: referencesCount,
    },
    {
      id: 'auto-publish',
      label: 'Auto Publish',
      icon: CalendarCheck2,
    },
  ];

  const handleNavClick = (id: SidebarTabId) => {
    onSelectTab(id);
    setMobileOpen(false);
  };

  const renderDesktopSidebar = () => (
    <div className="flex flex-col h-full bg-[#0A192F] text-white border-r border-white/10 select-none overflow-visible">
      {/* Top Brand & Collapse Toggle Header */}
      <div
        className={`border-b border-white/10 flex items-center shrink-0 transition-all duration-300 ${
          isCollapsed ? 'justify-center px-2 py-4' : 'justify-between px-4 py-4'
        }`}
      >
        {isCollapsed ? (
          <div className="relative group flex items-center justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Buka Sidebar"
              aria-label="Buka Sidebar"
              className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-[#112240] transition-colors cursor-pointer"
            >
              <img
                src="/assets/aistudio/clipA_dae34944.png"
                alt="ClipA Studio"
                className="w-9 h-9 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
            </button>
            <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[#0A192F] text-white text-xs font-semibold whitespace-nowrap border border-white/15 shadow-xl z-50">
              Buka Sidebar
            </span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-3 text-left cursor-pointer group min-w-0"
            >
              <img
                src="/assets/aistudio/clipA_dae34944.png"
                alt="ClipA Studio"
                className="w-9 h-9 object-contain shrink-0 transition-transform group-hover:scale-105"
              />
              <div className="min-w-0">
                <div className="text-base font-extrabold tracking-tight text-white leading-none whitespace-nowrap">
                  ClipA Studio
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium whitespace-nowrap">
                  Editor Klip Video AI
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={onToggleCollapse}
              title="Tutup Sidebar"
              aria-label="Tutup Sidebar"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#112240] border border-transparent hover:border-white/10 transition-colors cursor-pointer shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Main Navigation Links */}
      <nav
        className={`flex-1 py-4 space-y-2 overflow-y-auto overflow-x-visible ${
          isCollapsed ? 'px-2.5' : 'px-3.5'
        }`}
        aria-label="Menu Utama"
      >
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (isCollapsed) {
            return (
              <div key={item.id} className="relative group flex justify-center">
                <button
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  aria-label={item.label}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/35'
                      : 'bg-[#0D1F3A] text-slate-300 hover:text-white hover:bg-[#112240] border border-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                </button>
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-[#0A192F] text-white text-xs font-semibold whitespace-nowrap border border-white/15 shadow-xl z-50">
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/30 border border-blue-300/30'
                  : 'bg-[#0D1F3A] text-slate-200 hover:text-white hover:bg-[#132A4D] border border-white/5'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold whitespace-nowrap truncate">
                  {item.label}
                </span>
              </div>

              {typeof item.badge === 'number' && (
                <span
                  className={`text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-[#112240] text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Pinned Bottom Settings Item */}
      <div
        className={`mt-auto border-t border-white/10 shrink-0 ${
          isCollapsed ? 'p-2.5' : 'p-3.5'
        }`}
      >
        {isCollapsed ? (
          <div className="relative group flex justify-center">
            <button
              type="button"
              onClick={() => handleNavClick('settings')}
              aria-label="Settings"
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/35'
                  : 'bg-[#0D1F3A] text-slate-300 hover:text-white hover:bg-[#112240] border border-white/5'
              }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
            </button>
            <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-[#0A192F] text-white text-xs font-semibold whitespace-nowrap border border-white/15 shadow-xl z-50">
              Settings
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/30 border border-blue-300/30'
                : 'bg-[#0D1F3A] text-slate-200 hover:text-white hover:bg-[#132A4D] border border-white/5'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap truncate">Settings</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderMobileSidebar = () => (
    <div className="flex flex-col h-full bg-[#0A192F] text-white border-r border-white/10 select-none">
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 text-left cursor-pointer"
        >
          <img
            src="/assets/aistudio/clipA_dae34944.png"
            alt="ClipA Studio"
            className="w-9 h-9 object-contain shrink-0"
          />
          <span className="text-base font-extrabold tracking-tight text-white whitespace-nowrap">
            ClipA Studio
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#112240] cursor-pointer"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto" aria-label="Menu Mobile">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#0D1F3A] text-slate-200 hover:text-white hover:bg-[#132A4D]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold whitespace-nowrap truncate">{item.label}</span>
              </div>
              {typeof item.badge === 'number' && (
                <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md bg-white/15 text-white shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-3 border-t border-white/10">
        <button
          type="button"
          onClick={() => handleNavClick('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#2563EB] text-white'
              : 'bg-[#0D1F3A] text-slate-200 hover:text-white hover:bg-[#132A4D]'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold whitespace-nowrap">Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Compact Header Trigger */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-[#0A192F] border-b border-white/10 px-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <img
            src="/assets/aistudio/clipA_dae34944.png"
            alt="ClipA Studio"
            className="w-9 h-9 object-contain shrink-0"
          />
          <span className="text-sm font-extrabold text-white tracking-tight whitespace-nowrap">
            ClipA Studio
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center shadow-none transition-colors cursor-pointer"
          aria-label="Buka navigasi"
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Desktop Collapsible Sticky Rail */}
      <aside
        className={`hidden lg:flex flex-col sticky top-0 h-screen shrink-0 z-30 transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
        aria-label="Navigasi Utama"
      >
        {renderDesktopSidebar()}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">{renderMobileSidebar()}</div>
        </div>
      )}
    </>
  );
};
