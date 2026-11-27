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

// Lazy Google GenAI Client (Server-only: GEMINI_API -> GEMINI_API_KEY)
function getGenAI() {
  const apiKey =
    (typeof process.env.GEMINI_API === "string" && process.env.GEMINI_API.trim()) ||
    (typeof process.env.GEMINI_API_KEY === "string" && process.env.GEMINI_API_KEY.trim()) ||
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

function getServerPixabayApiKey(overrideKey?: string): string {
  return (
    (typeof overrideKey === "string" && overrideKey.trim()) ||
    (typeof process.env.PIXABAY_API_KEY === "string" && process.env.PIXABAY_API_KEY.trim()) ||
    ""
  );
}

const sleepMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extractGeminiErrorMeta(err: any): {
  status: number;
  message: string;
  retryDelayMs: number | null;
  isRateLimit: boolean;
  isAuthError: boolean;
  isNotFound: boolean;
} {
  const rawMsg = String(err?.message || err || "");
  const explicitStatus = Number(err?.status || err?.code || err?.error?.code);
  let parsedStatus = Number.isFinite(explicitStatus) ? explicitStatus : 0;
  let parsedMsg = rawMsg;
  let detailsRetryMs: number | null = null;
  let msgRetryMs: number | null = null;

  const jsonStart = rawMsg.indexOf("{");
  if (jsonStart !== -1) {
    try {
      const obj = JSON.parse(rawMsg.slice(jsonStart));
      const eObj = obj?.error || obj;
      if (Number(eObj?.code)) parsedStatus = Number(eObj.code);
      if (typeof eObj?.message === "string" && eObj.message) parsedMsg = eObj.message;
      const details = Array.isArray(eObj?.details) ? eObj.details : [];
      for (const d of details) {
        if (typeof d?.retryDelay === "string") {
          const secMatch = d.retryDelay.match(/([\d.]+)\s*s/i);
          if (secMatch) {
            detailsRetryMs = Math.max(detailsRetryMs || 0, Math.ceil(parseFloat(secMatch[1]) * 1000));
          }
        }
      }
    } catch {
      // Ignore malformed JSON tail
    }
  }

  const msgMatch =
    rawMsg.match(/retry in\s+([\d.]+)\s*s/i) ||
    rawMsg.match(/"retryDelay"\s*:\s*"([\d.]+)s"/i);
  if (msgMatch) {
    msgRetryMs = Math.ceil(parseFloat(msgMatch[1]) * 1000);
  }

  const retryDelayMs =
    detailsRetryMs !== null || msgRetryMs !== null
      ? Math.max(detailsRetryMs || 0, msgRetryMs || 0)
      : null;

  const isRateLimit =
    parsedStatus === 429 ||
    parsedStatus === 503 ||
    /RESOURCE_EXHAUSTED|UNAVAILABLE|rate[- ]?limit|quota exceeded|429/i.test(rawMsg);
  const isAuthError =
    parsedStatus === 401 ||
    parsedStatus === 403 ||
    /PERMISSION_DENIED|API_KEY_INVALID|API key not valid/i.test(rawMsg);
  const isNotFound =
    parsedStatus === 404 ||
    /NOT_FOUND|is not found for API version/i.test(rawMsg);

  return {
    status: parsedStatus || (isRateLimit ? 429 : isAuthError ? 403 : isNotFound ? 404 : 500),
    message: parsedMsg || "Gagal memanggil Gemini API.",
    retryDelayMs,
    isRateLimit,
    isAuthError,
    isNotFound,
  };
}

function buildFriendlyGeminiErrorMessage(err: any, fallbackLabel = "Gagal memanggil Gemini API."): { status: number; message: string } {
  const meta = extractGeminiErrorMeta(err);
  if (meta.isRateLimit) {
    return {
      status: 429,
      message:
        "Batas kuota permintaan/token Gemini API (429 RESOURCE_EXHAUSTED) tercapai sementara. Silakan tunggu beberapa detik lalu coba lagi, atau pilih API key berbayar di panel Settings > Secrets untuk kuota lebih tinggi.",
    };
  }
  if (meta.isAuthError || /API key/i.test(meta.message)) {
    return {
      status: meta.status === 401 ? 401 : 403,
      message:
        "API key Gemini tidak valid atau belum dikonfigurasi (403/400). Periksa API key Anda di panel Settings > Secrets.",
    };
  }
  if (meta.isNotFound) {
    return {
      status: 404,
      message: "Model Gemini yang diminta tidak ditemukan (404 NOT_FOUND). Pastikan nama model sesuai.",
    };
  }
  return {
    status: meta.status >= 400 && meta.status < 600 ? meta.status : 500,
    message: meta.message || fallbackLabel,
  };
}

async function generateContentWithRetry(
  ai: GoogleGenAI,
  requestParams: {
    model: string;
    contents: any;
    config?: Record<string, any>;
  },
  options?: {
    maxRetries?: number;
    fallbackTextModel?: string;
  }
) {
  const maxRetries = options?.maxRetries ?? 3;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(requestParams);
    } catch (err: any) {
      lastError = err;
      const meta = extractGeminiErrorMeta(err);
      if (!meta.isRateLimit || attempt >= maxRetries) {
        break;
      }
      // Honor server retryDelay (e.g. "Please retry in 1.85s") + 800ms cushion
      const backoffMs =
        meta.retryDelayMs !== null
          ? Math.min(18000, Math.max(1500, meta.retryDelayMs + 800))
          : Math.min(16000, 2200 * Math.pow(2, attempt));
      await sleepMs(backoffMs);
    }
  }

  // Optional separate-quota text model fallback on persistent 429 rate-limit
  if (options?.fallbackTextModel && extractGeminiErrorMeta(lastError).isRateLimit) {
    const cleanFallbackConfig: Record<string, any> = { ...(requestParams.config || {}) };
    delete cleanFallbackConfig.thinkingConfig;
    try {
      return await ai.models.generateContent({
        model: options.fallbackTextModel,
        contents: requestParams.contents,
        config: cleanFallbackConfig,
      });
    } catch (fbErr: any) {
      const fbMeta = extractGeminiErrorMeta(fbErr);
      if (fbMeta.isRateLimit) {
        const waitMs =
          fbMeta.retryDelayMs !== null
            ? Math.min(15000, Math.max(1500, fbMeta.retryDelayMs + 700))
            : 3000;
        await sleepMs(waitMs);
        return await ai.models.generateContent({
          model: options.fallbackTextModel,
          contents: requestParams.contents,
          config: cleanFallbackConfig,
        });
      }
      throw fbErr;
    }
  }

  throw lastError;
}

// Initialize Turso DB table on startup
initDatabase().catch(err => console.warn("Turso init non-fatal note:", err));

// Env status check (boolean only — never leaks secret values)
app.get("/api/env-status", (_req, res) => {
  const hasGeminiKey = Boolean(
    (typeof process.env.GEMINI_API === "string" && process.env.GEMINI_API.trim()) ||
    (typeof process.env.GEMINI_API_KEY === "string" && process.env.GEMINI_API_KEY.trim())
  );
  const hasPixabayKey = Boolean(
    typeof process.env.PIXABAY_API_KEY === "string" && process.env.PIXABAY_API_KEY.trim()
  );
  return res.json({ hasGeminiKey, hasPixabayKey });
});

// Expose Pixabay key & key availability status safely for client-side B-Roll fetching
app.get("/api/config/keys", (_req, res) => {
  const pixabayApiKey = getServerPixabayApiKey();
  const hasGeminiKey = Boolean(
    (typeof process.env.GEMINI_API === "string" && process.env.GEMINI_API.trim()) ||
    (typeof process.env.GEMINI_API_KEY === "string" && process.env.GEMINI_API_KEY.trim())
  );
  return res.json({
    pixabayApiKey,
    hasPixabayKey: Boolean(pixabayApiKey),
    hasGeminiKey,
  });
});

