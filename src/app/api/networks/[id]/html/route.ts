import { NextRequest, NextResponse } from "next/server";
import { getNetworkById } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const network = await getNetworkById(id);

    if (!network) {
      return new NextResponse("<h1>404 - Red no encontrada</h1>", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new NextResponse(network.htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error: any) {
    console.error("Error serving HTML network view:", error);
    return new NextResponse("<h1>500 - Error al cargar la visualización</h1>", {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
