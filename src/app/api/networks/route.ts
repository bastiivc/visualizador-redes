import { NextRequest, NextResponse } from "next/server";
import { getNetworksList, createNetwork } from "@/lib/db";
import { parsePyVisStats } from "@/lib/utils";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "admin123";

export async function GET() {
  try {
    const list = await getNetworksList();
    return NextResponse.json(list);
  } catch (error: any) {
    console.error("Error fetching networks:", error);
    return NextResponse.json(
      { error: "Error al obtener la lista de redes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify Admin authentication header
    const adminKeyHeader = req.headers.get("x-admin-key");
    if (adminKeyHeader !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: "No autorizado. Se requiere rol de Administrador." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, htmlContent } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la red es obligatorio." },
        { status: 400 }
      );
    }

    if (!htmlContent || typeof htmlContent !== "string") {
      return NextResponse.json(
        { error: "El contenido HTML del archivo es obligatorio." },
        { status: 400 }
      );
    }

    // Estimate node and edge counts from PyVis HTML
    const fileSizeBytes = Buffer.byteLength(htmlContent, "utf-8");
    const { nodeCount, edgeCount } = parsePyVisStats(htmlContent);

    const newRecord = await createNetwork({
      name: name.trim(),
      description: description ? description.trim() : null,
      htmlContent,
      fileSizeBytes,
      nodeCount,
      edgeCount,
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error("Error creating network:", error);
    return NextResponse.json(
      { error: "Error al guardar la red en la base de datos." },
      { status: 500 }
    );
  }
}
