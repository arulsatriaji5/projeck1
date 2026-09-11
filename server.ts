import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Google GenAI Client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// API Endpoint to analyze YouTube URL and generate smart clips using Gemini AI
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