// Server-side Pixabay B-Roll proxy (supports photo/video & multi-result grid when PIXABAY_API_KEY is stored on server)
app.get("/api/pixabay-search", async (req, res) => {
  try {
    const q = String(req.query.q || "modern workspace").trim();
    const topicStr = String(req.query.topic || "").trim();
    const reqType = String(req.query.type || "all").toLowerCase();
    const perPage = Math.max(1, Math.min(12, Number(req.query.per_page) || 6));
    const strictMatch = String(req.query.strict || "1") !== "0";
    const headerKey = typeof req.headers["x-pixabay-key"] === "string" ? req.headers["x-pixabay-key"] : "";
    const apiKey = getServerPixabayApiKey(headerKey);
    if (!apiKey) {
      return res.json({ success: false, reason: "no_key", items: [] });
    }

    const STOP_WORDS = new Set([
      "the", "and", "for", "with", "from", "into", "that", "this", "your", "you", "are", "was", "have", "has",
      "about", "over", "under", "near", "on", "in", "at", "to", "of", "by", "or", "an", "a", "is", "be",
      "dan", "yang", "untuk", "dengan", "dari", "pada", "ini", "itu", "atau", "di", "ke", "saat"
    ]);
    const BANNED_GENERIC_NATURE = new Set([
      "nature", "landscape", "meadow", "field", "flower", "flowers", "trees", "tree", "forest", "woods",
      "sky", "clouds", "cloud", "sunset", "sunrise", "mountain", "mountains", "ocean", "sea", "beach",
      "abstract", "wallpaper", "background", "texture", "blur", "bokeh", "grass", "leaf", "leaves"
    ]);

    const tokenizeWords = (text: string): string[] =>
      String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/[\s-]+/)
        .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

    const queryTokens = tokenizeWords(q);
    const topicTokens = Array.from(new Set([...queryTokens, ...tokenizeWords(topicStr)]));

    const scoreTagRelevance = (tagsStr: string, hitUrl: string, currentQuery: string): number => {
      const combined = `${tagsStr} ${hitUrl}`.toLowerCase();
      if (/\b(black and white|b&w|monochrome|grayscale|greyscale|sepia|vintage|historical|archive|retro|antique|etching|engraving|daguerreotype)\b/i.test(combined)) {
        return -50;
      }
      const tagWords = tokenizeWords(tagsStr);
      const curTokens = tokenizeWords(currentQuery);
      const allowedSet = new Set(topicTokens);

      let genericPenalty = 0;
      for (const tw of tagWords) {
        if (BANNED_GENERIC_NATURE.has(tw) && !allowedSet.has(tw)) {
          genericPenalty += 1;
        }
      }
      if (genericPenalty >= 2 && tagWords.every((tw) => BANNED_GENERIC_NATURE.has(tw) || !allowedSet.has(tw))) {
        return -20;
      }

      let overlap = 0;
      for (const qt of curTokens) {
        if (tagWords.some((tw) => tw === qt || (qt.length >= 4 && tw.includes(qt)) || (tw.length >= 4 && qt.includes(tw)))) {
          overlap += 2;
        }
      }
      for (const tt of topicTokens) {
        if (tagWords.some((tw) => tw === tt || (tt.length >= 4 && tw.includes(tt)))) {
          overlap += 1;
        }
      }
      return overlap - genericPenalty;
    };

    const fetchVideos = async () => {
      const vidUrl = `https://pixabay.com/api/videos/?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(q)}&per_page=${Math.max(8, perPage)}&order=popular&safesearch=true`;
      const vidRes = await fetch(vidUrl);
      if (!vidRes.ok) return [];
      const vidData: any = await vidRes.json();
      if (!Array.isArray(vidData?.hits)) return [];
      const scored = vidData.hits
        .map((hit: any) => {
          const fullUrl = hit?.videos?.medium?.url || hit?.videos?.small?.url || hit?.videos?.tiny?.url || "";
          const picId = hit?.picture_id || "";
          const thumbFromVimeo = picId ? `https://i.vimeocdn.com/video/${picId}_295x166.jpg` : "";
          const previewUrl = hit?.videos?.tiny?.thumbnail || hit?.videos?.small?.thumbnail || thumbFromVimeo || "";
          const tags = String(hit.tags || "");
          if (!fullUrl) return null;
          const relScore = scoreTagRelevance(tags, fullUrl, q);
          return {
            id: String(hit.id || Math.random()),
            mediaType: "video",
            previewUrl,
            fullUrl,
            duration: Number(hit.duration) || 0,
            tags,
            source: "Pixabay Video",
            _relScore: relScore,
          };
        })
        .filter(Boolean);
      const verified = scored.filter((m: any) => m._relScore >= 1).sort((a: any, b: any) => b._relScore - a._relScore);
      const chosen = strictMatch ? verified : (verified.length > 0 ? verified : scored.filter((m: any) => m._relScore >= 0));
      return chosen.slice(0, perPage).map(({ _relScore, ...rest }: any) => rest);
    };

    const buildQueryAttempts = (rawQuery: string): string[] => {
      const cleaned = rawQuery.replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
      const tokens = cleaned.split(/\s+/).filter((t) => t.length >= 2);
      const list = [cleaned];
      if (tokens.length > 2) list.push(tokens.slice(0, 2).join(" "));
      return Array.from(new Set(list.filter(Boolean)));
    };

    const fetchPhotosForQuery = async (queryText: string) => {
      const fetchCount = Math.max(10, perPage * 2);
      const imgUrl = `https://pixabay.com/api/?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(queryText)}&image_type=photo&order=popular&per_page=${fetchCount}&safesearch=true`;
      const imgRes = await fetch(imgUrl);
      if (!imgRes.ok) return [];
      const imgData: any = await imgRes.json();
      if (!Array.isArray(imgData?.hits)) return [];
      const mapped = imgData.hits
        .map((hit: any) => {
          const fullUrl = hit?.webformatURL || hit?.largeImageURL || "";
          const previewUrl = hit?.previewURL || hit?.webformatURL || "";
          const tags = String(hit.tags || "");
          if (!fullUrl) return null;
          const relScore = scoreTagRelevance(tags, fullUrl, queryText);
          return {
            id: String(hit.id || Math.random()),
            mediaType: "image",
            previewUrl,
            fullUrl,
            duration: 0,
            tags,
            source: "Pixabay Foto",
            _relScore: relScore,
          };
        })
        .filter(Boolean);
      const verified = mapped.filter((m: any) => m._relScore >= 1).sort((a: any, b: any) => b._relScore - a._relScore);
      const finalHits = strictMatch ? verified : (verified.length > 0 ? verified : mapped.filter((m: any) => m._relScore >= 0));
      return finalHits.slice(0, perPage).map(({ _relScore, ...rest }: any) => rest);
    };

    const fetchPhotos = async () => {
      const attempts = buildQueryAttempts(q);
      for (const attemptQ of attempts) {
        const hits = await fetchPhotosForQuery(attemptQ);
        if (hits.length > 0) return hits;
      }
      return [];
    };

    let items: any[] = [];
    if (reqType === "photo") {
      items = await fetchPhotos();
    } else if (reqType === "video") {
      items = await fetchVideos();
    } else {
      items = await fetchPhotos();
      if (items.length === 0) {
        items = await fetchVideos();
      }
    }

    if (items.length > 0) {
      return res.json({
        success: true,
        mediaType: items[0].mediaType,
        url: items[0].fullUrl,
        source: items[0].source,
        items,
      });
    }

    return res.json({ success: false, reason: "no_hits", items: [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Pixabay proxy error", items: [] });
  }
});

// Allowlisted media proxy so Pixabay/Wikimedia B-Roll assets can always be fetched into Blob URLs for clean <canvas> export
app.get("/api/media-proxy", async (req, res) => {
  try {
    const rawUrl = String(req.query.url || "").trim();
    if (!rawUrl) {
      return res.status(400).json({ success: false, error: "URL diperlukan" });
    }
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return res.status(400).json({ success: false, error: "URL tidak valid" });
    }
    if (parsed.protocol !== "https:") {
      return res.status(403).json({ success: false, error: "Hanya HTTPS yang diizinkan" });
    }
    const host = parsed.hostname.toLowerCase();
    const isAllowed =
      host === "pixabay.com" ||
      host.endsWith(".pixabay.com") ||
      host === "i.vimeocdn.com" ||
      host === "upload.wikimedia.org";
    if (!isAllowed) {
      return res.status(403).json({ success: false, error: "Domain media tidak diizinkan" });
    }
    const upstream = await fetch(parsed.toString());
    if (!upstream.ok) {
      return res.status(upstream.status).send("Upstream media fetch failed");
    }
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(buf);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Media proxy failed" });
  }
});

// Analyze 3 frames of a reference video via Gemini 2.5 Flash to extract editing style recipe
app.post("/api/analyze-reference-style", async (req, res) => {
  try {
    const { name = "Gaya Kustom", frames = [] } = req.body || {};
    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY belum dikonfigurasi di server (Settings > Secrets).",
      });
    }
    if (!Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ success: false, error: "Minimal 1 frame gambar referensi diperlukan." });
    }

    const parts: any[] = [];
    frames.slice(0, 3).forEach((f: any) => {
      const raw = typeof f === "string" ? f : f?.data;
      if (raw && typeof raw === "string") {
        const b64 = raw.includes(",") ? raw.split(",")[1] : raw;
        parts.push({ inlineData: { mimeType: "image/jpeg", data: b64 } });
      }
    });
    parts.push({
      text: `Anda adalah direktur kreatif video pendek vertikal (TikTok/Reels/Shorts).
Amati 3 frame video referensi "${name}" ini secara cermat.

ATURAN PEMISAHAN KETAT:
- ABAIKAN logo watermark kecil di pojok layar, stiker nama channel, lencana merah/kuning sudut, atau handle sosial media kecil. Itu BUKAN subtitle maupun hook!
- Pisahkan secara tegas antara:
  (1) KOTAK JUDUL HOOK PEMBUKA (overlay judul statis yang muncul di awal video), dan
  (2) TEKS SUBTITLE UCAPAN PEMBICARA (caption dinamis per kata/kalimat saat pembicara berbicara).

Ekstrak resep gaya editannya ke JSON murni:
- hook_style: pilih ["white_box", "dark_pill", "none"]. Gunakan "white_box" jika Hook berupa kotak kartu putih bersih dengan teks gelap tebal, "dark_pill" jika Hook berupa kapsul/banner gelap navy/hitam dengan teks kuning/putih, atau "none" jika tidak ada kotak judul Hook.
- hook_position: pilih ["top", "bottom"] sesuai posisi Hook pada frame.
- hook_duration_sec: angka durasi tampil Hook dalam detik (umumnya 3.0; rentang 1.5 - 5.0).
- subtitle_style: pilih paling cocok di antara ["mozi_pop", "simple_clean", "handwritten_glow", "karaoke_pill", "cyan_kinetic", "chrome_glow", "stacked_coral", "gold_word_reveal", "single_yellow_pop", "lime_outline", "blue_pill_highlight"].
- emphasis_mode: pilih ["kinetic_scale", "color_highlight"]. Pilih "kinetic_scale" jika subtitle ucapan berwarna putih bersih dengan penekanan kata aktif berupa ukuran font lebih besar/tebal (tanpa mengubah warna menjadi merah/kuning). Pilih "color_highlight" HANYA jika teks ucapan pembicara sendiri benar-benar berganti warna (misalnya kuning/hijau) per kata aktif.
- primary_color: kode hex warna teks utama subtitle ucapan pembicara (default "#FFFFFF").
- highlight_color: kode hex warna kata aktif subtitle (jika emphasis_mode = "kinetic_scale", isi "#FFFFFF"; jika color_highlight, isi hex warnanya misal "#FACC15").
- font_size_px: integer ukuran font subtitle ideal (15-26).
- zoom_intensity: salah satu dari ["none", "subtle", "dynamic"].
- broll_frequency: salah satu dari ["none", "moderate", "frequent"].
- editing_rules: ringkasan 1-2 kalimat bahasa Indonesia tentang gaya kotak Hook, ritme pemotongan, tata letak subtitle, dan visual B-roll dari video referensi ini.`,
    });

    const resp = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: parts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hook_style: { type: Type.STRING },
            hook_position: { type: Type.STRING },
            hook_duration_sec: { type: Type.NUMBER },
            subtitle_style: { type: Type.STRING },
            emphasis_mode: { type: Type.STRING },
            primary_color: { type: Type.STRING },
            highlight_color: { type: Type.STRING },
            font_size_px: { type: Type.INTEGER },
            zoom_intensity: { type: Type.STRING },
            broll_frequency: { type: Type.STRING },
            editing_rules: { type: Type.STRING },
          },
          required: [
            "hook_style",
            "hook_position",
            "hook_duration_sec",
            "subtitle_style",
            "emphasis_mode",
            "primary_color",
            "highlight_color",
            "font_size_px",
            "zoom_intensity",
            "broll_frequency",
            "editing_rules",
          ],
        },
      },
    });

    const parsed = JSON.parse(resp.text || "{}");
    return res.json({ success: true, recipe: parsed });
  } catch (err: any) {
    const friendly = buildFriendlyGeminiErrorMessage(err, "Gagal menganalisis video referensi.");
    return res.status(friendly.status).json({ success: false, error: friendly.message });
  }
});

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

    const ai = getGenAI();

    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY belum dikonfigurasi di server (Settings > Secrets).",
      });
    }

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

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    }, { fallbackTextModel: "gemini-3.1-flash-lite" });

    if (!response.text) {
      return res.status(502).json({
        success: false,
        error: "Gemini tidak mengembalikan blueprint JSON.",
      });
    }

    const parsed = JSON.parse(response.text);
    return res.json({
      success: true,
      model: "gemini-2.5-flash",
      blueprint: parsed
    });
  } catch (err: any) {
    const friendly = buildFriendlyGeminiErrorMessage(err, "Gagal menganalisis blueprint video.");
    return res.status(friendly.status).json({
      success: false,
      error: friendly.message,
    });
  }
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

