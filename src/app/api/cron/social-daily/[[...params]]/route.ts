// src/app/api/cron/social-daily/[[...params]]/route.ts
export const runtime = "nodejs";           // ensure Node runtime (not Edge)
export const dynamic = "force-dynamic";    // never cache

import { NextResponse } from "next/server";
import {
  composeSocial,
  postToX,
  postToTelegram,
  postToDiscord,
} from "@/lib/social";

type Slot = "morning" | "midday" | "evening" | "preview";

function on(v?: string | boolean | null, d = false) {
  if (typeof v === "boolean") return v;
  if (!v) return d;
  const s = String(v).toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "y";
}

export async function GET(
  req: Request,
  ctx: { params: { params?: string[] } }
) {
  try {
    const url = new URL(req.url);
    const segs = ctx.params.params || [];

    // Support:
    //   /api/cron/social-daily/<key>
    //   /api/cron/social-daily/<key>/<slot>
    const urlKey = segs[0];
    const segSlot = segs[1] as Slot | undefined;

    const querySlot = (url.searchParams.get("slot") || "") as Slot;
    const dry = on(url.searchParams.get("dry"), false);

    const keyFromEnv = process.env.CRON_SECRET || "super-secret-123";
    if (!urlKey || urlKey !== keyFromEnv) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const slot: Slot =
      (segSlot || querySlot || "evening").toLowerCase() as Slot;

    const payload = composeSocial({ slot });

    let xRes: any = null,
      tgRes: any = null,
      dcRes: any = null;

    if (!dry) {
      if (on(process.env.SOCIAL_CHANNEL_X, true)) {
        xRes = await postToX(payload.preview.x);
      }
      if (on(process.env.SOCIAL_CHANNEL_TELEGRAM, true)) {
        tgRes = await postToTelegram(payload.preview.telegram);
      }
      if (on(process.env.SOCIAL_CHANNEL_DISCORD, true)) {
        dcRes = await postToDiscord(payload.preview.discord);
      }
    }

    return NextResponse.json({
      ok: true,
      result: {
        slot: payload.slot,
        topic: payload.topic,
        tone: payload.tone,
        links: payload.links,
        preview: payload.preview,
        x: xRes,
        telegram: tgRes,
        discord: dcRes,
        dry,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "cron route crashed" },
      { status: 500 }
    );
  }
}
