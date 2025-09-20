"use client";

import { useState } from "react";

type Provider = "openai" | "gemini" | "grok";

export default function ChatBox() {
  const [provider, setProvider] = useState<Provider>("openai");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [meta, setMeta] = useState<{ provider?: string; fallbacks?: any }>();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    setLoading(true);
    setErr(null);
    setAnswer("");
    setMeta(undefined);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, prompt }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErr(data?.error || `HTTP ${res.status}`);
        setMeta({ fallbacks: data?.details });
        return;
      }
      setAnswer(data.text || "");
      setMeta({ provider: data.provider, fallbacks: data.fallbackErrors });
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <label className="block text-sm font-medium">Provider</label>
      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value as Provider)}
        className="border rounded px-3 py-2"
      >
        <option value="openai">OpenAI</option>
        <option value="gemini">Gemini</option>
        <option value="grok">Grok (xAI)</option>
      </select>

      <textarea
        className="w-full border rounded p-3 h-40"
        placeholder="Ask anything about markets, portfolios, macro…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={send}
        disabled={loading || !prompt.trim()}
        className="px-5 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {loading ? "Thinking…" : "Send"}
      </button>

      {err && (
        <pre className="whitespace-pre-wrap text-red-600 border rounded p-3">
          {meta?.fallbacks
            ? `(Tried other providers.)\n\n${err}`
            : err}
        </pre>
      )}

      {!!answer && (
        <div className="space-y-2">
          <div className="text-sm text-neutral-500">
            Answered by <b>{meta?.provider ?? provider}</b>
            {meta?.fallbacks && Object.keys(meta.fallbacks).length > 0 ? (
              <> &nbsp;<i>(fallbacks used)</i></>
            ) : null}
          </div>
          <pre className="whitespace-pre-wrap border rounded p-3">{answer}</pre>
        </div>
      )}
    </div>
  );
}
