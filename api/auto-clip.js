export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  try {
    const { youtubeUrl, minSeconds = 15, maxSeconds = 30, styleNotes = "" } = req.body || {};
    const apiKey = process.env.GEMINI_API || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Environment variable GEMINI_API belum dipasang di Vercel."
      });
    }

    // 1. Ambil judul & nama channel asli YouTube lewat oEmbed
    let videoTitle = "Video YouTube";
    let authorName = "";
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`
      );
      if (oembedRes.ok) {
        const meta = await oembedRes.json();
        videoTitle = meta.title || videoTitle;
        authorName = meta.author_name || "";
      }
    } catch (_) {}

    // 2. Tarik direct MP4 stream lewat Cobalt API (jika tersedia)
    let mp4StreamUrl = null;
    try {
      const cobaltRes = await fetch("https://api.cobalt.tools/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: youtubeUrl,
          videoQuality: "720",
          filenameStyle: "basic"
        })
      });
      if (cobaltRes.ok) {
        const cobaltData = await cobaltRes.json();
        mp4StreamUrl = cobaltData.url || null;
      }
    } catch (_) {}

    // 3. Panggil Gemini 2.5 Flash REST API untuk menyusun segmen klip & subtitle
    const prompt = `Analisis video YouTube berjudul "${videoTitle}" oleh "${authorName}" (${youtubeUrl}).
Instruksi gaya pengguna: ${styleNotes || "Gaya edukasi/podcast viral dinamis"}.
Buat 3 segmen klip terbaik dengan durasi WAJIB antara ${minSeconds} sampai ${maxSeconds} detik per klip.
Kembalikan JSON murni dengan struktur:
{
  "clips": [
    {
      "title": "Judul hook klip",
      "viral_score": 94,
      "start_sec": 10,
      "end_sec": 35,
      "subtitles": [
        { "start_sec": 10, "end_sec": 13, "text": "POTONGAN TEKS SUBTITLE" }
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
          contents: [{ parts: [{ text: prompt }] }],
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
    return res.status(500).json({
      error: err.message || "Gagal memproses video di server"
    });
  }
}
