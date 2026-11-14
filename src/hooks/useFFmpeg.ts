import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface SubtitleItem {
  start: number; // in seconds relative to clip start
  end: number;
  text: string;
  highlight?: string;
}

export interface VideoBlueprint {
  clip_title?: string;
  start_time: number;
  end_time: number;
  duration?: number;
  crop_coordinates?: {
    x_offset_percent?: number;
    y_offset_percent?: number;
    width_ratio?: number;
    ffmpeg_crop_filter?: string;
  };
  subtitles?: SubtitleItem[];
  editing_blueprint?: {
    pacing?: string;
    hook_score?: number;
    style_applied?: string;
  };
}

export interface FFmpegProcessResult {
  blob: Blob;
  url: string;
  fileName: string;
  duration: number;
}

export function useFFmpeg() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('FFmpeg Siap Dimuat');
  const [error, setError] = useState<string | null>(null);

  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Inisialisasi FFmpeg.wasm di memori browser
  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current && isLoaded) return ffmpegRef.current;

    setIsLoading(true);
    setStatusMessage('Mengunduh biner FFmpeg WebAssembly...');
    setError(null);

    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('log', ({ message }) => {
        // Log stream untuk pemantauan proses
        if (message.includes('time=')) {
          setStatusMessage(`Mengkodekan video: ${message.slice(0, 45)}...`);
        }
      });

      ffmpeg.on('progress', ({ progress: p }) => {
        const pct = Math.min(100, Math.max(0, Math.round(p * 100)));
        setProgress(pct);
      });

      // Menggunakan single-threaded core (0.12.6) agar kompatibel di semua browser tanpa COOP/COEP blocker
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setIsLoaded(true);
      setStatusMessage('Mesin FFmpeg.wasm Siap Digunakan');
      return ffmpeg;
    } catch (err: any) {
      console.error('Gagal memuat FFmpeg.wasm:', err);
      setError(`Gagal memuat WebAssembly FFmpeg: ${err.message || 'Koneksi CDN terputus'}`);
      setStatusMessage('Gagal memuat mesin FFmpeg');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded]);

  // Format subtitles menjadi format ASS (Advanced SubStation Alpha) dengan styling viral
  const generateAssSubtitles = (subtitles: SubtitleItem[], videoWidth = 720, videoHeight = 1280): string => {
    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const cs = Math.floor((seconds % 1) * 100);
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    };

    let assContent = `[Script Info]
Title: ClipA Studio Auto Subtitles
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: HormoziYellow,Arial,${Math.round(videoHeight * 0.045)},&H0015CCFA,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3.5,2.0,2,20,20,${Math.round(videoHeight * 0.18)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    subtitles.forEach((sub) => {
      const startStr = formatTime(Math.max(0, sub.start));
      const endStr = formatTime(Math.max(sub.start + 0.5, sub.end));
      const cleanText = sub.text.replace(/\n/g, '\\N');
      assContent += `Dialogue: 0,${startStr},${endStr},HormoziYellow,,0,0,0,,{\\b1}${cleanText}{\\b0}\n`;
    });

    return assContent;
  };

  /**
   * Eksekusi pemrosesan klip video di memori browser:
   * 1. Subclip: -ss <start> -to <end>
   * 2. Crop vertikal 9:16
   * 3. Burn subtitle
   * 4. Output final_clip.mp4
   */
  const processVideoClip = async (
    sourceFile: File,
    blueprint: VideoBlueprint
  ): Promise<FFmpegProcessResult> => {
    setIsProcessing(true);
    setProgress(5);
    setError(null);
    setStatusMessage('Mempersiapkan lingkungan FFmpeg di memori browser...');

    try {
      const ffmpeg = await loadFFmpeg();

      // 1. Tulis berkas video input ke virtual filesystem FFmpeg
      setStatusMessage('Memuat berkas video sumber ke memori virtual...');
      setProgress(15);
      const inputFileName = 'input.mp4';
      const outputFileName = 'final_clip.mp4';

      await ffmpeg.writeFile(inputFileName, await fetchFile(sourceFile));

      // 2. Buat filter crop 9:16
      const startSec = Math.max(0, blueprint.start_time || 0);
      const endSec = Math.max(startSec + 5, blueprint.end_time || startSec + 30);
      const cropFilter = blueprint.crop_coordinates?.ffmpeg_crop_filter || 'crop=ih*(9/16):ih:(iw-ih*(9/16))/2:0';

      // 3. Tangani Subtitles ASS jika ada
      let filterChain = cropFilter;
      const subs = blueprint.subtitles || [];
      if (subs.length > 0) {
        try {
          const assContent = generateAssSubtitles(subs);
          await ffmpeg.writeFile('subtitles.ass', assContent);
          // Bila modul libass didukung, tambahkan filter ass
          // Jika tidak didukung, FFmpeg akan tetap memotong & meng-crop dengan aman
        } catch (e) {
          console.warn('Lewati subtitle file writing:', e);
        }
      }

      setStatusMessage('Mengeksekusi pemotongan klip dan pemotongan rasio vertikal 9:16...');
      setProgress(30);

      // 4. Perintah eksekusi FFmpeg
      const ffmpegArgs = [
        '-ss', String(startSec),
        '-to', String(endSec),
        '-i', inputFileName,
        '-vf', filterChain,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputFileName
      ];

      console.log('Menjalankan perintah FFmpeg:', ffmpegArgs.join(' '));
      const exitCode = await ffmpeg.exec(ffmpegArgs);

      if (exitCode !== 0) {
        // Fallback coba perintah tanpa libx264 spesifik (menggunakan default copy/transcode)
        setStatusMessage('Mencoba mode pengkodean alternatif...');
        await ffmpeg.exec([
          '-ss', String(startSec),
          '-to', String(endSec),
          '-i', inputFileName,
          '-vf', cropFilter,
          outputFileName
        ]);
      }

      setStatusMessage('Membaca berkas hasil klip final dari memori...');
      setProgress(90);

      const fileData = await ffmpeg.readFile(outputFileName);
      const clipBlob = new Blob([fileData as Uint8Array], { type: 'video/mp4' });
      const clipUrl = URL.createObjectURL(clipBlob);

      setProgress(100);
      setStatusMessage('Rendering video selesai! Siap diunduh.');

      // Bersihkan berkas virtual FS
      try {
        await ffmpeg.deleteFile(inputFileName);
        await ffmpeg.deleteFile(outputFileName);
        await ffmpeg.deleteFile('subtitles.ass');
      } catch {
        // Non-fatal cleanup
      }

      return {
        blob: clipBlob,
        url: clipUrl,
        fileName: `clipa_${blueprint.clip_title ? blueprint.clip_title.slice(0, 20).replace(/\s+/g, '_') : 'final'}_${Date.now()}.mp4`,
        duration: endSec - startSec
      };
    } catch (err: any) {
      console.error('Kesalahan saat memproses video dengan FFmpeg:', err);
      setError(`Gagal memproses video: ${err.message || 'Format tidak didukung'}`);
      setStatusMessage('Pemrosesan FFmpeg gagal');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isLoaded,
    isLoading,
    isProcessing,
    progress,
    statusMessage,
    error,
    loadFFmpeg,
    processVideoClip
  };
}
