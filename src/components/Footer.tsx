import React from 'react';
import { Facebook, Instagram, MessageSquare } from 'lucide-react';

interface FooterProps {
  setActiveTab?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    /* Footer Section */
    <footer className="bg-[#0B1F3A] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand Footer */}
        <button
          type="button"
          onClick={() => setActiveTab && setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer focus:outline-none"
        >
          <span className="w-8 h-8 rounded-lg bg-white p-1 shadow-sm flex items-center justify-center">
            <img 
              src="/assets/aistudio/clipA_dae34944.png" 
              alt="Logo ClipA" 
              className="w-full h-full object-contain" 
            />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">ClipA</span>
        </button>

        {/* Link Navigasi Ringkas */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-300">
          <button
            type="button"
            onClick={() => setActiveTab && setActiveTab('home')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Beranda
          </button>
          <a href="#fitur" className="hover:text-white transition-colors">
            Fitur AI
          </a>
          <a href="#panduan" className="hover:text-white transition-colors">
            Panduan Kreator
          </a>
        </div>

        {/* Ikon Media Sosial */}
        <div className="flex items-center gap-3">
          <a 
            href="#facebook" 
            aria-label="Facebook"
            className="w-10 h-10 rounded-full bg-[#122E56] hover:bg-[#1B4278] flex items-center justify-center text-white transition-colors shadow-sm"
          >
            <Facebook className="w-4 h-4" />
          </a>
          <a 
            href="#instagram" 
            aria-label="Instagram"
            className="w-10 h-10 rounded-full bg-[#122E56] hover:bg-[#1B4278] flex items-center justify-center text-white transition-colors shadow-sm"
          >
            <Instagram className="w-4 h-4" />
          </a>
          <a 
            href="#discord" 
            aria-label="Discord"
            className="w-10 h-10 rounded-full bg-[#122E56] hover:bg-[#1B4278] flex items-center justify-center text-white transition-colors shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
          </a>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10 text-center md:text-left text-xs text-slate-300">
        &copy; {new Date().getFullYear()} ClipA Studio. Platform Pembuat Klip Video Vertikal untuk Kreator dan UMKM.
      </div>
    </footer>
  );
};
