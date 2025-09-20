// src/app/api/chat/route.ts
import { NextResponse } from "next/server";

/** Util: safe body parse */
async function readBody(req: Request): Promise<{ provider?: string; prompt?: string }> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

/** ---------- Providers ---------- */

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are AAT Support. Be concise, helpful, and friendly. Never give financial advice. When relevant, mention /lab, /roadmap, and Uniswap link.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(json?.error?.message || `OpenAI HTTP ${res.status}`);
  const text: string =
    json?.choices?.[0]?.message?.content ??
    json?.choices?.[0]?.text ??
    "";

  if (!text) throw new Error("Empty response from OpenAI");
  return text;
}

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
    encodeURIComponent(key);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "You are AAT Support. Be concise, helpful, and friendly. Never give financial advice. " +
                "When relevant, mention /lab, /roadmap, and the Uniswap link.\n\nUser: " +
                prompt,
            },
          ],
        },
      ],
    }),
  });

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(json?.error?.message || `Gemini HTTP ${res.status}`);

  // Gemini response shape
  const parts: any[] = json?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p: any) => p?.text ?? "").join("\n").trim();
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

async function callGrok(prompt: string): Promise<string> {
  const key = process.env.XAI_API_KEY;
  const model = process.env.XAI_MODEL || "grok-2-latest";
  if (!key) throw new Error("XAI_API_KEY missing");

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are AAT Support. Be concise, helpful, and friendly. Never give financial advice.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(json?.error?.message || `xAI HTTP ${res.status}`);

  const text: string =
    json?.choices?.[0]?.message?.content ??
    json?.choices?.[0]?.text ??
    "";
  if (!text) throw new Error("Empty response from Grok/xAI");
  return text;
}

/** Try a provider, return {ok,text,error} without throwing */
async function tryOne<T extends string>(
  name: T,
  fn: () => Promise<string>
): Promise<{ ok: true; provider: T; text: string } | { ok: false; provider: T; error: string }> {
  try {
    const text = await fn();
    return { ok: true, provider: name, text };
  } catch (e: any) {
    return { ok: false, provider: name, error: e?.message || String(e) };
  }
}

/** ---------- Single export: POST ---------- */
export async function POST(req: Request) {
  const { provider, prompt } = await readBody(req);
  const question = (prompt || "").toString().trim();

  if (!question) {
    return NextResponse.json(
      { ok: false, error: "Missing 'prompt'." },
      { status: 400 }
    );
  }

  // Order: explicit provider else Grok → Gemini → OpenAI
  const queue =
    provider === "openai"
      ? (["openai"] as const)
      : provider === "gemini"
      ? (["gemini"] as const)
      : provider === "grok"
      ? (["grok"] as const)
      : (["grok", "gemini", "openai"] as const);

  const results: any[] = [];
  for (const p of queue) {
    if (p === "grok") {
      const r = await tryOne("grok", () => callGrok(question));
      results.push(r);
      if (r.ok) return NextResponse.json({ ok: true, provider: r.provider, text: r.text, fallbackErrors: results.filter(x => !x.ok) });
    } else if (p === "gemini") {
      const r = await tryOne("gemini", () => callGemini(question));
      results.push(r);
      if (r.ok) return NextResponse.json({ ok: true, provider: r.provider, text: r.text, fallbackErrors: results.filter(x => !x.ok) });
    } else if (p === "openai") {
      const r = await tryOne("openai", () => callOpenAI(question));
      results.push(r);
      if (r.ok) return NextResponse.json({ ok: true, provider: r.provider, text: r.text, fallbackErrors: results.filter(x => !x.ok) });
    }
  }

  // If we reached here, all failed
  return NextResponse.json(
    {
      ok: false,
      error: "All providers failed",
      fallbackErrors: results.filter(x => !x.ok),
    },
    { status: 502 }
  );
}
