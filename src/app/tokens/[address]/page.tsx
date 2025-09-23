// src/app/tokens/[address]/page.tsx
"use client";
import { useState } from "react";
import { TOKENS } from "@/lib/tokens";

export default function TokenDetail({ params }: { params: { address: string } }) {
  const token = TOKENS.find(t => t.address.toLowerCase() === decodeURIComponent(params.address).toLowerCase());

  const [q, setQ] = useState(`Give me a brief, factual overview of ${token?.symbol || params.address}: utility, risks, and what to verify before buying. Avoid price predictions.`);
  const [a, setA] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function ask() {
    setBusy(true); setA(""); setErr(null);
    try {
      const r = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setA(j.text);
    } catch (e: any) {
      setErr(e?.message || "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{token?.name || params.address}</h1>
        <div className="text-sm text-neutral-500">
          {token?.symbol ? `${token.symbol} · ` : ""}{token?.chain || "unknown"} · {params.address}
        </div>
        {token?.website && (
          <a className="text-sm underline mt-2 inline-block" href={token.website} target="_blank" rel="noreferrer">Website</a>
        )}
      </div>

      <div className="space-y-2">
        <textarea value={q} onChange={(e) => setQ(e.target.value)} className="w-full border rounded-xl p-3 min-h-[120px]" />
        <button onClick={ask} disabled={busy} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
          {busy ? "Thinking…" : "Ask AI about this token"}
        </button>
        {err && <div className="text-sm text-red-600">{err}</div>}
        {a && <div className="prose whitespace-pre-wrap text-sm border rounded-xl p-3 bg-neutral-50">{a}</div>}
      </div>
    </main>
  );
}
