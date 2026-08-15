import { NextRequest, NextResponse } from "next/server";
import { getFileById } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(`/api/files/${id}/content`, req.url);
  return NextResponse.redirect(url);
}
