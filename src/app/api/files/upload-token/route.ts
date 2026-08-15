import { NextRequest, NextResponse } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "admin123";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "redes-files";

export async function GET(req: NextRequest) {
  const adminKeyHeader = req.headers.get("x-admin-key");
  if (adminKeyHeader !== ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const isConfigured =
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL.startsWith("http") &&
    typeof SUPABASE_SERVICE_KEY === "string";

  if (!isConfigured) {
    return NextResponse.json({ configured: false });
  }

  return NextResponse.json({
    configured: true,
    url: SUPABASE_URL!.trim().replace(/\/+$/, ""),
    key: SUPABASE_SERVICE_KEY!.trim(),
    bucket: SUPABASE_BUCKET,
  });
}
