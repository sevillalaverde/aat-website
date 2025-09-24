// src/app/api/cron/social-daily/[key]/route.ts
import { NextResponse } from "next/server";
import { composeSocial, postToX, postToTelegram, postToDiscord } from "@/lib/social";

export async function GET(req: Request, { params }: { params: { key: string } }) {
  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1" || url.searchParams.get("dry") === "true";
  const slot = (url.searchParams.get("slot") || "evening") as "morning" | "midday" | "evening" | "preview";

  if (params.key !== (process.env.CRON_SECRET || "super-secret-123")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = composeSocial({ slot });

    // Always return the preview; optionally post live if not dry
    let xRes: any = null, tgRes: any = null, dcRes: any = null;

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
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "cron error" }, { status: 500 });
  }
}

function on(v?: string | boolean | null, d = false) {
  if (typeof v === "boolean") return v;
  if (!v) return d;
  const s = String(v).toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "y";
}
