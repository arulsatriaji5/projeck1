export interface ExtractedWavAudioPayload {
  audioBase64: string;
  audioMimeType: string;
  audioOffsetSeconds: number;
  duration: number;
  sampleRate?: number;
  hasAudioTrack: boolean;
}

const PRIMARY_SAMPLE_RATE = 16000;
const FALLBACK_SAMPLE_RATE = 8000;
// Keep raw WAV <= 5.6 MB so Base64 inlineData stays strictly < 8 MB (~7.47 MB)
const MAX_INLINE_WAV_BYTES = 5.6 * 1024 * 1024;
const MAX_AUDIO_WINDOW_SECONDS = 340;

function encodePcm16MonoWavBlob(samples: Float32Array, sampleRate: number): Blob {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function blobToCleanBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

async function renderMonoWavAtSampleRate(
  decodedBuffer: AudioBuffer,
  sampleRate: number,
  offsetSec: number,
  durationSec: number
): Promise<Blob> {
  const OfflineCtx =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;

  const targetFrames = Math.max(1, Math.floor(durationSec * sampleRate));
  const offlineCtx = new OfflineCtx(1, targetFrames, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decodedBuffer;
  source.connect(offlineCtx.destination);
  source.start(0, offsetSec, durationSec);

  const renderedBuffer = await offlineCtx.startRendering();
  const monoSamples = renderedBuffer.getChannelData(0);
  return encodePcm16MonoWavBlob(monoSamples, sampleRate);
}

export async function extractLocalAudioWavBase64(
  file: File,
  offsetSeconds = 0
): Promise<ExtractedWavAudioPayload | null> {
  if (typeof window === 'undefined') return null;

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const OfflineCtx =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;

  if (!AudioCtx || !OfflineCtx) return null;

  let decodeCtx: AudioContext | null = null;
  try {
    const arrayBuffer = await file.arrayBuffer();
    decodeCtx = new AudioCtx();
    const decodedBuffer = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
    const fullDuration = Number(decodedBuffer.duration) || 0;

    if (fullDuration <= 0.1 || decodedBuffer.numberOfChannels === 0) {
      return {
        audioBase64: '',
        audioMimeType: 'audio/wav',
        audioOffsetSeconds: 0,
        duration: 0,
        hasAudioTrack: false,
      };
    }

    const safeOffset = Math.max(0, Math.min(Math.max(0, fullDuration - 1), offsetSeconds));
    let windowDuration = Math.min(MAX_AUDIO_WINDOW_SECONDS, Math.max(0.5, fullDuration - safeOffset));

    // Try 16kHz mono WAV first
    let chosenRate = PRIMARY_SAMPLE_RATE;
    let wavBlob = await renderMonoWavAtSampleRate(decodedBuffer, PRIMARY_SAMPLE_RATE, safeOffset, windowDuration);

    // Fallback to 8kHz mono WAV if exceeding safe inlineData limit (< 8 MB Base64)
    if (wavBlob.size > MAX_INLINE_WAV_BYTES) {
      chosenRate = FALLBACK_SAMPLE_RATE;
      const maxDurationAt8k = Math.floor((MAX_INLINE_WAV_BYTES - 1024) / (FALLBACK_SAMPLE_RATE * 2));
      windowDuration = Math.min(windowDuration, Math.max(10, maxDurationAt8k));
      wavBlob = await renderMonoWavAtSampleRate(decodedBuffer, FALLBACK_SAMPLE_RATE, safeOffset, windowDuration);
    }

    const audioBase64 = await blobToCleanBase64(wavBlob);

    return {
      audioBase64,
      audioMimeType: 'audio/wav',
      audioOffsetSeconds: Math.round(safeOffset * 100) / 100,
      duration: Math.round(fullDuration * 100) / 100,
      sampleRate: chosenRate,
      hasAudioTrack: true,
    };
  } catch (err) {
    // Fallback for small standalone audio files (e.g. .mp3/.wav/.m4a) if decodeAudioData fails
    if (file && /^audio\//i.test(file.type) && file.size > 0 && file.size <= MAX_INLINE_WAV_BYTES) {
      try {
        const rawBase64 = await blobToCleanBase64(file);
        return {
          audioBase64: rawBase64,
          audioMimeType: file.type || 'audio/wav',
          audioOffsetSeconds: 0,
          duration: 30,
          hasAudioTrack: true,
        };
      } catch {
        // ignore fallback read failure
      }
    }
    console.warn('[audioExtractor] File tidak memiliki audio atau gagal didekode:', err);
    return {
      audioBase64: '',
      audioMimeType: 'audio/wav',
      audioOffsetSeconds: 0,
      duration: 0,
      hasAudioTrack: false,
    };
  } finally {
    if (decodeCtx) {
      decodeCtx.close().catch(() => {});
    }
  }
}
