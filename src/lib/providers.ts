// lib/providers.ts
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function toSinglePrompt(messages: ChatMessage[]) {
  // Simple join for providers that want a single prompt string
  return messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
}

/** OpenAI (Chat Completions) */
export async function chatOpenAI(messages: ChatMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content ?? "";
}

/** Google Gemini */
export async function chatGemini(messages: ChatMessage[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = toSinglePrompt(messages);
  const res = await model.generateContent(prompt);
  return res.response.text();
}

/** xAI (Grok) — endpoint shape may evolve; adjust if docs differ */
export async function chatXAI(messages: ChatMessage[]) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY is missing");
  const base = process.env.XAI_API_BASE || "https://api.x.ai/v1";

  const r = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-2-latest",
      messages,            // OpenAI-compatible format; update if xAI expects a different schema
      temperature: 0.3,
    }),
  });

  if (!r.ok) {
    const errTxt = await r.text().catch(() => "");
    throw new Error(`xAI error ${r.status}: ${errTxt}`);
  }
  const json = await r.json();
  return json.choices?.[0]?.message?.content ?? "";
}
