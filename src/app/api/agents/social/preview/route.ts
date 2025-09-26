/* src/app/api/agents/social/preview/route.ts */
import { NextResponse } from "next/server";
import { composeSocial } from "@/lib/social";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const slot = (body.slot || "morning") as "morning" | "midday" | "evening";
    const topic = body.topic as string | undefined;
    const tone  = body.tone as string | undefined;
    const links = (Array.isArray(body.links) ? body.links : undefined) as string[] | undefined;
    const variant = Number(body.v || 0) || 0;

    const result = composeSocial({ slot, topic, tone, links, variant });
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
