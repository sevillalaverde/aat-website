import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Roadmap — American AI Token ($AAT)",
  description:
    "AAT roadmap: Launch & Foundations, AI Core, DeFi Intelligence, Agents, Governance. Powered by Grok XAI, Gemini, and ChatGPT.",
  alternates: { canonical: "https://theaat.xyz/roadmap" },
};

type Item = {
  title: string;
  desc: string;
  tags?: string[];
  done?: boolean;   // ✅ mark completed items
};

const PHASES: { phase: string; blurb?: string; items: Item[] }[] = [
  {
    phase: "Phase 0 — Launch & Foundations (DONE)",
    blurb:
      "Everything needed to exist and iterate fast. Deployed token, verified contract, live MVP site, multi-provider AI endpoint.",
    items: [
      {
        title: "Deploy $AAT ERC-20 (Mainnet)",
        desc: "Contract deployed to 0x993aF915901CC6c2b8Ee38260621dc889DCb3C54 and verified on Etherscan.",
        tags: ["Token", "Mainnet"],
        done: true,
      },
      {
        title: "Etherscan setup (name, symbol, logo)",
        desc: "Token name/symbol configured; logo & metadata set so wallets/explorers show brand.",
        tags: ["Branding"],
        done: true,
      },
      {
        title: "GitHub org & repos",
        desc: "Organization and repos created (contracts + website) for collaborative development.",
        tags: ["Infra", "GitHub"],
        done: true,
      },
      {
        title: "Website MVP + AI Lab",
        desc: "Next.js app with AI chat endpoint and UI. Supports OpenAI, Gemini, and Grok with fallbacks.",
        tags: ["Web", "AI"],
        done: true,
      },
      {
        title: "Uniswap ‘Buy $AAT’ link",
        desc: "Direct swap link wired on the site to make acquisition easy.",
        tags: ["Growth", "UX"],
        done: true,
      },
      {
        title: "Roadmap page + SEO",
        desc: "This page, with JSON-LD ItemList and optimized metadata for Google indexing.",
        tags: ["SEO"],
        done: true,
      },
      // (Keep infra items here if you later want to tick them)
      // { title: "Vercel project + domain wired", desc: "Auto-deploys from main; custom domain connected.", tags: ["Infra"], done: true },
    ],
  },

  // ===== Your previously planned phases (unchecked until we build them) =====

  {
    phase: "Phase 1 — Core & Security",
    blurb:
      "Foundation + trust. Aggregated AI baseline, security agents, understandable on-chain insights.",
    items: [
      {
        title: "Fraud Detection Agent",
        desc: "Scans tx patterns/approvals to flag phishing & anomalies; bounties in $AAT.",
        tags: ["Security", "Agent", "Grok/Gem/ChatGPT"],
      },
      {
        title: "AI-Powered Smart Contract Auditing",
        desc: "Heuristic audit: known-exploit diffing, tokenomics rug-risk, ‘Trust Score’.",
        tags: ["Security", "Auditing"],
      },
      {
        title: "Etherscan Explain",
        desc: "Human-readable summaries for complex txs (multi-call, swap+stake+borrow).",
        tags: ["UX", "Analytics"],
      },
    ],
  },
  {
    phase: "Phase 2 — AI Core & Live Signals",
    blurb:
      "Live data + truth routing. X sentiment (Grok), bias-check (Gemini), reasoning (ChatGPT).",
    items: [
      {
        title: "Autonomous Sentiment Agent",
        desc: "Real-time X/Reddit/news monitoring; alerts & suggested rebalances.",
        tags: ["Agent", "Sentiment", "Signals"],
      },
      {
        title: "Real-Time Macro Event Impact",
        desc: "Live dashboard during Fed/ECB/CPI prints with sentiment + scenario analysis.",
        tags: ["Macro", "Live"],
      },
      {
        title: "News Aggregation Agent",
        desc: "Personalized, bias-checked summaries; staking unlocks premium filters.",
        tags: ["Agent", "Feed"],
      },
    ],
  },
  {
    phase: "Phase 3 — Investor Tools (Alpha Tier)",
    blurb:
      "Token-gated alpha surface + portfolio protection. Backtest and deploy strategies.",
    items: [
      {
        title: "Alpha Cortex Strategy Vault",
        desc: "AI-generated high-alpha strategies (pairs/event/factor).",
        tags: ["Alpha", "Vault", "Token-Gated"],
      },
      {
        title: "Predictive Hedging Agent",
        desc: "Scenario sims (rates/liquidity) + WLFI USD1 hedges; sandbox → live via $AAT.",
        tags: ["Agent", "Hedging"],
      },
      {
        title: "Portfolio Guardian Agent",
        desc: "Watchdog for volatility/credit/liquidity risks; cross-verified alerts.",
        tags: ["Agent", "Risk"],
      },
      {
        title: "Daily ‘State of the Market’ PDF",
        desc: "Morning brief with news, on-chain, sentiment. Lite free; full for holders.",
        tags: ["Reports", "Daily"],
      },
    ],
  },
  {
    phase: "Phase 4 — DeFi Intelligence",
    blurb:
      "Beyond TVL: predictive yields, undervalued protocol discovery, DAO sentiment.",
    items: [
      {
        title: "“DeFi Llama Killer” — AI Edition",
        desc: "Predictive yield trends, undervalued protocols, governance analysis.",
        tags: ["Analytics", "DeFi"],
      },
      {
        title: "WLFI Stablecoin Yield Optimizer",
        desc: "Continuous scan for safest/highest WLFI USD1 yields with risk scores.",
        tags: ["WLFI", "Yield"],
      },
      {
        title: "Yield Farming Optimizer Agent",
        desc: "Auto-rotate/compound (opt-in); simulations; deflationary fee burning.",
        tags: ["Agent", "Yield"],
      },
    ],
  },
  {
    phase: "Phase 5 — Agents & Automation",
    blurb:
      "From tool → platform. No-code agent builder and cross-chain automation (user-approved).",
    items: [
      {
        title: "On-Chain AI Agent Builder (No-Code)",
        desc: "Compose triggers (X keywords/price) + actions (alert/trade/hedge).",
        tags: ["Builder", "No-Code", "Agent"],
      },
      {
        title: "Cross-Chain Arbitrage Agent",
        desc: "Detect AAT/WLFI price dislocations (EVM + Solana); suggest/execute swaps.",
        tags: ["Agent", "Arb", "Multi-Chain"],
      },
    ],
  },
  {
    phase: "Phase 6 — Builders & Education",
    blurb:
      "Learning agents & dev kits; open bounties for plugins and data adapters.",
    items: [
      {
        title: "Personalized Learning Agent",
        desc: "Adaptive tutorials for investors and devs; unlockable tracks for $AAT.",
        tags: ["Agent", "Education"],
      },
      {
        title: "Tokenomics Simulator",
        desc: "Supply/vesting/utility modeling with inflation/deflation projections.",
        tags: ["Modeling", "Simulator"],
      },
    ],
  },
  {
    phase: "Phase 7 — Growth & Governance",
    blurb:
      "Community acquisition, DAO intelligence, enterprise queries, airdrop targeting.",
    items: [
      {
        title: "Whitelist & Airdrop AI Screener",
        desc: "Find ideal users via on-chain behaviors; projects pay in $AAT.",
        tags: ["Growth", "B2B"],
      },
      {
        title: "DAO Proposal Agent",
        desc: "AI drafts/evaluates proposals; agent-assisted pros/cons for voters.",
        tags: ["DAO", "Governance"],
      },
      {
        title: "Enterprise Query Agent",
        desc: "Advanced, privacy-aware analysis; optional zk-proofs; metered credits.",
        tags: ["Enterprise", "Agent"],
      },
    ],
  },

  {
    phase: "Phase 8 — Apps & Distribution",
    blurb:
      "Native & extension clients so AAT intelligence is everywhere users trade. Unified auth, WalletConnect, and real-time AI alerts.",
    items: [
      {
        title: "Google Chrome Extension (Trader Companion)",
        desc:
          "Overlay AI insights on Etherscan/DEXs/CEXs: Grok X sentiment, Gemini charts, tx ‘Explain’, risk flags, quick-swap deeplinks.",
        tags: ["Chrome", "Extension", "Grok/Gemini/ChatGPT", "WalletConnect"],
      },
      {
        title: "Apple iOS Mobile App",
        desc:
          "React Native (Expo) app: wallet connect, watchlists, push alerts, on-device secure storage, Uniswap deeplinks, AI Lab mini.",
        tags: ["iOS", "Mobile", "Expo", "Push"],
      },
      {
        title: "Android Mobile App",
        desc:
          "React Native (Expo) parity with iOS: portfolio view, alerts, agent triggers, WLFI USD1 yield tiles, light/dark UI.",
        tags: ["Android", "Mobile", "Expo", "Push"],
      },
    ],
  },


];

