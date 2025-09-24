// src/lib/social.ts
import crypto from "crypto";
import { TwitterApi } from "twitter-api-v2";

export type Slot = "morning" | "midday" | "evening";
export type Tone =
  | "credible"
  | "educational"
  | "hype-minimal"
  | "concise"
  | "friendly";

export type ComposeOpts = {
  slot: Slot;
  topic: string;          // e.g. daily-brief | announcement | token-update | community-cta | market-scan | dev-log | listing-watch | milestone
  tone?: Tone;
  links?: string[];       // one or more links to weave in
  variant?: number;       // optional manual nudger (?v=2 etc.)
};

export type ComposeOut = {
  x: string;         // <= 280 chars
  telegram: string;  // richer text OK
  discord: string;   // discord/webhook text
};

// ───────────────────────────────────────────────────────────────────────────────
// Helpers

const clamp = (s: string, n: number) =>
  s.length <= n ? s : s.slice(0, Math.max(0, n - 1)) + "…";

const pick = <T,>(arr: T[], idx: number) => arr[(idx % arr.length + arr.length) % arr.length];

function seededIndex(seed: string, max: number) {
  const h = crypto.createHash("sha256").update(seed).digest("hex");
  // take 8 hex chars -> int
  const val = parseInt(h.slice(0, 8), 16);
  return val % max;
}

function bestLink(links?: string[]) {
  if (!links?.length) return "https://theaat.xyz";
  // prefer the first, but ensure it’s an absolute URL
  const u = links[0].startsWith("http") ? links[0] : `https://${links[0]}`;
  return u;
}

// Build short hashtag bundle with good rotation.
function rotateTags(seed: string) {
  const pools = [
    ["#AAT", "#AI", "#crypto"],
    ["#AAT", "#DeFi", "#AI"],
    ["#AAT", "#AItrading", "#crypto"],
    ["#AAT", "#Web3", "#AI"],
    ["#AAT", "#OnchainAI", "#crypto"],
  ];
  return pools[seededIndex(seed, pools.length)].join(" ");
}

// ───────────────────────────────────────────────────────────────────────────────
// Templates (lightweight, fast, varied)
// Each topic has multiple patterns. We pick by seeded day+slot+variant,
// so repeats across a day/slot still vary between runs, and across days it rotates.

const TPL = {
  "daily-brief": [
    (link: string, tags: string) =>
      `AAT status: daily brief. ${link} Not financial advice. ${tags}`,
    (link: string, tags: string) =>
      `Daily check-in from AAT. Key notes + roadmap at ${link} ${tags} Not financial advice.`,
    (link: string, tags: string) =>
      `Good ${new Date().getHours() < 12 ? "morning" : "day"} — AAT brief is live → ${link} ${tags} (NFA)`,
  ],
  announcement: [
    (link: string, tags: string) =>
      `New update from American AI. Full details: ${link} ${tags} Not financial advice.`,
    (link: string, tags: string) =>
      `Heads-up: fresh announcement. Read the post → ${link} ${tags} (NFA)`,
    (link: string, tags: string) =>
      `Shipping in public: new announcement from AAT → ${link} ${tags} Not financial advice.`,
  ],
  "token-update": [
    (link: string, tags: string) =>
      `Token update: progress & upcoming steps. ${link} ${tags} (NFA)`,
    (link: string, tags: string) =>
      `AAT token notes for holders & new readers → ${link} ${tags} Not financial advice.`,
    (link: string, tags: string) =>
      `Quick token update: roadmap checkpoints + next milestones → ${link} ${tags} (NFA)`,
  ],
  "community-cta": [
    (link: string, tags: string) =>
      `Join the convo, share feedback, help shape AAT. ${link} ${tags}`,
    (link: string, tags: string) =>
      `Community matters: jump in, ask, propose, build with us → ${link} ${tags}`,
    (link: string, tags: string) =>
      `New here? Say hi & grab the latest info → ${link} ${tags}`,
  ],
  "market-scan": [
    (link: string, tags: string) =>
      `Market scan (high level): signals + context. ${link} ${tags} Not financial advice.`,
    (link: string, tags: string) =>
      `Today’s market quick-take from AAT. ${link} ${tags} (NFA)`,
    (link: string, tags: string) =>
      `Macro & crypto pulse in one quick read → ${link} ${tags} Not financial advice.`,
  ],
  "dev-log": [
    (link: string, tags: string) =>
      `Dev log: fixes, speedups, experiments. ${link} ${tags}`,
    (link: string, tags: string) =>
      `Building in the open. Today’s dev notes → ${link} ${tags}`,
    (link: string, tags: string) =>
      `Changelog (short): improvements shipped & in progress → ${link} ${tags}`,
  ],
  "listing-watch": [
    (link: string, tags: string) =>
      `Listings watch: venues & meta distribution. ${link} ${tags}`,
    (link: string, tags: string) =>
      `Tracking listings & tokenlist coverage. Details → ${link} ${tags}`,
    (link: string, tags: string) =>
      `On our radar: listing venues + metadata sync → ${link} ${tags}`,
  ],
  milestone: [
    (link: string, tags: string) =>
      `Milestone reached ✅ — details & what’s next: ${link} ${tags}`,
    (link: string, tags: string) =>
      `W! New milestone shipped. Read more → ${link} ${tags}`,
    (link: string, tags: string) =>
      `Step forward for AAT — recap & next steps → ${link} ${tags}`,
  ],
} as const;

