import { GoogleGenAI } from '@google/genai';

export const MISSING_GEMINI_KEY_MESSAGE_ID =
  'Gemini API Key belum ditemukan. Silakan buka menu Settings dan masukkan Gemini API Key Anda terlebih dahulu agar fitur AI berjalan lancar.';

const STATIC_HOST_SUFFIXES = [
  '.vercel.app',
  '.netlify.app',
  '.github.io',
  '.pages.dev',
  '.web.app',
  '.firebaseapp.com',
];

export function isStaticHost(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  const host = String(window.location.hostname || '').toLowerCase();
  return STATIC_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export function getSavedSettingsGeminiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    const saved =
      localStorage.getItem('clipa_gemini_api_key') ||
      localStorage.getItem('clipa_api_key') ||
      localStorage.getItem('gemini_api_key') ||
      '';
    return saved ? saved.trim() : '';
  } catch {
    return '';
  }
}

export function getGeminiApiKey(): string {
  // 1) User-saved API key in localStorage (entered via Settings)
  const localKey = getSavedSettingsGeminiKey();
  if (localKey) return localKey;

  // 2) import.meta.env.VITE_GEMINI_API_KEY
  try {
    const viteEnvKey = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_GEMINI_API_KEY;
    if (typeof viteEnvKey === 'string' && viteEnvKey.trim()) {
      return viteEnvKey.trim();
    }
  } catch {
    // ignore
  }

  // 3) process.env.GEMINI_API_KEY (via Vite define or runtime)
  try {
    const procKey =
      (typeof process !== 'undefined' && process.env && (process.env.GEMINI_API_KEY || process.env.GEMINI_API)) ||
      '';
    if (typeof procKey === 'string' && procKey.trim()) {
      return procKey.trim();
    }
  } catch {
    // ignore
  }

  try {
    const winEnv = (window as unknown as { __ENV__?: Record<string, string> }).__ENV__;
    const wKey = winEnv?.VITE_GEMINI_API_KEY || winEnv?.GEMINI_API_KEY || winEnv?.GEMINI_API || '';
    if (typeof wKey === 'string' && wKey.trim()) {
      return wKey.trim();
    }
  } catch {
    // ignore
  }

  return '';
}

export function createClientGenAI(explicitKey?: string): GoogleGenAI {
  const apiKey = (explicitKey || getGeminiApiKey()).trim();
  if (!apiKey) {
    throw new Error(MISSING_GEMINI_KEY_MESSAGE_ID);
  }
  return new GoogleGenAI({ apiKey });
}
