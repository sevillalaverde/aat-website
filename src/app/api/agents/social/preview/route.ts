// src/app/api/agents/social/preview/route.ts
import { NextResponse } from "next/server";
import { composeSocial } from "@/lib/social";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) || {};
    const topic = body?.topic as string | undefined;
    const tone = body?.tone as string | undefined;
    const links = (body?.links as string[] | undefined) || undefined;
    const slot = (body?.slot as "morning" | "midday" | "evening" | "preview") || "preview";

    const result = composeSocial({ slot, topic, tone, links });
    return NextResponse.json({ ok: true, result: { preview: result.preview } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "preview error" }, { status: 500 });
  }
}
