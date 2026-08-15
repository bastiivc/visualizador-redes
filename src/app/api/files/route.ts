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

    const contentType = req.headers.get("content-type") || "";

    // Handle Multipart FormData (recommended for large files)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const rawFile = formData.get("file") as File | null;
      const name = (formData.get("name") as string) || "";
      const description = (formData.get("description") as string) || "";
      const folderId = (formData.get("folderId") as string) || null;
      const customFileType = (formData.get("fileType") as string) || null;

      if (!name || !name.trim()) {
        return NextResponse.json(
          { error: "El nombre del archivo es obligatorio." },
          { status: 400 }
        );
      }

      if (!rawFile) {
        return NextResponse.json(
          { error: "No se proporcionó ningún archivo adjunto." },
          { status: 400 }
        );
      }

      const fileExtension = rawFile.name.toLowerCase().endsWith(".png") ? "png" : "html";
      const normalizedFileType = (customFileType || fileExtension).toLowerCase();

      // Read binary buffer directly from stream
      const arrayBuffer = await rawFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileId = crypto.randomUUID();
      const { saveStorageFile } = await import("@/lib/storage");
      const { storageKey, fileSizeBytes } = await saveStorageFile(fileId, normalizedFileType, buffer);

      let nodeCount: number | null = null;
      let edgeCount: number | null = null;

      if (normalizedFileType === "html") {
        // Parse PyVis stats from string content
        const textContent = buffer.toString("utf-8");
        const stats = parsePyVisStats(textContent);
        nodeCount = stats.nodeCount;
        edgeCount = stats.edgeCount;
      }

      const newRecord = await createFile({
        folderId: folderId || null,
        name: name.trim(),
        description: description ? description.trim() : null,
        fileType: normalizedFileType,
        content: null, // Stored on disk/S3
        storageKey,
        fileSizeBytes,
        nodeCount,
        edgeCount,
      });

      return NextResponse.json(newRecord, { status: 201 });
    }

    // Handle JSON payload (legacy / small files)
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

    // If payload is large (> 2MB), save to storage instead of inline DB
    let storageKey: string | null = null;
    let inlineContent: string | null = content;

    if (fileSizeBytes > 2 * 1024 * 1024) {
      const fileId = crypto.randomUUID();
      const { saveStorageFile } = await import("@/lib/storage");
      const buffer = Buffer.from(content, "utf-8");
      const saved = await saveStorageFile(fileId, normalizedFileType, buffer);
      storageKey = saved.storageKey;
      inlineContent = null;
    }

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
      content: inlineContent,
      storageKey,
      fileSizeBytes,
      nodeCount,
      edgeCount,
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error.message || "Error al guardar el archivo." },
      { status: 500 }
    );
  }
}
