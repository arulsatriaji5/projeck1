-- ====================================================================
-- ClipA Studio - Turso (libSQL) Database Schema for Vercel Next.js
-- Table: references (Gudang Referensi Editan Multi-Modal)
-- ====================================================================

CREATE TABLE IF NOT EXISTS "references" (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('video', 'image', 'text', 'url')),
    url_or_content TEXT NOT NULL,
    editing_notes TEXT NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_references_type ON "references"(type);
CREATE INDEX IF NOT EXISTS idx_references_created_at ON "references"(created_at DESC);

-- Seed Data Awal
INSERT OR IGNORE INTO "references" (id, type, url_or_content, editing_notes, created_at) VALUES 
('ref-seed-1', 'video', 'https://assets.clipa.ai/presets/hormozi_fast_pace.mp4', 'Potong jeda nafas 100% (zero silence). Zoom 1.15x tiap punchline. Subtitle font tebal kuning dengan bayangan hitam pekat.', CURRENT_TIMESTAMP),
('ref-seed-2', 'image', 'https://assets.clipa.ai/presets/cyberpunk_neon_palette.png', 'Grading warna high contrast dengan bayangan kebiruan dan highlight amber hangat. Text kartu semi-transparan.', CURRENT_TIMESTAMP),
('ref-seed-3', 'text', 'Formula Hook 3 Detik: Pertanyaan Kontroversial -> Eskalasi Masalah -> Solusi Inti.', 'Gunakan kata pembuka provokatif. Potong durasi tepat antara 30-60 detik.', CURRENT_TIMESTAMP);
