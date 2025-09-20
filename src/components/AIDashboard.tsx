'use client';
import { useState } from "react";

export default function AIDashboard() {
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
        body: JSON.stringify({ query }), // default order: grok -> gemini -> openai
      });
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
    <div className="max-w-3xl mx-auto p-4 space-y-3">
      <textarea
        className="w-full border rounded p-3 min-h-[120px]"
        placeholder="Ask about markets, WLFI, tokenomics, yield…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        onClick={run}
        disabled={loading || !query.trim()}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {loading ? "Thinking…" : "Query AIs"}
      </button>
      <pre className="whitespace-pre-wrap text-sm bg-neutral-50 border rounded p-3">
        {out}
      </pre>
    </div>
  );
}
