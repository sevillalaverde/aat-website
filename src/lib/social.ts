// src/lib/social.ts
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

type ComposeIn = {
  topic: string;
  tone: string;
  links: string[];
  seed?: number; // for deterministic variety
};

type ComposeOut = {
  x: string;
  telegram: string;
  discord: string;
};

const openaiKey = process.env.OPENAI_API_KEY || "";
const geminiKey = process.env.GEMINI_API_KEY || "";
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const genai = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

const SYSTEM = `You are the AAT Social Agent for American AI ($AAT).
- Write short, natural, human messages.
- No price predictions. Add "Not financial advice." at the end.
- X copy: ≤ 260 chars. Include exactly one hashtag, #AAT (if it fits).
- Telegram copy: 2–3 sentences, 1 emoji, include at least one provided link.
- Discord copy: friendly invite to discuss in server, include at least one provided link.
- Vary verbs/phrasing daily; avoid sounding like a bot.`;

const LIMIT_X = 260;

/** --- helpers ------------------------------------------------------------ */
function clampTweet(s: string): string {
  // crude hard cap
  if (s.length <= LIMIT_X) return s;
  return s.slice(0, LIMIT_X - 1) + "…";
}

function daySeed(d = new Date()): number {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
  const diff = +d - +start;
  return Math.floor(diff / 86400000); // day-of-year
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function oneLink(links: string[], rng: () => number) {
  return links.length ? links[Math.floor(rng() * links.length)] : "https://theaat.xyz";
}

/** fallback generator with variety (no AI) */
function fallbackCompose({ topic, tone, links, seed }: ComposeIn): ComposeOut {
  const rng = mulberry32((seed ?? daySeed()) + topic.length * 97);
  const verbs = ["Explore", "See", "Read", "Check", "Discover", "Learn about"];
  const ctas  = ["Join us", "Jump in", "Get involved", "Come discuss", "Say hi"];
  const vibes = tone.includes("hype")
    ? ["🚀","✨","🔥","💡","🌟"]
    : ["📌","🧠","📈","🔍","🧭"];
  const link = oneLink(links, rng);
  const vibe = pick(rng, vibes);
  const verb = pick(rng, verbs);
  const cta  = pick(rng, ctas);

  let subject = "";
  switch (topic) {
    case "daily-brief": subject = "Daily market brief"; break;
    case "roadmap": subject = "Roadmap highlight"; break;
    case "education-tip": subject = "Quick how-to tip"; break;
    case "community": subject = "Community spotlight"; break;
    case "partner": subject = "Partner/token spotlight"; break;
    case "safety": subject = "Safety reminder"; break;
    case "weekly-recap": subject = "Weekly recap"; break;
    default: subject = "Update";
  }

  const base = `${subject}. ${verb} more: ${link} Not financial advice.`;

  const x = clampTweet(`AAT update: ${subject.toLowerCase()}. ${verb} ${link} #AAT Not financial advice.`);
  const telegram = `${vibe} ${subject}.\n${verb} what’s new: ${link}\n${cta} in our community. Not financial advice.`;
  const discord  = `${subject} — ${verb.toLowerCase()} ${link}\n${cta} with fellow AAT holders. Not financial advice.`;

  return { x, telegram, discord };
}

/** AI compose (OpenAI → Gemini → fallback) */
export async function composeSocial(input: ComposeIn): Promise<ComposeOut> {
  const seed = input.seed ?? daySeed();
  const linksStr = (input.links || []).join(" ");

  const user = `Date(UTC): ${new Date().toISOString().slice(0,10)}
Topic: ${input.topic}
Tone: ${input.tone}
Links: ${linksStr || "https://theaat.xyz"}
Seed: ${seed}

Write THREE variants (X, Telegram, Discord) as JSON:
{
  "x": "<<=260 chars, include #AAT if possible, end with 'Not financial advice.'>",
  "telegram": "<2–3 short sentences, 1 emoji, include a link, end with 'Not financial advice.'>",
  "discord": "<friendly invite to discuss, include a link, end with 'Not financial advice.'>"
}
No extra keys, no markdown code fences. Keep it fresh; avoid repeating phrasing from typical corporate posts.`;

  // 1) OpenAI
  try {
    if (openai) {
      const res = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
      });
      const txt = res.choices?.[0]?.message?.content || "";
      const j = JSON.parse(txt) as ComposeOut;
      return { x: clampTweet(j.x), telegram: j.telegram, discord: j.discord };
    }
  } catch { /* fall through */ }

  // 2) Gemini
  try {
    if (genai) {
      const model = genai.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-pro" });
      const out = await model.generateContent(`${SYSTEM}\n\n${user}`);
      const txt = out.response.text();
      const j = JSON.parse(txt) as ComposeOut;
      return { x: clampTweet(j.x), telegram: j.telegram, discord: j.discord };
    }
  } catch { /* fall through */ }

  // 3) fallback
  return fallbackCompose({ ...input, seed });
}

/** Day-of-week rotation (works even with single daily cron) */
export function rotationForToday(): { topic: string; tone: string } {
  const dow = new Date().getUTCDay(); // 0=Sun
  switch (dow) {
    case 1: return { topic: "daily-brief",  tone: "credible" };      // Mon
    case 2: return { topic: "roadmap",      tone: "credible" };      // Tue
    case 3: return { topic: "education-tip",tone: "helpful"  };      // Wed
    case 4: return { topic: "community",    tone: "friendly" };      // Thu
    case 5: return { topic: "partner",      tone: "hype-minimal" };  // Fri
    case 6: return { topic: "safety",       tone: "credible" };      // Sat
    default:return { topic: "weekly-recap", tone: "credible" };      // Sun
  }
}
