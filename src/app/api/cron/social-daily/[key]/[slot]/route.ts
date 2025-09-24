// src/app/api/cron/social-daily/[key]/[slot]/route.ts
import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { composeSocial, rotationForToday } from "@/lib/social";

/** helpers */
const on = (v?: string, d = false) => {
  if (v === undefined) return d;
  return /^true$/i.test(String(v)) || v === "1";
};

export async function GET(
  _req: Request,
  ctx: { params: { key: string; slot: string } }
) {
  try {
    // 0) shared-secret
    const { key, slot } = ctx.params;
    const good = key && process.env.CRON_SECRET && key === process.env.CRON_SECRET;
    if (!good) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    // 1) rotation (even if the path says “morning”, choose by day-of-week)
    const rot = rotationForToday();
    const topic = process.env[`SOCIAL_${slot.toUpperCase()}_TOPIC`] || process.env.SOCIAL_TOPIC || rot.topic;
    const tone  = process.env[`SOCIAL_${slot.toUpperCase()}_TONE`]  || process.env.SOCIAL_TONE  || rot.tone;
    const links = (
      process.env[`SOCIAL_${slot.toUpperCase()}_LINKS`] ||
      process.env.SOCIAL_LINKS ||
      "https://theaat.xyz https://x.com/aait_ai"
    ).split(/\s+/).filter(Boolean);

    const seed = Date.now() / 86400000 | 0; // day-based seed
    const preview = await composeSocial({ topic, tone, links, seed });

    // 2) switches
    const postX   = on(process.env[`SOCIAL_${slot.toUpperCase()}_CHANNEL_X`], on(process.env.SOCIAL_CHANNEL_X, true));
    const postTG  = on(process.env[`SOCIAL_${slot.toUpperCase()}_CHANNEL_TELEGRAM`], on(process.env.SOCIAL_CHANNEL_TELEGRAM, true));
    const postDS  = on(process.env[`SOCIAL_${slot.toUpperCase()}_CHANNEL_DISCORD`], on(process.env.SOCIAL_CHANNEL_DISCORD, true));

    const result: any = { slot, topic, tone, links, preview, x: null, telegram: null, discord: null };

    // 3) X
    if (postX && process.env.TWITTER_APP_KEY) {
      try {
        const t = new TwitterApi({
          appKey: process.env.TWITTER_APP_KEY!,
          appSecret: process.env.TWITTER_APP_SECRET!,
          accessToken: process.env.TWITTER_ACCESS_TOKEN!,
          accessSecret: process.env.TWITTER_ACCESS_SECRET!,
        });
        const sent = await t.v2.tweet(preview.x);
        result.x = { ok: true, id: sent?.data?.id };
      } catch (e: any) {
        result.x = { ok: false, error: e?.data?.detail || e?.message || "x error" };
      }
    }

    // 4) Telegram
    if (postTG && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: preview.telegram,
            disable_web_page_preview: false,
            parse_mode: "HTML",
          }),
        });
        const j = await r.json();
        if (j?.ok) result.telegram = { ok: true, id: j?.result?.message_id };
        else       result.telegram = { ok: false, error: j?.description || "telegram error" };
      } catch (e: any) {
        result.telegram = { ok: false, error: e?.message || "telegram error" };
      }
    }

    // 5) Discord
    if (postDS && process.env.DISCORD_WEBHOOK_URL) {
      try {
        const r = await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: preview.discord }),
        });
        result.discord = { ok: r.ok };
      } catch (e: any) {
        result.discord = { ok: false, error: e?.message || "discord error" };
      }
    }

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "cron error" }, { status: 500 });
  }
}
