import { NextRequest, NextResponse } from "next/server";
import { getFolderById, updateFolder, deleteFolder } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "admin123";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const folder = await getFolderById(id);
    if (!folder) {
      return NextResponse.json({ error: "Carpeta no encontrada." }, { status: 404 });
    }
    return NextResponse.json(folder);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener la carpeta." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminKeyHeader = req.headers.get("x-admin-key");
    if (adminKeyHeader !== ADMIN_SECRET) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, color } = body;

    const updated = await updateFolder(id, {
      name: name?.trim(),
      description: description?.trim() || null,
      color,
    });

    if (!updated) {
      return NextResponse.json({ error: "Carpeta no encontrada." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar la carpeta." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminKeyHeader = req.headers.get("x-admin-key");
    if (adminKeyHeader !== ADMIN_SECRET) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteFolder(id);

    if (!deleted) {
      return NextResponse.json({ error: "Carpeta no encontrada o ya eliminada." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Carpeta eliminada correctamente." });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar la carpeta." }, { status: 500 });
  }
}
