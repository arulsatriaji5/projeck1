export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method tidak diizinkan" });

  try {
    const { youtubeUrl, minSeconds = 15, maxSeconds = 30, styleNotes = "" } = req.body || {};
    const apiKey = process.env.GEMINI_API || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Environment variable GEMINI_API belum dipasang di Vercel." });
    }

    // Normalisasi URL YouTube standar agar terbaca oleh Gemini Multimodal
    const match = youtubeUrl.match(/(?:v=|youtu\.be\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
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

    // 3. Kirim video YouTube langsung ke Gemini 2.5 Flash (fileData) agar transkrip 100% akurat
    const prompt = `Dengarkan audio dan tonton video YouTube ini secara langsung.
Instruksi gaya: ${styleNotes || "Podcast/edukasi viral dinamis"}.
Pilih 3 sampai 4 segmen paling menarik dengan durasi WAJIB antara ${minSeconds} sampai ${maxSeconds} detik.
Transkripsikan ucapan ASLI pembicara kata demi kata (verbatim) ke dalam potongan subtitle pendek (maksimal 2-3 kata per blok) dengan timestamp akurat sesuai video. DILARANG mengarang teks yang tidak diucapkan.
Kembalikan JSON murni:
{
  "clips": [
    {
      "title": "Judul hook berdasarkan ucapan asli",
      "viral_score": 95,
      "start_sec": 12.0,
      "end_sec": 34.5,
      "subtitles": [
        { "start_sec": 12.0, "end_sec": 13.4, "text": "KATA ASLI" }
      ],
      "broll_moments": [
        { "start_sec": 15.0, "end_sec": 18.0, "visual_keyword": "stock market chart", "headline": "DATA RISET", "category_tag": "INSIGHT" }
      ]
    }
  ]
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { fileData: { fileUri: canonicalYoutubeUrl } },
                { text: prompt }
              ]
            }
          ],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API Error (${geminiRes.status}): ${errText}`);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(rawText);

    return res.status(200).json({
      title: videoTitle,
      mp4StreamUrl,
      clips: parsed.clips || []
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Gagal memproses video di server" });
  }
}
