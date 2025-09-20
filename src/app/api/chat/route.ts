// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Provider = "openai" | "gemini";

function formatErr(err: any) {
  const status = err?.status ?? err?.response?.status ?? 500;
  const code =
    err?.code ||
    err?.error?.code ||
    err?.response?.data?.error?.code ||
    (status === 429 ? "rate_limited" : "unknown");
  const message =
    err?.message ||
    err?.error?.message ||
    err?.response?.data?.error?.message ||
    "Unexpected error";
  return { status, code, message };
}

async function askOpenAI(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  const openai = new OpenAI({ apiKey: key });

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini", // lower cost, capable
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You are AAT, a crypto/market copilot. Be concise, practical, and include caveats. Never promise profits.",
      },
      { role: "user", content: prompt },
    ],
  });

  return res.choices?.[0]?.message?.content?.trim() || "";
}

async function askGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, provider }: { prompt: string; provider?: Provider } =
      await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { ok: false, error: { message: "Missing prompt" } },
        { status: 400 }
      );
    }

    const want: Provider = (provider as Provider) || "openai";

    if (want === "gemini") {
      const text = await askGemini(prompt);
      return NextResponse.json({ ok: true, provider: "gemini", text });
    }

    // Default try OpenAI, then fallback to Gemini on 429/quota errors
    try {
      const text = await askOpenAI(prompt);
      return NextResponse.json({ ok: true, provider: "openai", text });
    } catch (e: any) {
      const err = formatErr(e);
      if (err.status === 429 || err.code === "insufficient_quota") {
        // fallback to Gemini
        try {
          const text = await askGemini(prompt);
          return NextResponse.json({
            ok: true,
            provider: "gemini",
            fallbackFrom: "openai",
            note:
              "OpenAI quota/rate limit reached. Automatically answered with Gemini.",
            text,
          });
        } catch (gErr: any) {
          const g = formatErr(gErr);
          return NextResponse.json(
            {
              ok: false,
              error: {
                message:
                  "All providers failed. Check API keys and quotas (OpenAI & Gemini).",
                providers: { openai: err, gemini: g },
              },
            },
            { status: 500 }
          );
        }
      }
      // some other OpenAI error
      return NextResponse.json({ ok: false, error: err }, { status: err.status });
    }
  } catch (e: any) {
    const err = formatErr(e);
    return NextResponse.json({ ok: false, error: err }, { status: err.status });
  }
}