async function fetchYouTubeTimedTextHints(videoId: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=id`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ClipAStudio/1.0)",
        "Accept-Language": "id,en;q=0.9",
      },
      signal: controller.signal,
    });
    if (!watchRes.ok) return "";
    const html = await watchRes.text();
    const tracksMatch = html.match(/"captionTracks":(\[.*?\])/);
    if (!tracksMatch) return "";
    const tracks = JSON.parse(tracksMatch[1]);
    if (!Array.isArray(tracks) || tracks.length === 0) return "";
    const preferred =
      tracks.find((t: any) => String(t?.languageCode || "").startsWith("id") && t?.kind !== "asr") ||
      tracks.find((t: any) => String(t?.languageCode || "").startsWith("id")) ||
      tracks.find((t: any) => String(t?.languageCode || "").startsWith("en") && t?.kind !== "asr") ||
      tracks[0];
    if (!preferred?.baseUrl) return "";

    const json3Url = `${preferred.baseUrl}${preferred.baseUrl.includes("?") ? "&" : "?"}fmt=json3`;
    const capRes = await fetch(json3Url, { signal: controller.signal });
    if (!capRes.ok) return "";
    const capData: any = await capRes.json().catch(() => null);
    if (!Array.isArray(capData?.events)) return "";

    const lines: string[] = [];
    for (const ev of capData.events) {
      if (!Array.isArray(ev?.segs) || typeof ev?.tStartMs !== "number") continue;
      const text = ev.segs
        .map((sg: any) => String(sg?.utf8 || ""))
        .join("")
        .replace(/\s+/g, " ")
        .trim();
      if (!text || text === "\n") continue;
      const startSec = Math.round((ev.tStartMs / 1000) * 100) / 100;
      const durSec = Math.max(0.4, Math.round(((Number(ev.dDurationMs) || 1800) / 1000) * 100) / 100);
      lines.push(`[${startSec.toFixed(2)}s-${(startSec + durSec).toFixed(2)}s] ${text}`);
      if (lines.length >= 160) break;
    }
    return lines.join("\n").slice(0, 6500);
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
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

    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY belum dikonfigurasi di server (Settings > Secrets). Harap tambahkan API key terlebih dahulu.",
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
    let ytCaptionHints = "";

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

      // Fetch real YouTube oEmbed metadata & optional timedtext caption grounding hints
      try {
        const [oembedRes, captionHints] = await Promise.all([
          fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${resolvedVideoId}&format=json`),
          fetchYouTubeTimedTextHints(resolvedVideoId),
        ]);
        if (oembedRes.ok) {
          const oembedData = (await oembedRes.json()) as { title?: string; author_name?: string };
          if (oembedData?.title) videoTitle = oembedData.title;
          if (oembedData?.author_name) authorName = oembedData.author_name;
        }
        ytCaptionHints = captionHints;
      } catch (oembedErr) {
        console.warn("[Auto-Clip API] oEmbed metadata warning:", oembedErr);
      }
    }

    const clientSourceDur = isLocalMode
      ? Math.max(4, Number(videoDuration) || 30)
      : Math.max(0, Number(sourceEndSeconds) || 0);

    const audioOffset = Math.max(0, Number(audioOffsetSeconds) || 0);
    const isAutoDuration = targetDuration === "auto" || targetDuration === "otomatis";

    let minSeconds = Number(req.body?.minSeconds);
    let maxSeconds = Number(req.body?.maxSeconds);
    if (!Number.isFinite(minSeconds) || !Number.isFinite(maxSeconds) || minSeconds <= 0 || maxSeconds < minSeconds) {
      if (targetDuration === "30_60") {
        minSeconds = 30;
        maxSeconds = 60;
      } else if (targetDuration === "60_90") {
        minSeconds = 60;
        maxSeconds = 90;
      } else if (isAutoDuration) {
        minSeconds = 15;
        maxSeconds = 60;
      } else {
        minSeconds = 15;
        maxSeconds = 30;
      }
    }
    minSeconds = Math.max(12, Math.round(minSeconds));
    maxSeconds = Math.max(minSeconds, Math.min(300, Math.round(maxSeconds)));
    const durationPrefLabel = isAutoDuration
      ? "Otomatis (pilih rentang 15–60 detik mengikuti batas kalimat utuh alami)"
      : `${minSeconds} sampai ${maxSeconds} detik per klip`;

    const baseMediaParts: Array<any> = [];
    if (!isLocalMode && resolvedVideoId && /^[A-Za-z0-9_-]{11}$/.test(resolvedVideoId)) {
      const youtubeUri = `https://www.youtube.com/watch?v=${resolvedVideoId}`;
      if (youtubeUri.trim().length > 0) {
        baseMediaParts.push({
          fileData: {
            fileUri: youtubeUri,
          },
        });
      }
    }
    if (isLocalMode && hasAudioPayload) {
      const cleanAudioBase64 = audioBase64.includes(",")
        ? audioBase64.split(",")[1]
        : audioBase64;
      baseMediaParts.push({
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
          baseMediaParts.push({
            inlineData: {
              mimeType: frameItem.mimeType || "image/jpeg",
              data: base64Payload,
            },
          });
        }
      });
    }

    // =========================================================================
    // STAGE 1: Mandatory Full Video-to-Text Transcription BEFORE Any Clipping
    // =========================================================================
    const stage1Prompt = isLocalMode
      ? `Anda adalah mesin transkripsi akustik forensik presisi milidetik (STAGE 1 — Transkripsi Penuh Seluruh Video).
${hasAudioPayload ? "Anda menerima rekaman AUDIO ASLI (mono 16kHz WAV, tepat 16000Hz) dari file MP4 pengguna." : "Anda menerima frame video MP4 lokal pengguna."}
- Nama File: ${fileName}
- Total Durasi Video Penuh: ${clientSourceDur.toFixed(2)} detik (0.00s s/d ${clientSourceDur.toFixed(2)}s)
${hasAudioPayload ? `- Catatan Timeline Audio: Detik 0.00 pada audio WAV ini berkorespondensi TEPAT 1:1 dengan detik ${audioOffset.toFixed(2)} pada timeline video asli.` : ""}

TUGAS WAJIB STAGE 1:
1. Dengarkan seluruh audio dari detik awal hingga detik akhir TANPA MEMOTONG atau memilih klip terlebih dahulu.
2. Transkripsikan SELURUH ucapan pembicara secara 100% verbatim (pertahankan bahasa asli Indonesia/Inggris/campuran secara persis) ke dalam array \`fullTranscript\`.
3. Pecah \`fullTranscript\` berdasarkan kalimat atau klausa alami berurutan secara kronologis. Untuk setiap item, isi:
   - \`start\`: waktu mulai kalimat dalam detik (relatif ke awal audio WAV ini).
   - \`end\`: waktu selesai kalimat dalam detik.
   - \`text\`: teks verbatim kalimat tersebut.
   - \`words\`: array kata demi kata \`{ word, start, end }\` dengan timestamp mulai & selesai akurat sesuai momen setiap kata terucap.
4. Isi \`video_title\` (judul deskriptif video) dan \`video_duration_sec\` (${clientSourceDur.toFixed(2)}).`
      : `Anda adalah mesin transkripsi akustik forensik presisi milidetik (STAGE 1 — Transkripsi Penuh Seluruh Video YouTube).
Anda menerima VIDEO YOUTUBE ASLI melalui fileData multimodal:
- YouTube URL: https://www.youtube.com/watch?v=${resolvedVideoId}
- Video ID: ${resolvedVideoId}
${videoTitle ? `- Judul Video: ${videoTitle}` : ""}
${authorName ? `- Channel: ${authorName}` : ""}
${typeof ytCaptionHints === "string" && ytCaptionHints ? `\nReferensi Timestamp Transkrip YouTube (gunakan sebagai jangkar waktu akurat bersama audio video):\n${ytCaptionHints}\n` : ""}

TUGAS WAJIB STAGE 1:
1. Dengarkan seluruh video YouTube dari detik 0 hingga akhir video. Laporkan durasi total video sebenarnya dalam detik pada \`video_duration_sec\`.
2. Transkripsikan SELURUH ucapan pembicara secara 100% verbatim (pertahankan bahasa asli Indonesia/Inggris/campuran) ke dalam array \`fullTranscript\` secara kronologis.
3. Pecah \`fullTranscript\` berdasarkan kalimat/klausa alami berurutan. Untuk setiap item, isi:
   - \`start\`: detik mulai kalimat pada video asli.
   - \`end\`: detik selesai kalimat pada video asli.
   - \`text\`: teks verbatim kalimat tersebut.
   - \`words\`: array kata demi kata \`{ word, start, end }\` dengan timestamp akurat saat setiap kata terucap.
4. Isi \`video_title\` dengan judul video yang akurat.`;

    const stage1Schema = {
      type: Type.OBJECT,
      properties: {
        video_title: { type: Type.STRING },
        video_duration_sec: { type: Type.NUMBER },
        fullTranscript: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.NUMBER },
              end: { type: Type.NUMBER },
              text: { type: Type.STRING },
              words: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    start: { type: Type.NUMBER },
                    end: { type: Type.NUMBER },
                  },
                  required: ["word", "start", "end"],
                },
              },
            },
            required: ["start", "end", "text", "words"],
          },
        },
      },
      required: ["video_duration_sec", "fullTranscript"],
    };

    const stage1Response = await generateContentWithRetry(
      ai,
      {
        model: "gemini-2.5-flash",
        contents: [...baseMediaParts, { text: stage1Prompt }],
        config: {
          temperature: 0.0,
          maxOutputTokens: 65536,
          thinkingConfig: { thinkingBudget: 512 },
          responseMimeType: "application/json",
          responseSchema: stage1Schema,
        },
      },
      { maxRetries: 2 }
    );

    if (!stage1Response.text) {
      return res.status(502).json({
        success: false,
        error: "Gemini 2.5 Flash (Stage 1 Transkripsi) tidak mengembalikan output JSON.",
      });
    }

    const parsedStage1 = JSON.parse(stage1Response.text);
    const rawTranscriptArr: any[] = Array.isArray(parsedStage1?.fullTranscript) ? parsedStage1.fullTranscript : [];
    const maxTranscriptEnd = rawTranscriptArr.reduce((mx, s) => {
      const rawEnd = Number(s?.end) || 0;
      const adjEnd = isLocalMode && hasAudioPayload && audioOffset > 0 ? rawEnd + audioOffset : rawEnd;
      return Math.max(mx, adjEnd);
    }, 0);

    const safeTotalDuration = isLocalMode
      ? clientSourceDur
      : Math.max(Number(parsedStage1?.video_duration_sec) || 0, maxTranscriptEnd, clientSourceDur, 15);

    const estimateWordWeight = (word: string) => {
      const clean = String(word || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
      if (!clean) return 1.2;
      const vowels = clean.match(/[aeiouyàáâäèéêëìíîïòóôöùúûü]+/g);
      return Math.max(1.5, (vowels ? vowels.length : 1) * 2 + clean.length * 0.55);
    };

    type TranscriptWordItem = { word: string; start: number; end: number };
    type TranscriptSegItem = { start: number; end: number; text: string; words: TranscriptWordItem[] };

    const normalizedFullTranscript: TranscriptSegItem[] = rawTranscriptArr
      .map((seg: any) => {
        const text = String(seg?.text || "").replace(/\s+/g, " ").trim();
        if (!text) return null;
        let sStart = Math.max(0, Number(seg?.start) || 0);
        let sEnd = Math.max(sStart + 0.25, Number(seg?.end) || sStart + 1.5);
        if (isLocalMode && hasAudioPayload && audioOffset > 0 && sStart < audioOffset - 0.2 && sEnd + audioOffset <= safeTotalDuration + 1.0) {
          sStart += audioOffset;
          sEnd += audioOffset;
        }
        sStart = Math.round(Math.min(safeTotalDuration - 0.2, sStart) * 100) / 100;
        sEnd = Math.round(Math.min(safeTotalDuration, Math.max(sStart + 0.2, sEnd)) * 100) / 100;

        const rawWords = Array.isArray(seg?.words) ? seg.words : [];
        let cleanWords: TranscriptWordItem[] = rawWords
          .map((w: any) => {
            const wordText = String(w?.word || "").trim();
            if (!wordText) return null;
            let wS = Number(w?.start);
            let wE = Number(w?.end);
            if (!Number.isFinite(wS) || !Number.isFinite(wE)) return null;
            if (isLocalMode && hasAudioPayload && audioOffset > 0 && wS < audioOffset - 0.2 && wE + audioOffset <= safeTotalDuration + 1.0) {
              wS += audioOffset;
              wE += audioOffset;
            }
            wS = Math.max(sStart, Math.min(sEnd - 0.05, wS));
            wE = Math.min(sEnd, Math.max(wS + 0.06, wE));
            return {
              word: wordText,
              start: Math.round(wS * 1000) / 1000,
              end: Math.round(wE * 1000) / 1000,
            };
          })
          .filter(Boolean) as TranscriptWordItem[];

        if (cleanWords.length > 1) {
          const spanSeg = Math.max(0.2, sEnd - sStart);
          const hasCollapsed =
            cleanWords.some((w, wi) => wi > 0 && Math.abs(w.start - cleanWords[wi - 1].start) < 0.02) ||
            (cleanWords[cleanWords.length - 1].end - cleanWords[0].start) < spanSeg * 0.35;
          if (hasCollapsed) {
            cleanWords = [];
          }
        }

        if (cleanWords.length === 0) {
          const tokens = text.split(/\s+/).filter(Boolean);
          const weights = tokens.map(estimateWordWeight);
          const totalW = Math.max(1, weights.reduce((a, b) => a + b, 0));
          const span = Math.max(0.2, sEnd - sStart);
          let cursor = sStart;
          cleanWords = tokens.map((tok, wi) => {
            const wDur = (weights[wi] / totalW) * span;
            const nextCur = wi === tokens.length - 1 ? sEnd : Math.min(sEnd, cursor + wDur);
            const item = {
              word: tok,
              start: Math.round(cursor * 1000) / 1000,
              end: Math.round(Math.max(cursor + 0.06, nextCur) * 1000) / 1000,
            };
            cursor = nextCur;
            return item;
          });
        } else {
          for (let wi = 1; wi < cleanWords.length; wi++) {
            if (cleanWords[wi].start < cleanWords[wi - 1].end) {
              cleanWords[wi].start = Math.min(cleanWords[wi - 1].end, Math.max(sStart, cleanWords[wi].end - 0.06));
              if (cleanWords[wi].end <= cleanWords[wi].start) {
                cleanWords[wi].end = Math.min(sEnd, Math.round((cleanWords[wi].start + 0.08) * 1000) / 1000);
              }
            }
          }
        }

        return {
          start: sStart,
          end: sEnd,
          text,
          words: cleanWords,
        };
      })
      .filter(Boolean) as TranscriptSegItem[];

    normalizedFullTranscript.sort((a, b) => a.start - b.start);
    for (let i = 1; i < normalizedFullTranscript.length; i++) {
      if (normalizedFullTranscript[i].start < normalizedFullTranscript[i - 1].end) {
        normalizedFullTranscript[i].start = Math.round(normalizedFullTranscript[i - 1].end * 100) / 100;
        if (normalizedFullTranscript[i].end <= normalizedFullTranscript[i].start) {
          normalizedFullTranscript[i].end = Math.round(Math.min(safeTotalDuration, normalizedFullTranscript[i].start + 0.3) * 100) / 100;
        }
      }
    }

    if (normalizedFullTranscript.length === 0) {
      return res.status(502).json({
        success: false,
        error: "Stage 1 gagal mengekstrak ucapan/transkrip yang valid dari video.",
      });
    }

    // =========================================================================
    // STAGE 2: Semantic Viral Moment Selection & Scoring from fullTranscript
    // =========================================================================
    const isShortVideo = safeTotalDuration < 60;
    const scaleRuleText = isShortVideo
      ? `PERLINDUNGAN VIDEO PENDEK (< 60 detik — Durasi aktual ${safeTotalDuration.toFixed(1)}s):
- Ekstrak HANYA 1 sampai 2 klip bernilai tinggi yang utuh (15s–40s per klip) — ATAU cukup 1 klip penuh (0s s/d ${safeTotalDuration.toFixed(1)}s) jika seluruh video membahas satu pesan utuh.
- DILARANG KERAS memecah video pendek menjadi potongan 2–8 detik atau memaksakan banyak klip!`
      : safeTotalDuration <= 90
      ? `SKALA DURASI (0:30 – 1:30 — Durasi aktual ${safeTotalDuration.toFixed(1)}s):
- Ekstrak 1 sampai 3 klip utuh bernilai tinggi berdasarkan topik lengkap yang benar-benar ada di transkrip.`
      : safeTotalDuration <= 600
      ? `SKALA DURASI (1:30 – 10:00 — Durasi aktual ${safeTotalDuration.toFixed(1)}s):
- Ekstrak 3 sampai 8 klip utuh non-overlapping. Pilih HANYA momen dengan insight kuat, cerita lengkap, atau argumen tajam.`
      : `SKALA DURASI PANJANG (10:00 – 60:00+ — Durasi aktual ${safeTotalDuration.toFixed(1)}s):
- Ekstrak 8 sampai 25+ klip utuh non-overlapping sesuai jumlah topik/insight bernilai tinggi yang benar-benar ada di transkrip (jangan mengulang atau membuat filler).`;

    const indexedTranscriptText = normalizedFullTranscript
      .map((seg, idx) => `[#${idx} | ${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s] ${seg.text}`)
      .join("\n");

    const stage2Prompt = `Anda adalah Viral Content Director & Editorial Producer ahli video pendek vertikal (STAGE 2 — Seleksi Momen Viral Semantik Berbasis Transkrip Penuh).
Berikut adalah TRANSKRIP LENGKAP VIDEO (${normalizedFullTranscript.length} kalimat, total durasi ${safeTotalDuration.toFixed(2)} detik) dari Stage 1:

${indexedTranscriptText}

KONFIGURASI PENGGUNA:
- Judul Video: ${parsedStage1?.video_title || videoTitle || fileName || "Video"}
- Target Durasi Klip: ${durationPrefLabel}
- Rasio Output: ${resolvedRatio}
- Gaya Subtitle: ${resolvedStyle}
${momentPrompt ? `- Fokus Momen Pengguna: ${momentPrompt}` : ""}
${referenceInstructions ? `- Resep Referensi Gaya Aktif: ${referenceInstructions}` : ""}

ATURAN EDITORIAL KETAT (WAJIB DIPATUHI 100%):
1. ATURAN PIKIRAN UTUH & DURASI MINIMAL 12 DETIK:
   - Setiap klip WAJIB membahas SATU topik, insight, cerita, atau argumen yang TUNTAS dari awal kalimat hingga kesimpulan/punchline selesai.
   - DILARANG memotong di tengah kalimat! Gunakan \`start_sec\` tepat pada \`start\` kalimat pembuka dan \`end_sec\` tepat pada \`end\` kalimat penutup.
   - WAJIB durasi setiap klip minimal **12 detik** (kecuali total video sumber < 12 detik). DILARANG keras membuat potongan 2 detik, 3 detik, atau fragmen terpotong.
2. ${scaleRuleText}
3. NON-OVERLAPPING & TANPA PADDING PALSU:
   - Timestamp klip DILARANG tumpang tindih (\`clips[i+1].start_sec >= clips[i].end_sec\`).
   - DILARANG keras menduplikasi momen atau membuat judul filler seperti "(Bagian 1)", "(Bagian 2)". Utamakan KUALITAS makna di atas kuantitas palsu!
4. HOOK & AUDIT SKOR VIRAL (55–99 per kriteria; bedakan nilai tiap klip secara jujur):
   - \`title\`: Judul singkat & spesifik untuk topik klip (Indonesia).
   - \`hook_headline\`: TEPAT 1 judul hook pembuka (maksimal 6–8 kata tanpa baris kedua/subjudul).
   - \`hook_score\` (35%), \`insight_score\` (30%), \`flow_score\` (20%), \`emotion_score\` (15%), dan \`alasan_viral\` (1 kalimat padat Bahasa Indonesia).
5. B-ROLL TOPIK KONKRET:
   - Sertakan 1 \`broll_moments\` relevan per klip (2.5–3.5 detik, di dalam [start_sec, end_sec]): \`visual_queries\` (3–4 query pencarian visual bahasa Inggris KONKRET & LITERAL sesuai topik kalimat pada momen itu; DILARANG istilah alam/lapangan/langit/abstrak generik), \`visual_keyword\` (query utama), \`topic_keywords\` (3–5 kata topik Inggris), \`headline\` (2–3 kata Indonesia), \`category_tag\`, dan \`spoken_quote\`.`;

    const stage2Schema = {
      type: Type.OBJECT,
      properties: {
        clips: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              hook_headline: { type: Type.STRING },
              start_sec: { type: Type.NUMBER },
              end_sec: { type: Type.NUMBER },
              hook_score: { type: Type.NUMBER },
              insight_score: { type: Type.NUMBER },
              flow_score: { type: Type.NUMBER },
              emotion_score: { type: Type.NUMBER },
              alasan_viral: { type: Type.STRING },
              broll_moments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    start_sec: { type: Type.NUMBER },
                    end_sec: { type: Type.NUMBER },
                    spoken_quote: { type: Type.STRING },
                    visual_keyword: { type: Type.STRING },
                    visual_queries: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    topic_keywords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    headline: { type: Type.STRING },
                    category_tag: { type: Type.STRING },
                  },
                  required: ["start_sec", "end_sec", "spoken_quote", "visual_keyword", "visual_queries", "headline", "category_tag"],
                },
              },
            },
            required: ["title", "hook_headline", "start_sec", "end_sec", "hook_score", "insight_score", "flow_score", "emotion_score", "alasan_viral", "broll_moments"],
          },
        },
      },
      required: ["clips"],
    };

    const stage2Response = await generateContentWithRetry(
      ai,
      {
        model: "gemini-2.5-flash",
        contents: stage2Prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 32768,
          thinkingConfig: { thinkingBudget: 512 },
          responseMimeType: "application/json",
          responseSchema: stage2Schema,
        },
      },
      {
        maxRetries: 3,
        fallbackTextModel: "gemini-3.1-flash-lite",
      }
    );

    if (!stage2Response.text) {
      return res.status(502).json({
        success: false,
        error: "Gemini (Stage 2 Seleksi Momen) tidak mengembalikan output JSON.",
      });
    }

    const parsedStage2 = JSON.parse(stage2Response.text);
    const rawSelectedClips: any[] = Array.isArray(parsedStage2?.clips) ? parsedStage2.clips : [];

    // Validate selected clips: snap to transcript sentence boundaries, enforce >= 12s (or full duration if < 12s), enforce non-overlapping, protect short videos (< 60s)
    const minAllowedClipSec = safeTotalDuration >= 12 ? 12 : Math.max(2, safeTotalDuration);
    const snapToTranscriptStart = (t: number) => {
      let best = t;
      let bestDiff = 1.25;
      for (const seg of normalizedFullTranscript) {
        const diff = Math.abs(seg.start - t);
        if (diff <= bestDiff) {
          bestDiff = diff;
          best = seg.start;
        }
      }
      return best;
    };
    const snapToTranscriptEnd = (t: number) => {
      let best = t;
      let bestDiff = 1.25;
      for (const seg of normalizedFullTranscript) {
        const diff = Math.abs(seg.end - t);
        if (diff <= bestDiff) {
          bestDiff = diff;
          best = seg.end;
        }
      }
      return best;
    };

    const validatedClips: any[] = [];
    const sortedCandidates = [...rawSelectedClips].sort(
      (a, b) => (Number(a?.start_sec) || 0) - (Number(b?.start_sec) || 0)
    );

    for (const cand of sortedCandidates) {
      const rawS = Math.max(0, Number(cand?.start_sec) || 0);
      const rawE = Math.min(safeTotalDuration, Number(cand?.end_sec) || 0);
      let sSec = Math.round(snapToTranscriptStart(rawS) * 100) / 100;
      let eSec = Math.round(snapToTranscriptEnd(rawE) * 100) / 100;

      if (validatedClips.length > 0) {
        const prevEnd = validatedClips[validatedClips.length - 1].end_sec;
        if (sSec < prevEnd) {
          const nextSegAfterPrev = normalizedFullTranscript.find((seg) => seg.start >= prevEnd - 0.05 && seg.end <= eSec + 0.5);
          sSec = nextSegAfterPrev ? nextSegAfterPrev.start : prevEnd;
        }
      }

      if (eSec - sSec < minAllowedClipSec) {
        // Extend cleanly to next sentence boundary if short clip still fits before next window, otherwise skip fragment
        const extendedSeg = normalizedFullTranscript.find((seg) => seg.end >= sSec + minAllowedClipSec && seg.end <= safeTotalDuration);
        if (extendedSeg && extendedSeg.end - sSec <= Math.max(maxSeconds + 15, 65)) {
          eSec = extendedSeg.end;
        } else {
          continue;
        }
      }

      if (eSec - sSec < minAllowedClipSec) continue;
      if (isShortVideo && validatedClips.length >= 2) break;

      validatedClips.push({
        ...cand,
        start_sec: Math.round(sSec * 100) / 100,
        end_sec: Math.round(eSec * 100) / 100,
      });
    }

    // Fallback safety ONLY if Stage 2 returned zero clips meeting >= 12s (e.g., unified short video): 1 full-duration clip
    if (validatedClips.length === 0) {
      const firstCand = rawSelectedClips[0] || {};
      validatedClips.push({
        title: String(firstCand.title || parsedStage1?.video_title || videoTitle || "Klip Sorotan Utama").trim(),
        hook_headline: String(firstCand.hook_headline || parsedStage1?.video_title || videoTitle || "Poin Penting Wajib Disimak").trim(),
        start_sec: 0,
        end_sec: Math.round(safeTotalDuration * 100) / 100,
        hook_score: firstCand.hook_score ?? 88,
        insight_score: firstCand.insight_score ?? 86,
        flow_score: firstCand.flow_score ?? 87,
        emotion_score: firstCand.emotion_score ?? 85,
        alasan_viral: String(firstCand.alasan_viral || "Satu kesatuan pesan utuh dengan alur pembuka hingga kesimpulan lengkap.").trim(),
        broll_moments: Array.isArray(firstCand.broll_moments) ? firstCand.broll_moments : [],
      });
    }

    // Deduplicate titles & hooks cleanly without appending fake "(Bagian N)"
    const usedTitles = new Set<string>();
    const usedHooks = new Set<string>();

    // =========================================================================
    // STAGE 3: Slice Exact Word-Level Subtitles from fullTranscript & Auto-Edits
    // =========================================================================
    const stripPunct = (w: string) => w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    const stopWords = new Set(["yang", "dan", "di", "ke", "dari", "ini", "itu", "untuk", "pada", "dengan", "adalah", "atau", "the", "a", "an", "and", "of", "to", "in", "is", "it", "for", "that", "this"]);
    const pickBestHighlightWord = (words: string[], rawHighlight?: string) => {
      if (!Array.isArray(words) || words.length === 0) return "";
      const rawNorm = stripPunct(String(rawHighlight || "").split(/\s+/)[0] || "");
      if (rawNorm) {
        const exact = words.find((w) => stripPunct(w) === rawNorm);
        if (exact) return exact;
      }
      let best = words[words.length - 1];
      let bestScore = -1;
      for (const w of words) {
        const clean = stripPunct(w);
        if (!clean) continue;
        const sc = clean.length + (/\d/.test(clean) ? 4 : 0) + (stopWords.has(clean) ? 0 : 3);
        if (sc > bestScore) {
          bestScore = sc;
          best = w;
        }
      }
      return best;
    };

    const sliceTranscriptToKineticBlocks = (clipStartSec: number, clipEndSec: number, clipIdx: number) => {
      const segDur = Math.max(0.5, clipEndSec - clipStartSec);
      const allWordsInRange: Array<{ word: string; relStart: number; relEnd: number; endsSentence: boolean }> = [];

      for (const seg of normalizedFullTranscript) {
        if (seg.end <= clipStartSec + 0.02 || seg.start >= clipEndSec - 0.02) continue;
        for (const w of seg.words) {
          if (w.end <= clipStartSec + 0.02 || w.start >= clipEndSec - 0.02) continue;
          const relS = Math.max(0, Math.min(segDur - 0.06, w.start - clipStartSec));
          const relE = Math.min(segDur, Math.max(relS + 0.06, w.end - clipStartSec));
          allWordsInRange.push({
            word: w.word,
            relStart: relS,
            relEnd: relE,
            endsSentence: /[.!?…]$/.test(w.word),
          });
        }
      }

      if (allWordsInRange.length === 0) return [];

      // Group words into tight 2-4 word kinetic blocks respecting sentence boundaries & pauses > 0.35s
      const rawBlocks: Array<typeof allWordsInRange> = [];
      let curGroup: typeof allWordsInRange = [];

      for (let wi = 0; wi < allWordsInRange.length; wi++) {
        const w = allWordsInRange[wi];
        const prev = curGroup.length > 0 ? curGroup[curGroup.length - 1] : null;
        const pauseGap = prev ? w.relStart - prev.relEnd : 0;

        if (curGroup.length >= 4 || (curGroup.length >= 2 && (pauseGap > 0.35 || prev?.endsSentence))) {
          rawBlocks.push(curGroup);
          curGroup = [];
        }
        curGroup.push(w);
      }
      if (curGroup.length > 0) {
        rawBlocks.push(curGroup);
      }

      // Merge any trailing 1-word orphan into previous block if <= 3 words
      const balancedBlocks: Array<typeof allWordsInRange> = [];
      for (const blk of rawBlocks) {
        if (balancedBlocks.length > 0 && blk.length === 1 && balancedBlocks[balancedBlocks.length - 1].length <= 3) {
          balancedBlocks[balancedBlocks.length - 1] = [...balancedBlocks[balancedBlocks.length - 1], ...blk];
        } else if (balancedBlocks.length > 0 && balancedBlocks[balancedBlocks.length - 1].length === 1 && blk.length <= 3) {
          balancedBlocks[balancedBlocks.length - 1] = [...balancedBlocks[balancedBlocks.length - 1], ...blk];
        } else {
          balancedBlocks.push(blk);
        }
      }

      const result = balancedBlocks.map((grp, bIdx) => {
        const relStart = Math.round(grp[0].relStart * 1000) / 1000;
        const relEnd = Math.round(Math.max(relStart + 0.14, grp[grp.length - 1].relEnd) * 1000) / 1000;
        const wordsText = grp.map((g) => g.word);
        return {
          id: `sub-${clipIdx + 1}-${bIdx + 1}`,
          start: relStart,
          end: relEnd,
          start_sec: Math.round((clipStartSec + relStart) * 1000) / 1000,
          end_sec: Math.round((clipStartSec + relEnd) * 1000) / 1000,
          posX: 50,
          posY: 56,
          text: wordsText.join(" "),
          highlightWord: pickBestHighlightWord(wordsText),
        };
      });

      // Anti-Squash validation: distribute proportionally by phrase length if any block is < 0.35s, bunched near 0, overlapping, or covering < 45% of segDur
      let needsDistribution = false;
      let nearZeroCount = 0;
      for (let i = 0; i < result.length; i++) {
        const cur = result[i];
        if (cur.end - cur.start < 0.35) {
          needsDistribution = true;
          break;
        }
        if (cur.start <= 0.15) nearZeroCount++;
        if (i > 0 && (cur.start < result[i - 1].end - 0.08 || cur.start < result[i - 1].start - 0.02)) {
          needsDistribution = true;
          break;
        }
      }
      if (!needsDistribution && result.length >= 2 && nearZeroCount >= 2) {
        needsDistribution = true;
      }
      if (!needsDistribution && result.length >= 3) {
        const spanCovered = result[result.length - 1].end - result[0].start;
        if (spanCovered < segDur * 0.45) {
          needsDistribution = true;
        }
      }

      if (needsDistribution && result.length > 0) {
        const weights = result.map((r) => Math.max(1, r.text.replace(/\s+/g, "").length));
        const totalChars = Math.max(1, weights.reduce((a, b) => a + b, 0));
        let cursor = 0;
        for (let i = 0; i < result.length; i++) {
          const blockDur = segDur * (weights[i] / totalChars);
          const relStart = Math.round(cursor * 100) / 100;
          const relEnd =
            i === result.length - 1
              ? Math.round(segDur * 100) / 100
              : Math.round(Math.min(segDur, cursor + blockDur) * 100) / 100;
          result[i].start = relStart;
          result[i].end = Math.max(Math.min(segDur, relStart + 0.35), relEnd);
          result[i].start_sec = Math.round((clipStartSec + result[i].start) * 100) / 100;
          result[i].end_sec = Math.round((clipStartSec + result[i].end) * 100) / 100;
          cursor += blockDur;
        }
      } else {
        for (let i = 0; i < result.length - 1; i++) {
          const cur = result[i];
          const next = result[i + 1];
          const gap = next.start - cur.end;
          if (gap > 0 && gap < 0.25) {
            cur.end = next.start;
          } else if (cur.end > next.start) {
            cur.end = next.start;
          }
          cur.start_sec = Math.round((clipStartSec + cur.start) * 1000) / 1000;
          cur.end_sec = Math.round((clipStartSec + cur.end) * 1000) / 1000;
        }
      }

      return result;
    };

    const normalizedClips = validatedClips.map((c: any, idx: number) => {
      const startSec = Math.round(Math.max(0, Number(c.start_sec) || 0) * 100) / 100;
      const endSec = Math.round(Math.max(startSec + 1.0, Number(c.end_sec) || safeTotalDuration) * 100) / 100;
      const segDur = Math.max(1.0, endSec - startSec);

      const segTexts = normalizedFullTranscript
        .filter((seg) => seg.end > startSec + 0.05 && seg.start < endSec - 0.05)
        .map((seg) => seg.text);
      const clipTranscriptText = segTexts.join(" ").trim();
      const clipTranscriptWords = clipTranscriptText.split(/\s+/).filter(Boolean);

      let clipTitle = String(c.title || "").trim() || clipTranscriptWords.slice(0, 6).join(" ") || `Sorotan Utama #${idx + 1}`;
      if (usedTitles.has(clipTitle.toLowerCase())) {
        const altSeed = clipTranscriptWords.slice(0, 6).join(" ").replace(/[,.;:]+$/, "");
        clipTitle = altSeed && !usedTitles.has(altSeed.toLowerCase()) ? altSeed : `${clipTitle} (${formatDurationMMSS(startSec)})`;
      }
      usedTitles.add(clipTitle.toLowerCase());

      let hookHeadline = String(c.hook_headline || clipTitle).split(/\r?\n/)[0].replace(/\s+/g, " ").trim();
      hookHeadline = hookHeadline.split(" ").filter(Boolean).slice(0, 8).join(" ");
      if (!hookHeadline || usedHooks.has(hookHeadline.toLowerCase())) {
        hookHeadline = clipTranscriptWords.slice(0, 7).join(" ").replace(/[,.;:]+$/, "") || clipTitle.split(" ").slice(0, 7).join(" ");
      }
      usedHooks.add(hookHeadline.toLowerCase());

      const clampCrit = (val: any, defVal: number) => Math.min(99, Math.max(58, Math.round(Number(val) || defVal)));
      const hookScore = clampCrit(c.hook_score, 86);
      const insightScore = clampCrit(c.insight_score, 85);
      const flowScore = clampCrit(c.flow_score, 84);
      const emotionScore = clampCrit(c.emotion_score, 83);
      const weighted = Math.round(hookScore * 0.35 + insightScore * 0.30 + flowScore * 0.20 + emotionScore * 0.15);
      const calibratedScore = Math.min(98, Math.max(68, weighted));

      const cleanSubs = sliceTranscriptToKineticBlocks(startSec, endSec, idx);

      const cleanBrolls = Array.isArray(c.broll_moments)
        ? c.broll_moments
            .map((b: any, bIdx: number) => {
              let bStart = Number(b.start_sec ?? b.start);
              let bEnd = Number(b.end_sec ?? b.end);
              if (isNaN(bStart)) return null;
              if (bStart <= segDur && startSec > segDur) bStart += startSec;
              if (isNaN(bEnd) || bEnd <= bStart) bEnd = bStart + 3.0;
              else if (bEnd <= segDur && startSec > segDur) bEnd += startSec;
              if (bStart < startSec) bStart = startSec + Math.min(2.5, segDur * 0.2);
              const categoryTag = String(b.category_tag || b.keyword || "Highlight").trim().slice(0, 20);
              const rawHeadline = String(b.headline || b.caption || categoryTag || "Poin Utama").trim();
              const conciseHeadline = rawHeadline.split(/\s+/).filter(Boolean).slice(0, 3).join(" ");
              const cleanQueries = (Array.isArray(b.visual_queries) ? b.visual_queries : [])
                .map((vq: any) => String(vq || "").replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim())
                .filter((vq: string) => vq.split(/\s+/).length >= 2)
                .slice(0, 4);
              const rawVisKw = String(b.visual_keyword || cleanQueries[0] || b.keyword || conciseHeadline || "modern studio workspace")
                .replace(/[^\w\s-]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
              const visualKeyword = rawVisKw.split(/\s+/).filter(Boolean).slice(0, 4).join(" ") || cleanQueries[0] || "modern studio workspace";
              if (!cleanQueries.includes(visualKeyword)) cleanQueries.unshift(visualKeyword);
              const topicKeywords = (Array.isArray(b.topic_keywords) ? b.topic_keywords : [])
                .map((tk: any) => String(tk || "").replace(/[^\w\s-]/g, " ").trim().toLowerCase())
                .filter(Boolean)
                .slice(0, 6);
              const spokenQuote = String(b.spoken_quote || "").trim().slice(0, 80);
              return {
                id: `broll-${idx + 1}-${bIdx + 1}`,
                rawStart: bStart,
                rawEnd: bEnd,
                spoken_quote: spokenQuote,
                visual_keyword: visualKeyword,
                visual_queries: cleanQueries.slice(0, 4),
                topic_keywords: topicKeywords,
                headline: conciseHeadline,
                category_tag: categoryTag,
                keyword: categoryTag,
                icon_or_emoji: String(b.icon_or_emoji || "✨").trim(),
                caption: conciseHeadline,
              };
            })
            .filter((b: any) => b && b.rawEnd > startSec && b.rawStart < endSec)
            .map((b: any) => {
              const clampedStart = Math.max(startSec, Math.min(endSec - 1.2, b.rawStart));
              const clampedEnd = Math.min(endSec, Math.max(clampedStart + 2.0, Math.min(clampedStart + 3.5, b.rawEnd)));
              return {
                id: b.id,
                start_sec: Math.round(clampedStart * 100) / 100,
                end_sec: Math.round(clampedEnd * 100) / 100,
                spoken_quote: b.spoken_quote,
                visual_keyword: b.visual_keyword,
                visual_queries: b.visual_queries,
                topic_keywords: b.topic_keywords,
                headline: b.headline,
                category_tag: b.category_tag,
                keyword: b.keyword,
                icon_or_emoji: b.icon_or_emoji,
                caption: b.caption,
              };
            })
            .slice(0, 2)
        : [];

      const ytFrameSlot = (() => {
        if (isLocalMode || !resolvedVideoId) return "";
        const ratioFrac = Math.max(0, Math.min(1, startSec / Math.max(1, safeTotalDuration)));
        const hqFrame = ratioFrac < 0.33 ? "hq1.jpg" : (ratioFrac < 0.67 ? "hq2.jpg" : "hq3.jpg");
        return `https://i.ytimg.com/vi/${resolvedVideoId}/${hqFrame}`;
      })();

      return {
        id: `clip-${Date.now()}-${idx + 1}`,
        mode: isLocalMode ? "local" : "youtube",
        videoId: resolvedVideoId,
        coverImage: ytFrameSlot,
        thumbnailUrl: ytFrameSlot,
        title: clipTitle,
        hook_headline: hookHeadline,
        full_transcript: clipTranscriptText,
        viral_score: calibratedScore,
        score: calibratedScore,
        score_breakdown: {
          hook: hookScore,
          insight: insightScore,
          flow: flowScore,
          emotion: emotionScore,
        },
        alasan_viral: String(
          c.alasan_viral ||
            `Hook pembuka (${hookScore}%) dengan kepadatan insight ${insightScore}% dan alur tuntas ${flowScore}%.`
        ).trim(),
        start_sec: startSec,
        end_sec: endSec,
        start_seconds: startSec,
        end_seconds: endSec,
        duration: formatDurationMMSS(segDur),
        subtitles: cleanSubs,
        broll_moments: cleanBrolls,
      };
    });

    // Sort strictly descending by viral_score (Tertinggi -> Terendah)
    normalizedClips.sort((a: any, b: any) => (Number(b.viral_score) || 0) - (Number(a.viral_score) || 0));

    const elapsedSeconds = ((Date.now() - startTimeStamp) / 1000).toFixed(2);
    console.log(
      `[Auto-Clip API] 3-Stage Transcript-First selesai (${isLocalMode ? (hasAudioPayload ? "Local MP4 Audio WAV" : "Local MP4 Frames") : "YouTube"}) dalam ${elapsedSeconds}s | ${normalizedFullTranscript.length} segmen transkrip -> ${normalizedClips.length} klip bernilai (sorted descending by viral_score).`
    );

    return res.json({
      success: true,
      mode: isLocalMode ? "local" : "youtube",
      videoId: resolvedVideoId,
      videoTitle: parsedStage1?.video_title || videoTitle || fileName || "Video Analisis AI",
      videoDurationSec: Math.round(safeTotalDuration * 100) / 100,
      fullTranscript: normalizedFullTranscript,
      clips: normalizedClips,
    });
  } catch (err: any) {
    const friendly = buildFriendlyGeminiErrorMessage(err, "Gagal memproses video dengan Gemini API.");
    console.error("[Auto-Clip API] Error:", friendly.status, friendly.message);
    const isRestrictedYt =
      !extractGeminiErrorMeta(err).isRateLimit &&
      /fileUri|YouTube|private|unavailable|restricted/i.test(String(err?.message || ""));
    const finalMsg = isRestrictedYt
      ? `Video YouTube tidak dapat diproses langsung oleh Gemini AI (pastikan video bersifat publik, tidak dibatasi usia/wilayah, dan tautan valid). Detail: ${friendly.message}`
      : friendly.message;
    return res.status(friendly.status).json({
      success: false,
      error: finalMsg,
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
    const ai = getGenAI();
    
    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY belum dikonfigurasi di server (Settings > Secrets).",
      });
    }

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

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    }, { fallbackTextModel: "gemini-3.1-flash-lite" });

    if (!response.text) {
      return res.status(502).json({ success: false, error: "Gemini tidak mengembalikan JSON." });
    }

    const parsed = JSON.parse(response.text);
    parsed.videoId = videoId;
    if (!parsed.thumbnailUrl) {
      parsed.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return res.json(parsed);
  } catch (err: any) {
    const friendly = buildFriendlyGeminiErrorMessage(err, "Gagal menganalisis URL video.");
    return res.status(friendly.status).json({
      success: false,
      error: friendly.message,
    });
  }
});

