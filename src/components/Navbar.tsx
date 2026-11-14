import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  Settings,
  FolderArchive,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  credits?: number;
  maxCredits?: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWorkspace?: () => void;
  onOpenAutoClipInput?: () => void;
  onOpenManualEdit?: () => void;
  onOpenReferenceVault: () => void;
  onOpenApiSettings: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAutoClipInput,
  onOpenManualEdit,
  onOpenReferenceVault,
  onOpenApiSettings,
  onLogout
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    /* Header Navigation Section */
    <header className="sticky top-0 z-40 bg-[#0B1F3A] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Logo & Wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group select-none whitespace-nowrap shrink-0 focus:outline-none"
        >
          <span className="w-9 h-9 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <img 
              src="/assets/aistudio/clipA_dae34944.png" 
              alt="Logo ClipA" 
              className="w-full h-full object-contain" 
            />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">
            ClipA
          </span>
        </button>

        {/* Zone 2: Primary Navigation Links (Single-line text links) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'home'
                ? 'text-white border-sky-400 font-semibold'
                : 'text-slate-300 border-transparent hover:text-white hover:border-slate-400'
            }`}
          >
            Beranda
          </button>

          {onOpenAutoClipInput && (
            <button
              type="button"
              onClick={onOpenAutoClipInput}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activeTab === 'autoClip'
                  ? 'text-white border-sky-400 font-semibold'
                  : 'text-slate-300 border-transparent hover:text-white hover:border-slate-400'
              }`}
            >
              Klip Otomatis
            </button>
          )}

          {onOpenManualEdit && (
            <button
              type="button"
              onClick={onOpenManualEdit}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activeTab === 'manualEditor'
                  ? 'text-white border-sky-400 font-semibold'
                  : 'text-slate-300 border-transparent hover:text-white hover:border-slate-400'
              }`}
            >
              Edit Manual
            </button>
          )}

          <button
            type="button"
            onClick={onOpenReferenceVault}
            className="py-1 text-slate-300 hover:text-white border-b-2 border-transparent hover:border-slate-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Gudang Referensi
          </button>
        </nav>

        {/* Zone 3: User Profile Action & Dropdown */}
        <div className="flex items-center shrink-0" ref={menuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#122E56] hover:bg-[#1B4278] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
              aria-label="Menu Profil Pengguna"
            >
              <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                <User className="w-4 h-4 text-sky-300" />
              </span>
              <span className="hidden sm:inline">Akun Kreator</span>
              <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2.5 w-60 rounded-2xl bg-white text-[#0B1F3A] shadow-xl ring-1 ring-slate-900/5 p-2 z-50">
                <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-sm font-bold text-[#0B1F3A]">Akun Kreator</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">user@clipa.ai</p>
                </div>

                <div className="py-1 space-y-1 text-sm">
                  {/* Item 1: Gudang Referensi */}
                  <button 
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenReferenceVault();
                    }} 
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-100 rounded-xl text-[#0B1F3A] font-semibold flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <FolderArchive className="w-4 h-4 text-[#1B4278]" />
                    <span>Gudang Referensi</span>
                  </button>

                  {/* Item 2: Pengaturan API */}
                  <button 
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenApiSettings();
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-100 rounded-xl text-slate-700 hover:text-[#0B1F3A] font-medium flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Pengaturan API</span>
                  </button>
                </div>

                {/* Item 3: Keluar */}
                <div className="pt-1.5 mt-1 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50 rounded-xl text-rose-600 font-semibold flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
