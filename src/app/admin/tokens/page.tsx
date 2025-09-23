"use client";

import { useEffect, useState } from "react";

type Token = {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  contract: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  description?: string;
  submittedAt: string;
  submitter?: string;
};

export default function AdminTokensPage() {
  const [keyInput, setKeyInput] = useState<string>("");
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved key on mount (and fetch once if present)
  useEffect(() => {
    const saved = localStorage.getItem("aat_admin_key") || "";
    setKeyInput(saved);
    if (saved) unlockWith(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchTokens(k: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tokens", {
        headers: { "x-admin-key": k },
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "fetch_failed");
      setTokens(j.tokens || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }

  function unlock() {
    unlockWith(keyInput);
  }

  function unlockWith(k: string) {
    setAuthKey(k);
    localStorage.setItem("aat_admin_key", k);
    fetchTokens(k);
  }

  function lock() {
    setAuthKey(null);
    localStorage.removeItem("aat_admin_key");
    setTokens([]);
    setError(null);
  }

  async function save(token: Token) {
    if (!authKey) return alert("Unlock first.");
    const res = await fetch("/api/admin/tokens", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": authKey },
      body: JSON.stringify(token),
    });
    const j = await res.json().catch(() => null);
    if (res.ok && j?.ok) {
      fetchTokens(authKey);
    } else {
      alert(j?.error || "Save failed");
    }
  }

  async function remove(id: string) {
    if (!authKey) return alert("Unlock first.");
    if (!confirm("Delete this token?")) return;
    const res = await fetch(`/api/admin/tokens?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-admin-key": authKey },
    });
    const j = await res.json().catch(() => null);
    if (res.ok && j?.ok) {
      setTokens(tokens.filter(t => t.id !== id));
    } else {
      alert(j?.error || "Delete failed");
    }
  }

  async function create() {
    if (!authKey) return alert("Unlock first.");
    const symbol = prompt("Symbol? (e.g., WLFI)");
    const name = prompt("Name? (e.g., World Liberty Financial)");
    const chain = prompt("Chain? (Ethereum/Solana/Polygon/BNB/…)") || "";
    const contract = prompt("Contract/Mint?") || "";
    if (!symbol || !name || !chain || !contract) return;

    const res = await fetch("/api/admin/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": authKey },
      body: JSON.stringify({ symbol, name, chain, contract }),
    });
    const j = await res.json().catch(() => null);
    if (res.ok && j?.ok) fetchTokens(authKey);
    else alert(j?.error || "Create failed");
  }

  // Locked screen
  if (!authKey) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Admin — Tokens</h1>
        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-2 w-80"
            placeholder="Enter admin key"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
          />
          <button className="rounded bg-black text-white px-4" onClick={unlock}>Unlock</button>
        </div>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </main>
    );
  }

  // Unlocked screen
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Admin — Tokens</h1>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-1" onClick={lock}>Lock</button>
          <button className="rounded bg-black text-white px-3 py-1" onClick={create}>New Token</button>
        </div>
      </div>

      {loading && <div className="mb-3 text-sm text-gray-600">Loading…</div>}
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      <div className="overflow-x-auto border rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Chain</th>
              <th className="px-3 py-2">Contract</th>
              <th className="px-3 py-2">Links</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map(t => (
              <tr key={t.id} className="border-t align-top">
                <td className="px-3 py-2">
                  <input
                    className="border rounded px-2 py-1 w-24"
                    value={t.symbol}
                    onChange={(e) =>
                      setTokens(prev => prev.map(p => p.id === t.id ? { ...p, symbol: e.target.value.toUpperCase() } : p))
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="border rounded px-2 py-1 w-56"
                    value={t.name}
                    onChange={(e) =>
                      setTokens(prev => prev.map(p => p.id === t.id ? { ...p, name: e.target.value } : p))
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="border rounded px-2 py-1 w-28"
                    value={t.chain}
                    onChange={(e) =>
                      setTokens(prev => prev.map(p => p.id === t.id ? { ...p, chain: e.target.value } : p))
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="border rounded px-2 py-1 w-[22rem]"
                    value={t.contract}
                    onChange={(e) =>
                      setTokens(prev => prev.map(p => p.id === t.id ? { ...p, contract: e.target.value } : p))
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <input
                      className="border rounded px-2 py-1 w-56"
                      placeholder="Website"
                      value={t.website || ""}
                      onChange={(e) =>
                        setTokens(prev => prev.map(p => p.id === t.id ? { ...p, website: e.target.value } : p))
                      }
                    />
                    <input
                      className="border rounded px-2 py-1 w-56"
                      placeholder="Twitter"
                      value={t.twitter || ""}
                      onChange={(e) =>
                        setTokens(prev => prev.map(p => p.id === t.id ? { ...p, twitter: e.target.value } : p))
                      }
                    />
                    <input
                      className="border rounded px-2 py-1 w-56"
                      placeholder="Telegram"
                      value={t.telegram || ""}
                      onChange={(e) =>
                        setTokens(prev => prev.map(p => p.id === t.id ? { ...p, telegram: e.target.value } : p))
                      }
                    />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button className="rounded bg-black text-white px-3 py-1" onClick={() => save(t)}>Save</button>
                    <button className="rounded border px-3 py-1" onClick={() => remove(t.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {tokens.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-gray-500" colSpan={6}>
                  No tokens yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
