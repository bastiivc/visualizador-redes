import { NextRequest, NextResponse } from "next/server";
import { getFilesList, createFile } from "@/lib/db";
import { parsePyVisStats } from "@/lib/utils";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "admin123";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folderIdParam = searchParams.get("folderId");
    
    // If folderId is "root" or null
    let folderIdFilter: string | null | undefined = undefined;
    if (folderIdParam !== null) {
      folderIdFilter = folderIdParam === "root" || folderIdParam === "" ? null : folderIdParam;
    }

    const filesList = await getFilesList(folderIdFilter);
    return NextResponse.json(filesList);
  } catch (error: any) {
    console.error("Error fetching files list:", error);
    return NextResponse.json(
      { error: "Error al obtener la lista de archivos." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminKeyHeader = req.headers.get("x-admin-key");
    if (adminKeyHeader !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: "No autorizado. Se requiere rol de Administrador para subir archivos." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, fileType, content, folderId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre del archivo es obligatorio." },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "El contenido del archivo es obligatorio." },
        { status: 400 }
      );
    }

    const normalizedFileType = (fileType || "html").toLowerCase();
    const fileSizeBytes = Buffer.byteLength(content, "utf-8");
    
    // Parse stats if HTML PyVis file
    let nodeCount: number | null = null;
    let edgeCount: number | null = null;
    if (normalizedFileType === "html") {
      const stats = parsePyVisStats(content);
      nodeCount = stats.nodeCount;
      edgeCount = stats.edgeCount;
    }

    const newRecord = await createFile({
      folderId: folderId || null,
      name: name.trim(),
      description: description ? description.trim() : null,
      fileType: normalizedFileType,
      content,
      fileSizeBytes,
      nodeCount,
      edgeCount,
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Error al guardar el archivo en la base de datos." },
      { status: 500 }
    );
  }
}
