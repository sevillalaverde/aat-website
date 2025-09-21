// src/lib/finance.ts
type Metrics = {
  symbol?: string;
  priceUSD?: number | null;
  liquidityUSD?: number | null;
  fdvUSD?: number | null;
  mcapUSD?: number | null;
  source?: string;
};

async function tryJSON(url: string, opts?: RequestInit, timeoutMs = 7000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) throw new Error("Non-JSON response");
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// Dexscreener per-token pairs (works for many chains)
export async function getDexscreenerByToken(tokenAddress: string): Promise<Metrics | null> {
  try {
    const data = await tryJSON(
      `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(
        tokenAddress
      )}`
    );
    const pair = data?.pairs?.[0];
    if (!pair) return null;
    return {
      symbol: pair?.baseToken?.symbol || pair?.quoteToken?.symbol,
      priceUSD: pair?.priceUsd ? Number(pair.priceUsd) : null,
      liquidityUSD: pair?.liquidity?.usd ? Number(pair.liquidity.usd) : null,
      fdvUSD: pair?.fdv ? Number(pair.fdv) : null,
      mcapUSD: null,
      source: "dexscreener",
    };
  } catch {
    return null;
  }
}

// Extend here with Coingecko/Coinpaprika if you want.
export async function getMetricsForAsset(asset: string): Promise<Metrics | null> {
  const id = asset.trim().toLowerCase();
  // Hardcode AAT mainnet address for convenience
  if (id === "aat") {
    const addr = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;
    if (!addr) return null;
    return await getDexscreenerByToken(addr);
  }
  // WLFI not guaranteed on Dexscreener by name; leave null for now (will improve later).
  return null;
}
