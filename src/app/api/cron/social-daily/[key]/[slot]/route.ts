// src/app/api/cron/social-daily/[key]/[slot]/route.ts
import { NextResponse } from "next/server";
import { composeSocial, postToX, postToTelegram, postToDiscord, Slot } from "@/lib/social";

// Read env with sane defaults
const on = (v?: string, d = false) => (typeof v === "string" ? v.toLowerCase() === "true" : d);

function envList(name: string, fallback: string[] = []) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw.split(/\s+/).filter(Boolean);
}

export async function GET(
  req: Request,
  ctx: { params: { key: string; slot?: string } }
) {
  return handle(req, ctx);
}

export async function POST(
  req: Request,
  ctx: { params: { key: string; slot?: string} }
) {
  return handle(req, ctx);
}

async function handle(req: Request, ctx: { params: { key: string; slot?: string } }) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams;

    // Secret
    const okKey = process.env.CRON_SECRET || "super-secret-123";
    if (ctx.params.key !== okKey) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // Slot via path `/.../:slot` OR query `?slot=...`
    const slot = (ctx.params.slot || search.get("slot") || "morning") as Slot;

    // Optionally override via query
    const topic =
      search.get("topic") ||
      process.env[`SOCIAL_${slot.toUpperCase()}_TOPIC`] ||
      process.env.SOCIAL_TOPIC ||
      "daily-brief";

    const tone =
      (search.get("tone") ||
        process.env[`SOCIAL_${slot.toUpperCase()}_TONE`] ||
        process.env.SOCIAL_TONE ||
        "credible") as any;

    const links =
      search.get("links")
        ? search.get("links")!.split(",")
        : envList(`SOCIAL_${slot.toUpperCase()}_LINKS`, envList("SOCIAL_LINKS", ["https://theaat.xyz"]));

    const dry = search.get("dry") === "1" || search.get("dry") === "true";
    const variant = Number(search.get("v") || "0") || 0;

    const preview = composeSocial({ slot, topic, tone, links, variant });

    // If dry-run, return preview only:
    if (dry) {
      return NextResponse.json({ ok: true, result: { slot, topic, tone, links, preview }, dry: true });
    }

    // Post depending on channel toggles
    const doX = on(process.env.SOCIAL_CHANNEL_X, true);
    const doTG = on(process.env.SOCIAL_CHANNEL_TELEGRAM, true);
    const doDC = on(process.env.SOCIAL_CHANNEL_DISCORD, true);

    const [xRes, tgRes, dcRes] = await Promise.all([
      doX ? postToX(preview.x) : Promise.resolve({ ok: false, skipped: true }),
      doTG ? postToTelegram(preview.telegram) : Promise.resolve({ ok: false, skipped: true }),
      doDC ? postToDiscord(preview.discord) : Promise.resolve({ ok: false, skipped: true }),
    ]);

    return NextResponse.json({
      ok: true,
      result: {
        slot,
        topic,
        tone,
        links,
        preview,
        x: xRes,
        telegram: tgRes,
        discord: dcRes,
      },
      dry: false,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}
