// src/app/api/cron/social-daily/[[...params]]/route.ts
import { NextResponse } from "next/server";
import {
  composeSocial,
  resolveSlot,
  channels,
  postToX,
  postToTelegram,
  postToDiscord,
  type Slot,
} from "@/lib/social";

/**
 * Supports both:
 *   /api/cron/social-daily/<KEY>/<slot>?dry=1&v=2&seed=123
 * and
 *   /api/cron/social-daily/<KEY>?slot=morning&dry=1&v=2
 */
export async function GET(req: Request, ctx: { params: { params?: string[] } }) {
  const url = new URL(req.url);
  const parts = ctx.params.params || [];

  const secretFromPath = parts[0];
  const slotFromPath = parts[1];

  const secret = process.env.CRON_SECRET || "super-secret-123";
  if (secretFromPath !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const dry = url.searchParams.get("dry") === "1";
  const v = parseInt(url.searchParams.get("v") || "", 10) || 2;
  const seed = url.searchParams.get("seed")
    ? parseInt(url.searchParams.get("seed")!, 10)
    : undefined;

  const slot = (slotFromPath ||
    (url.searchParams.get("slot") as Slot) ||
    "morning") as Slot;

  // Resolve defaults (topic/tone/links) for the chosen slot
  const cfg = resolveSlot(slot);

  // Compose deterministic, varied copy
  const copy = composeSocial({
    slot,
    topic: cfg.topic,
    tone: cfg.tone,
    links: cfg.links,
    variant: v,
    seed,
    xSuffix: process.env.SOCIAL_X_SUFFIX,
  });

  const chan = channels();

  // Post (unless dry-run)
  const results: Record<string, any> = { preview: copy };
  if (!dry) {
    if (chan.x) results.x = await postToX(copy.x);
    if (chan.telegram) results.telegram = await postToTelegram(copy.telegram);
    if (chan.discord) results.discord = await postToDiscord(copy.discord);
  }

  return NextResponse.json(
    {
      ok: true,
      result: {
        slot,
        topic: cfg.topic,
        tone: cfg.tone,
        links: cfg.links,
        ...results,
        dry,
      },
    },
    { status: 200 }
  );
}