const ALL_ITEMS = PHASES.flatMap((p) => p.items.map((i) => i.title));

export default function RoadmapPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: ALL_ITEMS.map((name, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name,
      url: `https://theaat.xyz/roadmap#${slugify(name)}`,
    })),
  };

  return (
    <>
      <Script
        id="roadmap-itemlist"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-14">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          $AAT Roadmap
        </h1>
        <p className="mt-4 text-neutral-600 max-w-3xl">
          Built by <strong>99% AI</strong> (Grok XAI + Gemini + ChatGPT) and{" "}
          <strong>1% human</strong>. From launch to fully agentic,
          multi-chain DeFi intelligence.
        </p>

        <div className="mt-8 flex gap-3">
          <a
            className="px-5 py-3 rounded-xl bg-black text-white"
            href="https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0x993aF915901CC6c2b8Ee38260621dc889DCb3C54"
            target="_blank"
            rel="noreferrer"
          >
            Buy $AAT
          </a>
          <Link href="/lab" className="px-5 py-3 rounded-xl border">
            Try AI Lab
          </Link>
        </div>

        <div className="mt-12 space-y-10">
          {PHASES.map(({ phase, blurb, items }) => (
            <section key={phase} className="rounded-3xl border p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-semibold">{phase}</h2>
              {blurb && <p className="mt-2 text-neutral-600">{blurb}</p>}

              <ul className="mt-6 grid md:grid-cols-2 gap-6">
                {items.map((item) => (
                  <li key={item.title} id={slugify(item.title)} className="flex gap-3">
                    <input
                      type="checkbox"
                      disabled
                      checked={!!item.done}
                      className={`mt-1 h-5 w-5 ${item.done ? "accent-green-600" : "accent-neutral-400"}`}
                      aria-label={item.title}
                      title={item.done ? "Completed" : "Planned"}
                    />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {item.title}
                        {item.done && (
                          <span className="text-xs rounded-full bg-green-600 text-white px-2 py-0.5">
                            DONE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">{item.desc}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              className="text-xs rounded-full border px-2 py-1"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-neutral-500">
          Last updated: {new Date().toISOString().slice(0, 10)} • Some items may shift as
          dependencies land. Alpha-gated features require staking $AAT.
        </p>
      </main>
    </>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
