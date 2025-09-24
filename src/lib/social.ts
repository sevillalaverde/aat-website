// src/lib/social.ts
/* Helpers to compose varied social copy + post to X / Telegram / Discord */

import { TwitterApi } from "twitter-api-v2";

const bool = (v?: string, d = false) =>
  typeof v === "string" ? /^(1|true|yes|on)$/i.test(v) : d;

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function hashDate(seed = "") {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const h = String(now.getUTCHours()).padStart(2, "0");
  // Short daily code to avoid exact duplicates while staying human
  return `${y}${m}${d}${h.slice(0, 1)}${seed ? "-" + seed : ""}`;
}

export type ComposeInput = {
  slot: "morning" | "midday" | "evening";
  topic: string; // e.g. daily-brief | announcement | token-update
  tone: string;  // e.g. credible | educational | hype-minimal
  links?: string[];
  tag?: string;  // default #AAT
};

export function composeSocial({
  slot,
  topic,
  tone,
  links = [],
  tag = process.env.SOCIAL_X_SUFFIX || "#AAT",
}: ComposeInput) {
  const link = links[0] || "https://theaat.xyz";
  const altLink = links[1] || "https://theaat.xyz/roadmap";
  const code = hashDate(slot === "morning" ? "a" : slot === "midday" ? "b" : "c");

  const openers = {
    "daily-brief": [
      "AAT daily brief:",
      "Quick market pulse:",
      "Morning rundown:",
      "Today’s snapshot:",
      "AAT update:",
    ],
    announcement: [
      "Heads up:",
      "New from AAT:",
      "Announcement:",
      "Shipping update:",
      "Dev note:",
    ],
    "token-update": [
      "Token update:",
      "Holders’ note:",
      "$AAT update:",
      "Protocol update:",
    ],
  } as Record<string, string[]>;

  const tones = {
    credible: [
      "Stay informed on what matters. Not financial advice.",
      "Built for clarity and signal over noise. Not financial advice.",
      "Facts first. Not financial advice.",
    ],
    educational: [
      "Learn, compare, and decide. Not financial advice.",
      "Breakdowns without the hype. Not financial advice.",
      "Step-by-step insights. Not financial advice.",
    ],
    "hype-minimal": [
      "Big week ahead—stay close. Not financial advice.",
      "Momentum builds. Eyes on the roadmap. Not financial advice.",
      "Simplify. Execute. Not financial advice.",
    ],
  } as Record<string, string[]>;

  const closer = pick(tones[tone] || tones.credible);
  const intro =
    pick(openers[topic] || openers["daily-brief"]) +
    (slot === "morning"
      ? " coffee-ready ☕"
      : slot === "midday"
      ? " halftime check ⚙️"
      : " evening wrap 🌙");

  // X is short; TG/DC can be longer
  const xTemplates = [
    `${intro} ${link} ${tag}`,
    `${intro} ${altLink} ${tag}`,
    `${intro} ${pick([link, altLink])} ${tag} ${code}`,
  ];

  const tgTemplates = [
    `${intro}\n\nJoin the conversation: ${link}\n\n${closer}`,
    `${intro}\n\nDetails: ${altLink}\n\n${closer}`,
    `${intro}\n\nRead more → ${pick([link, altLink])}\n\n${closer}`,
  ];

  const dcTemplates = [
    `${intro} Discuss with the community. ${link} ${closer}`,
    `${intro} Chime in on the thread: ${altLink} ${closer}`,
    `${intro} What’s your take? ${pick([link, altLink])} ${closer}`,
  ];

  return {
    x: pick(xTemplates),
    telegram: pick(tgTemplates),
    discord: pick(dcTemplates),
  };
}

/* Posters */

export async function postToX(status: string) {
  const appKey = process.env.TWITTER_APP_KEY;
  const appSecret = process.env.TWITTER_APP_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    return { ok: false, error: "Missing X credentials" as const };
  }

  try {
    const client = new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
    });
    const rw = client.readWrite;
    const res = await rw.v2.tweet(status);
    return { ok: true as const, id: res.data.id };
  } catch (e: any) {
    return { ok: false as const, error: String(e?.data || e?.message || e) };
  }
}

export async function postToTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID; // ex: @AmericanAAT or numeric
  if (!token || !chatId) return { ok: false as const, error: "Missing Telegram env" };

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: false }),
    });
    const j = await r.json();
    if (!j?.ok) return { ok: false as const, error: j?.description || "TG failed" };
    return { ok: true as const, id: j?.result?.message_id };
  } catch (e: any) {
    return { ok: false as const, error: String(e?.message || e) };
  }
}

export async function postToDiscord(text: string) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return { ok: false as const, error: "Missing Discord webhook" };
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (!r.ok) {
      return { ok: false as const, error: `Discord ${r.status}` };
    }
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: String(e?.message || e) };
  }
}

/* Resolve slot defaults from env */
export function resolveSlot(slot: string) {
  const s = slot as ComposeInput["slot"];
  const def = {
    morning: {
      topic: process.env.SOCIAL_MORNING_TOPIC || process.env.SOCIAL_TOPIC || "daily-brief",
      tone: process.env.SOCIAL_MORNING_TONE || process.env.SOCIAL_TONE || "credible",
      links: (process.env.SOCIAL_MORNING_LINKS || process.env.SOCIAL_LINKS || "")
        .split(" ")
        .filter(Boolean),
    },
    midday: {
      topic: process.env.SOCIAL_MIDDAY_TOPIC || process.env.SOCIAL_TOPIC || "announcement",
      tone: process.env.SOCIAL_MIDDAY_TONE || process.env.SOCIAL_TONE || "educational",
      links: (process.env.SOCIAL_MIDDAY_LINKS || process.env.SOCIAL_LINKS || "")
        .split(" ")
        .filter(Boolean),
    },
    evening: {
      topic: process.env.SOCIAL_EVENING_TOPIC || process.env.SOCIAL_TOPIC || "token-update",
      tone: process.env.SOCIAL_EVENING_TONE || process.env.SOCIAL_TONE || "hype-minimal",
      links: (process.env.SOCIAL_EVENING_LINKS || process.env.SOCIAL_LINKS || "")
        .split(" ")
        .filter(Boolean),
    },
  } as const;

  return def[s] || def.morning;
}

/* Channel toggles */
export function channels() {
  return {
    x: bool(process.env.SOCIAL_CHANNEL_X, true),
    telegram: bool(process.env.SOCIAL_CHANNEL_TELEGRAM, true),
    discord: bool(process.env.SOCIAL_CHANNEL_DISCORD, true),
  };
}
