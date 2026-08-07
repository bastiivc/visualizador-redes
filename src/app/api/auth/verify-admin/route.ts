import { NextRequest, NextResponse } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "admin123";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();

    if (key === ADMIN_SECRET) {
      return NextResponse.json({ success: true, message: "Modo Administrador activado." });
    }

    return NextResponse.json(
      { success: false, error: "Clave de administración incorrecta." },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error en el servidor." },
      { status: 500 }
    );
  }
}
