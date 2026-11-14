import React, { useState, useEffect } from 'react';
import { ClipItem, CaptionItem } from '../types';
import { X, Sparkles, Plus, Trash2, Check, Clock, Type } from 'lucide-react';

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
  onUpdateCaptions,
}) => {
  const [captions, setCaptions] = useState<CaptionItem[]>(clip.captions || []);

  useEffect(() => {
    if (isOpen) {
      setCaptions(clip.captions || []);
    }
  }, [isOpen, clip]);

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
    };
    setCaptions([...captions, newItem]);
  };

  const handleSave = () => {
    onUpdateCaptions(captions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-emerald-400">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Editor Subtitle &amp; Highlight AI</h2>
              <p className="text-xs text-gray-400">Edit teks subtitle per baris dan kata kunci sorotan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-gray-900">
          {captions.map((item, index) => (
            <div
              key={item.id || index}
              className="p-4 rounded-xl bg-gray-950 border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center gap-3"
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 text-xs font-mono tabular-nums text-emerald-400 font-semibold shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {item.start}s - {item.end}s
                </span>
              </div>

              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => handleTextChange(item.id, e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-400 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none"
                  placeholder="Teks Subtitle"
                />

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 font-medium">Highlight:</span>
                  <input
                    type="text"
                    value={item.highlight || ''}
                    onChange={(e) => handleHighlightChange(item.id, e.target.value)}
                    className="bg-gray-900 border border-gray-800 focus:border-emerald-400 rounded-lg px-2 py-1 text-[11px] text-white font-semibold focus:outline-none w-40"
                    placeholder="Kata sorotan"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-2 text-gray-500 hover:text-rose-400 hover:bg-gray-900 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddCaption}
            className="w-full py-3 rounded-xl border border-dashed border-gray-700 hover:border-emerald-400 text-gray-300 hover:text-emerald-400 bg-gray-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Baris Subtitle Baru
          </button>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-950">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Otomatis sinkron dengan timeline</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-gray-900 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-gray-950 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Simpan Subtitle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
