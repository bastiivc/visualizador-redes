import { NextRequest, NextResponse } from "next/server";
import { getFileById } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileRecord = await getFileById(id);

    if (!fileRecord) {
      return new NextResponse("<h1>404 - Archivo no encontrado</h1>", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (fileRecord.fileType === "png") {
      // Check if base64 data URI
      if (fileRecord.content.startsWith("data:image/png;base64,")) {
        const base64Data = fileRecord.content.replace(/^data:image\/png;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");
        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }

    // Default HTML or text response
    return new NextResponse(fileRecord.content, {
      status: 200,
      headers: {
        "Content-Type": fileRecord.fileType === "png" ? "image/png" : "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error: any) {
    console.error("Error serving file content:", error);
    return new NextResponse("<h1>500 - Error al cargar el archivo</h1>", {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
