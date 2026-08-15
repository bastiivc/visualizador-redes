import { NextRequest, NextResponse } from "next/server";
import { getFileById, updateFile, deleteFile } from "@/lib/db";
import { parsePyVisStats } from "@/lib/utils";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "admin123";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileRecord = await getFileById(id);

    if (!fileRecord) {
      return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
    }

    const { content, ...meta } = fileRecord;
    return NextResponse.json(meta);
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener el archivo." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminKeyHeader = req.headers.get("x-admin-key");
    if (adminKeyHeader !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: "No autorizado. Se requiere rol de Administrador." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, folderId, content, fileType } = body;

    const existing = await getFileById(id);
    if (!existing) {
      return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
    }

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (description !== undefined) updatePayload.description = description ? description.trim() : null;
    if (folderId !== undefined) updatePayload.folderId = folderId || null;

    // If new file content is provided (replacing the attached file!)
    if (content && typeof content === "string") {
      updatePayload.content = content;
      updatePayload.fileType = (fileType || existing.fileType).toLowerCase();
      updatePayload.fileSizeBytes = Buffer.byteLength(content, "utf-8");

      if (updatePayload.fileType === "html") {
        const stats = parsePyVisStats(content);
        updatePayload.nodeCount = stats.nodeCount;
        updatePayload.edgeCount = stats.edgeCount;
      } else {
        updatePayload.nodeCount = null;
        updatePayload.edgeCount = null;
      }
    }

    const updated = await updateFile(id, updatePayload);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating file:", error);
    return NextResponse.json({ error: "Error al editar el archivo." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminKeyHeader = req.headers.get("x-admin-key");
    if (adminKeyHeader !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: "No autorizado. Se requiere rol de Administrador para eliminar." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const deleted = await deleteFile(id);

    if (!deleted) {
      return NextResponse.json({ error: "Archivo no encontrado o ya eliminado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Archivo eliminado correctamente." });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al eliminar el archivo." }, { status: 500 });
  }
}