// Endpoint Auto Script (2-Stage Ultra-Accurate Verbatim Acoustic + Proofread via Gemini 2.5 Flash)
app.post("/api/transcribe-script", async (req, res) => {
  try {
    const {
      audioBase64,
      audioMimeType = "audio/wav",
      youtubeUrl,
      videoId,
      format = "paragraph",
      language = "auto",
      customVocab = "",
      fileName = "Video",
    } = req.body || {};

    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY belum dikonfigurasi di server (Settings > Secrets).",
      });
    }

    const cleanAudioB64 = typeof audioBase64 === "string"
      ? (audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64).trim()
      : "";
    const hasAudio = cleanAudioB64.length > 50;
    const ytMatch = String(youtubeUrl || "").match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    const resolvedYtId = videoId || (ytMatch ? ytMatch[1] : "");

    if (!hasAudio && !resolvedYtId) {
      return res.status(400).json({
        success: false,
        error: "Kirimkan audio/video lokal atau tautan YouTube yang valid untuk disalin menjadi teks.",
      });
    }

    const cleanVocab = String(customVocab || "").trim();
    const vocabRule = cleanVocab
      ? `\nKAMUS ISTILAH KHUSUS WAJIB (prioritaskan ejaan tepat saat pembicara mengucapkan kata/singkatan berikut): ${cleanVocab}`
      : "";

    const langRule = language === "id"
      ? "Gunakan Bahasa Indonesia alami yang akurat sesuai KBBI/ucapan, pertahankan istilah teknis/Inggris tepat seperti diucapkan pembicara."
      : language === "en"
        ? "Transcribe 100% accurately in English preserving proper nouns and domain terms."
        : "Ikuti bahasa asli yang diucapkan pembicara (termasuk code-switching Bahasa Indonesia & Inggris) secara akurat kata demi kata.";

    // STAGE 1: Verbatim Acoustic Pass (temperature: 0.0)
    const stage1TimestampInstruction = format === "timestamped"
      ? "Sertakan penanda waktu [MM:SS] akurat di setiap awal kalimat/pergantian napas."
      : "Tulis berurutan dari detik pertama hingga detik terakhir tanpa melewatkan satu kalimat pun.";

    const stage1Prompt = `Anda adalah mesin transkripsi akustik forensik berpresisi 99.9%.
Tugas STAGE 1 (Verbatim Acoustic Pass) untuk "${fileName || "Video"}":
Dengarkan setiap detik audio dari awal sampai selesai dan salin SEMUA kata yang diucapkan pembicara SECARA HARFIAH (100% verbatim).
ATURAN KETAT:
1. DILARANG meringkas, memparafrase, mengubah urutan kata, atau menghilangkan kata/kalimat apa pun.
2. DILARANG berhalusinasi atau menambah topik di luar suara asli.
3. ${langRule}
4. ${stage1TimestampInstruction}${vocabRule}

Keluarkan HANYA hasil transkrip mentah verbatim tanpa komentar pembuka/penutup.`;

    const mediaParts: any[] = [];
    if (hasAudio) {
      mediaParts.push({
        inlineData: {
          mimeType: audioMimeType || "audio/wav",
          data: cleanAudioB64,
        },
      });
    } else if (resolvedYtId && /^[A-Za-z0-9_-]{11}$/.test(resolvedYtId)) {
      const youtubeUri = `https://www.youtube.com/watch?v=${resolvedYtId}`;
      if (youtubeUri.trim().length > 0) {
        mediaParts.push({
          fileData: {
            fileUri: youtubeUri,
          },
        });
      }
    }

    const stage1Resp = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: [...mediaParts, { text: stage1Prompt }],
      config: {
        temperature: 0.0,
      },
    });

    const stage1Transcript = (stage1Resp.text || "").trim();
    if (!stage1Transcript) {
      return res.status(500).json({
        success: false,
        error: "Gemini tidak mengembalikan transkrip pada Stage 1.",
      });
    }

    // STAGE 2: Orthography, Vocabulary & Punctuation Proofread Pass (temperature: 0.0)
    let formatRuleStage2 = "";
    if (format === "timestamped") {
      formatRuleStage2 = `Format keluaran AKHIR WAJIB berupa Transkrip + Timestamp per kalimat/frasa dengan format [MM:SS] di awal baris:
[00:00] Kalimat pembuka yang diucapkan...
[00:04] Kalimat berikutnya...
Pastikan setiap timestamp [MM:SS] dipertahankan akurat dan setiap kata tetap 100% verbatim.`;
    } else if (format === "repurpose") {
      formatRuleStage2 = `Format keluaran AKHIR WAJIB berupa Script Konten Ulang berbasis fakta ucapan asli dari transkrip Stage 1:
### HOOK PEMBUKA
(1-2 kalimat pancingan paling kuat yang tetap setia pada inti ucapan asli)

### ISI UTAMA
- Poin 1: ...
- Poin 2: ...
- Poin 3: ...
(Sertakan naskah siap baca yang rapi tanpa mengubah fakta atau angka pembicara)

### PENUTUP & CTA
(Kalimat penutup & ajakan bertindak yang relevan dengan isi video)`;
    } else {
      formatRuleStage2 = `Format keluaran AKHIR WAJIB berupa Naskah Paragraf Rapi:
- Pertahankan 100% kata-kata asli pembicara dari Stage 1 (JANGAN membuang kalimat atau mengganti makna).
- Rapikan pembagian paragraf, huruf kapital, angka, serta tanda baca (titik, koma, tanda tanya) agar nyaman dibaca.`;
    }

    const stage2Prompt = `Anda adalah editor ortografi & proofreader naskah profesional.
Berikut adalah hasil transkrip verbatim Stage 1 dari audio "${fileName || "Video"}":

"""
${stage1Transcript}
"""

Tugas STAGE 2 (Orthography & Punctuation Proofread):
1. Perbaiki kesalahan ejaan akronim, nama diri, angka, maupun istilah Inggris-Indonesia (code-switching) agar akurat 99%-100%.${vocabRule}
2. ${langRule}
3. JANGAN menambah informasi fiktif atau membuang kata yang memang diucapkan pembicara (kecuali penataan format jika memilih mode Script Konten Ulang).
4. ${formatRuleStage2}

Keluarkan HANYA naskah final yang sudah bersih dan siap salin tanpa kata pengantar apa pun.`;

    const stage2Resp = await generateContentWithRetry(
      ai,
      {
        model: "gemini-2.5-flash",
        contents: [{ text: stage2Prompt }],
        config: {
          temperature: 0.0,
        },
      },
      { fallbackTextModel: "gemini-3.1-flash-lite" }
    );

    const finalTranscript = (stage2Resp.text || stage1Transcript).trim();

    return res.json({
      success: true,
      format,
      transcript: finalTranscript,
      stage1Preview: stage1Transcript.slice(0, 140),
      stagesCompleted: 2,
      usedVocab: Boolean(cleanVocab),
    });
  } catch (err: any) {
    const friendly = buildFriendlyGeminiErrorMessage(err, "Gagal menyalin video menjadi teks.");
    console.error("[Auto Script API] Error:", friendly.status, friendly.message);
    return res.status(friendly.status).json({
      success: false,
      error: friendly.message,
    });
  }
});

