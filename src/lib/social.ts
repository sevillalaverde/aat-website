// src/lib/social.ts
import { TwitterApi } from "twitter-api-v2";

export type Slot = "morning" | "midday" | "evening";
export type ComposeArgs = {
  slot: Slot;
  topic: string;
  tone: string;
  links: string[];
  variant?: number;
  seed?: number;
  xSuffix?: string;
};
export type Composed = { x: string; telegram: string; discord: string };

/* ── utils ─────────────────────────────────────────────────────────────── */
function hash(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}
function pick<T>(arr: T[], seed: number, salt = 0) {
  const idx = Math.abs((seed + salt) % arr.length);
  return arr[idx];
}
function clampX(msg: string) {
  return msg.length <= 280 ? msg : msg.slice(0, 277) + "…";
}
const on = (v?: string, d = false) =>
  typeof v === "string" ? /^(1|true|yes)$/i.test(v) : d;

/* ── slot defaults ─────────────────────────────────────────────────────── */
export function resolveSlot(slot: Slot) {
  if (slot === "morning") {
    return {
      topic: process.env.SOCIAL_MORNING_TOPIC || "daily-brief",
      tone: process.env.SOCIAL_MORNING_TONE || "credible",
      links: (process.env.SOCIAL_MORNING_LINKS ||
        "https://theaat.xyz/roadmap").split(/\s+/),
    };
  }
  if (slot === "midday") {
    return {
      topic: process.env.SOCIAL_MIDDAY_TOPIC || "announcement",
      tone: process.env.SOCIAL_MIDDAY_TONE || "educational",
      links: (process.env.SOCIAL_MIDDAY_LINKS ||
        "https://theaat.xyz/lab").split(/\s+/),
    };
  }
  return {
    topic: process.env.SOCIAL_EVENING_TOPIC || "community",
    tone: process.env.SOCIAL_EVENING_TONE || "hype-minimal",
    links: (process.env.SOCIAL_EVENING_LINKS ||
      "https://x.com/aait_ai https://t.me/american_aat").split(/\s+/),
  };
}

/* ── deterministic, varied composer (no LLM) ───────────────────────────── */
function composeVariant2(args: ComposeArgs): Composed {
  const { slot, topic, tone, links, seed: seedOverride, xSuffix } = args;

  const now = new Date();
  const key = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}:${slot}:${topic}:${tone}`;
  const daySeed =
    typeof seedOverride === "number"
      ? seedOverride
      : hash(key) + (parseInt(process.env.SOCIAL_SEED_OFFSET || "0", 10) || 0);

  const link = links[0] || "https://theaat.xyz";
  const suffix = (xSuffix || process.env.SOCIAL_X_SUFFIX || "").trim();
  const suffixWithSpace = suffix ? ` ${suffix}` : "";

  const hooksBrief = [
    "AAT daily-brief",
    "Quick AAT daily-brief",
    "Today’s AAT brief",
    "Market & protocol tick",
    "New day, fresh signals",
  ];
  const hooksAnn = [
    "New from the AI Lab",
    "AAT update",
    "Release note",
    "Heads-up",
    "What’s live",
  ];
  const hooksComm = [
    "Community pulse",
    "Holders update",
    "Builders’ corner",
    "What the community’s up to",
    "Contributor highlights",
  ];

  const stylesCredible = [
    "Not financial advice.",
    "DYOR. This is informational only.",
    "For research. No investment advice.",
  ];
  const stylesEdu = ["Learn more inside.", "Read the explainer.", "Breakdown in the thread."];
  const stylesHype = ["Let’s build.", "Onwards.", "Alpha is earned.", "We keep shipping."];

  const bulletsBrief = [
    "Protocol roadmap checkpoints",
    "AI agents reliability & guardrails",
    "Ecosystem integrations",
    "Community growth & content",
    "Listings & liquidity planning",
  ];
  const bulletsAnn = [
    "New tools in the AI Lab",
    "Model routing & failovers",
    "Better wallet UX",
    "Token-gated features",
    "Analytics previews",
  ];
  const bulletsComm = [
    "New members & feedback",
    "Ambassadors & spaces",
    "Docs & tutorials",
    "Open issues & PRs",
    "Roadmap votes",
  ];

  const hook =
    topic.includes("daily")
      ? pick(hooksBrief, daySeed, 1)
      : topic.includes("announce")
      ? pick(hooksAnn, daySeed, 2)
      : pick(hooksComm, daySeed, 3);

  const bset =
    topic.includes("daily")
      ? bulletsBrief
      : topic.includes("announce")
      ? bulletsAnn
      : bulletsComm;

  const b1 = pick(bset, daySeed, 10);
  let b2 = pick(bset, daySeed, 11);
  if (b2 === b1) b2 = pick(bset, daySeed, 12);

  const close =
    tone.includes("credible")
      ? pick(stylesCredible, daySeed, 20)
      : tone.includes("educational")
      ? pick(stylesEdu, daySeed, 21)
      : pick(stylesHype, daySeed, 22);

  const x = clampX(`${hook}: ${b1}; ${b2}. ${link}${suffixWithSpace} ${close}`);
  const telegram = `${hook}.\n• ${b1}\n• ${b2}\n\n${link}\n\n${close}`;
  const discord = `${hook} — discuss with the community.\n• ${b1}\n• ${b2}\n\n${link}\n\n${close}`;
  return { x, telegram, discord };
}

export function composeSocial(args: ComposeArgs): Composed {
  return composeVariant2(args);
}

/* ── channel toggles (both constants and helper for backwards-compat) ───── */
export const CHANNEL_X = on(process.env.SOCIAL_CHANNEL_X, true);
export const CHANNEL_TELEGRAM = on(process.env.SOCIAL_CHANNEL_TELEGRAM, true);
export const CHANNEL_DISCORD = on(process.env.SOCIAL_CHANNEL_DISCORD, true);

export function channels() {
  return { x: CHANNEL_X, telegram: CHANNEL_TELEGRAM, discord: CHANNEL_DISCORD };
}

/* ── posters ────────────────────────────────────────────────────────────── */
export async function postToX(status: string) {
  const key = process.env.TWITTER_APP_KEY!;
  const secret = process.env.TWITTER_APP_SECRET!;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN!;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET!;
  if (!key || !secret || !accessToken || !accessSecret)
    return { ok: false as const, error: "Missing Twitter credentials" };

  try {
    const client = new TwitterApi({ appKey: key, appSecret: secret, accessToken, accessSecret });
    const { data } = await client.v2.tweet(status);
    return { ok: true as const, id: data?.id };
  } catch (e: any) {
    return { ok: false as const, error: String(e?.message || e) };
  }
}

export async function postToTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_CHAT_ID!;
  if (!token || !chatId) return { ok: false as const, error: "Missing Telegram env" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: false }),
    });
    const j = await res.json();
    return j?.ok ? { ok: true as const, id: j?.result?.message_id } : { ok: false as const, error: j?.description || "telegram error" };
  } catch (e: any) {
    return { ok: false as const, error: String(e?.message || e) };
  }
}

export async function postToDiscord(message: string) {
  const webhook = process.env.DISCORD_WEBHOOK_URL!;
  if (!webhook) return { ok: false as const, error: "Missing Discord webhook" };
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
    return res.ok ? { ok: true as const } : { ok: false as const, error: `discord ${res.status}` };
  } catch (e: any) {
    return { ok: false as const, error: String(e?.message || e) };
  }
}
