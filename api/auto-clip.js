export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method tidak diizinkan" });

  try {
    const { youtubeUrl, minSeconds = 15, maxSeconds = 30, styleNotes = "", referenceInstructions = "" } = req.body || {};
    const safeMinSec = Math.max(3, Math.min(180, Math.round(Number(minSeconds) || 15)));
    const safeMaxSec = Math.max(safeMinSec, Math.min(300, Math.round(Number(maxSeconds) || 30)));
    const apiKey = process.env.GEMINI_API || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Environment variable GEMINI_API belum dipasang di Vercel." });
    }

    // Normalisasi URL YouTube standar agar terbaca oleh Gemini Multimodal
    const match = String(youtubeUrl || "").match(/(?:v=|youtu\.be\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : null;
    const canonicalYoutubeUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : youtubeUrl;

    // 1. Ambil metadata judul asli
    let videoTitle = "Video YouTube";
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalYoutubeUrl)}&format=json`);
      if (oembedRes.ok) {
        const meta = await oembedRes.json();
        videoTitle = meta.title || videoTitle;
      }
    } catch (_) {}

    // 2. Tarik direct MP4 stream lewat Cobalt API agar browser bisa crop & export MP4 asli
    let mp4StreamUrl = null;
    try {
      const cobaltRes = await fetch("https://api.cobalt.tools/", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ url: canonicalYoutubeUrl, videoQuality: "720", filenameStyle: "basic" })
      });
      if (cobaltRes.ok) {
        const cobaltData = await cobaltRes.json();
        mp4StreamUrl = cobaltData.url || null;
      }
    } catch (_) {}

    // 3. PASS 1: Transkripsi Akustik & Ekstraksi 5-6 Kandidat Segmen
    const pass1Prompt = `Anda adalah ahli speech-to-text alignment, transkripsi verbatim, dan editor video pendek AI profesional (PASS 1 - Ekstraksi Kandidat).
Dengarkan audio dan tonton video YouTube ini secara langsung (${videoTitle}).
Instruksi gaya: ${styleNotes || "Podcast/edukasi viral dinamis"}.
${referenceInstructions ? `Resep Referensi Gaya Aktif: ${referenceInstructions}` : ""}

ATURAN WAJIB PASS 1:
1. Ekstrak 5 sampai 6 kandidat segmen terbaik dengan durasi WAJIB antara ${safeMinSec} sampai ${safeMaxSec} detik.
2. Untuk setiap kandidat, isi 'candidate_id' (cand-1..cand-6), 'title', 'hook_headline' (3-5 kata kapital), dan tuliskan terlebih dulu 'full_transcript' ucapan ASLI pembicara kata demi kata secara utuh.
3. Pecah 'full_transcript' menjadi blok 'subtitles' berisi 2-4 kata UTUH yang natural (tanpa kata terpotong/berulang, tanpa '...', timestamp berurutan tanpa tumpang tindih). DILARANG mengarang teks yang tidak diucapkan.
4. Sertakan 1-2 'broll_moments' (2.5-3.5 detik, setelah detik ke-3 klip) HANYA saat kata kunci visual konkret diucapkan: isi 'visual_keyword' bahasa Inggris 2-4 kata untuk pencarian stock video Pixabay, 'headline' ringkas 2-3 kata Indonesia, 'spoken_quote', dan 'category_tag'.

