import { createClient } from "@libsql/client";

/**
 * Utilitas Koneksi Database Turso (libSQL) untuk ClipA Studio.
 * Mendukung mode koneksi remote Turso Edge dan fallback lokal in-memory
 * apabila variabel lingkungan TURSO_DATABASE_URL belum disetel.
 */

let tursoClient = null;

// Fallback in-memory storage jika TURSO_DATABASE_URL tidak disetel
const inMemoryStore = [
  {
    id: "ref-seed-1",
    type: "video",
    url_or_content: "https://assets.clipa.ai/presets/hormozi_fast_pace.mp4",
    editing_notes: "Potong jeda nafas 100% (zero silence). Zoom 1.15x tiap punchline. Subtitle font tebal kuning dengan bayangan hitam pekat.",
    created_at: new Date().toISOString()
  },
  {
    id: "ref-seed-2",
    type: "image",
    url_or_content: "https://assets.clipa.ai/presets/cyberpunk_neon_palette.png",
    editing_notes: "Grading warna high contrast dengan bayangan kebiruan dan highlight amber hangat. Text kartu semi-transparan.",
    created_at: new Date().toISOString()
  },
  {
    id: "ref-seed-3",
    type: "text",
    url_or_content: "Formula Hook 3 Detik: Pertanyaan Kontroversial -> Eskalasi Masalah -> Solusi Inti.",
    editing_notes: "Gunakan kata pembuka provokatif. Potong durasi tepat antara 30-60 detik.",
    created_at: new Date().toISOString()
  }
];

export function getTursoClient() {
  if (tursoClient) return tursoClient;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    try {
      tursoClient = createClient({
        url,
        authToken: authToken || undefined,
      });
      return tursoClient;
    } catch (err) {
      console.warn("Gagal inisialisasi Turso client, menggunakan mode in-memory fallback:", err);
    }
  }

  return null;
}

/**
 * Inisialisasi tabel references pada Turso jika belum ada.
 */
export async function initDatabase() {
  const client = getTursoClient();
  if (!client) {
    return { success: true, mode: "in-memory" };
  }

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "references" (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        url_or_content TEXT NOT NULL,
        editing_notes TEXT NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    return { success: true, mode: "turso" };
  } catch (err) {
    console.error("Gagal menjalankan schema migration di Turso:", err);
    return { success: false, error: err.message, mode: "in-memory-fallback" };
  }
}

/**
 * Mengambil semua referensi dari Turso DB (atau fallback in-memory)
 */
export async function getAllReferences() {
  const client = getTursoClient();

  if (!client) {
    return [...inMemoryStore];
  }

  try {
    const result = await client.execute(`
      SELECT id, type, url_or_content, editing_notes, created_at 
      FROM "references" 
      ORDER BY created_at DESC;
    `);

    return result.rows.map(row => ({
      id: String(row.id),
      type: String(row.type),
      url_or_content: String(row.url_or_content),
      editing_notes: String(row.editing_notes || ''),
      created_at: String(row.created_at)
    }));
  } catch (err) {
    console.warn("Gagal membaca data dari Turso, beralih ke in-memory store:", err);
    return [...inMemoryStore];
  }
}

/**
 * Menambahkan referensi baru ke Turso DB
 */
export async function insertReference({ id, type, url_or_content, editing_notes }) {
  const newId = id || `ref-${Date.now()}`;
  const now = new Date().toISOString();
  const cleanType = type || "text";
  const content = url_or_content || "";
  const notes = editing_notes || "";

  const client = getTursoClient();

  if (!client) {
    const item = {
      id: newId,
      type: cleanType,
      url_or_content: content,
      editing_notes: notes,
      created_at: now
    };
    inMemoryStore.unshift(item);
    return item;
  }

  try {
    await client.execute({
      sql: `INSERT INTO "references" (id, type, url_or_content, editing_notes, created_at) VALUES (?, ?, ?, ?, ?);`,
      args: [newId, cleanType, content, notes, now]
    });

    return {
      id: newId,
      type: cleanType,
      url_or_content: content,
      editing_notes: notes,
      created_at: now
    };
  } catch (err) {
    console.warn("Gagal insert ke Turso, menyimpan ke in-memory store:", err);
    const item = {
      id: newId,
      type: cleanType,
      url_or_content: content,
      editing_notes: notes,
      created_at: now
    };
    inMemoryStore.unshift(item);
    return item;
  }
}

/**
 * Menghapus referensi berdasarkan ID
 */
export async function deleteReference(id) {
  const client = getTursoClient();

  if (!client) {
    const idx = inMemoryStore.findIndex(r => r.id === id);
    if (idx !== -1) {
      inMemoryStore.splice(idx, 1);
      return { success: true };
    }
    return { success: false, notFound: true };
  }

  try {
    await client.execute({
      sql: `DELETE FROM "references" WHERE id = ?;`,
      args: [id]
    });
    return { success: true };
  } catch (err) {
    console.error("Gagal menghapus dari Turso:", err);
    return { success: false, error: err.message };
  }
}
