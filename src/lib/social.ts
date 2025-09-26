/* src/lib/social.ts */
import { TwitterApi } from "twitter-api-v2";

/** ─────────────────────────────
 *  Helpers: env + flags
 *  ──────────────────────────── */
const env = (k: string, d = "") => process.env[k] ?? d;
const on = (v?: string, d = false) => {
  if (!v) return d;
  const s = v.toString().trim().toLowerCase();
  return ["1", "true", "yes", "y"].includes(s);
};

export type ComposeInput = {
  slot: "morning" | "midday" | "evening";
  topic?: string;
  tone?: string;
  links?: string[];
  variant?: number;     // extra entropy knob (?v=2,3,…)
  dateISO?: string;     // override for testing
};

export type ChannelBundle = {
  x: string;
  telegram: string;
  discord: string;
};

export const CHANNEL_X        = on(env("SOCIAL_CHANNEL_X"),        true);
export const CHANNEL_TELEGRAM = on(env("SOCIAL_CHANNEL_TELEGRAM"), true);
export const CHANNEL_DISCORD  = on(env("SOCIAL_CHANNEL_DISCORD"),  true);

/** ─────────────────────────────
 *  Seeded randomness by date+slot
 *  ──────────────────────────── */
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pick<T>(seed: number, arr: T[]): T {
  const idx = seed % arr.length;
  return arr[idx];
}
function shuffle<T>(seed: number, arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** ─────────────────────────────
 *  Content libraries (clean, safe)
 *  ──────────────────────────── */
const focuses = [
  "market breadth & flows",
  "on-chain activity & gas trends",
  "macro headlines that matter",
  "liquidity shifts & large wallet moves",
  "builder news around AI + crypto",
  "AAT roadmap progress & community wins",
  "token research highlights from the Lab",
  "security reminders & safety tips",
];

const ctas = [
  "Join the discussion",
  "Read more in the Lab",
  "See the roadmap",
  "Share your thoughts",
  "Tell us what to cover next",
  "Tap in with the community",
];

const linkDefaults = (slot: ComposeInput["slot"]) => {
  const base = (env("SOCIAL_LINKS") || "").split(/\s+/).filter(Boolean);
  const per = (env(`SOCIAL_${slot.toUpperCase()}_LINKS`) || "")
    .split(/\s+/)
    .filter(Boolean);
  return per.length ? per : (base.length ? base : ["https://theaat.xyz/roadmap"]);
};

const topicDefaults: Record<ComposeInput["slot"], string> = {
  morning: env("SOCIAL_MORNING_TOPIC") || env("SOCIAL_TOPIC") || "daily-brief",
  midday:  env("SOCIAL_MIDDAY_TOPIC")  || env("SOCIAL_TOPIC") || "announcement",
  evening: env("SOCIAL_EVENING_TOPIC") || env("SOCIAL_TOPIC") || "community",
};

const toneDefaults: Record<ComposeInput["slot"], string> = {
  morning: env("SOCIAL_MORNING_TONE") || env("SOCIAL_TONE") || "credible",
  midday:  env("SOCIAL_MIDDAY_TONE")  || env("SOCIAL_TONE") || "educational",
  evening: env("SOCIAL_EVENING_TONE") || env("SOCIAL_TONE") || "hype-minimal",
};

const hashtagPools = [
  ["#AAT", "#AI", "#Crypto"],
  ["#AAT", "#DeFi", "#AI"],
  ["#AAT", "#Onchain", "#AI"],
  ["#AAT", "#Web3", "#AI"],
];

function smallTone(tone: string) {
  const t = tone.toLowerCase();
  if (t.includes("hype")) return ["Quick alpha:", "Heads up:", "Fast update:"];
  if (t.includes("educ")) return ["Today’s read:", "Learn more:", "FYI:"];
  return ["AAT update:", "Today’s brief:", "Status:"];
}

/** trim X to 280 hard */
function clipX(msg: string) {
  const HARD = 280;
  if (msg.length <= HARD) return msg;
  const parts = msg.split(" ");
  const keep = parts.filter((p) => !p.startsWith("#"));
  let s = keep.join(" ");
  if (s.length > HARD) s = s.slice(0, HARD - 1) + "…";
  return s;
}

/** ─────────────────────────────
 *  Compose: deterministic variety
 *  ──────────────────────────── */
export function composeSocial(input: ComposeInput): ChannelBundle {
  const slot  = input.slot;
  const dateISO = input.dateISO || new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const topic = (input.topic || topicDefaults[slot]).toLowerCase();
  const tone  = (input.tone || toneDefaults[slot]).toLowerCase();
  const links = (input.links && input.links.length ? input.links : linkDefaults(slot));

  const baseSeed = hashSeed([dateISO, slot, topic, tone, String(input.variant ?? 0)].join("|"));

  const intro = pick(baseSeed, smallTone(tone));
  const focus = pick(baseSeed + 11, focuses);
  const cta   = pick(baseSeed + 23, ctas);
  const tags  = pick(baseSeed + 47, hashtagPools).join(" ");

  const link = pick(baseSeed + 71, links);
  const nf = "Not financial advice.";

  const tA = `${intro} ${topic.replace("-", " ")}. ${cta}. ${link} ${nf}`;
  const tB = `${intro} ${topic.replace("-", " ")} — ${focus}. ${link} ${tags} ${nf}`;
  const tC = `AAT ${topic}: ${focus}. ${link} ${nf}`;

  const ordered = shuffle(baseSeed, [tA, tB, tC]);
  const x = clipX(ordered[0]);

  const tele = `${intro} ${topic.replace("-", " ")}.\n\n${link}\n\n${nf}`;
  const disc = `AAT ${topic}. Discuss with the community. ${link} ${nf}`;

  return { x, telegram: tele, discord: disc };
}

/** ─────────────────────────────
 *  Posting helpers
 *  ──────────────────────────── */
export async function postToX(status: string) {
  const appKey = env("TWITTER_APP_KEY");
  const appSecret = env("TWITTER_APP_SECRET");
  const accessToken = env("TWITTER_ACCESS_TOKEN");
  const accessSecret = env("TWITTER_ACCESS_SECRET");

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    return { ok: false, error: "X credentials missing" as const };
  }

  try {
    const client = new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
    const tweet = await client.v2.tweet(status);
    return { ok: true, id: tweet.data?.id };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export async function postToTelegram(text: string) {
  const token = env("TELEGRAM_BOT_TOKEN");
  const chatId = env("TELEGRAM_CHAT_ID");
  if (!token || !chatId) return { ok: false, error: "Telegram env missing" as const };

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });
  const j = await res.json();
  return j?.ok ? { ok: true, id: j?.result?.message_id } : { ok: false, error: j?.description || "TG error" };
}

export async function postToDiscord(content: string) {
  const webhook = env("DISCORD_WEBHOOK_URL");
  if (!webhook) return { ok: false, error: "Discord webhook missing" as const };
  const r = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return r.ok ? { ok: true } : { ok: false, error: `Discord ${r.status}` };
}

/** ─────────────────────────────
 *  Compatibility helpers (to satisfy old imports)
 *  ──────────────────────────── */
export function resolveSlot(s?: string): "morning" | "midday" | "evening" {
  const v = String(s || "").toLowerCase();
  if (v === "midday" || v === "evening" || v === "morning") return v;
  return "morning";
}
export const channels = {
  x: CHANNEL_X,
  telegram: CHANNEL_TELEGRAM,
  discord: CHANNEL_DISCORD,
};
