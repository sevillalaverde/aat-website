// src/lib/social.ts
/* Utilities + posting helpers + copy composer for Social Agent */

import { TwitterApi } from "twitter-api-v2";

/* ------------ Channel toggles (read from env) ------------- */
export const CHANNEL_X = (process.env.SOCIAL_CHANNEL_X || "true") === "true";
export const CHANNEL_TELEGRAM =
  (process.env.SOCIAL_CHANNEL_TELEGRAM || "true") === "true";
export const CHANNEL_DISCORD =
  (process.env.SOCIAL_CHANNEL_DISCORD || "true") === "true";

/** Convenience helper used by some routes */
export function channels() {
  return { x: CHANNEL_X, telegram: CHANNEL_TELEGRAM, discord: CHANNEL_DISCORD };
}

/* ---------------- Slot config resolver -------------------- */
export type Slot = "morning" | "midday" | "evening";

export function resolveSlot(slot: Slot) {
  // base defaults
  const baseTopic = process.env.SOCIAL_TOPIC || "daily-brief";
  const baseTone = process.env.SOCIAL_TONE || "credible";
  const baseLinks = (process.env.SOCIAL_LINKS || "")
    .split(" ")
    .filter(Boolean);

  // per-slot overrides
  const up = (s: string) => s.toUpperCase();
  const topic =
    process.env[`SOCIAL_${up(slot)}_TOPIC`] || baseTopic;
  const tone =
    process.env[`SOCIAL_${up(slot)}_TONE`] || baseTone;
  const links = (
    process.env[`SOCIAL_${up(slot)}_LINKS`] || baseLinks.join(" ")
  )
    .split(" ")
    .filter(Boolean);

  return { topic, tone, links };
}

/* ---------------- Copy composer (with variants) ------------ */

type ComposeIn = {
  slot: Slot;
  topic: string;
  tone: string;
  links: string[];
  /** optional variant number (1..n). If omitted we pick based on seed. */
  variant?: number;
  /** deterministic seed; if omitted we derive from date+slot */
  seed?: number;
  /** optional X suffix (e.g., hashtags) */
  xSuffix?: string;
};

type ComposeOut = {
  x: string;
  telegram: string;
  discord: string;
  meta: { seed: number; variant: number; picked: string[] };
};

/** tiny deterministic RNG */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todaySeed(slot: Slot) {
  // seed by UTC yyyy-mm-dd + slot so each day+slot is stable/different
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  const base = Number(`${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`);
  const slotMap: Record<Slot, number> = { morning: 17, midday: 73, evening: 221 };
  return base * 9973 + slotMap[slot];
}

const bulletLibrary = [
  "Protocol roadmap checkpoints",
  "AI agents reliability & guardrails",
  "Community Q&A + highlights",
  "New repo commits & docs",
  "Partner + ecosystem notes",
  "Gas, fees & network health",
  "Market breadth / risk monitor",
];

const openers: Record<string, string[]> = {
  "daily-brief": [
    "AAT daily-brief.",
    "Quick AAT daily-brief.",
    "Today’s AAT update.",
  ],
  announcement: [
    "AAT announcement.",
    "Heads up from AAT.",
    "Fresh news from AAT.",
  ],
  "token-update": [
    "AAT token update.",
    "Latest on $AAT.",
    "Progress on $AAT.",
  ],
};

function pickN(rng: () => number, arr: string[], n: number) {
  const copy = [...arr];
  const picked: string[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rng() * copy.length);
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
}

export function composeSocial(input: ComposeIn): ComposeOut {
  const seed = input.seed ?? todaySeed(input.slot);
  const rng = mulberry32(seed);

  const topic = input.topic;
  const openerPool = openers[topic] || ["Update."];
  // select variant 1..3 if not provided
  const variant =
    input.variant && input.variant > 0
      ? input.variant
      : Math.floor(rng() * 3) + 1;

  const chosenOpener = openerPool[Math.floor(rng() * openerPool.length)];
  const bullets = pickN(rng, bulletLibrary, 2 + Math.floor(rng() * 2)); // 2-3 bullets
  const linksText =
    input.links && input.links.length ? input.links.join(" ") : "";

  const disclaimerX = "Not financial advice.";
  const disclaimer = "For research. No investment advice.";

  const xSuffix = input.xSuffix || (process.env.SOCIAL_X_SUFFIX || "").trim();

  // craft bodies
  const x =
    `${chosenOpener}\n` +
    bullets.map((b) => `• ${b}`).join("\n") +
    (linksText ? `\n\n${linksText}` : "") +
    (xSuffix ? ` ${xSuffix}` : "") +
    ` ${disclaimerX}`;

  const telegram =
    `${chosenOpener}\n` +
    bullets.map((b) => `• ${b}`).join("\n") +
    (linksText ? `\n\n${linksText}` : "") +
    `\n\n${disclaimer}`;

  const discord =
    `${chosenOpener}\n` +
    bullets.map((b) => `• ${b}`).join("\n") +
    (linksText ? `\n\n${linksText}` : "") +
    `\n\n${disclaimer}`;

  return { x, telegram, discord, meta: { seed, variant, picked: bullets } };
}

/* ---------------- Posting helpers ------------------------- */

export async function postToX(text: string) {
  const key = process.env.TWITTER_APP_KEY!;
  const secret = process.env.TWITTER_APP_SECRET!;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN!;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET!;

  if (!key || !secret || !accessToken || !accessSecret) {
    return { ok: false as const, error: "Missing Twitter credentials" };
  }
  try {
    const client = new TwitterApi({
      appKey: key,
      appSecret: secret,
      accessToken,
      accessSecret,
    });
    const { data } = await client.v2.tweet(text);
    return { ok: true as const, id: data?.id };
  } catch (err: any) {
    return { ok: false as const, error: err?.message || String(err) };
  }
}

export async function postToTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { ok: false as const, error: "Missing Telegram credentials" };
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
      }
    );
    const json = await res.json();
    if (!json.ok) return { ok: false as const, error: json.description };
    return { ok: true as const, id: json.result?.message_id };
  } catch (err: any) {
    return { ok: false as const, error: err?.message || String(err) };
  }
}

export async function postToDiscord(text: string) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return { ok: false as const, error: "Missing Discord webhook" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (!res.ok) return { ok: false as const, error: `HTTP ${res.status}` };
    return { ok: true as const };
  } catch (err: any) {
    return { ok: false as const, error: err?.message || String(err) };
  }
}
