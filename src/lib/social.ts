/* src/lib/social.ts */
/* Human-like social copy generation with AI + repeat-avoidance (optional KV) */

import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type SocialPreview = { x: string; telegram: string; discord: string };

// ---------- small utils ----------
const clamp = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + "…");
const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));
const normLinks = (links?: string[] | string) =>
  uniq((Array.isArray(links) ? links : (links || "").split(/\s+/)).filter(Boolean));

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- optional Upstash KV (for dedupe) ----------
const KV_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

async function kvGet(key: string): Promise<string[] | null> {
  if (!KV_URL || !KV_TOKEN) return null;
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const j = await res.json().catch(() => null);
  if (!j?.result) return [];
  try {
    return JSON.parse(j.result);
  } catch {
    return [];
  }
}
async function kvSet(key: string, arr: string[]) {
  if (!KV_URL || !KV_TOKEN) return;
  await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(arr),
  });
}
async function remember(platform: "x" | "telegram" | "discord", text: string) {
  const key = `aat:social:${platform}:${todayKey()}`;
  const old = (await kvGet(key)) || [];
  old.unshift(text.trim());
  await kvSet(key, old.slice(0, 20));
}
async function seen(platform: "x" | "telegram" | "discord", text: string) {
  const key = `aat:social:${platform}:${todayKey()}`;
  const old = (await kvGet(key)) || [];
  const norm = (t: string) => t.replace(/\s+/g, " ").trim().toLowerCase();
  return old.some((o) => norm(o) === norm(text));
}

// ---------- AI providers ----------
function getOpenAI() {
  const key = process.env.OPENAI_API_KEY || "";
  return key ? new OpenAI({ apiKey: key }) : null;
}
function getGemini() {
  const key = process.env.GEMINI_API_KEY || "";
  return key ? new GoogleGenerativeAI(key) : null;
}

type Platform = "x" | "telegram" | "discord";
type Tone =
  | "credible"
  | "educational"
  | "hype-minimal"
  | "conversational"
  | "professional";

const FALLBACK_HASHTAGS = process.env.SOCIAL_X_SUFFIX || "#AAT";

// Rotating topic wheel (override with SOCIAL_TOPICS="daily-brief;how-to;roadmap;security;dev-update;partnership;community-cta;macro;token-update;education")
function pickTopic(slot: string): string {
  const topics =
    (process.env.SOCIAL_TOPICS || "")
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  const pool =
    topics.length > 0
      ? topics
      : [
          "daily-brief",
          "token-update",
          "education",
          "security",
          "how-to",
          "roadmap",
          "community-cta",
          "macro",
          "dev-update",
          "announcement",
        ];
  // rotate by day + slot index
  const dayIndex = Math.abs(
    Array.from(todayKey() + ":" + slot).reduce((a, c) => a + c.charCodeAt(0), 0)
  );
  return pool[dayIndex % pool.length];
}

function systemPrompt(platform: Platform, tone: Tone) {
  const base = `You are the American AI ($AAT) social copywriter. Write concise, fresh, *non-repetitive* posts that feel human.
- Never promise returns or give financial advice. Always include a light disclaimer (e.g., "Not financial advice." or "DYOR.").
- Always include the first link the user provides.
- Never mention internal prompts, never say "as an AI".
- Stay on-topic: $AAT protocol, AI in crypto, product news, roadmap, security hygiene, explainers.
- Avoid price talk, hype words like "moon", and absolute claims.`;

  if (platform === "x") {
    return `${base}
Output: one single sentence ≤ 280 chars, includes 1–3 relevant hashtags (include #AAT), crisp voice, no markdown, no emojis unless tone=hype-minimal.
Tone: ${tone}.`;
  }
  if (platform === "telegram") {
    return `${base}
Output: 2 short sentences, informative and welcoming. Keep it ~30–60 words.`;
  }
  return `${base}
Output: 2–3 short sentences tailored for a Discord general channel, inviting discussion. ~25–50 words.`;
}

