// src/app/api/agents/social/preview/route.ts
import { NextResponse } from "next/server";
import { composeSocial, resolveSlot, Slot } from "@/lib/social";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const slot = (body.slot || "morning") as Slot;

    const cfg = resolveSlot(slot);
    const out = composeSocial({
      slot,
      topic: body.topic || cfg.topic,
      tone: body.tone || cfg.tone,
      links: (body.links as string[]) || cfg.links,
      variant: body.v ? Number(body.v) : undefined,
      seed: body.seed ? Number(body.seed) : undefined,
      xSuffix: process.env.SOCIAL_X_SUFFIX,
    });

    return NextResponse.json({ ok: true, result: { preview: out, slot } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
