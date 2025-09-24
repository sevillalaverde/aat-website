// src/app/api/agents/social/preview/route.ts
import { NextResponse } from "next/server";
import { composeSocial } from "@/lib/social";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const topic = String(body?.topic || "daily-brief");
    const tone  = String(body?.tone  || "credible");
    const links = Array.isArray(body?.links)
      ? body.links
      : String(body?.links || "").split(/\s+/).filter(Boolean);

    const out = await composeSocial({
      topic, tone, links, seed: Date.now() / 86400000 | 0
    });

    return NextResponse.json({ ok: true, result: { preview: out } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}
