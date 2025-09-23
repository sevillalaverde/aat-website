// src/app/api/query/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- Helpers ----------
function asText(x: unknown): string {
  if (typeof x === "string") return x;
  if (!x) return "";
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}

async function parseJsonOrThrow(res: Response): Promise<any> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const snippet = await res.text().catch(() => "");
    throw new Error(
      `Non-JSON response (${res.status}). First bytes: ${snippet.slice(0, 100)}`
    );
  }
  return res.json();
}

// ---------- Providers in preferred order: GEMINI → GROK → OPENAI ----------
async function askGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-pro";
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: modelName });

  const resp = await model.generateContent(prompt);
  // SDK responses differ slightly by version:
  const text =
    (resp as any)?.response?.text?.() ??
    (resp as any)?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "";
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

async function askGrok(prompt: string) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY missing");
  const model = process.env.XAI_MODEL || "grok-2";
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    }),
  });
  const data = await parseJsonOrThrow(res);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from Grok");
  return text;
}

async function askOpenAI(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const client = new OpenAI({ apiKey: key });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const r = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
  });
  const text = r?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from OpenAI");
  return text;
}

// ---------- POST handler ----------
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      query?: string;
      provider?: "gemini" | "grok" | "openai";
    };

    const query = (body.query || "").trim();
    if (!query) {
      return NextResponse.json(
        { ok: false, error: "Missing 'query'." },
        { status: 400 }
      );
    }

    // If the caller forces a provider, honor it. Otherwise use our order.
    const order: Array<"gemini" | "grok" | "openai"> = body.provider
      ? [body.provider]
      : ["gemini", "grok", "openai"];

    const errors: Record<string, string> = {};
    for (const p of order) {
      try {
        if (p === "gemini") {
          const text = await askGemini(query);
          return NextResponse.json({ ok: true, provider: p, text, errors });
        }
        if (p === "grok") {
          const text = await askGrok(query);
          return NextResponse.json({ ok: true, provider: p, text, errors });
        }
        if (p === "openai") {
          const text = await askOpenAI(query);
          return NextResponse.json({ ok: true, provider: p, text, errors });
        }
      } catch (e: any) {
        errors[p] = asText(e?.message || e);
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "All providers failed.",
        errors,
      },
      { status: 502 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: asText(e?.message || e) },
      { status: 500 }
    );
  }
}
