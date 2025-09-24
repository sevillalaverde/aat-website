/* src/app/api/cron/social-daily/[key]/[slot]/route.ts */
import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { buildSocialCopy, postToTelegram, postToDiscord } from "@/lib/social";

const on = (v?: string, d = false) => {
  const s = (v ?? "").toString().trim().toLowerCase();
  if (!s) return d;
  return ["1", "true", "yes", "y"].includes(s);
};

export async function GET(req: Request, ctx: { params: { key: string; slot: string } }) {
  try {
    const { key, slot } = ctx.params;
    if (key !== (process.env.CRON_SECRET || "")) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    const url = new URL(req.url);
    const dry = url.searchParams.get("dry") === "1";

    const topic = process.env[`SOCIAL_${slot.toUpperCase()}_TOPIC`] || undefined;
    const tone  = process.env[`SOCIAL_${slot.toUpperCase()}_TONE`]  || undefined;
    const links =
      (process.env[`SOCIAL_${slot.toUpperCase()}_LINKS`] || process.env.SOCIAL_LINKS || "")
        .split(/\s+/)
        .filter(Boolean);

    const preview = await buildSocialCopy(topic, tone, links, slot);

    const chanX  = on(process.env[`SOCIAL_${slot.toUpperCase()}_CHANNEL_X`], on(process.env.SOCIAL_CHANNEL_X, true));
    const chanTg = on(process.env[`SOCIAL_${slot.toUpperCase()}_CHANNEL_TELEGRAM`], on(process.env.SOCIAL_CHANNEL_TELEGRAM, true));
    const chanDc = on(process.env[`SOCIAL_${slot.toUpperCase()}_CHANNEL_DISCORD`], on(process.env.SOCIAL_CHANNEL_DISCORD, true));

    const result: any = { slot, topic: topic ?? "(auto-rotated)", tone: tone ?? "credible", preview };

    if (!dry && chanX) {
      try {
        const tw = new TwitterApi({
          appKey: process.env.TWITTER_APP_KEY || "",
          appSecret: process.env.TWITTER_APP_SECRET || "",
          accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
          accessSecret: process.env.TWITTER_ACCESS_SECRET || "",
        });
        const out = await tw.v2.tweet(preview.x);
        result.x = { ok: true, id: out?.data?.id };
      } catch (e: any) {
        result.x = { ok: false, error: String(e?.data?.detail || e?.message || e) };
      }
    } else result.x = { ok: !chanX ? null : true, dry };

    if (!dry && chanTg) result.telegram = await postToTelegram(preview.telegram);
    else result.telegram = { ok: !chanTg ? null : true, dry };

    if (!dry && chanDc) result.discord = await postToDiscord(preview.discord);
    else result.discord = { ok: !chanDc ? null : true, dry };

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "cron error" }, { status: 500 });
  }
}
