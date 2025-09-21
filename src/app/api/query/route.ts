import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function runGrok(prompt: string) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY missing");
  const r = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "grok-2-latest", messages: [{ role: "user", content: prompt }], temperature: 0.4 }),
  });
  if (!r.ok) throw new Error(`grok http ${r.status}`);
  const j = await r.json();
  return j?.choices?.[0]?.message?.content?.trim() || "";
}

async function runGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const genai = new GoogleGenerativeAI(key);
  const model = genai.getGenerativeModel({ model: "gemini-1.5-pro" });
  const res = await model.generateContent(prompt);
  return res?.response?.text?.()?.trim() || "";
}

async function runOpenAI(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const client = new OpenAI({ apiKey: key });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const r = await client.chat.completions.create({ model, messages: [{ role: "user", content: prompt }], temperature: 0.4 });
  return r?.choices?.[0]?.message?.content?.trim() || "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query: string = (body?.query || "").toString().trim();
    if (!query) return NextResponse.json({ ok: false, error: "Missing query" }, { status: 400 });

    const results: Record<string, string> = {};
    const errors: Record<string, string> = {};

    // Provider order: grok → gemini → openai
    try { results.grok = await runGrok(query); } catch (e: any) { errors.grok = e?.message || "grok failed"; }
    if (!results.grok) {
      try { results.gemini = await runGemini(query); } catch (e: any) { errors.gemini = e?.message || "gemini failed"; }
    }
    if (!results.grok && !results.gemini) {
      try { results.openai = await runOpenAI(query); } catch (e: any) { errors.openai = e?.message || "openai failed"; }
    }

    const final = results.grok || results.gemini || results.openai || "";
    if (!final) return NextResponse.json({ ok: false, error: "All providers failed", errors }, { status: 502 });

    return NextResponse.json({ ok: true, final, results, errors });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
