// src/app/api/support/route.ts
import { NextRequest, NextResponse } from "next/server";

const SYS = `You are AAT Support (American AI, token $AAT) on the official website.
Goal: answer like a friendly, concise concierge. 
Provide: how to buy on Uniswap (token prefilled), how to open the AI Lab (/lab),
where to see Roadmap (/roadmap) and Docs (/docs). Keep it helpful, light, and non-financial-advice.
Tone: warm, short paragraphs, bullets when useful.`;

const TIMEOUT_MS = 12000;

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS) {
  return Promise.race([
    p,
    new Promise<T>((_, r) => setTimeout(() => r(new Error("timeout")), ms)),
  ]);
}

async function callGrok(prompt: string) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("no xAI key");
  const r = await withTimeout(
    fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    })
  );
  if (!("ok" in r) || !r.ok) throw new Error("grok http");
  const j = await r.json();
  const text =
    j?.choices?.[0]?.message?.content ??
    j?.choices?.[0]?.message?.text ??
    "";
  if (!text.trim()) throw new Error("grok empty");
  return text as string;
}

async function callGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("no gemini key");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`;
  const r = await withTimeout(
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${SYS}\n\nUser: ${prompt}` }],
          },
        ],
      }),
    })
  );
  if (!("ok" in r) || !r.ok) throw new Error("gemini http");
  const j = await r.json();
  const parts = j?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p: any) => p?.text ?? "").join("\n")
    : "";
  if (!text.trim()) throw new Error("gemini empty");
  return text as string;
}

async function callOpenAI(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("no openai key");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const r = await withTimeout(
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    })
  );
  if (!("ok" in r) || !r.ok) throw new Error("openai http");
  const j = await r.json();
  const text =
    j?.choices?.[0]?.message?.content ??
    j?.choices?.[0]?.message?.text ??
    "";
  if (!text.trim()) throw new Error("openai empty");
  return text as string;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt = "", history = [] } = await req.json().catch(() => ({}));
    const q = String(prompt || "").slice(0, 4000);
    if (!q) {
      return NextResponse.json(
        { ok: false, provider: null, text: "Ask me anything about $AAT." },
        { status: 200 }
      );
    }

    const errors: string[] = [];

    // Priority: Grok → Gemini → OpenAI
    try {
      const text = await callGrok(q);
      return NextResponse.json({ ok: true, provider: "grok", text, errors });
    } catch (e: any) {
      errors.push(`grok: ${e?.message || e}`);
    }
    try {
      const text = await callGemini(q);
      return NextResponse.json({ ok: true, provider: "gemini", text, errors });
    } catch (e: any) {
      errors.push(`gemini: ${e?.message || e}`);
    }
    try {
      const text = await callOpenAI(q);
      return NextResponse.json({ ok: true, provider: "openai", text, errors });
    } catch (e: any) {
      errors.push(`openai: ${e?.message || e}`);
    }

    // Soft-fail, never 500/404
    return NextResponse.json(
      {
        ok: false,
        provider: null,
        text:
          "Sorry — support is temporarily unavailable. Please try again in a moment.",
        errors,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        provider: null,
        text:
          "Sorry — support is temporarily unavailable. Please try again in a moment.",
        errors: [e?.message || String(e)],
      },
      { status: 200 }
    );
  }
}