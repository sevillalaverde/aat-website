/* src/app/api/cron/social-daily/[[...params]]/route.ts */
import { NextResponse } from "next/server";
import {
  composeSocial,
  postToX,
  postToTelegram,
  postToDiscord,
  CHANNEL_X,
  CHANNEL_TELEGRAM,
  CHANNEL_DISCORD,
  resolveSlot,
} from "@/lib/social";
import { clear } from "console";

export const dynamic = "force-dynamic";

// Supports both:
//   /api/cron/social-daily/<KEY>/<slot>?dry=1&v=2
//   /api/cron/social-daily/<KEY>?slot=midday&dry=1
export async function GET(req: Request, ctx: { params?: { params?: string[] } }) {
  const segs = ctx.params?.params || [];
  const keyFromPath = segs[0] || "";
  const slotFromPath = segs[1];

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const v = Number(url.searchParams.get("v") || "0") || 0;

  const slot = resolveSlot(slotFromPath || url.searchParams.get("slot") || "morning");

  const secret = process.env.CRON_SECRET || "super-secret-123";
  if (keyFromPath !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // compose daily-varied copy
  const preview = composeSocial({ slot, variant: v });

  const result: any = { slot, preview, channels: {} };

  if (dry) {
    return NextResponse.json({ ok: true, result, dry: true });
  }

  if (CHANNEL_X)        result.channels.x        = await postToX(preview.x);
  if (CHANNEL_TELEGRAM) result.channels.telegram = await postToTelegram(preview.telegram);
  if (CHANNEL_DISCORD)  result.channels.discord  = await postToDiscord(preview.discord);

  return NextResponse.json({ ok: true, result, dry: false });
}
