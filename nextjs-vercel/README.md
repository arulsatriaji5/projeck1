# ClipA Studio - Vercel & Turso Deployment Guide

Arsitektur aplikasi web full-stack modern untuk otomatisasi klip video vertikal TikTok (9:16) menggunakan **Next.js (App Router)**, **Turso (libSQL)**, **Gemini 2.5 Flash**, dan **FFmpeg.wasm**.

---

## Mengapa Client-Side Rendering untuk Video?

1. **Bebas Batasan Timeout Vercel**: Serverless Functions di Vercel memiliki batas eksekusi maksimum 10-60 detik. Rendering klip video panjang di server sering kali menyebabkan error `FUNCTION_INVOCATION_TIMEOUT`.
2. **Ketiadaan Biner FFmpeg**: Runtime Node.js Vercel tidak menyertakan biner native FFmpeg.
3. **Solusi FFmpeg.wasm**: Pemrosesan video dilakukan secara lokal di RAM browser pengguna menggunakan WebAssembly (`@ffmpeg/ffmpeg`), menghemat biaya server dan memberikan hasil render instan.

---

## Struktur Berkas Utama

```
nextjs-vercel/
├── app/
│   ├── api/
│   │   ├── analyze-video/
│   │   │   └── route.ts         # Endpoint Gemini 2.5 Flash (Multimodal Blueprint)
│   │   └── references/
│   │       └── route.ts         # CRUD API Route untuk Turso libSQL
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Halaman utama dengan integrasi client-side engine
├── components/
│   └── ClientVideoProcessor.tsx # Komponen pratinjau 9:16 & eksekutor render
├── hooks/
│   └── useFFmpeg.ts             # Custom hook @ffmpeg/ffmpeg & @ffmpeg/util
├── lib/
│   ├── turso.ts                 # Koneksi libSQL Turso dengan in-memory fallback
│   └── turso.js
├── schema.sql                   # Skema DDL tabel "references"
├── next.config.mjs              # Konfigurasi COOP/COEP untuk WebAssembly
├── package.json
└── .env.example
```

---

## Langkah 1: Persiapan Database Turso (libSQL)

1. Pasang CLI Turso di terminal Anda:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
2. Buat database baru untuk ClipA Studio:
   ```bash
   turso db create clipa-studio
   ```
3. Ambil URL database:
   ```bash
   turso db show clipa-studio --url
   # Contoh output: libsql://clipa-studio-username.turso.io
   ```
4. Buat token autentikasi:
   ```bash
   turso db tokens create clipa-studio
   ```
5. Eksekusi skema `schema.sql`:
   ```bash
   turso db shell clipa-studio < schema.sql
   ```

---

## Langkah 2: Menjalankan Secara Lokal

```bash
cd nextjs-vercel
npm install
cp .env.example .env.local
# Masukkan GEMINI_API_KEY, TURSO_DATABASE_URL, dan TURSO_AUTH_TOKEN
npm run dev
```

---

## Langkah 3: Deployment ke Vercel

1. Dorong repositori ini ke GitHub / GitLab.
2. Buka [Vercel Dashboard](https://vercel.com/) dan klik **Add New Project**.
3. Pilih repositori Anda, atur **Root Directory** ke `nextjs-vercel` (jika berada di sub-folder).
4. Tambahkan Environment Variables di Vercel:
   - `GEMINI_API_KEY`: Kunci API Google AI Studio Anda.
   - `TURSO_DATABASE_URL`: URL database Turso Anda (`libsql://...`).
   - `TURSO_AUTH_TOKEN`: Token autentikasi Turso.
5. Klik **Deploy**. Proyek Anda langsung online dengan dukungan WebAssembly dan Edge Database!
