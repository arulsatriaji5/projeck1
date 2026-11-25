async function fetchYouTubeTimedTextHints(videoId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
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
      tracks.find((t) => String(t?.languageCode || "").startsWith("id") && t?.kind !== "asr") ||
      tracks.find((t) => String(t?.languageCode || "").startsWith("id")) ||
      tracks.find((t) => String(t?.languageCode || "").startsWith("en") && t?.kind !== "asr") ||
      tracks[0];
    if (!preferred?.baseUrl) return "";

    const json3Url = `${preferred.baseUrl}${preferred.baseUrl.includes("?") ? "&" : "?"}fmt=json3`;
    const capRes = await fetch(json3Url, { signal: controller.signal });
    if (!capRes.ok) return "";
    const capData = await capRes.json().catch(() => null);
    if (!Array.isArray(capData?.events)) return "";

    const lines = [];
    for (const ev of capData.events) {
      if (!Array.isArray(ev?.segs) || typeof ev?.tStartMs !== "number") continue;
      const text = ev.segs
        .map((sg) => String(sg?.utf8 || ""))
        .join("")
        .replace(/\s+/g, " ")
        .trim();
      if (!text || text === "\n") continue;
      const startSec = Math.round((ev.tStartMs / 1000) * 100) / 100;
      const durSec = Math.max(0.4, Math.round(((Number(ev.dDurationMs) || 1800) / 1000) * 100) / 100);
      lines.push(`[${startSec.toFixed(2)}s-${(startSec + durSec).toFixed(2)}s] ${text}`);
      if (lines.length >= 220) break;
    }
    return lines.join("\n").slice(0, 9000);
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-gemini-api-key");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method tidak diizinkan" });

  try {
    const body = req.body || {};
    const {
      mode,
      youtubeUrl,
      videoUrl,
      sourceVideoUrl,
      videoId: clientVideoId,
      fileName,
      videoDuration,
      audioBase64,
      audioMimeType,
      frames,
      minSeconds = 15,
      maxSeconds = 30,
      styleNotes = "",
      referenceInstructions = "",
      momentPrompt = "",
    } = body;

    const headerKey = typeof req.headers["x-gemini-api-key"] === "string" ? req.headers["x-gemini-api-key"].trim() : "";
    const bodyKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const apiKey =
      bodyKey ||
      headerKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API ||
      process.env.VITE_GEMINI_API_KEY ||
      "";

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "Gemini API Key belum ditemukan. Silakan buka menu Settings dan masukkan Gemini API Key Anda terlebih dahulu.",
      });
    }

    const safeMinSec = Math.max(12, Math.min(180, Math.round(Number(minSeconds) || 15)));
    const safeMaxSec = Math.max(safeMinSec, Math.min(300, Math.round(Number(maxSeconds) || 45)));

    const cleanAudioB64 = typeof audioBase64 === "string"
      ? (audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64).trim()
      : "";
    const hasAudio = cleanAudioB64.length > 50;
    const rawIncomingUrl = String(youtubeUrl || videoUrl || sourceVideoUrl || "").trim();
    const isLocalMode =
      mode === "local" ||
      hasAudio ||
      (Array.isArray(frames) && frames.length > 0) ||
      Boolean(fileName && !rawIncomingUrl);

    let videoTitle = fileName ? String(fileName).replace(/\.[^/.]+$/, "") : "Video Klip";
    let mp4StreamUrl = null;
    let ytCaptionHints = "";
    let resolvedVideoId = null;

    const parts = [];

    if (isLocalMode) {
      if (hasAudio) {
        parts.push({
          inlineData: {
            mimeType: audioMimeType || "audio/wav",
            data: cleanAudioB64,
          },
        });
      }
      if (Array.isArray(frames)) {
        frames.slice(0, hasAudio ? 3 : 6).forEach((frameItem) => {
          const raw = typeof frameItem === "string" ? frameItem : frameItem?.data;
          if (raw && typeof raw === "string") {
            const b64 = raw.includes(",") ? raw.split(",")[1] : raw;
            if (b64 && b64.length > 20) {
              parts.push({
                inlineData: {
                  mimeType: frameItem?.mimeType || "image/jpeg",
                  data: b64,
                },
              });
            }
          }
        });
      }
      if (parts.length === 0) {
        return res.status(400).json({
          success: false,
          error: "File video/audio tidak memiliki trek suara atau frame yang terbaca.",
        });
      }
    } else {
      const match = rawIncomingUrl.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      resolvedVideoId = (typeof clientVideoId === "string" && /^[A-Za-z0-9_-]{11}$/.test(clientVideoId))
        ? clientVideoId
        : (match ? match[1] : null);

      if (!resolvedVideoId) {
        return res.status(400).json({
          success: false,
          error: "Tautan YouTube tidak valid atau kosong. Tempel link YouTube yang valid atau unggah file MP4 lokal.",
        });
      }

      const canonicalYoutubeUrl = `https://www.youtube.com/watch?v=${resolvedVideoId}`;

      try {
        const [oembedRes, captionHints] = await Promise.all([
          fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalYoutubeUrl)}&format=json`),
          fetchYouTubeTimedTextHints(resolvedVideoId),
        ]);
        if (oembedRes.ok) {
          const meta = await oembedRes.json();
          if (meta?.title) videoTitle = meta.title;
        }
        ytCaptionHints = captionHints;
      } catch (_) {}

      if (!ytCaptionHints) {
        return res.status(400).json({
          success: false,
          error: "Transkrip otomatis YouTube tidak tersedia untuk video ini pada hosting statis. Silakan unduh/unggah file MP4 atau audio lokal agar dapat diproses dengan presisi 100%.",
        });
      }
    }

    const durLabel = Number(videoDuration) > 0 ? `${Number(videoDuration).toFixed(1)} detik` : "sesuai panjang audio/transkrip";
    const pass1Prompt = `Anda adalah ahli transkripsi verbatim & kurator momen viral (PASS 1).
Judul/Sumber: ${videoTitle} (${durLabel}).
${ytCaptionHints ? `Transkrip Timestamp YouTube:\n${ytCaptionHints}\n` : ""}
Instruksi gaya: ${styleNotes || momentPrompt || "Podcast/edukasi viral dinamis"}.
${referenceInstructions ? `Resep Referensi Gaya Aktif: ${referenceInstructions}` : ""}

ATURAN WAJIB:
1. Ekstrak 1 sampai 8 segmen pemikiran utuh non-overlapping terbaik (durasi minimal 12 detik, ideal ${safeMinSec}-${safeMaxSec} detik, jangan memotong di tengah kalimat).
2. Isi 'candidate_id', 'title', 'hook_headline' (maks 7 kata), 'start_sec', 'end_sec', dan 'full_transcript' kata demi kata secara utuh.
3. Pecah 'full_transcript' menjadi blok 'subtitles' berisi 2-4 kata UTUH yang natural (timestamp berurutan dalam detik absolut).
4. Sertakan 1 'broll_moments' dengan 'visual_keyword' bahasa Inggris 2-4 kata, 'headline', 'spoken_quote', dan 'category_tag'.

Kembalikan JSON murni:
{
  "clips": [
    {
      "candidate_id": "cand-1",
      "title": "Judul hook berdasarkan ucapan asli",
      "hook_headline": "RAHASIA PENTING INI",
      "start_sec": 0.0,
      "end_sec": 24.5,
      "full_transcript": "Transkrip lengkap segmen...",
      "subtitles": [
        { "start_sec": 0.0, "end_sec": 1.4, "text": "KATA ASLI" }
      ],
      "broll_moments": [
        { "start_sec": 4.0, "end_sec": 7.0, "spoken_quote": "kata kunci", "visual_keyword": "stock market chart", "headline": "DATA RISET", "category_tag": "INSIGHT" }
      ]
    }
  ]
}`;

    parts.push({ text: pass1Prompt });

    const pass1Res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!pass1Res.ok) {
      const errText = await pass1Res.text();
      return res.status(pass1Res.status).json({
        success: false,
        error: `Gemini API Error (${pass1Res.status}): ${errText}`,
      });
    }

    const pass1Data = await pass1Res.json();
    const rawPass1 = pass1Data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsedPass1 = JSON.parse(rawPass1);
    const candidates = (Array.isArray(parsedPass1.clips) ? parsedPass1.clips : []).map((c, idx) => ({
      ...c,
      candidate_id: String(c.candidate_id || `cand-${idx + 1}`),
      viral_score: Math.min(98, Math.max(72, 94 - idx * 3)),
      score_breakdown: {
        hook: Math.max(70, 93 - idx * 3),
        insight: Math.max(70, 91 - idx * 2),
        flow: Math.max(70, 89 - idx * 2),
        emotion: Math.max(70, 88 - idx * 3),
      },
      alasan_viral: String(c.alasan_viral || "Hook kuat dengan pemikiran lengkap dan alur retensi tinggi.").trim(),
    }));

    candidates.sort((a, b) => b.viral_score - a.viral_score);

    return res.status(200).json({
      success: true,
      videoTitle,
      title: videoTitle,
      mp4StreamUrl,
      clips: candidates,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Gagal memproses video di server" });
  }
}
