// src/components/ChatBox.tsx
"use client";

import React, { useState } from "react";

type Provider = "openai" | "gemini" | "xai";

export default function ChatBox() {
  const [provider, setProvider] = useState<Provider>("openai");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(p: Provider) {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: p, prompt }),
    });
    return res;
  }

  async function onSend() {
    if (!prompt.trim()) return;
    setLoading(true);
    setAnswer("");

    try {
      // Primary call
      let res = await ask(provider);

      // Auto-fallbacks:
      // - If OpenAI rate-limits or errors, try Gemini
      // - If xAI rate-limits or errors, try Gemini
      if (!res.ok && (provider === "openai" || provider === "xai")) {
        const tag =
          provider === "openai"
            ? "(OpenAI quota/rate limit or error. Answered with Gemini.)\n\n"
            : "(Grok/xAI error. Answered with Gemini.)\n\n";
        const fallback = await ask("gemini");
        if (fallback.ok) {
          const data = await fallback.json();
          setAnswer(tag + (data.text || ""));
          return;
        } else {
          const err = await fallback.json().catch(() => ({}));
          setAnswer(tag + (err.error || "Unknown error from Gemini"));
          return;
        }
      }

      // Normal path
      const data = await res.json();
      if (res.ok) {
        setAnswer(String(data.text || "").trim());
      } else {
        setAnswer(data.error || "Unknown error");
      }
    } catch (e: any) {
      setAnswer(e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <label className="block text-sm mb-2">Provider</label>
      <select
        className="border rounded px-3 py-2"
        value={provider}
        onChange={(e) => setProvider(e.target.value as Provider)}
      >
        <option value="openai">OpenAI</option>
        <option value="gemini">Gemini</option>
        <option value="xai">Grok (xAI)</option>
      </select>

      <textarea
        className="w-full border rounded mt-4 p-3 h-40"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask anything about markets, tokens, or AAT tools…"
      />

      <button
        onClick={onSend}
        disabled={loading}
        className="mt-3 px-5 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {loading ? "Thinking…" : "Send"}
      </button>

      <pre className="mt-4 whitespace-pre-wrap text-sm p-3 border rounded">
        {answer}
      </pre>
    </div>
  );
}
