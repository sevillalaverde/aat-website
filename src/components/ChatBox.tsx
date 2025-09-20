"use client";
import { useState } from "react";

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "grok",   label: "Grok (xAI)" },
];

export default function ChatBox() {
  const [provider, setProvider] = useState("openai");
  const [prompt, setPrompt] = useState("");
  const [out, setOut] = useState("");

  async function send() {
    setOut("Thinking…");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, prompt }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        data = { ok: false, error: text || res.statusText || `HTTP ${res.status}` };
      }

      if (data.ok) {
        setOut(`(${data.provider}) ${data.text}`);
      } else {
        setOut(data.error || `Error ${res.status}`);
      }
    } catch (e: any) {
      setOut(e?.message || String(e));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm">Provider</label>
        <select
          className="border rounded px-3 py-2"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          {PROVIDERS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <textarea
        className="w-full h-40 border rounded p-3"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask anything (markets, WLFI, macro, portfolio)…"
      />

      <button onClick={send} className="px-4 py-2 rounded bg-black text-white">
        Send
      </button>

      {out ? <pre className="whitespace-pre-wrap border rounded p-3">{out}</pre> : null}
    </div>
  );
}
