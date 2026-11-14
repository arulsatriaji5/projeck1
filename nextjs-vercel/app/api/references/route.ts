import { NextRequest, NextResponse } from "next/server";
import { getAllReferences, insertReference, deleteReference, initDatabase } from "@/lib/turso";

export const dynamic = "force-dynamic";

// GET: Ambil daftar seluruh referensi dari Turso
export async function GET() {
  try {
    await initDatabase();
    const references = await getAllReferences();
    return NextResponse.json({ success: true, count: references.length, references });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data referensi" },
      { status: 500 }
    );
  }
}

// POST: Tambahkan referensi baru ke Turso
export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json();
    const { type, url_or_content, editing_notes } = body;

    if (!url_or_content && !editing_notes) {
      return NextResponse.json(
        { success: false, error: "url_or_content atau editing_notes wajib diisi" },
        { status: 400 }
      );
    }

    const created = await insertReference({
      type: type || "video",
      url_or_content: url_or_content || "",
      editing_notes: editing_notes || ""
    });

    return NextResponse.json({ success: true, reference: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan referensi" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus referensi berdasarkan query ?id=... atau body json
export async function DELETE(req: NextRequest) {
  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // Query param only
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID referensi wajib disertakan" },
        { status: 400 }
      );
    }

    const result = await deleteReference(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus referensi" },
      { status: 500 }
    );
  }
}
