import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Payload = {
  topic: string;
  tone?: "credible" | "hype-minimal" | "educational" | string;
  links?: string[];
  custom?: string;
};

type SocialOut = { x: string; telegram: string; discord: string };

const SYSTEM = `You are AAT Social Agent.
Return STRICT JSON with keys: x, telegram, discord. No prose.
Rules:
- Be concise, factual, no promises. Add: "Not financial advice."
- X must be <= 280 characters.
- If links provided, include 0–2 of them (prefer site/Etherscan).
`;

function getGemini() {
  const key = process.env.GEMINI_API_KEY || "";
  return key ? new GoogleGenerativeAI(key) : null;
}
function getOpenAI() {
  const key = process.env.OPENAI_API_KEY || "";
  return key ? new OpenAI({ apiKey: key }) : null;
}

function fallbackCompose(p: Payload): SocialOut {
  const ln = (p.links || []).join(" ");
  const base =
    p.topic === "daily-brief"
      ? "Market brief: key moves and upcoming catalysts."
      : p.topic === "announcement"
      ? "Update: new milestone shipped."
      : p.topic === "token-update"
      ? "Token update: progress on roadmap and listings."
      : p.custom || "Update.";
  const tail = (ln ? ` ${ln}` : "") + " Not financial advice.";
  const x = (base + tail).slice(0, 280);
  const rest = `${base}${tail}`;
  return { x, telegram: rest, discord: rest };
}

function safeParseJSON(txt: string): SocialOut | null {
  try {
    const j = JSON.parse(txt);
    if (j && typeof j === "object" && "x" in j && "telegram" in j && "discord" in j) {
      const out: SocialOut = {
        x: String(j.x || ""),
        telegram: String(j.telegram || ""),
        discord: String(j.discord || ""),
      };
      if (out.x.length > 280) out.x = out.x.slice(0, 275) + "…";
      return out;
    }
  } catch {}
  // try to extract {...} from markdown
  const m = txt.match(/{[\s\S]*}/);
  if (m) return safeParseJSON(m[0]);
  return null;
}

async function generateJSON(payload: Payload): Promise<SocialOut> {
  const prompt = `
Topic: ${payload.topic}
Tone: ${payload.tone || "credible"}
Links: ${(payload.links || []).join(" ") || "none"}
${payload.custom ? `Custom:\n${payload.custom}` : ""}

Return JSON ONLY:
{"x":"...", "telegram":"...", "discord":"..."}
`;

  // Try Gemini first (if present)
  try {
    const g = getGemini();
    if (g) {
      const model = g.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });
      const res = await model.generateContent(`${SYSTEM}\n\n${prompt}`);
      const text = res.response.text().trim();
      const parsed = safeParseJSON(text);
      if (parsed) return parsed;
    }
  } catch {}

  // Try OpenAI (json)
  try {
    const ai = getOpenAI();
    if (ai) {
      const out = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" } as any,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
      });
      const txt = (out.choices?.[0]?.message?.content || "").trim();
      const parsed = safeParseJSON(txt);
      if (parsed) return parsed;
    }
  } catch {}

  // Fallback template
  return fallbackCompose(payload);
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Payload;
    const preview = await generateJSON(payload);
    return NextResponse.json({ ok: true, preview });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server_error" }, { status: 500 });
  }
}
