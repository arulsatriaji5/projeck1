import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { getAllReferences, insertReference, deleteReference, initDatabase } from "./src/lib/turso";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy Google GenAI Client (GEMINI_API -> GEMINI_API_KEY -> Settings fallback)
function getGenAI(overrideApiKey?: string) {
  const apiKey =
    (typeof process.env.GEMINI_API === "string" && process.env.GEMINI_API.trim()) ||
    (typeof process.env.GEMINI_API_KEY === "string" && process.env.GEMINI_API_KEY.trim()) ||
    (typeof overrideApiKey === "string" && overrideApiKey.trim()) ||
    "";
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Initialize Turso DB table on startup
initDatabase().catch(err => console.warn("Turso init non-fatal note:", err));

// ====================================================================
// 1. ENDPOINTS: /api/references (Turso / libSQL Reference Vault CRUD)
// ====================================================================

// GET: Ambil seluruh referensi gaya editan
app.get("/api/references", async (req, res) => {
  try {
    const references = await getAllReferences();
    return res.json({ success: true, count: references.length, references });
  } catch (err: any) {
    console.error("Error GET /api/references:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Tambah referensi gaya editan baru
app.post("/api/references", async (req, res) => {
  try {
    const { type, url_or_content, editing_notes } = req.body;
    if (!url_or_content && !editing_notes) {
      return res.status(400).json({ success: false, error: "url_or_content atau editing_notes wajib diisi" });
    }

    const created = await insertReference({
      type: type || "video",
      url_or_content: url_or_content || "",
      editing_notes: editing_notes || ""
    });

    return res.status(201).json({ success: true, reference: created });
  } catch (err: any) {
    console.error("Error POST /api/references:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE: Hapus referensi berdasarkan ID
app.delete("/api/references", async (req, res) => {
  try {
    const id = (req.query.id as string) || req.body?.id;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID referensi wajib disertakan" });
    }

    const result = await deleteReference(id);
    return res.json(result);
  } catch (err: any) {
    console.error("Error DELETE /api/references:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================================================
// 2. ENDPOINT: /api/analyze-video (Gemini 2.5 Flash Multimodal Blueprint)
// ====================================================================
app.post("/api/analyze-video", async (req, res) => {
  const { 
    sourceVideoName = "sample_video.mp4", 
    sourceDuration = 60, 
    sourceUrl, 
    referenceId, 
    editingNotes: customNotes = "", 
    promptInstructions = "" 
  } = req.body;

  try {
    let activeReferenceNotes = customNotes;
    if (referenceId) {
      const allRefs = await getAllReferences();
      const matched = allRefs.find(r => r.id === referenceId);
      if (matched) {
        activeReferenceNotes = `[Gaya Referensi ${matched.type.toUpperCase()}: ${matched.url_or_content}]\n${matched.editing_notes}\n${customNotes}`;
      }
    }

    const headerApiKey = typeof req.headers["x-gemini-api-key"] === "string" ? req.headers["x-gemini-api-key"] : "";
    const bodyApiKey = typeof req.body?.apiKey === "string" ? req.body.apiKey : "";
    const ai = getGenAI(bodyApiKey || headerApiKey);

    if (ai) {
      const prompt = `Act as an expert viral video editor and technical director for short-form video (TikTok, YouTube Shorts, Reels).
Analyze this input video request:
- Video Name: ${sourceVideoName}
- Estimated Duration: ${sourceDuration} seconds
- Source URL: ${sourceUrl || 'Local File Upload'}
- Reference Editing Style Notes (from Turso Reference Vault):
"""
${activeReferenceNotes || 'Potong jeda nafas pembicara 100%. Fokuskan wajah di 35% tinggi layar atas rasio 9:16. Subtitle warna kuning neon dengan bayangan hitam pekat.'}
"""
- User Additional Constraints:
"""
${promptInstructions || 'Pilih segmen 20-45 detik dengan hook terkuat.'}
"""

You must generate a strict technical video blueprint for client-side FFmpeg processing.
Return ONLY valid JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({
          success: true,
          model: "gemini-2.5-flash",
          blueprint: parsed
        });
      }
    }
  } catch (err: any) {
    console.warn("Gemini 2.5 Flash /api/analyze-video warning:", err);
  }

  const start = Math.min(10, Math.max(0, Number(sourceDuration) * 0.15));
  const dur = Math.min(30, Math.max(15, Number(sourceDuration) * 0.5));
  const end = start + dur;

  return res.json({
    success: true,
    model: "gemini-2.5-flash-fallback",
    blueprint: {
      clip_title: "Rahasia Terbesar Hook 3 Detik FYP TikTok",
      start_time: Math.round(start * 10) / 10,
      end_time: Math.round(end * 10) / 10,
      duration: Math.round(dur * 10) / 10,
      crop_coordinates: {
        x_offset_percent: 50,
        y_offset_percent: 0,
        width_ratio: 0.5625,
        ffmpeg_crop_filter: "crop=ih*(9/16):ih:(iw-ih*(9/16))/2:0"
      },
      subtitles: [
        { start: 0.0, end: 2.2, text: "Ternyata 90% penonton bakal scroll...", highlight: "90% penonton" },
        { start: 2.2, end: 4.8, text: "...kalau 3 detik awal gak menarik!", highlight: "3 detik awal" },
        { start: 4.8, end: 8.5, text: "Terapkan formula retensi ini ke semua kontenmu!", highlight: "formula retensi" },
        { start: 8.5, end: 12.0, text: "Potong klip tanpa jeda nafas dan gunakan subtitle kuning neon.", highlight: "subtitle kuning neon" }
      ],
      editing_blueprint: {
        pacing: "Fast-Paced (Zero Silence)",
        hook_score: 97,
        style_applied: "Hormozi Fast Hook Style (Turso Reference)"
      }
    }
  });
});

// ====================================================================
// 3. ENDPOINT: /api/auto-clip (Real Gemini 2.5 Flash Pipeline — Zero Mock Fallback)
// ====================================================================
function formatDurationMMSS(seconds: number): string {
  const safe = Math.max(1, Math.round(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function extractYouTubeVideoId(inputUrl: string): string | null {
  const regExp = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const match = inputUrl.match(regExp);
  return match ? match[1] : null;
}

app.post("/api/auto-clip", async (req, res) => {
  const startTimeStamp = Date.now();
  try {
    const {
      mode,
      sourceVideoUrl,
      videoUrl,
      videoId: clientVideoId,
      fileName,
      videoDuration,
      audioBase64,
      audioMimeType,
      audioOffsetSeconds,
      frames,
      recipe,
      ratio,
      style,
      sourceStartSeconds,
      sourceEndSeconds,
      targetDuration,
      momentPrompt,
      referenceInstructions,
      videoTitle: clientVideoTitle,
      authorName: clientAuthorName,
    } = req.body || {};

    const headerApiKey = typeof req.headers["x-gemini-api-key"] === "string" ? req.headers["x-gemini-api-key"] : "";
    const bodyApiKey = typeof req.body?.apiKey === "string" ? req.body.apiKey : "";
    const ai = getGenAI(bodyApiKey || headerApiKey);
    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API maupun GEMINI_API_KEY belum dikonfigurasi di server (Settings > Secrets). Harap tambahkan API key terlebih dahulu.",
      });
    }

    const incomingUrl =
      typeof sourceVideoUrl === "string" && sourceVideoUrl.trim()
        ? sourceVideoUrl.trim()
        : typeof videoUrl === "string" && videoUrl.trim()
        ? videoUrl.trim()
        : "";

    const hasAudioPayload = typeof audioBase64 === "string" && audioBase64.trim().length > 0;
    const isLocalMode =
      mode === "local" ||
      hasAudioPayload ||
      (Array.isArray(frames) && frames.length > 0) ||
      Boolean(fileName && !incomingUrl);
    const resolvedRatio = recipe?.layout || ratio || "9:16";
    const resolvedStyle = recipe?.subtitleTemplateName || style || "hormozi";

    let resolvedVideoId: string | null = null;
    let videoTitle = fileName
      ? fileName.replace(/\.[^/.]+$/, "")
      : (typeof clientVideoTitle === "string" ? clientVideoTitle.trim() : "");
    let authorName = typeof clientAuthorName === "string" ? clientAuthorName.trim() : "";

    if (isLocalMode) {
      if (!fileName) {
        return res.status(400).json({
          success: false,
          error: "File MP4 lokal tidak ditemukan pada permintaan.",
        });
      }
    } else {
      if (!incomingUrl) {
        return res.status(400).json({
          success: false,
          error: "Tautan YouTube atau file video MP4 lokal wajib disertakan.",
        });
      }
      resolvedVideoId = (typeof clientVideoId === "string" && clientVideoId.length === 11)
        ? clientVideoId
        : extractYouTubeVideoId(incomingUrl);

      if (!resolvedVideoId) {
        return res.status(400).json({
          success: false,
          error: "Tautan YouTube tidak valid. Gunakan tautan youtube.com/watch?v=..., youtu.be/..., shorts/..., atau live/...",
        });
      }

      // Fetch real YouTube oEmbed metadata so Gemini analyzes the real video title & channel
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${resolvedVideoId}&format=json`
        );
        if (oembedRes.ok) {
          const oembedData = (await oembedRes.json()) as { title?: string; author_name?: string };
          if (oembedData?.title) videoTitle = oembedData.title;
          if (oembedData?.author_name) authorName = oembedData.author_name;
        }
      } catch (oembedErr) {
        console.warn("[Auto-Clip API] oEmbed metadata warning:", oembedErr);
      }
    }

    const safeTotalDuration = isLocalMode
      ? Math.max(4, Number(videoDuration) || 30)
      : Math.max(60, Number(sourceEndSeconds) || 300);

    const audioOffset = Math.max(0, Number(audioOffsetSeconds) || 0);
    const rangeStart = 0;
    const rangeEnd = safeTotalDuration;

    let minSeconds = Number(req.body?.minSeconds);
    let maxSeconds = Number(req.body?.maxSeconds);
    if (!Number.isFinite(minSeconds) || !Number.isFinite(maxSeconds) || minSeconds <= 0 || maxSeconds < minSeconds) {
      if (targetDuration === "30_60") {
        minSeconds = 30;
        maxSeconds = 60;
      } else if (targetDuration === "60_90") {
        minSeconds = 60;
        maxSeconds = 90;
      } else {
        minSeconds = 15;
        maxSeconds = 30;
      }
    }
    minSeconds = Math.max(5, Math.round(minSeconds));
    maxSeconds = Math.max(minSeconds, Math.round(maxSeconds));
    const durationRule = `WAJIB antara ${minSeconds} sampai ${maxSeconds} detik per klip`;

    const promptText = isLocalMode
      ? `Anda adalah ahli transkripsi audio dan editor video pendek AI profesional.
${hasAudioPayload ? "Anda menerima rekaman AUDIO ASLI (mono 16kHz WAV) dari seluruh file video MP4 pengguna" : "Anda menerima frame sampel dari file video MP4 lokal pengguna"}:
- Nama File: ${fileName}
- Total Durasi Video Penuh: ${safeTotalDuration.toFixed(2)} detik (mulai 0.00s sampai ${safeTotalDuration.toFixed(2)}s)
${hasAudioPayload ? `- Catatan Timeline Audio: Detik 0.0 pada file audio ini berkorespondensi dengan detik ${audioOffset.toFixed(2)} pada timeline video asli.` : ""}
- Target Durasi Klip: ${durationRule}
- Rasio Output: ${resolvedRatio}
- Gaya Subtitle: ${resolvedStyle}
${momentPrompt ? `- Momen Spesifik yang Dicari: ${momentPrompt}` : ""}
${referenceInstructions ? `- Instruksi Tambahan: ${referenceInstructions}` : ""}

ATURAN DURASI WAJIB (CRITICAL):
Every returned clip MUST have a duration (end_sec - start_sec) strictly between ${minSeconds} and ${maxSeconds} seconds. If the total source video is under 35 seconds, return 1 comprehensive clip lasting ${minSeconds} to ${safeTotalDuration.toFixed(1)} seconds rather than splitting into tiny 6-second fragments.

TUGAS WAJIB (SANGAT KETAT):
1. ${hasAudioPayload ? "Dengarkan dengan teliti ucapan asli (Bahasa Indonesia atau Inggris) pada seluruh audio." : "Analisis visual frame yang dikirimkan."}
2. Pilih ${safeTotalDuration < 35 ? "1 segmen klip komprehensif terbaik" : "3 sampai 4 segmen klip terbaik"} dengan 'start_sec' dan 'end_sec' (angka desimal/float tepat dalam detik timeline video asli, berada di dalam rentang 0.00 sampai ${safeTotalDuration.toFixed(2)}) dengan panjang (end_sec - start_sec) antara ${minSeconds} sampai ${maxSeconds} detik.
3. Berikan 'title' klip, 'hook_headline' (judul hook super singkat 3-6 kata huruf kapital yang memancing rasa penasaran untuk banner 3 detik pertama), dan 'viral_score' (75-99).
4. TRANSKRIPSI VERBATIM (KATA DEMI KATA): Pecah ucapan NYATA yang benar-benar terdengar di dalam rentang [start_sec, end_sec] menjadi potongan subtitle pendek yang padat (2 sampai 4 kata per baris).
   - JANGAN PERNAH mengarang, menambah, atau berhalusinasi kata yang tidak diucapkan di audio.
   - Setiap objek subtitle WAJIB memiliki 'start_sec' dan 'end_sec' dalam DETIK TIMELINE VIDEO ASLI (antara start_sec dan end_sec klip tersebut).
   - Jika pada bagian tertentu tidak ada ucapan (musik/hening), jangan buat teks ucapan palsu.
5. AI B-ROLL MOMENTS: Untuk setiap klip, buat 1 sampai 2 'broll_moments' pada momen kata kunci penting di dalam rentang [start_sec, end_sec] (masing-masing berdurasi 2.5 - 4.0 detik) berisi: 'start_sec', 'end_sec', 'keyword' (1-2 kata), 'icon_or_emoji' (1 emoji visual relevan seperti 📈, 💡, 🚀, 🎯, 💰), dan 'caption' (ringkasan visual singkat 3-6 kata).`
      : `Anda adalah editor video pendek AI profesional.
Analisis video YouTube nyata berikut:
- YouTube URL: ${incomingUrl}
- Video ID: ${resolvedVideoId}
${videoTitle ? `- Judul Video Asli: ${videoTitle}` : ""}
${authorName ? `- Channel: ${authorName}` : ""}
- Analisis seluruh video dari awal (0s) dengan estimasi rentang ${rangeStart}s sampai ${rangeEnd}s
- Target Durasi Klip: ${durationRule}
- Rasio Output: ${resolvedRatio}
- Gaya Subtitle: ${resolvedStyle}
${momentPrompt ? `- Momen Spesifik yang Dicari: ${momentPrompt}` : ""}
${referenceInstructions ? `- Instruksi Tambahan: ${referenceInstructions}` : ""}

ATURAN DURASI WAJIB (CRITICAL):
Every returned clip MUST have a duration (end_sec - start_sec) strictly between ${minSeconds} and ${maxSeconds} seconds. If the total source video is under 35 seconds, return 1 comprehensive clip lasting ${minSeconds} to ${safeTotalDuration.toFixed(1)} seconds rather than splitting into tiny 6-second fragments.

Tugas Wajib:
1. Analisis topik dan konteks video YouTube tersebut dan hasilkan 3 sampai 4 segmen klip paling berpotensi viral.
2. Setiap segmen memiliki 'start_sec' dan 'end_sec' di dalam rentang ${rangeStart}..${rangeEnd} sesuai target (${durationRule}).
3. Semua 'title', 'hook_headline' (3-6 kata singkat untuk banner hook 3 detik pertama), dan 'subtitles' WAJIB berbahasa Indonesia yang relevan dengan topik video aslinya dan memiliki 'viral_score' (75-99).
4. Untuk setiap segmen, buat potongan 'subtitles' (2-4 kata per baris) dengan 'start_sec' dan 'end_sec' dalam detik timeline video asli (di antara start_sec dan end_sec segmen tersebut).
5. Sertakan 1 sampai 2 'broll_moments' per klip di dalam [start_sec, end_sec] berisi 'start_sec', 'end_sec', 'keyword', 'icon_or_emoji', dan 'caption'.`;

    const contentParts: Array<any> = [];
    if (isLocalMode && hasAudioPayload) {
      const cleanAudioBase64 = audioBase64.includes(",")
        ? audioBase64.split(",")[1]
        : audioBase64;
      contentParts.push({
        inlineData: {
          mimeType: audioMimeType || "audio/wav",
          data: cleanAudioBase64,
        },
      });
    }
    if (isLocalMode && Array.isArray(frames)) {
      frames.slice(0, hasAudioPayload ? 3 : 6).forEach((frameItem: any) => {
        if (frameItem?.data && typeof frameItem.data === "string") {
          const base64Payload = frameItem.data.includes(",")
            ? frameItem.data.split(",")[1]
            : frameItem.data;
          contentParts.push({
            inlineData: {
              mimeType: frameItem.mimeType || "image/jpeg",
              data: base64Payload,
            },
          });
        }
      });
    }
    contentParts.push({ text: promptText });

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contentParts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            video_title: { type: Type.STRING },
            clips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  hook_headline: { type: Type.STRING },
                  viral_score: { type: Type.INTEGER },
                  start_sec: { type: Type.NUMBER },
                  end_sec: { type: Type.NUMBER },
                  subtitles: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        start_sec: { type: Type.NUMBER },
                        end_sec: { type: Type.NUMBER },
                        text: { type: Type.STRING },
                      },
                      required: ["start_sec", "end_sec", "text"],
                    },
                  },
                  broll_moments: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        start_sec: { type: Type.NUMBER },
                        end_sec: { type: Type.NUMBER },
                        keyword: { type: Type.STRING },
                        icon_or_emoji: { type: Type.STRING },
                        caption: { type: Type.STRING },
                      },
                      required: ["start_sec", "end_sec", "keyword", "icon_or_emoji", "caption"],
                    },
                  },
                },
                required: ["title", "hook_headline", "viral_score", "start_sec", "end_sec", "subtitles", "broll_moments"],
              },
            },
          },
          required: ["clips"],
        },
      },
    });

    if (!geminiResponse.text) {
      return res.status(502).json({
        success: false,
        error: "Gemini 2.5 Flash tidak mengembalikan output JSON.",
      });
    }

    const parsed = JSON.parse(geminiResponse.text);
    const rawClips = Array.isArray(parsed?.clips) ? parsed.clips : [];

    if (rawClips.length === 0) {
      return res.status(502).json({
        success: false,
        error: "Gemini 2.5 Flash tidak menemukan segmen klip yang valid.",
      });
    }

    const normalizedClips = rawClips.map((c: any, idx: number) => {
      let startSec = Math.max(0, Number(c.start_sec ?? c.start_seconds) || 0);
      let endSec = Number(c.end_sec ?? c.end_seconds) || startSec + minSeconds;

      if (isLocalMode) {
        if (safeTotalDuration >= minSeconds) {
          startSec = Math.min(startSec, Math.max(0, safeTotalDuration - minSeconds));
          endSec = Math.min(safeTotalDuration, Math.max(startSec + 1, endSec));
          if (endSec - startSec < minSeconds) {
            endSec = Math.min(safeTotalDuration, startSec + minSeconds);
            if (endSec - startSec < minSeconds) {
              startSec = Math.max(0, safeTotalDuration - minSeconds);
            }
          }
          if (endSec - startSec > maxSeconds) {
            endSec = startSec + maxSeconds;
          }
        } else {
          startSec = 0;
          endSec = safeTotalDuration;
        }
      } else {
        if (endSec - startSec < minSeconds) {
          endSec = startSec + minSeconds;
        }
        if (endSec - startSec > maxSeconds) {
          endSec = startSec + maxSeconds;
        }
      }

      startSec = Math.round(startSec * 100) / 100;
      endSec = Math.round(endSec * 100) / 100;
      const segDur = Math.max(1.5, endSec - startSec);

      const cleanSubs = Array.isArray(c.subtitles)
        ? c.subtitles
            .map((s: any, sIdx: number) => {
              let rawSubStart = Number(s.start_sec ?? s.start);
              let rawSubEnd = Number(s.end_sec ?? s.end);
              if (isNaN(rawSubStart)) rawSubStart = startSec;
              if (isNaN(rawSubEnd)) rawSubEnd = rawSubStart + 1.5;

              // Safety check: jika model mengembalikan offset audio 0-based saat audioOffset > 0
              if (hasAudioPayload && audioOffset > 0 && rawSubStart < startSec - 0.5 && rawSubStart + audioOffset >= startSec - 0.5) {
                rawSubStart += audioOffset;
                rawSubEnd += audioOffset;
              }

              return {
                id: `sub-${idx + 1}-${sIdx + 1}`,
                rawSubStart,
                rawSubEnd,
                text: String(s.text || "").trim(),
              };
            })
            .filter((s: any) => s.text.length > 0 && s.rawSubEnd > startSec && s.rawSubStart < endSec)
            .map((s: any) => {
              const subStartSec = Math.max(startSec, Math.min(endSec - 0.2, s.rawSubStart));
              const subEndSec = Math.min(endSec, Math.max(subStartSec + 0.2, s.rawSubEnd));
              return {
                id: s.id,
                start_sec: Math.round(subStartSec * 100) / 100,
                end_sec: Math.round(subEndSec * 100) / 100,
                text: s.text,
              };
            })
            .sort((a: any, b: any) => a.start_sec - b.start_sec)
        : [];

      let cleanBrolls = Array.isArray(c.broll_moments)
        ? c.broll_moments
            .map((b: any, bIdx: number) => {
              let bStart = Number(b.start_sec ?? b.start);
              let bEnd = Number(b.end_sec ?? b.end);
              if (isNaN(bStart)) bStart = startSec + Math.min(4, segDur * 0.25);
              if (isNaN(bEnd) || bEnd <= bStart) bEnd = bStart + 3.0;
              if (hasAudioPayload && audioOffset > 0 && bStart < startSec - 0.5 && bStart + audioOffset >= startSec - 0.5) {
                bStart += audioOffset;
                bEnd += audioOffset;
              }
              return {
                id: `broll-${idx + 1}-${bIdx + 1}`,
                rawStart: bStart,
                rawEnd: bEnd,
                keyword: String(b.keyword || "Highlight").trim(),
                icon_or_emoji: String(b.icon_or_emoji || "💡").trim(),
                caption: String(b.caption || b.keyword || "Poin Utama").trim(),
              };
            })
            .filter((b: any) => b.rawEnd > startSec && b.rawStart < endSec)
            .map((b: any) => {
              const clampedStart = Math.max(startSec + 0.5, Math.min(endSec - 1.2, b.rawStart));
              const clampedEnd = Math.min(endSec, Math.max(clampedStart + 1.5, Math.min(clampedStart + 4.5, b.rawEnd)));
              return {
                id: b.id,
                start_sec: Math.round(clampedStart * 100) / 100,
                end_sec: Math.round(clampedEnd * 100) / 100,
                keyword: b.keyword,
                icon_or_emoji: b.icon_or_emoji,
                caption: b.caption,
              };
            })
            .slice(0, 2)
        : [];

      if (cleanBrolls.length === 0 && segDur >= 4) {
        const fallbackStart = Math.round((startSec + Math.min(3.5, segDur * 0.25)) * 100) / 100;
        const fallbackEnd = Math.round(Math.min(endSec, fallbackStart + 3.0) * 100) / 100;
        cleanBrolls = [
          {
            id: `broll-${idx + 1}-1`,
            start_sec: fallbackStart,
            end_sec: fallbackEnd,
            keyword: "Poin Kunci",
            icon_or_emoji: "💡",
            caption: String(c.title || "Momen Penting").slice(0, 36),
          },
        ];
      }

      const score = Math.min(99, Math.max(70, Math.round(Number(c.viral_score) || 88)));
      const hookHeadline = String(c.hook_headline || c.title || "WAJIB TONTON SAMPAI HABIS!").trim();

      return {
        id: `clip-${Date.now()}-${idx + 1}`,
        mode: isLocalMode ? "local" : "youtube",
        videoId: resolvedVideoId,
        title: String(c.title || `Klip #${idx + 1}`),
        hook_headline: hookHeadline,
        viral_score: score,
        score,
        start_sec: startSec,
        end_sec: endSec,
        start_seconds: startSec,
        end_seconds: endSec,
        duration: formatDurationMMSS(segDur),
        subtitles: cleanSubs,
        broll_moments: cleanBrolls,
      };
    });

    const elapsedSeconds = ((Date.now() - startTimeStamp) / 1000).toFixed(2);
    console.log(
      `[Auto-Clip API] Selesai (${isLocalMode ? (hasAudioPayload ? "Local MP4 Audio WAV" : "Local MP4 Frames") : "YouTube"}) dalam ${elapsedSeconds}s | ${normalizedClips.length} klip.`
    );

    return res.json({
      success: true,
      mode: isLocalMode ? "local" : "youtube",
      videoId: resolvedVideoId,
      videoTitle: parsed.video_title || videoTitle || fileName || "Video Analisis AI",
      clips: normalizedClips,
    });
  } catch (err: any) {
    console.error("[Auto-Clip API] Error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Gagal memproses video dengan Gemini API.",
    });
  }
});

