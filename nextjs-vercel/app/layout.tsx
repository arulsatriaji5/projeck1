import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipA Studio - AI Video Repurposing & Client-Side Clipping",
  description: "Otomatisasi klip video YouTube & lokal ke format vertikal 9:16 TikTok dengan Gemini 2.5 Flash & FFmpeg.wasm di Vercel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-black text-white antialiased font-sans selection:bg-sky-500 selection:text-black min-h-screen">
        {children}
      </body>
    </html>
  );
}
