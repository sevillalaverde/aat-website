import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { POST as previewPOST } from "../../../agents/social/preview/route"; // reuse generator

/** Parse boolean-ish env flags */
const on = (v?: string, d = false) => {
  const s = (v ?? (d ? "1" : "")).toString().trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y" || s === "on";
};

async function postToX(text: string) {
  const appKey = process.env.TWITTER_APP_KEY || "";
  const appSecret = process.env.TWITTER_APP_SECRET || "";
  const accessToken = process.env.TWITTER_ACCESS_TOKEN || "";
  const accessSecret = process.env.TWITTER_ACCESS_SECRET || "";
  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    return { ok: false, error: "missing_x_credentials" };
  }
  const client = new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
  const res = await client.v2.tweet(text);
  return { ok: true, id: res?.data?.id };
}

async function postToTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";
  if (!token || !chatId) return { ok: false, error: "missing_telegram_credentials" };
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: false }),
  });
  const j = await r.json().catch(() => null);
  return r.ok ? { ok: true, id: j?.result?.message_id } : { ok: false, error: j?.description || "telegram_error" };
}

async function postToDiscord(text: string) {
  const webhook = process.env.DISCORD_WEBHOOK_URL || "";
  if (!webhook) return { ok: false, error: "missing_discord_credentials" };
  const r = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text }),
  });
  return r.ok ? { ok: true } : { ok: false, error: "discord_webhook_error" };
}

export async function GET(_req: Request, ctx: { params: { key: string } }) {
  const key = ctx.params?.key || "";
  if (!key || key !== (process.env.CRON_SOCIAL_KEY || "")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Config via env
  const topic = process.env.SOCIAL_TOPIC || "daily-brief"; // daily-brief | announcement | token-update | custom
  const tone = process.env.SOCIAL_TONE || "credible";
  const links = (process.env.SOCIAL_LINKS || "").trim().split(/\s+/).filter(Boolean);
  const custom = topic === "custom" ? (process.env.SOCIAL_CUSTOM || "") : undefined;

  const channels = {
    x: on(process.env.SOCIAL_CHANNEL_X, false),          // default off (safety)
    telegram: on(process.env.SOCIAL_CHANNEL_TELEGRAM, false),
    discord: on(process.env.SOCIAL_CHANNEL_DISCORD, false),
  };

  // Generate text by reusing the preview generator
  const reqBody = { topic, tone, links, custom };
  const fakeReq = new Request("http://local/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reqBody),
  });
  const preRes = await previewPOST(fakeReq);
  const preJson = await preRes.json();
  if (!preJson?.ok) {
    return NextResponse.json({ ok: false, error: "preview_failed" }, { status: 500 });
  }
  const preview = preJson.preview as { x: string; telegram: string; discord: string };

  const result: any = { preview, x: null, telegram: null, discord: null };

  if (channels.x && preview.x) {
    try { result.x = await postToX(preview.x); } catch (e: any) { result.x = { ok: false, error: e?.message || "x_error" }; }
  }
  if (channels.telegram && preview.telegram) {
    try { result.telegram = await postToTelegram(preview.telegram); } catch (e: any) { result.telegram = { ok: false, error: e?.message || "telegram_error" }; }
  }
  if (channels.discord && preview.discord) {
    try { result.discord = await postToDiscord(preview.discord); } catch (e: any) { result.discord = { ok: false, error: e?.message || "discord_error" }; }
  }

  return NextResponse.json({ ok: true, result });
}