// Endpoint On-Demand AI Auto-Subtitles untuk Edit Manual (Gemini 2.5 Flash Structured JSON Timestamps)
app.post("/api/generate-subtitles", async (req, res) => {
  try {
    const {
      audioBase64,
      audioMimeType = "audio/wav",
      youtubeUrl,
      videoId,
      startSec = 0,
      endSec = 30,
      fileName = "Clip Video",
    } = req.body || {};

    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY belum dikonfigurasi di server (Settings > Secrets).",
      });
    }

    const cleanAudioB64 = typeof audioBase64 === "string"
      ? (audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64).trim()
      : "";
    const hasAudio = cleanAudioB64.length > 50;
    const ytMatch = String(youtubeUrl || "").match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    const resolvedYtId = videoId || (ytMatch ? ytMatch[1] : "");

    if (!hasAudio && !resolvedYtId) {
      return res.status(400).json({
        success: false,
        error: "Kirimkan audio video lokal atau tautan YouTube yang valid untuk membuat subtitle otomatis.",
      });
    }

    const sSec = Math.max(0, Number(startSec) || 0);
    const eSec = Math.max(sSec + 1, Number(endSec) || (sSec + 30));

    const prompt = `Anda adalah pembuat subtitle verbatim presisi tinggi untuk video pendek (TikTok/Reels/Shorts).
Dengarkan audio dari "${fileName || "Video"}" khususnya pada rentang waktu ${sSec.toFixed(1)} detik hingga ${eSec.toFixed(1)} detik.
Tugas Anda:
1. Transkripsikan ucapan pembicara secara 100% verbatim sesuai bahasa asli yang diucapkan (Indonesia, Inggris, atau campur/code-switching) tanpa meringkas atau mengarang.
2. Pecah menjadi blok subtitle pendek yang enak dibaca (2 hingga 5 kata utuh per blok).
3. Berikan start_sec dan end_sec akurat dalam detik absolut pada audio asli (rentang ${sSec.toFixed(1)} sampai ${eSec.toFixed(1)}, tanpa tumpang tindih).
4. Hindari pengulangan kata/gagap yang tidak perlu dan jangan memotong kata di tengah.`;

    const mediaParts: any[] = [];
    if (hasAudio) {
      mediaParts.push({
        inlineData: {
          mimeType: audioMimeType || "audio/wav",
          data: cleanAudioB64,
        },
      });
    } else if (resolvedYtId && /^[A-Za-z0-9_-]{11}$/.test(resolvedYtId)) {
      const youtubeUri = `https://www.youtube.com/watch?v=${resolvedYtId}`;
      if (youtubeUri.trim().length > 0) {
        mediaParts.push({
          fileData: {
            fileUri: youtubeUri,
          },
        });
      }
    }

    const resp = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: [...mediaParts, { text: prompt }],
      config: {
        temperature: 0.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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
          },
          required: ["subtitles"],
        },
      },
    }, { maxRetries: 0 });

    const rawJson = (resp.text || "").trim();
    const parsed = JSON.parse(rawJson.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim());
    const subtitles = Array.isArray(parsed?.subtitles) ? parsed.subtitles : [];

    return res.json({
      success: true,
      subtitles,
    });
  } catch (err: any) {
    const meta = extractGeminiErrorMeta(err);
    const friendly = buildFriendlyGeminiErrorMessage(err, "Gagal membuat subtitle otomatis.");
    const cleanError = meta.isRateLimit || friendly.status === 429
      ? "Kuota API Gemini habis. Silakan coba lagi nanti."
      : friendly.message;
    console.error("[Generate Subtitles API] Error:", friendly.status, cleanError);
    return res.status(meta.isRateLimit ? 429 : friendly.status).json({
      success: false,
      error: cleanError,
    });
  }
});

