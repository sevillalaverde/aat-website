// src/app/api/cron/social-daily/[[...params]]/route.ts
import { NextResponse } from "next/server";
import {
  channels,
  composeSocial,
  resolveSlot,
  postToX,
  postToTelegram,
  postToDiscord,
  type Slot,
} from "@/lib/social";

export async function GET(
  req: Request,
  { params }: { params: { params?: string[] } }
) {
  try {
    const url = new URL(req.url);
    const parts = params.params || [];          // e.g. [<key>, 'morning']
    const keyFromPath = parts[0];
    const slotFromPath = parts[1] as Slot | undefined;

    const secret = process.env.CRON_SECRET || "super-secret-123";
    const keyFromQuery = url.searchParams.get("key") || "";
    const providedKey = keyFromPath || keyFromQuery;
    if (providedKey !== secret) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const slot = (slotFromPath || (url.searchParams.get("slot") as Slot) || "morning") as Slot;
    const dry = url.searchParams.get("dry") === "1";

    // parse optional variant & seed
    const variant = url.searchParams.get("v")
      ? Number(url.searchParams.get("v"))
      : undefined;
    const seedParam = url.searchParams.get("seed");
    const seed = typeof seedParam === "string" ? Number(seedParam) : undefined;

    const { topic, tone, links } = resolveSlot(slot);
    const copy = composeSocial({
      slot,
      topic,
      tone,
      links,
      variant,
      seed,                           // ✅ now number | undefined
      xSuffix: process.env.SOCIAL_X_SUFFIX,
    });

    const ch = channels();
    const result: any = { slot, topic, tone, links, preview: copy, dry, used: ch };

    if (!dry) {
      if (ch.x) result.x = await postToX(copy.x);
      if (ch.telegram) result.telegram = await postToTelegram(copy.telegram);
      if (ch.discord) result.discord = await postToDiscord(copy.discord);
    }

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}

// Support POST the same way (optional)
export const POST = GET;
