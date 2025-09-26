// src/app/api/admin/tokens/route.ts
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const TOKENS_PATH = join(process.cwd(), "content", "tokens.json");

export async function GET() {
  try {
    const buf = await readFile(TOKENS_PATH);
    const tokens = JSON.parse(buf.toString());
    return NextResponse.json({ ok: true, tokens });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "read error", tokens: [] },
      { status: 200 }
    );
  }
}

// NOTE: Writes to the filesystem won’t work on Vercel’s serverless runtime.
// Keep POST/PUT/DELETE out or back them with a DB/KV if you need edits in prod.
