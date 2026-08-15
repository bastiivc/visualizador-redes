import { NextRequest, NextResponse } from "next/server";
import { getNetworkById, deleteNetwork } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "admin123";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const network = await getNetworkById(id);

    if (!network) {
      return NextResponse.json(
        { error: "Red no encontrada." },
        { status: 404 }
      );
    }

    // Exclude content from metadata view
    const { content, ...meta } = network;
    return NextResponse.json(meta);
  } catch (error: any) {
    console.error("Error fetching single network:", error);
    return NextResponse.json(
      { error: "Error al obtener la red." },
      { status: 500 }
    );
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
    const deleted = await deleteNetwork(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Red no encontrada o ya eliminada." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Red eliminada correctamente." });
  } catch (error: any) {
    console.error("Error deleting network:", error);
    return NextResponse.json(
      { error: "Error al eliminar la red." },
      { status: 500 }
    );
  }
}
