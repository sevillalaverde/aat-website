"use client";

import { useState } from "react";

type Provider = "openai" | "gemini" | "xai";

export default function ChatBox() {
  const [provider, setProvider] = useState<Provider>("openai");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState("");

  async function send() {
    if (!input.trim()) return;
    setBusy(true); setOutput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          messages: [{ role: "user", content: input }]
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setOutput(json.text);
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Ask the AAT AI</h2>
      <div className="flex gap-3 items-center">
        <label className="text-sm">Provider</label>
        <select
          className="border rounded px-2 py-1"
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
        >
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
          <option value="xai">xAI (Grok)</option>
        </select>
      </div>

      <textarea
        className="w-full border rounded p-3 min-h-[120px]"
        placeholder="Ask anything about markets, tokens, WLFI, etc."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        className="rounded px-4 py-2 bg-black text-white disabled:opacity-50"
        onClick={send}
        disabled={busy}
      >
        {busy ? "Thinking…" : "Send"}
      </button>

      {output && (
        <div className="border rounded p-3 whitespace-pre-wrap">
          {output}
        </div>
      )}
    </div>
  );
}