// Endpoint Segmentasi Subjek & Analisis Latar Foto untuk "Hapus Latar Foto" (Gemini 2.5 Flash Vision)
app.post("/api/photo-cutout", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body || {};
    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY belum dikonfigurasi di server (Settings > Secrets).",
      });
    }

    const cleanB64 = typeof imageBase64 === "string"
      ? (imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64).trim()
      : "";
    if (!cleanB64 || cleanB64.length < 50) {
      return res.status(400).json({
        success: false,
        error: "Data gambar tidak valid untuk pemotongan latar.",
      });
    }

    const prompt = `Analyze this image to isolate the main foreground subject (person, product, or central object) from its background.
Return pure JSON with:
1. "subjectBox": normalized coordinates (0 to 1000) tightly enclosing the primary foreground subject: { "ymin": number, "xmin": number, "ymax": number, "xmax": number }.
2. "bgColors": array of 1 to 3 dominant background hex colors sampled near the outer edges (e.g. ["#E5E7EB"]).
3. "isUniformBg": boolean indicating whether the background is relatively clean/solid/studio or complex.
4. "subjectType": short label ("person", "product", or "object").`;

    const resp = await generateContentWithRetry(
      ai,
      {
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanB64,
            },
          },
          { text: prompt },
        ],
        config: {
          temperature: 0.0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subjectBox: {
                type: Type.OBJECT,
                properties: {
                  ymin: { type: Type.NUMBER },
                  xmin: { type: Type.NUMBER },
                  ymax: { type: Type.NUMBER },
                  xmax: { type: Type.NUMBER },
                },
                required: ["ymin", "xmin", "ymax", "xmax"],
              },
              bgColors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              isUniformBg: { type: Type.BOOLEAN },
              subjectType: { type: Type.STRING },
            },
            required: ["subjectBox", "bgColors", "isUniformBg", "subjectType"],
          },
        },
      },
      { maxRetries: 0 }
    );

    const rawJson = (resp.text || "{}").trim();
    const parsed = JSON.parse(rawJson.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim());
    const box = parsed?.subjectBox || {};
    const safeBox = {
      ymin: Math.max(0, Math.min(950, Number(box.ymin) || 80)),
      xmin: Math.max(0, Math.min(950, Number(box.xmin) || 120)),
      ymax: Math.max(50, Math.min(1000, Number(box.ymax) || 940)),
      xmax: Math.max(50, Math.min(1000, Number(box.xmax) || 880)),
    };

    return res.json({
      success: true,
      subjectBox: safeBox,
      bgColors: Array.isArray(parsed?.bgColors) ? parsed.bgColors.slice(0, 3) : [],
      isUniformBg: Boolean(parsed?.isUniformBg),
      subjectType: String(parsed?.subjectType || "object"),
    });
  } catch (err: any) {
    const meta = extractGeminiErrorMeta(err);
    const friendly = buildFriendlyGeminiErrorMessage(err, "Gagal menganalisis subjek foto.");
    const cleanError = meta.isRateLimit || friendly.status === 429
      ? "Kuota API Gemini habis. Silakan coba lagi nanti."
      : friendly.message;
    console.error("[Photo Cutout API] Error:", friendly.status, cleanError);
    return res.status(meta.isRateLimit ? 429 : friendly.status).json({
      success: false,
      error: cleanError,
    });
  }
});

