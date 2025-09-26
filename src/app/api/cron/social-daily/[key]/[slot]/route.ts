/* src/app/api/cron/social-daily/[key]/[slot]/route.ts */
import { NextResponse } from "next/server";
import {
  composeSocial,
  postToX,
  postToTelegram,
  postToDiscord,
  CHANNEL_X,
  CHANNEL_TELEGRAM,
  CHANNEL_DISCORD,
} from "@/lib/social";

export const dynamic = "force-dynamic";

type Params = { key: string; slot: "morning" | "midday" | "evening" };

export async function GET(req: Request, ctx: { params: Params }) {
  const { key, slot } = ctx.params;
  const u = new URL(req.url);
  const dry = u.searchParams.get("dry") === "1";
  const variant = Number(u.searchParams.get("v") || "0") || 0;

  const goodKey = process.env.CRON_SECRET || "super-secret-123";
  if (key !== goodKey) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

  // Compose varied copy (deterministic by date + slot + variant)
  const bundle = composeSocial({ slot, variant });

  const result: any = { slot, preview: bundle, channels: {} };

  if (dry) {
    return NextResponse.json({ ok: true, result, dry: true });
  }

  // Post to channels as enabled
  if (CHANNEL_X) {
    const r = await postToX(bundle.x);
    result.channels.x = r;
  }
  if (CHANNEL_TELEGRAM) {
    const r = await postToTelegram(bundle.telegram);
    result.channels.telegram = r;
  }
  if (CHANNEL_DISCORD) {
    const r = await postToDiscord(bundle.discord);
    result.channels.discord = r;
  }

  return NextResponse.json({ ok: true, result, dry: false });
}
