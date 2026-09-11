import React from 'react';
import { Facebook, Instagram, MessageSquare, Film } from 'lucide-react';

interface FooterProps {
  setActiveTab?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-black border-t border-zinc-800 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Kiri: Logo + Menu navigasi teks (putih) */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-sky-500 flex items-center justify-center text-black font-extrabold">
              <Film className="w-4 h-4 text-black fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-sky-400">ClipA</span>
          </div>

          <nav className="flex items-center gap-6 text-sm font-medium text-white">
            <button 
              onClick={() => setActiveTab?.('features')} 
              className="hover:text-sky-400 transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => setActiveTab?.('pricing')} 
              className="hover:text-sky-400 transition-colors"
            >
              Pricing
            </button>
            <button 
              onClick={() => setActiveTab?.('api')} 
              className="hover:text-sky-400 transition-colors"
            >
              API Docs
            </button>
            <button 
              onClick={() => setActiveTab?.('community')} 
              className="hover:text-sky-400 transition-colors"
            >
              Community
            </button>
          </nav>
        </div>

        {/* Kanan: Ikon Sosial (Putih) */}
        <div className="flex items-center gap-4 text-white">
          <a 
            href="#facebook" 
            aria-label="Facebook"
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white hover:border-sky-400 hover:text-sky-400 transition-all"
          >
            <Facebook className="w-4 h-4 text-white fill-current" />
          </a>
          <a 
            href="#instagram" 
            aria-label="Instagram"
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white hover:border-sky-400 hover:text-sky-400 transition-all"
          >
            <Instagram className="w-4 h-4 text-white" />
          </a>
          <a 
            href="#discord" 
            aria-label="Discord"
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white hover:border-sky-400 hover:text-sky-400 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-white fill-current" />
          </a>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-zinc-900 text-center md:text-left text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} ClipA Inc. Studio Video AI Terpadu untuk Kreator Konten.
      </div>
    </footer>
  );
};
