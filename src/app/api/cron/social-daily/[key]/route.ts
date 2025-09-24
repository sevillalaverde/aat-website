// src/app/api/cron/social-daily/[key]/route.ts
import { NextResponse } from "next/server";
import { composeSocial, postToX, postToTelegram, postToDiscord, resolveSlot, channels } from "@/lib/social";

export async function GET(req: Request, { params }: { params: { key: string } }) {
  const secret = process.env.CRON_SECRET || "super-secret-123";
  if (params.key !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const slot = (url.searchParams.get("slot") || "morning") as "morning" | "midday" | "evening";
  const { topic, tone, links } = resolveSlot(slot);
  const copy = composeSocial({ slot, topic, tone, links });

  const chan = channels();
  let xRes: any = null, tgRes: any = null, dcRes: any = null;

  if (!dry && chan.x) xRes = await postToX(copy.x);
  if (!dry && chan.telegram) tgRes = await postToTelegram(copy.telegram);
  if (!dry && chan.discord) dcRes = await postToDiscord(copy.discord);

  return NextResponse.json({
    ok: true,
    result: { slot, topic, tone, links, preview: copy, x: xRes, telegram: tgRes, discord: dcRes, dry },
  });
}
