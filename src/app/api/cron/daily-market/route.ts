import { NextResponse } from "next/server";
import { postToTelegram, postToDiscord } from "@/lib/social";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function aiDailyBrief(): Promise<string> {
  const prompt = `
You are American AI ($AAT). Produce a concise “State of the Market” briefing for crypto investors.
- Sections: Overview (2-3 bullets), On-Chain/Flows (2 bullets), Sentiment (2 bullets), Watchlist (2 items), Disclaimer (1 line)
- Tone: factual, crisp, non-hype. No financial advice.
- Keep under ~1200 characters.
`;

  // 1) Try Grok (xAI)
  try {
    const r = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.XAI_API_KEY || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });
    if (r.ok) {
      const j = await r.json();
      const text = j?.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    }
  } catch {}

  // 2) Try Gemini
  try {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      const genai = new GoogleGenerativeAI(key);
      const model = genai.getGenerativeModel({ model: "gemini-1.5-pro" });
      const res = await model.generateContent(prompt);
      const text = res?.response?.text?.() ?? "";
      if (text.trim()) return text.trim();
    }
  } catch {}

  // 3) Try OpenAI
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const client = new OpenAI({ apiKey: openaiKey });
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      const r = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      });
      const text = r.choices?.[0]?.message?.content?.trim();
      if (text) return text!;
    }
  } catch {}

  throw new Error("All AI providers failed");
}

function okCron(req: Request) {
  // Allow Vercel Cron (header) OR a manual call with ?key=CRON_SECRET
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const cronHeader = req.headers.get("x-vercel-cron");
  if (cronHeader === "1") return true;
  if (key && process.env.CRON_SECRET && key === process.env.CRON_SECRET) return true;
  return false;
}

/** GET /api/cron/daily-market  */
export async function GET(req: Request) {
  try {
    if (!okCron(req)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const brief = await aiDailyBrief();

    const tg = await postToTelegram(`*AAT — State of the Market*\n\n${brief}`);
    const dc = await postToDiscord(`**AAT — State of the Market**\n\n${brief}`);

    return NextResponse.json({ ok: true, telegram: tg, discord: dc });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
