// src/app/roadmap/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Roadmap — American AI ($AAT)",
  description:
    "Build plan for AAT: presale, liquidity, multi-chain listings, and AI feature rollouts.",
};

const phases = [
  {
    title: "Phase 1 — Foundation (Live)",
    items: [
      "Token deployed (ETH mainnet): 0x993aF915901CC6c2b8Ee38260621dc889DCb3C54",
      "Website + AI Lab (OpenAI→Gemini fallback)",
      "Brand assets (logo, X banner), Etherscan verification",
    ],
  },
  {
    title: "Phase 2 — Presale & Liquidity",
    items: [
      "Finalize token economics & sale contracts",
      "KOLs & WLFI community campaign",
      "Post-sale: LP on Uniswap (ETH/USDC or ETH/USDT), lock LP",
    ],
  },
  {
    title: "Phase 3 — AI Feature Rollout",
    items: [
      "Grok X sentiment engine (X/Twitter live signals)",
      "Gemini macro scenarios + OpenAI portfolio coach",
      "AAT credit staking for pro features",
    ],
  },
  {
    title: "Phase 4 — Multi-chain & Integrations",
    items: [
      "Bridge/wrap to SOL, BNB, BTC L2 where viable",
      "DEX listings + tokenlists for explorers/wallets",
      "SDK & bounties for community devs",
    ],
  },
];

export default function RoadmapPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold">Roadmap</h1>
      <p className="mt-3 text-neutral-600">
        Track our deliverables and what’s coming next. Questions?{" "}
        <Link href="/lab" className="underline">
          Ask the AAT AI
        </Link>
        .
      </p>

      <div className="mt-10 grid gap-6">
        {phases.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border p-6 bg-gradient-to-br from-white to-neutral-50"
          >
            <h2 className="text-2xl font-semibold">{p.title}</h2>
            <ul className="mt-4 list-disc pl-5 space-y-2">
              {p.items.map((it) => (
                <li key={it} className="text-neutral-700">
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
