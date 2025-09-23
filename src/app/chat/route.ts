// src/app/api/chat/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ---- Helpers --------------------------------------------------------------

type Provider = "grok" | "gemini" | "openai";

function norm(s: unknown) {
  return (typeof s === "string" ? s : String(s ?? "")).trim();
}

async function askGrok(prompt: string) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("Missing XAI_API_KEY");
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-2-latest",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`xAI ${res.status}`);
  const data = await res.json().catch(() => ({}));
  const text = norm(data?.choices?.[0]?.message?.content);
  if (!text) throw new Error("Empty xAI response");
  return text;
}

async function askGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
    encodeURIComponent(key);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json().catch(() => ({}));
  // candidates[0].content.parts[] -> text
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = norm(
    Array.isArray(parts) ? parts.map((p: any) => p?.text ?? "").join("\n") : ""
  );
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

async function askOpenAI(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json().catch(() => ({}));
  const text = norm(data?.choices?.[0]?.message?.content);
  if (!text) throw new Error("Empty OpenAI response");
  return text;
}

async function tryProviders(order: Provider[], prompt: string) {
  const errors: string[] = [];
  for (const p of order) {
    try {
      if (p === "grok") return { provider: p, text: await askGrok(prompt), errors };
      if (p === "gemini") return { provider: p, text: await askGemini(prompt), errors };
      if (p === "openai") return { provider: p, text: await askOpenAI(prompt), errors };
    } catch (e: any) {
      errors.push(`${p}: ${e?.message ?? e}`);
    }
  }
  throw new Error(errors.join(" | "));
}

// ---- POST handler ---------------------------------------------------------

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = norm(body?.prompt);
    const requested = (norm(body?.provider).toLowerCase() as Provider) || "grok";
    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Missing prompt" },
        { status: 400 }
      );
    }

    // Fallback order: requested first, then the remaining two in Grok → Gemini → OpenAI order
    const baseOrder: Provider[] = ["grok", "gemini", "openai"];
    const order = [requested, ...baseOrder.filter((p) => p !== requested)];

    const { provider, text, errors } = await tryProviders(order, prompt);

    return NextResponse.json({ ok: true, provider, text, fallbackErrors: errors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "All providers failed", detail: e?.message ?? String(e) },
      { status: 502 }
    );
  }
}