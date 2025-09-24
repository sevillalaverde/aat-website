// src/app/api/cron/social-daily/[key]/[slot]/route.ts
import { NextResponse } from "next/server";
import { composeSocial, postToX, postToTelegram, postToDiscord, resolveSlot, channels } from "@/lib/social";

export async function GET(req: Request, { params }: { params: { key: string; slot: "morning" | "midday" | "evening" } }) {
  const secret = process.env.CRON_SECRET || "super-secret-123";
  if (params.key !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const { topic, tone, links } = resolveSlot(params.slot);
  const copy = composeSocial({ slot: params.slot, topic, tone, links });

  const chan = channels();
  let xRes: any = null, tgRes: any = null, dcRes: any = null;

  if (!dry && chan.x) xRes = await postToX(copy.x);
  if (!dry && chan.telegram) tgRes = await postToTelegram(copy.telegram);
  if (!dry && chan.discord) dcRes = await postToDiscord(copy.discord);

  return NextResponse.json({
    ok: true,
    result: { slot: params.slot, topic, tone, links, preview: copy, x: xRes, telegram: tgRes, discord: dcRes, dry },
  });
}