function topicKey(t: string): keyof typeof TPL {
  const k = t.toLowerCase();
  if (k in TPL) return k as keyof typeof TPL;
  return "daily-brief";
}

export function composeSocial(opts: ComposeOpts): ComposeOut {
  const { slot, topic, links, variant = 0 } = opts;
  const link = bestLink(links);
  const day = new Date();
  const dayKey = day.toISOString().slice(0, 10); // YYYY-MM-DD
  const seed = `${dayKey}|${slot}|${topic}|${variant}`;

  const pool = TPL[topicKey(topic)];
  const idx = seededIndex(seed, pool.length);
  const tags = rotateTags(seed);

  // Twitter/X copy (≤ 280 chars). Slightly shorter, punchier.
  const xRaw = pool[idx](link, tags);
  const x = clamp(xRaw, 280);

  // Telegram/Discord can be a bit roomier + different phrasing
  const tgLead = [
    "Today’s AAT update:",
    "Quick AAT recap:",
    "AAT daily-brief:",
    "Fresh notes from American AI:",
  ];
  const dcLead = [
    "AAT update:",
    "Heads-up:",
    "Daily-brief:",
    "New note:",
  ];

  const tIdx = seededIndex(seed + "|tg", tgLead.length);
  const dIdx = seededIndex(seed + "|dc", dcLead.length);

  const telegram = `${tgLead[tIdx]} ${pool[idx](link, "")}\n\nNot financial advice.`;
  const discord = `${dcLead[dIdx]} ${pool[idx](link, "")} Not financial advice.`;

  return { x, telegram, discord };
}

// ───────────────────────────────────────────────────────────────────────────────
// Posting helpers

export async function postToX(status: string) {
  if (!process.env.SOCIAL_CHANNEL_X || process.env.SOCIAL_CHANNEL_X.toLowerCase() !== "true") {
    return { ok: false, skipped: true, reason: "SOCIAL_CHANNEL_X=false" };
  }
  const appKey = process.env.TWITTER_APP_KEY;
  const appSecret = process.env.TWITTER_APP_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    return { ok: false, error: "Missing X/Twitter credentials" };
  }

  try {
    const client = new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
    const res = await client.v2.tweet(status);
    return { ok: true, id: res?.data?.id };
  } catch (err: any) {
    // Surface common causes cleanly (401 write perms; 187 duplicate; 403 policy)
    const msg =
      err?.data?.detail ||
      err?.message ||
      "Unknown X error";
    return { ok: false, error: msg, code: err?.code || err?.status };
  }
}

export async function postToTelegram(text: string) {
  if (!process.env.SOCIAL_CHANNEL_TELEGRAM || process.env.SOCIAL_CHANNEL_TELEGRAM.toLowerCase() !== "true") {
    return { ok: false, skipped: true, reason: "SOCIAL_CHANNEL_TELEGRAM=false" };
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID" };

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
    disable_web_page_preview: false,
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!j?.ok) return { ok: false, error: j?.description || "Telegram error" };
    return { ok: true, id: j?.result?.message_id };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Telegram error" };
  }
}

export async function postToDiscord(text: string) {
  if (!process.env.SOCIAL_CHANNEL_DISCORD || process.env.SOCIAL_CHANNEL_DISCORD.toLowerCase() !== "true") {
    return { ok: false, skipped: true, reason: "SOCIAL_CHANNEL_DISCORD=false" };
  }
  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (!hook) return { ok: false, error: "Missing DISCORD_WEBHOOK_URL" };

  try {
    const r = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (!r.ok) return { ok: false, error: `Discord HTTP ${r.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Discord error" };
  }
}