// Endpoint lama untuk analisis URL YouTube (kompatibilitas dashboard)
app.post("/api/analyze-url", async (req, res) => {
  const { url, targetLanguage = "id" } = req.body;


  if (!url) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  // Extract YouTube ID helper
  const extractVideoId = (inputUrl: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = inputUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "dQw4w9WgXcQ";
  };

  const videoId = extractVideoId(url);

  try {
    const headerApiKey = typeof req.headers["x-gemini-api-key"] === "string" ? req.headers["x-gemini-api-key"] : "";
    const bodyApiKey = typeof req.body?.apiKey === "string" ? req.body.apiKey : "";
    const ai = getGenAI(bodyApiKey || headerApiKey);
    
    if (ai) {
      const prompt = `Analyze this YouTube video URL: ${url} (Video ID: ${videoId}).
Act as an expert social media viral clip editor (like Opus Clip / CapCut).
Generate 4 highly engaging short video clips (15-60 seconds each) suitable for TikTok, YouTube Shorts, and Instagram Reels.
Language: ${targetLanguage === "id" ? "Indonesian" : "English"}.

Return ONLY valid JSON in this exact structure:
{
  "videoTitle": "String - compelling title for the original video",
  "channelName": "String - channel name",
  "totalDuration": "String e.g. 18:42",
  "thumbnailUrl": "https://img.youtube.com/vi/${videoId}/maxresdefault.jpg",
  "clips": [
    {
      "id": "clip-1",
      "title": "String - catchy viral clip headline",
      "hook": "String - the opening hook line",
      "startTime": 12,
      "endTime": 45,
      "duration": "00:33",
      "viralScore": 98,
      "scoreReason": "High emotional hook, key takeaway for tech enthusiasts",
      "aspectRatio": "9:16",
      "category": "High Energy",
      "captions": [
        { "id": "c1", "start": 0, "end": 2.5, "text": "Ini rahasia terbesar AI yang jarang orang tau!", "highlight": "rahasia terbesar" },
        { "id": "c2", "start": 2.5, "end": 5.0, "text": "Hanya dalam 5 menit, kamu bisa ubah video panjang...", "highlight": "5 menit" },
        { "id": "c3", "start": 5.0, "end": 8.0, "text": "...jadi 10 klip viral siap upload ke TikTok!", "highlight": "10 klip viral" }
      ]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        // Ensure thumbnailUrl has youtube fallback
        parsed.videoId = videoId;
        if (!parsed.thumbnailUrl) {
          parsed.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
        return res.json(parsed);
      }
    }
  } catch (err) {
    console.warn("Gemini API call warning/fallback:", err);
  }

  // Default fallback data if no API key or fallback triggered
  const fallbackClips = {
    videoId: videoId,
    videoTitle: url.includes("podcast") 
      ? "Secrets of Modern AI SaaS & Viral Content Creation"
      : "Cara Bikin Video YouTube Jadi Klip Shorts Viral dalam 1 Klik",
    channelName: "Tech & Creator Studio",
    totalDuration: "14:28",
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    clips: [
      {
        id: `clip-${videoId}-1`,
        title: "🔥 Rahasia Trik 5 Detik Pertama Biar Video FYP",
        hook: "Ternyata 90% penonton scroll kalau 3 detik awal gak menarik!",
        startTime: 15,
        endTime: 48,
        duration: "00:33",
        viralScore: 98,
        scoreReason: "Hook pertanyaan kuat + solutif tinggi untuk algoritma TikTok",
        aspectRatio: "9:16",
        category: "🔥 Viral Hook",
        captions: [
          { id: "c1", start: 0, end: 2.2, text: "Ternyata 90% penonton bakal scroll...", highlight: "90% penonton" },
          { id: "c2", start: 2.2, end: 4.8, text: "...kalau 3 detik pertama gak menarik!", highlight: "3 detik pertama" },
          { id: "c3", start: 4.8, end: 8.0, text: "Gunakan trik pancingan emosi ini sekarang!", highlight: "pancingan emosi" }
        ]
      },
      {
        id: `clip-${videoId}-2`,
        title: "⚡ Step-by-Step Edit Subtitle Otomatis Gaya Hormozi",
        hook: "Subtitle warna-warni melayang ini beneran nambah watch time!",
        startTime: 72,
        endTime: 110,
        duration: "00:38",
        viralScore: 94,
        scoreReason: "Tutorial langsung, retensi visual tinggi dengan kata kunci tebal",
        aspectRatio: "9:16",
        category: "💡 Tutorial",
        captions: [
          { id: "c4", start: 0, end: 2.5, text: "Subtitle warna-warni melayang ini...", highlight: "Subtitle warna-warni" },
          { id: "c5", start: 2.5, end: 5.5, text: "...bisa menaikkan retensi penonton hingga 300%!", highlight: "300%" },
          { id: "c6", start: 5.5, end: 9.0, text: "Ganti font ke Montserrat Bold dan beri stroke hitam.", highlight: "Montserrat Bold" }
        ]
      },
      {
        id: `clip-${videoId}-3`,
        title: "🚀 Strategi Monetisasi Konten AI Tanpa Wajah",
        hook: "Gak perlu tampil di depan kamera buat dapet puluhan juta dari Shorts!",
        startTime: 180,
        endTime: 225,
        duration: "00:45",
        viralScore: 91,
        scoreReason: "Topik pencarian tinggi (faceless creator), konversi klik tinggi",
        aspectRatio: "9:16",
        category: "💰 Monetisasi",
        captions: [
          { id: "c7", start: 0, end: 3.0, text: "Gak perlu tampil di depan kamera...", highlight: "Gak perlu tampil" },
          { id: "c8", start: 3.0, end: 6.2, text: "...buat dapetin penghasilan dari Shorts & Reels!", highlight: "Shorts & Reels" },
          { id: "c9", start: 6.2, end: 10.0, text: "Gunakan AI repurposing untuk otomatisasi klip harian.", highlight: "AI repurposing" }
        ]
      },
      {
        id: `clip-${videoId}-4`,
        title: "🧠 Mindset Kreator Konten Konsisten Tanpa Burnout",
        hook: "Jangan buat 1 video untuk 1 platform. 1 video untuk 5 platform!",
        startTime: 280,
        endTime: 315,
        duration: "00:35",
        viralScore: 87,
        scoreReason: "Pesan inspiratif, bagus untuk dibagikan (shareability)",
        aspectRatio: "9:16",
        category: "✨ Motivation",
        captions: [
          { id: "c10", start: 0, end: 2.8, text: "Jangan cuma upload di satu platform aja!", highlight: "satu platform" },
          { id: "c11", start: 2.8, end: 6.0, text: "1 Video panjang bisa dipotong jadi 10 klip Shorts!", highlight: "10 klip Shorts" },
          { id: "c12", start: 6.0, end: 9.5, text: "Kerja lebih pintar dengan bantuan AI automation.", highlight: "AI automation" }
        ]
      }
    ]
  };

  return res.json(fallbackClips);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
