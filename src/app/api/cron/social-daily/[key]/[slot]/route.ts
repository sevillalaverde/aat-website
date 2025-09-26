// src/app/api/cron/social-daily/[key]/[slot]/route.ts
import { NextResponse } from "next/server";
import {
  composeSocial,
  postToX,
  postToTelegram,
  postToDiscord,
  resolveSlot,
  channels,
  Slot,
} from "@/lib/social";

export async function GET(
  req: Request,
  ctx: { params: { key: string; slot: Slot } }
) {
  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const v = url.searchParams.get("v");
  const seed = url.searchParams.get("seed");
  const secret = process.env.CRON_SECRET || "super-secret-123";

  if (ctx.params.key !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const slot = (ctx.params.slot || "morning") as Slot;
  const { topic, tone, links } = resolveSlot(slot);
  const copy = composeSocial({
    slot,
    topic,
    tone,
    links,
    variant: v ? Number(v) : undefined,
    seed: seed ? Number(seed) : undefined,
    xSuffix: process.env.SOCIAL_X_SUFFIX,
  });

  const ch = channels();
  const result: any = { preview: copy, slot, dry, used: ch };

  if (!dry) {
    result.x = ch.x ? await postToX(copy.x) : { ok: false, skipped: true };
    result.telegram = ch.telegram
      ? await postToTelegram(copy.telegram)
      : { ok: false, skipped: true };
    result.discord = ch.discord
      ? await postToDiscord(copy.discord)
      : { ok: false, skipped: true };
  }

  return NextResponse.json({ ok: true, result });
}
