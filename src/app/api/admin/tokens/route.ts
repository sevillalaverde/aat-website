// src/app/api/admin/tokens/route.ts
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const buf = await readFile(join(process.cwd(), "content", "tokens.json"));
    const tokens = JSON.parse(buf.toString());
    return NextResponse.json({ ok: true, tokens });
  } catch (e: any) {
    return NextResponse.json({ ok: false, tokens: [], error: e?.message || "read error" });
  }
}
