// src/app/api/ai/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYS_PROMPT =
  "You are AAT AI, part of the American AI Token ($AAT). Be concise, practical, and unbiased. If the user asks for market predictions, provide scenario analysis and risks, not financial advice.";

type Provider = "openai" | "gemini" | "xai";

export async function POST(req: Request) {
  try {
    const { prompt, provider }: { prompt: string; provider: Provider } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    switch (provider) {
      case "openai":
        return NextResponse.json({ text: await askOpenAI(prompt) });
      case "gemini":
        return NextResponse.json({ text: await askGemini(prompt) });
      case "xai":
        return NextResponse.json({ text: await askXAI(prompt) });
      default:
        return NextResponse.json({ text: await askOpenAI(prompt) });
    }
  } catch (err: any) {
    // Final safety net
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: Number(err?.status) || 500 }
    );
  }
}

// ---------- Providers ----------

async function askOpenAI(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYS_PROMPT },
        { role: "user", content: prompt },
      ],
    });
    return res.choices?.[0]?.message?.content?.trim() || "(no content)";
  } catch (e: any) {
    // Bubble status so the client can auto-fallback
    const err: any = new Error(e?.message || "OpenAI error");
    err.status = e?.status || e?.code === "rate_limit_exceeded" ? 429 : 500;
    throw err;
  }
}

async function askGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    systemInstruction: SYS_PROMPT,
  });

  const res = await model.generateContent(prompt);
  return res.response.text().trim();
}

async function askXAI(prompt: string): Promise<string> {
  if (!process.env.XAI_API_KEY) throw new Error("XAI_API_KEY missing");

  // xAI’s API is OpenAI-compatible. Default model if you don’t set XAI_MODEL:
  const model = process.env.XAI_MODEL || "grok-2";
  const resp = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYS_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!resp.ok) {
    const data = await safeJson(resp);
    const err: any = new Error(
      data?.error?.message || `xAI error ${resp.status}`
    );
    err.status = resp.status;
    throw err;
  }

  const data = await resp.json();
  return data?.choices?.[0]?.message?.content?.trim() || "(no content)";
}

async function safeJson(r: Response) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}
