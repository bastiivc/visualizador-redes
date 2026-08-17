import { NextRequest, NextResponse } from "next/server";
import { getFolders, createFolder } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "admin123";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ancestorsOf = searchParams.get("ancestorsOf");
    if (ancestorsOf) {
      const { getFolderAncestors } = await import("@/lib/db");
      const path = await getFolderAncestors(ancestorsOf);
      return NextResponse.json(path);
    }

    const parentIdParam = searchParams.get("parentId");
    let parentIdFilter: string | null | undefined = undefined;
    if (parentIdParam !== null) {
      parentIdFilter = parentIdParam === "root" || parentIdParam === "" ? null : parentIdParam;
    }

    const foldersList = await getFolders(parentIdFilter);
    return NextResponse.json(foldersList);
  } catch (error: any) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Error al obtener las carpetas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminKeyHeader = req.headers.get("x-admin-key");
    if (adminKeyHeader !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: "No autorizado. Se requiere rol de Administrador para crear carpetas." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, color, parentId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la carpeta es obligatorio." },
        { status: 400 }
      );
    }

    const newFolder = await createFolder({
      name: name.trim(),
      description: description ? description.trim() : null,
      color: color || "cyan",
      parentId: parentId || null,
    });

    return NextResponse.json(newFolder, { status: 201 });
  } catch (error: any) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Error al crear la carpeta en la base de datos." },
      { status: 500 }
    );
  }
}