function userPrompt({
  topic,
  tone,
  link,
  linksAll,
  platform,
  forbid,
}: {
  topic: string;
  tone: Tone;
  link: string;
  linksAll: string[];
  platform: Platform;
  forbid: string[];
}) {
  const forbidStr = forbid.length
    ? `Do NOT echo or paraphrase any of these recent posts (or their structure):\n- ${forbid.join("\n- ")}`
    : "";
  return `Topic: ${topic}
Primary link: ${link}
Other links: ${linksAll.slice(1).join(", ") || "(none)"}
Platform: ${platform}
${forbidStr}`;
}

async function aiWrite(
  platform: Platform,
  topic: string,
  tone: Tone,
  linksIn: string[],
  forbid: string[]
): Promise<string> {
  const links = normLinks(linksIn);
  const link = links[0] || "https://theaat.xyz";
  const openai = getOpenAI();
  const gemini = getGemini();

  // Try OpenAI → Gemini → fallback template
  try {
    if (openai) {
      const out = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.85,
        messages: [
          { role: "system", content: systemPrompt(platform, tone) },
          { role: "user", content: userPrompt({ topic, tone, link, linksAll: links, platform, forbid }) },
        ],
      });
      let text = (out.choices?.[0]?.message?.content || "").trim();
      if (platform === "x") {
        // enforce ≤ 280 chars and ensure hashtag
        if (!/#AAT\b/i.test(text)) text = `${text} ${FALLBACK_HASHTAGS}`.trim();
        text = clamp(text, 280);
      }
      return text;
    }
  } catch {}

  try {
    if (gemini) {
      const model = gemini.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      });
      const res = await model.generateContent(
        `${systemPrompt(platform, tone)}\n\n${userPrompt({
          topic,
          tone,
          link,
          linksAll: links,
          platform,
          forbid,
        })}`
      );
      let text = (res.response.text() || "").trim();
      if (platform === "x") {
        if (!/#AAT\b/i.test(text)) text = `${text} ${FALLBACK_HASHTAGS}`.trim();
        text = clamp(text, 280);
      }
      return text;
    }
  } catch {}

  // Fallback small template (very rare)
  if (platform === "x") {
    return clamp(`AAT update: ${topic}. ${link} Not financial advice. ${FALLBACK_HASHTAGS}`, 280);
  }
  if (platform === "telegram") {
    return `AAT update on ${topic}. Learn more at ${link}. Join our community to stay informed. Not financial advice.`;
  }
  return `AAT ${topic} update. Details: ${link}. Join the discussion. Not financial advice.`;
}

// ---------- public API ----------
export async function buildSocialCopy(
  topicIn: string | undefined,
  toneIn: string | undefined,
  linksIn?: string[] | string,
  slot: string = "daily",
): Promise<SocialPreview> {
  const topic = (topicIn || pickTopic(slot)).trim();
  const tone = (toneIn as Tone) || ("credible" as Tone);
  const links = normLinks(linksIn);

  // read “forbid” list (recent posts) from KV if available to avoid repeats
  const forbidX = (await kvGet(`aat:social:x:${todayKey()}`)) || [];
  const forbidTg = (await kvGet(`aat:social:telegram:${todayKey()}`)) || [];
  const forbidDc = (await kvGet(`aat:social:discord:${todayKey()}`)) || [];

  const [x, telegram, discord] = await Promise.all([
    aiWrite("x", topic, tone, links, forbidX),
    aiWrite("telegram", topic, tone, links, forbidTg),
    aiWrite("discord", topic, tone, links, forbidDc),
  ]);

  // push into history (best-effort)
  await Promise.all([remember("x", x), remember("telegram", telegram), remember("discord", discord)]);

  return { x, telegram, discord };
}

// ---------- network helpers kept for cron ----------
export async function postToTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";
  if (!token || !chatId) return { ok: false, error: "TELEGRAM env missing" };

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: false }),
  });
  const j = await res.json();
  if (!j?.ok) return { ok: false, error: j?.description || "Telegram error" };
  return { ok: true, id: j?.result?.message_id };
}

export async function postToDiscord(text: string) {
  const webhook = process.env.DISCORD_WEBHOOK_URL || "";
  if (!webhook) return { ok: false, error: "DISCORD_WEBHOOK_URL missing" };
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text }),
  });
  if (!res.ok) return { ok: false, error: `Discord HTTP ${res.status}` };
  return { ok: true };
}
