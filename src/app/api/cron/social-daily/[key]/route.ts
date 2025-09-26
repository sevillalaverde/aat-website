// src/app/api/cron/social-daily/[key]/route.ts
import { NextResponse } from "next/server";
import {
  composeSocial,
  resolveSlot,
  postToX,
  postToTelegram,
  postToDiscord,
  CHANNEL_X,
  CHANNEL_TELEGRAM,
  CHANNEL_DISCORD,
  type Slot,
} from "@/lib/social";

export async function GET(req: Request, { params }: { params: { key: string } }) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET || "super-secret-123";
  if (params.key !== secret) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const slot = (url.searchParams.get("slot") || "morning") as Slot;
  const dry = url.searchParams.get("dry") === "1";
  const v = parseInt(url.searchParams.get("v") || "2", 10) || 2;
  const seed = url.searchParams.get("seed") ? parseInt(url.searchParams.get("seed")!, 10) : undefined;

  const cfg = resolveSlot(slot);
  const copy = composeSocial({
    slot,
    topic: cfg.topic,
    tone: cfg.tone,
    links: cfg.links,
    variant: v,
    seed,
    xSuffix: process.env.SOCIAL_X_SUFFIX,
  });

  const result: Record<string, any> = { preview: copy };
  if (!dry) {
    if (CHANNEL_X) result.x = await postToX(copy.x);
    if (CHANNEL_TELEGRAM) result.telegram = await postToTelegram(copy.telegram);
    if (CHANNEL_DISCORD) result.discord = await postToDiscord(copy.discord);
  }

  return NextResponse.json(
    { ok: true, result: { slot, topic: cfg.topic, tone: cfg.tone, links: cfg.links, ...result, dry } },
    { status: 200 },
  );
}
