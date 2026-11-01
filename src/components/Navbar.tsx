import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  Settings,
  FolderArchive
} from 'lucide-react';

interface NavbarProps {
  credits?: number;
  maxCredits?: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWorkspace?: () => void;
  onOpenReferenceVault: () => void;
  onOpenApiSettings: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReferenceVault,
  onOpenApiSettings,
  onLogout
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
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
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Kiri: Logo "ClipA" (gambar logo + teks bold biru langit) */}
        <div 
          className="flex items-center gap-3 cursor-pointer group select-none"
          onClick={() => setActiveTab('home')}
        >
          <img 
            src="/assets/aistudio/clipA_dae34944.png" 
            alt="ClipA Logo" 
            className="w-9 h-9 object-contain drop-shadow-[0_0_14px_rgba(14,165,233,0.45)] group-hover:scale-105 transition-transform" 
          />
          <span className="text-2xl font-black tracking-tight text-sky-400">
            ClipA
          </span>
        </div>

        {/* Kanan: Ikon profil pengguna */}
        <div className="flex items-center gap-3">
          
          {/* Ikon Profil Pengguna (Putih, dilingkari) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full border border-zinc-700 hover:border-sky-400 flex items-center justify-center text-white bg-zinc-900 hover:bg-zinc-800 transition-all cursor-pointer shadow-sm group"
              title="Profil Pengguna"
            >
              <User className="w-5 h-5 text-zinc-300 group-hover:text-sky-400 transition-colors" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3.5 py-2.5 border-b border-zinc-800 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <p className="text-sm font-bold text-white">Akun Kreator</p>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono">user@clipa.ai</p>
                </div>

                <div className="py-1 space-y-1 text-xs">
                  {/* Item 1: Gudang Referensi */}
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenReferenceVault();
                    }} 
                    className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-800 rounded-xl text-sky-400 font-bold flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <FolderArchive className="w-4 h-4 text-sky-400" />
                    <span>Gudang Referensi</span>
                  </button>

                  {/* Item 2: Pengaturan API */}
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenApiSettings();
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-800 rounded-xl text-zinc-200 hover:text-white font-medium flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span>Pengaturan API</span>
                  </button>
                </div>

                {/* Item 3: Keluar */}
                <div className="pt-1.5 mt-1 border-t border-zinc-800">
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-950/40 rounded-xl text-rose-400 hover:text-rose-300 font-medium flex items-center gap-2.5 cursor-pointer transition-colors"
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

