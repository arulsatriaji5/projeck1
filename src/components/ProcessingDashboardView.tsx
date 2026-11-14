import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Clock, Video, X } from 'lucide-react';
import { RecipeStyleConfig } from '../types';

interface ProcessingDashboardViewProps {
  sourceLabel: string;
  recipe: RecipeStyleConfig;
  isUploadingLocal?: boolean;
  onCancel: () => void;
}

export const ProcessingDashboardView: React.FC<ProcessingDashboardViewProps> = ({
  sourceLabel,
  recipe,
  isUploadingLocal = false,
  onCancel,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const steps = [
    {
      label: isUploadingLocal ? 'Uploading file video lokal...' : 'Mengambil metadata & transkrip video...',
      eta: 'ETA: 2 menit',
    },
    {
      label: 'Menganalisis AI — mendeteksi momen hook & skor viral...',
      eta: 'ETA: 1 menit 30 detik',
    },
    {
      label: `Merender klip ${recipe.layout} & menyinkronkan subtitle (${recipe.subtitleTemplateName})...`,
      eta: 'ETA: 30 detik',
    },
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const s = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1400);
    return () => clearInterval(s);
  }, [steps.length]);

  const progressPercent = stepIndex === 0 ? 32 : stepIndex === 1 ? 68 : 92;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4 py-12 pt-20 lg:pt-12">
      <div className="w-full max-w-xl bg-gray-950 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-5 right-5 p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="Batalkan pemrosesan"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Active Spinner & Headline */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-mono tabular-nums uppercase tracking-wider text-emerald-400 font-bold">
              {isUploadingLocal && stepIndex === 0 ? 'Uploading...' : `Menganalisis AI (${steps[stepIndex].eta})`}
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              AI Sedang Memproses Klip Otomatis...
            </h2>
          </div>

          {sourceLabel && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-300 max-w-full">
              <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[340px]">{sourceLabel}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-medium">{steps[stepIndex].label}</span>
            <span className="font-mono tabular-nums text-emerald-400 font-bold">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Pipeline Step List */}
        <div className="space-y-2 bg-gray-900 border border-gray-800 rounded-xl p-4">
          {steps.map((st, idx) => {
            const done = idx < stepIndex;
            const current = idx === stepIndex;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-lg text-xs ${
                  current
                    ? 'bg-gray-950 border border-gray-800 text-white font-semibold'
                    : done
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : current ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-700 shrink-0" />
                )}
                <span className="flex-1">{st.label}</span>
              </div>
            );
          })}
        </div>

        {/* Footer Timer */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800">
          <span className="flex items-center gap-1.5 font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Waktu berjalan: <strong className="text-white">{elapsed}s</strong>
          </span>
          <span className="font-mono text-gray-500">
            Layout {recipe.layout} · {recipe.autoHook ? 'Auto-Hook' : 'Standar'}
          </span>
        </div>
      </div>
    </div>
  );
};
