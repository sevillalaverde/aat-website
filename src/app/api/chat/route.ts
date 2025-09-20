import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Provider = "openai" | "gemini" | "grok";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const provider = (body?.provider as Provider) || "openai";
    const prompt = String(body?.prompt || "").trim();

    if (!prompt) {
      return NextResponse.json({ ok: false, error: "Missing prompt" }, { status: 400 });
    }

    // Try the selected provider first, then fall back safely
    const order: Provider[] = Array.from(new Set<Provider>([
      provider,
      "openai",
      "gemini",
      "grok",
    ]));

    let lastError = "Unknown error";
    for (const p of order) {
      try {
        const text = await ask(p, prompt);
        return NextResponse.json({ ok: true, provider: p, text });
      } catch (e: any) {
        const msg = e?.message || String(e);
        lastError = `${p} error: ${msg}`;
        // continue to next provider
      }
    }
    return NextResponse.json({ ok: false, error: lastError }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

async function ask(p: Provider, prompt: string): Promise<string> {
  switch (p) {
    case "openai": {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error("OPENAI_API_KEY missing");
      const client = new OpenAI({ apiKey: key });
      const r = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Be concise and helpful. If topic is financial/crypto, include a short non-advice disclaimer." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });
      const content = r.choices?.[0]?.message?.content;
      const text =
        typeof content === "string"
          ? content
          : Array.isArray(content)
          ? content.map((c: any) => c?.text ?? "").join("\n")
          : String(content || "");
      if (!text) throw new Error("Empty response from OpenAI");
      return text;
    }

    case "gemini": {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_API_KEY missing");
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const r = await model.generateContent(prompt);
      const text = r.response?.text?.() ?? "";
      if (!text) throw new Error("Empty response from Gemini");
      return text;
    }

    case "grok": {
      const key = process.env.XAI_API_KEY;
      if (!key) throw new Error("XAI_API_KEY missing");

      // xAI public API may be /v1/responses or /v1/chat/completions depending on account.
      const resp = await fetch("https://api.x.ai/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-2-latest",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => resp.statusText);
        throw new Error(`${resp.status} ${errText}`);
      }

      const ct = resp.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await resp.json();
        const text =
          j?.output?.[0]?.content?.[0]?.text || // responses-style
          j?.choices?.[0]?.message?.content ||  // chat.completions-style
          j?.content?.[0]?.text ||
          j?.message?.content ||
          j?.text ||
          "";
        if (!text) throw new Error("Empty response body from xAI");
        return typeof text === "string" ? text : JSON.stringify(text);
      } else {
        const text = await resp.text();
        if (!text) throw new Error("Empty non-JSON body from xAI");
        return text;
      }
    }
  }
}
