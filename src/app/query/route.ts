// src/app/api/query/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic"; // no caching

type Answer = { provider: "grok" | "gemini" | "openai"; text: string };

async function callXAI(prompt: string): Promise<Answer> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI key missing");
  const model = process.env.XAI_MODEL || "grok-2-latest";

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`xAI ${res.status}: ${t}`);
  }
  const data = await res.json();
  const text =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.message ||
    JSON.stringify(data);
  if (!text) throw new Error("Empty xAI response");
  return { provider: "grok", text };
}

async function callGemini(prompt: string): Promise<Answer> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini key missing");
  const modelId = process.env.GEMINI_MODEL || "gemini-1.5-pro";
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: modelId });
  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.() ?? "";
  if (!text) throw new Error("Empty Gemini response");
  return { provider: "gemini", text };
}

async function callOpenAI(prompt: string): Promise<Answer> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI key missing");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const openai = new OpenAI({ apiKey: key });

  const out = await openai.chat.completions.create({
    model,
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }],
  });

  const text = out?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Empty OpenAI response");
  return { provider: "openai", text };
}

/**
 * POST /api/query
 * Body: { query: string, order?: ("grok"|"gemini"|"openai")[] }
 * Tries providers in order; returns each provider’s answer + a short synthesis when possible.
 */
export async function POST(req: Request) {
  try {
    const { query, order } = (await req.json().catch(() => ({}))) as {
      query?: string;
      order?: Array<"grok" | "gemini" | "openai">;
    };
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing 'query' string" },
        { status: 400 }
      );
    }

    const tryOrder = order?.length
      ? order
      : (["grok", "gemini", "openai"] as const);

    const answers: Answer[] = [];
    const errors: Record<string, string> = {};

    for (const p of tryOrder) {
      try {
        if (p === "grok") answers.push(await callXAI(query));
        if (p === "gemini") answers.push(await callGemini(query));
        if (p === "openai") answers.push(await callOpenAI(query));
      } catch (e: any) {
        errors[p] = e?.message || String(e);
      }
    }

    // Build a short synthesis if we have >1 answer and any provider to summarize
    let final = answers.map(a => `**${a.provider.toUpperCase()}**: ${a.text}`).join("\n\n");

    // If OpenAI exists, ask it for a concise synthesis
    if (answers.length > 1 && process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
        const synth = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "Synthesize the following multiple AI answers into one concise, helpful response for a crypto-investor. Avoid repetition.",
            },
            { role: "user", content: final },
          ],
        });
        final = synth?.choices?.[0]?.message?.content || final;
      } catch {
        /* keep concat version */
      }
    }

    return NextResponse.json({
      ok: true,
      used: answers.map(a => a.provider),
      answers,
      final,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
