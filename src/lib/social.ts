// src/lib/social.ts
/* Utility + posting helpers used by social preview & cron */

import { TwitterApi } from "twitter-api-v2";

/** ---------- small seeded RNG so messages vary but are deterministic per day ---------- */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(rng: () => number, arr: T[]) =>
  arr[Math.floor(rng() * arr.length)];

/** ---------- pools ---------- */
const TOPICS = [
  "daily-brief",
  "token-update",
  "community-cta",
  "roadmap",
  "ecosystem",
  "education",
  "security-tip",
  "listing-watch",
  "market-brief",
] as const;

const TONES = [
  "credible",
  "friendly",
  "hype-minimal",
  "analytical",
  "educational",
] as const;

type Slot = "morning" | "midday" | "evening" | "preview";

export type ComposeInput = {
  slot?: Slot;
  topic?: string | null;
  tone?: string | null;
  links?: string[] | null;
  salt?: string | null;
};

export type ComposeResult = {
  slot: Slot;
  topic: string;
  tone: string;
  links: string[];
  preview: { x: string; telegram: string; discord: string };
};

/** read env / per-slot override, fall back to variety mode */
function envOr(slot: Slot, baseKey: string) {
  const specific = process.env[`SOCIAL_${slot.toUpperCase()}_${baseKey}`];
  if (specific && specific.trim()) return specific;
  const generic = process.env[`SOCIAL_${baseKey}`];
  if (generic && generic.trim()) return generic;
  return "";
}
function parseLinks(s?: string) {
  if (!s) return [] as string[];
  return s
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** ---------- composeSocial: MAKE VARIED COPY ---------- */
export function composeSocial(input: ComposeInput = {}): ComposeResult {
  const slot: Slot = (input.slot || "preview") as Slot;

  // choose topic/tone/links from explicit input -> env per slot -> env base -> random
  const topic =
    input.topic ||
    envOr(slot, "TOPIC") ||
    (pick(mulberry32(seedBase(slot)), [...TOPICS]) as string);

  const tone =
    input.tone ||
    envOr(slot, "TONE") ||
    (pick(mulberry32(seedBase(slot) + 11), [...TONES]) as string);

  const links =
    input.links && input.links.length
      ? input.links
      : parseLinks(envOr(slot, "LINKS")) ||
        parseLinks(process.env.SOCIAL_LINKS || "");

  const rng = mulberry32(seedBase(slot) + 101);

  const hashtags =
    (process.env.SOCIAL_X_SUFFIX || "#AAT")
      .split(/\s+/)
      .filter(Boolean)
      .join(" ") || "#AAT";

  const linkPart = links.length ? ` ${links[0]}` : "";

  // Light, fast templates (no API call) with small randomness
  const openers = {
    credible: [
      "AAT update:",
      "AAT status:",
      "Latest from AAT:",
      "AAT daily:",
    ],
    "hype-minimal": [
      "Quick alpha:",
      "Heads up:",
      "Fresh drop:",
      "Signal only:",
    ],
    friendly: ["Hey fam —", "GM —", "Hello AAT community —", "Team —"],
    analytical: ["Data check:", "Briefing:", "Market read:", "Snapshot:"],
    educational: ["Learn:", "Did you know?", "Guide:", "Explainer:"],
  } as Record<string, string[]>;

  const subject = (() => {
    switch (topic) {
      case "daily-brief":
      case "market-brief":
        return "daily-brief";
      case "token-update":
        return "token update";
      case "community-cta":
        return "join the community";
      case "roadmap":
        return "roadmap highlights";
      case "ecosystem":
        return "ecosystem progress";
      case "security-tip":
        return "security tip";
      case "listing-watch":
        return "listing watch";
      case "education":
        return "education";
      default:
        return "update";
    }
  })();

  const opener = pick(rng, openers[tone] || openers.credible);

  const x = `${opener} ${subject}.${linkPart} Not financial advice. ${hashtags}`.trim();

  const tgBodyOptions = [
    `AAT ${subject}.`,
    `Here's your AAT ${subject}.`,
    `Today’s AAT ${subject}.`,
    `Quick AAT ${subject}.`,
  ];
  const tg = `${pick(rng, tgBodyOptions)}${
    links.length ? `\n\n${links.join(" ")}` : ""
  }\n\nNot financial advice.`;

  const dc = `AAT ${subject}. Discuss with the community.${
    links.length ? ` ${links.join(" ")}` : ""
  } Not financial advice.`;

  return {
    slot,
    topic,
    tone,
    links,
    preview: { x, telegram: tg, discord: dc },
  };
}

function seedBase(slot: Slot) {
  const d = new Date();
  const ymd = Number(`${d.getUTCFullYear()}${d.getUTCMonth() + 1}${d.getUTCDate()}`);
  const salt = process.env.SOCIAL_VARIETY_SALT || "v1";
  let acc = 0;
  for (const ch of `${ymd}-${salt}-${slot}`) acc += ch.charCodeAt(0);
  return acc;
}

/** ---------- channel posting helpers ---------- */

export async function postToX(text: string) {
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_APP_KEY || "",
      appSecret: process.env.TWITTER_APP_SECRET || "",
      accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
      accessSecret: process.env.TWITTER_ACCESS_SECRET || "",
    });
    const res = await client.v2.tweet(text);
    return { ok: true as const, id: res?.data?.id };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || String(e) };
  }
}

export async function postToTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false as const, error: "Missing TELEGRAM_* env" };
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: false }),
    });
    const j = await r.json();
    if (!j.ok) return { ok: false as const, error: j.description || "TG error" };
    return { ok: true as const, id: j.result?.message_id };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || String(e) };
  }
}

export async function postToDiscord(text: string) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return { ok: false as const, error: "Missing DISCORD_WEBHOOK_URL" };
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (!r.ok) return { ok: false as const, error: `Discord ${r.status}` };
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || String(e) };
  }
}
