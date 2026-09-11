import React, { useState } from 'react';
import { ClipItem, CaptionItem } from '../types';
import { X, Sparkles, Plus, Trash2, Check, Clock, Type, Smile } from 'lucide-react';

interface CaptionEditorModalProps {
  clip: ClipItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCaptions: (captions: CaptionItem[]) => void;
}

export const CaptionEditorModal: React.FC<CaptionEditorModalProps> = ({
  clip,
  isOpen,
  onClose,
  onUpdateCaptions
}) => {
  const [captions, setCaptions] = useState<CaptionItem[]>(clip.captions || []);

  if (!isOpen) return null;

  const handleTextChange = (id: string, newText: string) => {
    setCaptions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text: newText } : item))
    );
  };

  const handleHighlightChange = (id: string, newHighlight: string) => {
    setCaptions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, highlight: newHighlight } : item))
    );
  };

  const handleEmojiChange = (id: string, emoji: string) => {
    setCaptions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, emoji } : item))
    );
  };

  const handleDelete = (id: string) => {
    setCaptions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddCaption = () => {
    const lastCap = captions[captions.length - 1];
    const newStart = lastCap ? lastCap.end : 0;
    const newEnd = newStart + 3.0;

    const newItem: CaptionItem = {
      id: `cap-${Date.now()}`,
      start: Number(newStart.toFixed(1)),
      end: Number(newEnd.toFixed(1)),
      text: 'Tulis subtitle baru di sini...',
      highlight: 'subtitle',
      emoji: '✨'
    };
    setCaptions([...captions, newItem]);
  };

  const handleSave = () => {
    onUpdateCaptions(captions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-900/40 text-purple-400 border border-purple-500/30">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Editor Subtitle & Highlight AI</h2>
              <p className="text-xs text-slate-400">Edit teks subtitle per baris, kata kunci tebal, dan emoji</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Caption List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {captions.map((item, index) => (
            <div
              key={item.id || index}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3 hover:border-slate-700 transition-colors"
            >
              {/* Timing Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{item.start}s - {item.end}s</span>
              </div>

              {/* Text Input */}
              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => handleTextChange(item.id, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                  placeholder="Teks Subtitle"
                />

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Highlight:</span>
                  <input
                    type="text"
                    value={item.highlight || ''}
                    onChange={(e) => handleHighlightChange(item.id, e.target.value)}
                    className="bg-slate-900 border border-slate-800 focus:border-yellow-400 rounded px-2 py-0.5 text-[11px] text-yellow-300 focus:outline-none w-36"
                    placeholder="Kata tebal"
                  />

                  {/* Emoji selection */}
                  <span className="text-slate-500 font-medium ml-2">Emoji:</span>
                  <select
                    value={item.emoji || '🔥'}
                    onChange={(e) => handleEmojiChange(item.id, e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-white rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="🔥">🔥 Fire</option>
                    <option value="⚡">⚡ Lightning</option>
                    <option value="💡">💡 Idea</option>
                    <option value="🚀">🚀 Rocket</option>
                    <option value="😱">😱 Shock</option>
                    <option value="📌">📌 Pin</option>
                  </select>
                </div>
              </div>

              {/* Action Delete */}
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors shrink-0"
                title="Hapus baris"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add Line Button */}
          <button
            onClick={handleAddCaption}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-purple-500 text-slate-400 hover:text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Baris Subtitle Baru
          </button>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-1.5 text-xs text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Otomatis Menyesuaikan Pacing Teks</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-slate-950 hover:brightness-110 shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" /> Simpan Subtitle
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
