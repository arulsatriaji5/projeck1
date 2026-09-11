import React, { useState } from 'react';
import { 
  Film, 
  Zap, 
  User, 
  ChevronDown, 
  LogOut, 
  Settings,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  credits: number;
  maxCredits: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWorkspace: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  credits,
  maxCredits,
  activeTab,
  setActiveTab,
  onOpenWorkspace
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Kiri: Logo teks "ClipA" (font bold, biru langit) */}
        <div className="flex items-center gap-8">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-black font-extrabold shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-black fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tight text-sky-400">
              ClipA
            </span>
          </div>

          {/* Tengah: Menu navigasi teks (putih) */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setActiveTab('features')}
              className="text-sm font-medium text-white hover:text-sky-400 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className="text-sm font-medium text-white hover:text-sky-400 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className="text-sm font-medium text-white hover:text-sky-400 transition-colors"
            >
              API Docs
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className="text-sm font-medium text-white hover:text-sky-400 transition-colors"
            >
              Community
            </button>
          </nav>
        </div>

        {/* Kanan: Ikon profil pengguna & Tombol "Get Started Free" */}
        <div className="flex items-center gap-3">
          
          {/* Ikon Profil Pengguna (Putih, dilingkari) */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-full border border-white flex items-center justify-center text-white bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Profil Pengguna"
            >
              <User className="w-4 h-4 text-white" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-zinc-800">
                  <p className="text-sm font-bold text-white">Akun Kreator</p>
                  <p className="text-xs text-zinc-400">user@clipa.ai</p>
                </div>
                <div className="py-1 text-xs text-zinc-300">
                  <button onClick={onOpenWorkspace} className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded-lg text-sky-400 font-semibold flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Buka Studio Editor
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded-lg flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-zinc-400" /> Pengaturan API
                  </button>
                </div>
                <div className="pt-1 border-t border-zinc-800">
                  <button className="w-full text-left px-3 py-2 hover:bg-rose-950/40 rounded-lg text-rose-400 flex items-center gap-2">
                    <LogOut className="w-3.5 h-3.5" /> Keluar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tombol "Get Started Free" (kotak, teks putih, batas biru langit, tanpa gradasi) */}
          <button
            onClick={onOpenWorkspace}
            className="px-4 py-2 rounded-lg border border-sky-400 bg-sky-500/10 hover:bg-sky-500 hover:text-black text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-sm shadow-sky-500/20"
          >
            Get Started Free
          </button>

        </div>

      </div>
    </header>
  );
};