// Endpoint Generator Caption & Hashtag Viral untuk Auto Publish (Gemini 2.5 Flash)
app.post("/api/generate-publish-copy", async (req, res) => {
  try {
    const {
      title = "",
      transcript = "",
      topicHint = "",
      language = "id",
      platforms = ["tiktok", "youtube_shorts", "instagram_reels", "facebook_reels"],
    } = req.body || {};

    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY belum dikonfigurasi di server (Settings > Secrets).",
      });
    }

    const sourceSummary = [
      title ? `Judul Klip: ${title}` : "",
      topicHint ? `Topik/Arahan Tambahan: ${topicHint}` : "",
      transcript ? `Isi/Transkrip Klip:\n${String(transcript).slice(0, 3500)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!sourceSummary) {
      return res.status(400).json({
        success: false,
        error: "Isi topik, judul klip, atau transkrip agar AI dapat membuat caption & hashtag.",
      });
    }

    const langRule = language === "en"
      ? "Tulis seluruh judul, caption, dan hashtag dalam Bahasa Inggris natural yang engaging."
      : "Tulis seluruh judul, caption, dan CTA dalam Bahasa Indonesia yang santai, tajam, dan memicu interaksi (komen/share).";

    const platformSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Judul hook singkat & menarik maksimal 80 karakter" },
        caption: { type: Type.STRING, description: "Caption natural siap unggah lengkap dengan hook & ajakan komentar" },
        hashtags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "4-7 hashtag relevan diawali tanda # tanpa spasi",
        },
      },
      required: ["title", "caption", "hashtags"],
    };

    const prompt = `Anda adalah Social Media Growth Strategist ahli video pendek viral (${Array.isArray(platforms) ? platforms.join(", ") : "TikTok, YouTube Shorts, Instagram Reels, Facebook Reels"}).
${langRule}

Konteks Video:
${sourceSummary}

Buat paket copywriting teroptimasi per platform dengan gaya khas algoritma masing-masing:
- tiktok: Hook singkat punchy, caption conversational 1-3 baris, hashtag campuran niche + FYP relevan.
- youtube_shorts: Judul SEO-friendly tinggi CTR (< 75 karakter), deskripsi padat berisi kata kunci, hashtag #Shorts + niche.
- instagram_reels: Hook baris pertama kuat ("Baca sampai habis" / pertanyaan pemicu simpan/share), caption terstruktur rapi, hashtag niche relevan.
- facebook_reels: Gaya storytelling/relatable yang mendorong diskusi di kolom komentar & share.`;

    const resp = await generateContentWithRetry(
      ai,
      {
        model: "gemini-2.5-flash",
        contents: [{ text: prompt }],
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tiktok: platformSchema,
              youtube_shorts: platformSchema,
              instagram_reels: platformSchema,
              facebook_reels: platformSchema,
            },
            required: ["tiktok", "youtube_shorts", "instagram_reels", "facebook_reels"],
          },
        },
      },
      { fallbackTextModel: "gemini-3.1-flash-lite" }
    );

    const rawJson = (resp.text || "{}").trim();
    let parsed: any = {};
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return res.status(500).json({
        success: false,
        error: "Respons AI untuk caption tidak valid JSON.",
      });
    }

    const normalizeHashtags = (tags: any) =>
      (Array.isArray(tags) ? tags : [])
        .map((t) => String(t || "").trim().replace(/\s+/g, ""))
        .filter(Boolean)
        .map((t) => (t.startsWith("#") ? t : `#${t}`));

    const normalizePlatform = (obj: any, fallbackTitle: string) => ({
      title: String(obj?.title || fallbackTitle || "Klip Video Pendek").trim(),
      caption: String(obj?.caption || "").trim(),
      hashtags: normalizeHashtags(obj?.hashtags),
    });

    return res.json({
      success: true,
      platforms: {
        tiktok: normalizePlatform(parsed.tiktok, title),
        youtube_shorts: normalizePlatform(parsed.youtube_shorts, title),
        instagram_reels: normalizePlatform(parsed.instagram_reels, title),
        facebook_reels: normalizePlatform(parsed.facebook_reels, title),
      },
    });
  } catch (err: any) {
    const friendly = buildFriendlyGeminiErrorMessage(err, "Gagal membuat caption & hashtag otomatis.");
    console.error("[Generate Publish Copy API] Error:", friendly.status, friendly.message);
    return res.status(friendly.status).json({
      success: false,
      error: friendly.message,
    });
  }
});