Kembalikan JSON murni:
{
  "clips": [
    {
      "candidate_id": "cand-1",
      "title": "Judul hook berdasarkan ucapan asli",
      "hook_headline": "RAHASIA PENTING INI",
      "start_sec": 12.0,
      "end_sec": 34.5,
      "full_transcript": "Transkrip lengkap segmen...",
      "subtitles": [
        { "start_sec": 12.0, "end_sec": 13.4, "text": "KATA ASLI" }
      ],
      "broll_moments": [
        { "start_sec": 15.0, "end_sec": 18.0, "spoken_quote": "kata kunci", "visual_keyword": "stock market chart", "headline": "DATA RISET", "category_tag": "INSIGHT" }
      ]
    }
  ]
}`;

    const pass1Res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { fileData: { fileUri: canonicalYoutubeUrl } },
                { text: pass1Prompt }
              ]
            }
          ],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!pass1Res.ok) {
      const errText = await pass1Res.text();
      throw new Error(`Gemini API Error (${pass1Res.status}): ${errText}`);
    }

    const pass1Data = await pass1Res.json();
    const rawPass1 = pass1Data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsedPass1 = JSON.parse(rawPass1);
    const candidates = (Array.isArray(parsedPass1.clips) ? parsedPass1.clips : []).map((c, idx) => ({
      ...c,
      candidate_id: String(c.candidate_id || `cand-${idx + 1}`)
    }));

    // 4. PASS 2: Audit Viral & Pembobotan Skor Akurat (35% Hook, 30% Insight, 20% Alur, 15% Emosi)
    const auditedMap = new Map();
    if (candidates.length > 0) {
      try {
        const auditInput = candidates.map((c, idx) => ({
          index: idx,
          candidate_id: c.candidate_id,
          title: c.title,
          hook_headline: c.hook_headline,
          duration_sec: Math.round(((Number(c.end_sec) || 0) - (Number(c.start_sec) || 0)) * 10) / 10,
          full_transcript: c.full_transcript || ""
        }));

        const pass2Prompt = `Anda adalah Viral Content Director & Algorithm Auditor (PASS 2 - Audit Viral & Pembobotan Skor Akurat).
Evaluasi secara KRITIS setiap kandidat klip pada 4 kriteria berbobot (skala 55-99 per kriteria; bedakan nilai antar kandidat secara jujur—JANGAN memberi skor sama rata!):
1. hook_score (Bobot 35%): Kekuatan pancingan kalimat 3 detik awal.
2. insight_score (Bobot 30%): Kepadatan nilai edukasi/tips konkret tanpa basa-basi.
3. flow_score (Bobot 20%): Kejelasan alur cerita dari pembuka hingga penutup.
4. emotion_score (Bobot 15%): Intonasi emosi, urgensi, dan daya dorong interaksi.
Sertakan 'alasan_viral' (1 kalimat padat Bahasa Indonesia).

Kembalikan JSON murni:
{
  "evaluations": [
    { "candidate_id": "cand-1", "hook_score": 92, "insight_score": 88, "flow_score": 85, "emotion_score": 84, "alasan_viral": "Pembukaan langsung menantang asumsi umum dengan contoh konkret." }
  ]
}
Kandidat:
${JSON.stringify(auditInput)}`;

        const pass2Res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: pass2Prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          }
        );
        if (pass2Res.ok) {
          const pass2Data = await pass2Res.json();
          const parsedPass2 = JSON.parse(pass2Data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
          if (Array.isArray(parsedPass2.evaluations)) {
            parsedPass2.evaluations.forEach((ev) => {
              if (ev?.candidate_id) auditedMap.set(String(ev.candidate_id), ev);
            });
          }
        }
      } catch (_) {}
    }

    const scoredCandidates = candidates.map((c, idx) => {
      const ev = auditedMap.get(String(c.candidate_id));
      const clampCrit = (val, defVal) => Math.min(99, Math.max(55, Math.round(Number(val) || defVal)));
      const hook = clampCrit(ev?.hook_score, 86 - idx * 4);
      const insight = clampCrit(ev?.insight_score, 84 - idx * 3);
      const flow = clampCrit(ev?.flow_score, 82 - idx * 2);
      const emotion = clampCrit(ev?.emotion_score, 80 - idx * 3);
      const calibratedScore = Math.min(98, Math.max(65, Math.round(hook * 0.35 + insight * 0.3 + flow * 0.2 + emotion * 0.15)));
      return {
        ...c,
        viral_score: calibratedScore,
        score_breakdown: { hook, insight, flow, emotion },
        alasan_viral: String(ev?.alasan_viral || `Hook pembuka ${hook}% dengan kepadatan insight ${insight}% dan alur ${flow}%.`).trim()
      };
    });

    scoredCandidates.sort((a, b) => b.viral_score - a.viral_score);

    return res.status(200).json({
      title: videoTitle,
      mp4StreamUrl,
      clips: scoredCandidates.slice(0, 4)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Gagal memproses video di server" });
  }
}
