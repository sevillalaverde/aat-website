// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";        // run on Node (OpenAI SDK friendly)
export const dynamic = "force-dynamic"; // don't cache

type Provider = "openai" | "gemini" | "grok";

const OAI_MODEL   = process.env.OPENAI_MODEL  || "gpt-4o-mini";
const GEM_MODEL   = process.env.GEMINI_MODEL  || "gemini-1.5-flash";
const GROK_MODEL  = process.env.XAI_MODEL     || "grok-2-latest";

/** --- Provider callers --- */
async function askOpenAI(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const oai = new OpenAI({ apiKey: key });

  const resp = await oai.chat.completions.create({
    model: OAI_MODEL,
    temperature: 0.4,
    messages: [
      { role: "system", content: "You are AAT — an AI investing copilot." },
      { role: "user", content: prompt },
    ],
  });

  const text = resp.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("Empty response from OpenAI");
  return text;
}

async function askGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: GEM_MODEL });

  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.() ?? "";
  if (!text.trim()) throw new Error("Empty response from Gemini");
  return text;
}

async function askGrok(prompt: string): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY missing");

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [
        { role: "system", content: "You are AAT — an AI investing copilot." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`xAI error ${res.status}: ${errText}`);
  }
  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("Empty response from Grok/xAI");
  return text;
}

/** --- POST handler with smart fallbacks --- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const provider: Provider = (body.provider || "openai").toLowerCase();
    const prompt: string = body.prompt || "";

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ ok: false, error: "Missing 'prompt'." }, { status: 400 });
    }

    const order: Provider[] =
      provider === "gemini" ? ["gemini", "openai", "grok"]
      : provider === "grok" ? ["grok", "openai", "gemini"]
      : ["openai", "gemini", "grok"];

    const errors: Record<string, string> = {};
    let used: Provider | null = null;
    let text = "";

    for (const p of order) {
      try {
        if (p === "openai") text = await askOpenAI(prompt);
        else if (p === "gemini") text = await askGemini(prompt);
        else text = await askGrok(prompt);
        used = p;
        if (text?.trim()) break;
      } catch (e: any) {
        errors[p] = e?.message || String(e);
      }
    }

    if (!text.trim()) {
      return NextResponse.json(
        { ok: false, error: "All providers failed.", details: errors },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, provider: used, text, fallbackErrors: errors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