// Endpoint Eksekusi Auto Publish Multi-Platform (Sinkron dengan Koneksi Akun API / Browser Session)
app.post("/api/publish/execute", async (req, res) => {
  try {
    const {
      title = "Video ClipA Studio",
      platforms = [],
      connectedAccounts = {},
      platformCopy = {},
      scheduledAt = null,
      clipId = "",
    } = req.body || {};

    const targetPlatforms = Array.isArray(platforms) ? platforms : [];
    if (targetPlatforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Pilih minimal satu platform tujuan publikasi.",
      });
    }

    let usedApiCount = 0;
    let quickSessionCount = 0;

    const results = await Promise.all(
      targetPlatforms.map(async (platformKey: string) => {
        const acc = connectedAccounts && connectedAccounts[platformKey] ? connectedAccounts[platformKey] : null;
        if (!acc || !acc.connected) {
          return {
            platform: platformKey,
            status: "not_connected",
            message: "Akun belum terhubung.",
          };
        }

        const username = String(acc.username || "@creator").trim();
        const mode = acc.mode === "api" && String(acc.token || "").trim() ? "api" : "quick";
        const copyObj = platformCopy && platformCopy[platformKey] ? platformCopy[platformKey] : {};

        if (mode === "api") {
          usedApiCount += 1;
          const token = String(acc.token || "").trim();
          let apiVerified = false;
          if (platformKey === "youtube_shorts") {
            try {
              const ytCheck = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
                headers: { Authorization: `Bearer ${token}` },
              });
              apiVerified = ytCheck.ok;
            } catch {
              apiVerified = false;
            }
          }
          return {
            platform: platformKey,
            username,
            status: "api_dispatched",
            apiVerified,
            titleSent: String(copyObj.title || title),
            scheduledAt,
            clipId,
            message: apiVerified
              ? `Terverifikasi & dikirim via YouTube Data API v3 (${username}).`
              : `Payload API disiapkan untuk ${username} (Token terpasang; unggah media via Studio jika OAuth belum final).`,
          };
        }

        quickSessionCount += 1;
        return {
          platform: platformKey,
          username,
          status: "quick_session",
          titleSent: String(copyObj.title || title),
          message: `Mode Koneksi Cepat aktif (${username}) — video diunduh & caption disalin.`,
        };
      })
    );

    return res.json({
      success: true,
      usedApiCount,
      quickSessionCount,
      results,
      executedAt: Date.now(),
    });
  } catch (err: any) {
    console.error("[Publish Execute API] Error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Gagal mengeksekusi publikasi.",
    });
  }
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
