// src/app/api/cron/social-daily/[key]/route.ts
import { NextResponse } from "next/server";
import {
  composeSocial,
  postToX,
  postToTelegram,
  postToDiscord,
  resolveSlot,
  CHANNEL_X,
  CHANNEL_TELEGRAM,
  CHANNEL_DISCORD,
} from "@/lib/social";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { key: string } }
) {
  const secret = process.env.CRON_SECRET || "super-secret-123";
  if (params.key !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const variant = Number(url.searchParams.get("v") || "0") || 0;
  const slot = resolveSlot(url.searchParams.get("slot") || "morning"); // "morning"|"midday"|"evening"

  // deterministic, varied copy for the day+slot (+ optional ?v=2)
  const preview = composeSocial({ slot, variant });

  // Dry-run: preview only, post nowhere
  if (dry) {
    return NextResponse.json({ ok: true, result: { slot, preview }, dry: true });
  }

  // Live fire to enabled channels
  const result: any = { slot, preview, channels: {} };
  if (CHANNEL_X)        result.channels.x        = await postToX(preview.x);
  if (CHANNEL_TELEGRAM) result.channels.telegram = await postToTelegram(preview.telegram);
  if (CHANNEL_DISCORD)  result.channels.discord  = await postToDiscord(preview.discord);

  return NextResponse.json({ ok: true, result, dry: false });
}
