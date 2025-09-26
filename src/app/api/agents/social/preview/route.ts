// src/app/api/agents/social/preview/route.ts
import { NextResponse } from "next/server";
import { composeSocial, resolveSlot, type Slot } from "@/lib/social";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const slot = (body.slot || "morning") as Slot;
    const cfg = resolveSlot(slot);
    const copy = composeSocial({
      slot,
      topic: body.topic || cfg.topic,
      tone: body.tone || cfg.tone,
      links: (body.links as string[]) || cfg.links,
      variant: Number(body.v) || 2,
      seed: Number(body.seed) || undefined,
      xSuffix: process.env.SOCIAL_X_SUFFIX,
    });
    return NextResponse.json({ ok: true, result: { preview: copy } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
