import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

/** -------- helpers -------- */
const on = (v?: string, d = false) => {
  const s = (v ?? (d ? "1" : "")).toString().trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y" || s === "on";
};

function uniqSuffix() {
  const tag = process.env.SOCIAL_X_SUFFIX || "#AAT";
  const t = new Date();
  const ts =
    `${t.getUTCFullYear()}${String(t.getUTCMonth() + 1).padStart(2, "0")}${String(t.getUTCDate()).padStart(2, "0")}` +
    `${String(t.getUTCHours()).padStart(2, "0")}${String(t.getUTCMinutes()).padStart(2, "0")}`;
  return ` ${tag} ${ts}`;
}
function withSuffix(x: string) {
  const suff = uniqSuffix();
  const max = 280;
  if (x.length + suff.length <= max) return x + suff;
  const keep = Math.max(0, max - suff.length - 1);
  return x.slice(0, keep).replace(/\s+$/, "") + " " + suff;
}

/** -------- text generation (OpenAI → Gemini → template) -------- */
type GenInput = { topic: string; tone: string; links: string[]; custom?: string };
type GenOut = { x: string; telegram: string; discord: string };

async function generateCopy(input: GenInput): Promise<GenOut> {
  const { topic, tone, links, custom } = input;
  const linkStr = links?.length ? links.join(" ") : "";

  const SYSTEM = `You are AAT's social bot. Produce channel-specific copy about the given topic.
Rules:
- Output JSON with keys: x, telegram, discord.
- x: <= 280 chars, 1-2 sentences, include at most 2 short hashtags, end with "Not financial advice."
- telegram: 2-3 sentences; invite to join AAT; end with "Not financial advice."
- discord: 1-2 sentences; invite to discuss in Discord; end with "Not financial advice."
- Use provided links if any; keep it concise and credible. No price predictions.`;

  const USER = `topic=${topic}; tone=${tone}; links=${linkStr || "(none)"}${
    custom ? `; custom="${custom}"` : ""
  }`;

  // 1) OpenAI
  try {
    const key = process.env.OPENAI_API_KEY || "";
    if (key) {
      const ai = new OpenAI({ apiKey: key });
      const res = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.5,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: USER },
        ],
        response_format: { type: "json_object" },
      });
      const text = res.choices?.[0]?.message?.content || "{}";
      const j = JSON.parse(text);
      if (j?.x && j?.telegram && j?.discord) return j as GenOut;
    }
  } catch (e) {
    // fall through to Gemini/template
  }

  // 2) Gemini
  try {
    const key = process.env.GEMINI_API_KEY || "";
    if (key) {
      const gen = new GoogleGenerativeAI(key);
      const model = gen.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
      const res = await model.generateContent(`${SYSTEM}\n\n${USER}`);
      const text = res.response.text();
      const j = JSON.parse(text);
      if (j?.x && j?.telegram && j?.discord) return j as GenOut;
    }
  } catch (e) {
    // fall through to template
  }

  // 3) Template fallback
  const base = `Not financial advice.`;
  const x = `AAT update: ${custom || topic}. ${linkStr} ${base}`.trim();
  return {
    x,
    telegram: `AAT update: ${custom || topic}. Join our community for more. ${linkStr} ${base}`.trim(),
    discord: `AAT update: ${custom || topic}. Discuss with the community. ${linkStr} ${base}`.trim(),
  };
}

/** -------- platform posters -------- */
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

/** -------- per-slot config -------- */
function slotCfg(slot: string) {
  const up = slot.toUpperCase(); // MORNING / MIDDAY / EVENING
  const topic = process.env[`SOCIAL_${up}_TOPIC`] || process.env.SOCIAL_TOPIC || "daily-brief";
  const tone = process.env[`SOCIAL_${up}_TONE`] || process.env.SOCIAL_TONE || "credible";
  const links =
    (process.env[`SOCIAL_${up}_LINKS`] || process.env.SOCIAL_LINKS || "")
      .split(/\s+/)
      .filter(Boolean);
  const custom =
    topic === "custom"
      ? process.env[`SOCIAL_${up}_CUSTOM`] || process.env.SOCIAL_CUSTOM || ""
      : undefined;

  const channels = {
    x: on(process.env[`SOCIAL_${up}_CHANNEL_X`], on(process.env.SOCIAL_CHANNEL_X, false)),
    telegram: on(
      process.env[`SOCIAL_${up}_CHANNEL_TELEGRAM`],
      on(process.env.SOCIAL_CHANNEL_TELEGRAM, false)
    ),
    discord: on(
      process.env[`SOCIAL_${up}_CHANNEL_DISCORD`],
      on(process.env.SOCIAL_CHANNEL_DISCORD, false)
    ),
  };

  return { topic, tone, links, custom, channels };
}

/** -------- handler -------- */
export async function GET(_req: Request, ctx: { params: { key: string; slot: string } }) {
  // secret in path
  const provided = ctx.params?.key || "";
  const expected = process.env.CRON_SECRET || "";
  if (!provided || !expected || provided !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const slot = (ctx.params?.slot || "morning").toLowerCase(); // morning|midday|evening
  const { topic, tone, links, custom, channels } = slotCfg(slot);

  // generate copy
  const preview = await generateCopy({ topic, tone, links, custom });
  const out: any = { slot, topic, tone, links, preview, x: null, telegram: null, discord: null };

  // post (X is made unique to avoid 403 duplicates)
  if (channels.x && preview.x) {
    try { out.x = await postToX(withSuffix(preview.x)); } catch (e: any) { out.x = { ok: false, error: e?.message || "x_error" }; }
  }
  if (channels.telegram && preview.telegram) {
    try { out.telegram = await postToTelegram(preview.telegram); } catch (e: any) { out.telegram = { ok: false, error: e?.message || "telegram_error" }; }
  }
  if (channels.discord && preview.discord) {
    try { out.discord = await postToDiscord(preview.discord); } catch (e: any) { out.discord = { ok: false, error: e?.message || "discord_error" }; }
  }

  return NextResponse.json({ ok: true, result: out });
}
