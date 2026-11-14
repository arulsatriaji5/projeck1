import { createClient, Client } from "@libsql/client";

export interface TursoReference {
  id: string;
  type: 'video' | 'image' | 'text' | 'url';
  url_or_content: string;
  editing_notes: string;
  created_at: string;
}

let tursoClient: Client | null = null;

// Fallback in-memory storage jika TURSO_DATABASE_URL tidak disetel
const inMemoryStore: TursoReference[] = [
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

export function getTursoClient(): Client | null {
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

export async function initDatabase(): Promise<{ success: boolean; mode: string; error?: string }> {
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
  } catch (err: any) {
    console.error("Gagal menjalankan schema migration di Turso:", err);
    return { success: false, error: err.message, mode: "in-memory-fallback" };
  }
}

export async function getAllReferences(): Promise<TursoReference[]> {
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
      type: row.type as 'video' | 'image' | 'text' | 'url',
      url_or_content: String(row.url_or_content),
      editing_notes: String(row.editing_notes || ''),
      created_at: String(row.created_at)
    }));
  } catch (err) {
    console.warn("Gagal membaca data dari Turso, beralih ke in-memory store:", err);
    return [...inMemoryStore];
  }
}

export async function insertReference(data: {
  id?: string;
  type?: 'video' | 'image' | 'text' | 'url';
  url_or_content: string;
  editing_notes?: string;
}): Promise<TursoReference> {
  const newId = data.id || `ref-${Date.now()}`;
  const now = new Date().toISOString();
  const cleanType = data.type || "text";
  const content = data.url_or_content || "";
  const notes = data.editing_notes || "";

  const client = getTursoClient();

  if (!client) {
    const item: TursoReference = {
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
    const item: TursoReference = {
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

export async function deleteReference(id: string): Promise<{ success: boolean; notFound?: boolean; error?: string }> {
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
  } catch (err: any) {
    console.error("Gagal menghapus dari Turso:", err);
    return { success: false, error: err.message };
  }
}
