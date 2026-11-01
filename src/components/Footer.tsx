import React from 'react';
import { Facebook, Instagram, MessageSquare } from 'lucide-react';

interface FooterProps {
  setActiveTab?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-black border-t border-zinc-800 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Kiri: Logo ClipA */}
        <div className="flex items-center gap-3">
          <img 
            src="/assets/aistudio/clipA_dae34944.png" 
            alt="ClipA Logo" 
            className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(14,165,233,0.35)]" 
          />
          <span className="text-xl font-bold tracking-tight text-sky-400">ClipA</span>
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
