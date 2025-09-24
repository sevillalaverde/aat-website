// src/app/api/agents/social/preview/route.ts
import { NextResponse } from "next/server";
import { composeSocial } from "@/lib/social";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const slot = (body?.slot || "morning") as any;
    const topic = (body?.topic || "daily-brief") as string;
    const tone = (body?.tone || "credible") as any;
    const links = (body?.links || []) as string[];
    const variant = Number(body?.variant || 0);

    const preview = composeSocial({ slot, topic, tone, links, variant });
    return NextResponse.json({ ok: true, result: preview });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "bad request" }, { status: 400 });
  }
}
