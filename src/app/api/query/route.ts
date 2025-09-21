// src/app/api/query/route.ts
import { NextResponse } from "next/server";
import { kbContextFor } from "@/lib/kb";
import { getMetricsForAsset } from "@/lib/finance";

type Body = {
  query?: string;
  asset?: string; // "aat" | "wlfi" | "btc" | "eth" | etc
};

const SYS_PROMPT = `
You are **AAT Concierge**, a crisp, friendly finance assistant for the American AI Token project.

Goals:
- Answer **directly** with high signal, like a Bloomberg terminal note.
- Do **not** send users to external sites or paste long URLs.
- Use the provided "Context" and "Live Metrics" faithfully.
- Keep tone: helpful, calm, confident; offer next steps when useful.
- If something is unknown or uncertain, say so plainly and suggest what we will do to find out.
- Never invent numbers. If no metric, show "N/A".

Format:
1) TL;DR — one short paragraph
2) Key Numbers — short bullets (only if available)
3) What it means — 2-5 bullets
4) How to act on AAT — concrete next steps inside the AAT app

Keep answers under ~200 words unless the user asks for deep detail.
`;

function buildUserPrompt(q: string, asset: string | undefined, kb: string, metrics: any) {
  const lines: string[] = [];
  lines.push("## Context");
  lines.push(kb || "N/A");
  lines.push("## Live Metrics");
  lines.push(
    metrics
      ? JSON.stringify(metrics, null, 2)
      : "N/A"
  );
  lines.push("## User Question");
  lines.push(q);
  lines.push("## Instructions");
  lines.push("Follow the system prompt exactly. No links. Be concise, high-signal.");
  if (asset) lines.push(`Primary asset focus: ${asset.toUpperCase()}`);
  return lines.join("\n\n");
}

async function readJSON(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON from provider: ${text.slice(0, 200)}`);
  }
}

async function callGrok(prompt: string): Promise<string> {
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
      messages: [
        { role: "system", content: SYS_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 500,
    }),
  });
  const json = await readJSON(res);
  const msg = json?.choices?.[0]?.message?.content;
  if (!msg) throw new Error("Empty Grok response");
  return String(msg);
}

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYS_PROMPT}\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
      }),
    }
  );
  const json = await readJSON(res);
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("\n") ||
    "";
  if (!text.trim()) throw new Error("Empty Gemini response");
  return text;
}

async function callOpenAI(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYS_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 500,
    }),
  });
  const json = await readJSON(res);
  const txt = json?.choices?.[0]?.message?.content;
  if (!txt) throw new Error("Empty OpenAI response");
  return String(txt);
}

export async function POST(req: Request) {
  try {
    const { query, asset }: Body = await req.json().catch(() => ({}));
    const q = (query || "").toString().trim();
    const a = (asset || "").toString().trim().toLowerCase();

    if (!q) {
      return NextResponse.json(
        { ok: false, error: "Missing `query`." },
        { status: 400 }
      );
    }

    // Build grounding
    const kb = kbContextFor([a || "aat", "wlfi"].filter(Boolean));
    const metrics = a ? await getMetricsForAsset(a) : await getMetricsForAsset("aat");
    const userPrompt = buildUserPrompt(q, a || undefined, kb, metrics);

    // Provider cascade: Grok -> Gemini -> OpenAI
    const errors: string[] = [];
    const tryOrder: Array<["grok" | "gemini" | "openai", (p: string) => Promise<string>]> = [
      ["grok", callGrok],
      ["gemini", callGemini],
      ["openai", callOpenAI],
    ];

    for (const [name, fn] of tryOrder) {
      try {
        const text = await fn(userPrompt);
        // Lightweight sanity: must include TL;DR
        if (!/TL;DR/i.test(text)) {
          throw new Error(`${name} returned low-structure text`);
        }
        return NextResponse.json({
          ok: true,
          provider: name,
          final: text,
          usedAsset: a || "aat",
          metrics: metrics || null,
        });
      } catch (e: any) {
        errors.push(`${name}: ${e?.message || String(e)}`);
      }
    }

    return NextResponse.json(
      { ok: false, error: "All providers failed", details: errors },
      { status: 502 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
