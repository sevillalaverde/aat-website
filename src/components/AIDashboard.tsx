// src/components/AIDashboard.tsx
'use client';
import { useState } from "react";

const ASSETS = [
  { id: "aat", label: "AAT" },
  { id: "wlfi", label: "WLFI" },
  { id: "btc", label: "BTC" },
  { id: "eth", label: "ETH" },
];

export default function AIDashboard() {
  const [asset, setAsset] = useState("aat");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<string>("");

  async function run() {
    setLoading(true);
    setOut("");
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, asset }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Bad response from /api/query (${res.status}). ${t}`);
      }
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "API error");
      setOut(data.final || JSON.stringify(data, null, 2));
    } catch (e: any) {
      setOut("Error: " + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex gap-2 items-center">
        <label className="text-sm text-neutral-600">Asset</label>
        <select
          value={asset}
          onChange={(e) => setAsset(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {ASSETS.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </div>

      <textarea
        className="w-full border rounded p-3 min-h-[120px]"
        placeholder="Ask like: “What’s WLFI and how could AAT holders use it safely?” or “Give me a TL;DR on AAT utilities.”"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button
        onClick={run}
        disabled={loading || !query.trim()}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {loading ? "Thinking…" : "Ask Concierge"}
      </button>

      <div className="text-xs text-neutral-500">
        Responses are grounded on AAT/WLFI context and live metrics when available. No external links.
      </div>

      <pre className="whitespace-pre-wrap text-sm bg-neutral-50 border rounded p-3">
        {out}
      </pre>
    </div>
  );
}
