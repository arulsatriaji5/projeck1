export interface ExtractedWavAudioPayload {
  audioBase64: string;
  audioMimeType: string;
  audioOffsetSeconds: number;
  duration: number;
}

const TARGET_SAMPLE_RATE = 16000;
// Cap extracted audio window to keep JSON payload fast & under Express body limits (~3.5MB base64 ≈ 105s mono 16kHz PCM)
const MAX_AUDIO_WINDOW_SECONDS = 120;

function encodePcm16MonoWav(samples: Float32Array, sampleRate: number): Uint8Array {
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
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function uint8ToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export async function extractLocalAudioWavBase64(
  file: File,
  offsetSeconds = 0
): Promise<ExtractedWavAudioPayload | null> {
  if (typeof window === 'undefined') return null;

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const OfflineCtx =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;

  if (!AudioCtx || !OfflineCtx) return null;

  let decodeCtx: AudioContext | null = null;
  try {
    const arrayBuffer = await file.arrayBuffer();
    decodeCtx = new AudioCtx();
    const decodedBuffer = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
    const fullDuration = Math.max(0.5, decodedBuffer.duration || 0);

    const safeOffset = Math.max(0, Math.min(Math.max(0, fullDuration - 1), offsetSeconds));
    const windowDuration = Math.min(MAX_AUDIO_WINDOW_SECONDS, Math.max(0.5, fullDuration - safeOffset));
    const targetFrames = Math.max(1, Math.floor(windowDuration * TARGET_SAMPLE_RATE));

    const offlineCtx = new OfflineCtx(1, targetFrames, TARGET_SAMPLE_RATE);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0, safeOffset, windowDuration);

    const renderedBuffer = await offlineCtx.startRendering();
    const monoSamples = renderedBuffer.getChannelData(0);
    const wavBytes = encodePcm16MonoWav(monoSamples, TARGET_SAMPLE_RATE);

    return {
      audioBase64: uint8ToBase64(wavBytes),
      audioMimeType: 'audio/wav',
      audioOffsetSeconds: Math.round(safeOffset * 100) / 100,
      duration: Math.round(fullDuration * 100) / 100,
    };
  } catch (err) {
    console.warn('[audioExtractor] Gagal mengekstrak audio lokal ke WAV:', err);
    return null;
  } finally {
    if (decodeCtx) {
      decodeCtx.close().catch(() => {});
    }
  }
}
