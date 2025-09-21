/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export const metadata = {
  title: "Roadmap — American AI ($AAT)",
  description:
    "Transparent, living roadmap for the American AI ($AAT) protocol: shipped items, in-progress work, and upcoming milestones.",
};

type Item = {
  label: string;
  done?: boolean;   // ✅ shipped (green)
  progress?: boolean; // 🟠 in progress
  href?: string;
};

type Phase = {
  title: string;
  items: Item[];
};

const CHECK = (
  <span
    aria-hidden
    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-[12px] mr-2"
    title="Done"
  >
    ✓
  </span>
);

const PROG = (
  <span
    aria-hidden
    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[12px] mr-2"
    title="In progress"
  >
    •
  </span>
);

const TODO = (
  <span
    aria-hidden
    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-300 text-neutral-700 text-[12px] mr-2"
    title="Planned"
  >
    –
  </span>
);

const phases: Phase[] = [
  {
    title: "Phase 0 — Foundation",
    items: [
      {
        label:
          "Deploy ERC-20 token on Ethereum mainnet (AAT) and verify on Etherscan",
        done: true,
        href: "https://etherscan.io/token/0x993aF915901CC6c2b8Ee38260621dc889DCb3C54",
      },
      {
        label: "Set token logo / metadata on Etherscan & wallets",
        done: true,
      },
      {
        label:
          "Source control & repos created (contracts + website), GitHub workflows",
        done: true,
        href: "https://github.com/sevillalaverde",
      },
    ],
  },
  {
    title: "Phase 1 — Web App MVP",
    items: [
      { label: "Next.js site scaffold (Home, Lab, Roadmap)", done: true, href: "/" },
      {
        label: "Wallet connect + Add-Token button (Wagmi/RainbowKit)",
        done: true,
      },
      {
        label:
          "Support Chat (concierge persona) with voice input toggle (mobile-friendly)",
        done: true,
        href: "/",
      },
      {
        label:
          "Basic SEO: titles, meta, social cards; robots/sitemap (foundation)",
        done: true,
      },
    ],
  },
  {
    title: "Phase 2 — AI Core (Aggregator) MVP",
    items: [
      {
        label:
          "Unified /api/chat & /api/query with provider order: Grok → Gemini → OpenAI",
        done: true,
      },
      {
        label:
          "Graceful fallbacks, JSON-safe responses, timeouts & error handling",
        done: true,
      },
      {
        label:
          "Lab page to test AAT intelligence & provider switching",
        done: true,
        href: "/lab",
      },
    ],
  },
  {
    title: "Phase 3 — Social & Community",
    items: [
      { label: "X profile live (@aait_ai) & pinned intro thread content", done: true, href: "https://x.com/aait_ai" },
      { label: "Telegram channel live (@american_aat)", done: true, href: "https://t.me/american_aat" },
      { label: "Discord server live", done: true, href: "https://discord.gg/sC84NN33" },
      { label: "Instagram profile live (@theaat.xyz)", done: true, href: "https://www.instagram.com/theaat.xyz" },
      { label: "Repo content folders for social posts (X/IG captions)", done: true },
      { label: "Daily “State of the Market” AI brief — code ready", done: true },
      { label: "Vercel Cron enabled & env set for auto-posting to TG/Discord", progress: true },
    ],
  },
  {
    title: "Phase 4 — Presale / Auction Plan",
    items: [
      { label: "Finalize sale mechanism (Fair launch / Dutch / Bonding Curve)", },
      { label: "Allowlist & KYC policy (if required by venue)", },
      { label: "Treasury / vesting smart-contract setup", },
      { label: "Campaign creative & landing with live metrics", },
    ],
  },
  {
    title: "Phase 5 — Liquidity & Listings",
    items: [
      { label: "Initial liquidity on Uniswap (ETH / USD stable pair)" },
      { label: "Tokenlists & metadata distribution (TokenLists.org, TrustWallet, etc.)" },
      { label: "CEX outreach package (one-pager, smart-contract summary, audit)" },
      { label: "Buyback / stabilization policy (transparent)" },
    ],
  },
  {
    title: "Phase 6 — Multichain",
    items: [
      { label: "Bridge & wrapped deployments (Arbitrum/OP/Base/Polygon)", },
      { label: "Solana representation (via Wormhole / canonical bridge)", },
      { label: "BNB Chain pair", },
      { label: "USD1 / USDT / USDC strategic LP pairs", },
    ],
  },
  {
    title: "Phase 7 — Advanced AI Features",
    items: [
      { label: "Alpha Cortex — token-gated strategy vault (backtests, deployable)", },
      { label: "AI-Powered Smart-Contract Auditing w/ Trust Score", },
      { label: "On-Chain AI Agent Builder (no-code triggers & actions)", },
      { label: `“DeFi Llama Killer” AI analytics (forward yield & DAO sentiment)`, },
      { label: `“Etherscan Explain” — humanized TX decode`, },
      { label: "Real-Time Macro Event Impact dashboard", },
      { label: "Tokenomics Simulator (supply/vesting/inflation scenarios)", },
      { label: "WLFI/USD1 Yield Optimizer module", },
      { label: "Whitelist & Airdrop AI Screener (paid in $AAT)", },
      { label: "Cross-Chain Arbitrage Agent (advisory, opt-in execution)", },
      { label: "Autonomous Sentiment Agent (X/Reddit scanners)", },
      { label: "Predictive Hedging Agent (scenario testing)", },
      { label: "Portfolio Guardian Agent (volatility & risk alerts)", },
      { label: "News Aggregation Agent (bias-checked summaries)", },
      { label: "Enterprise Query Agent (privacy-preserving analytics)", },
    ],
  },
  {
    title: "Phase 8 — Mobile & Extensions",
    items: [
      { label: "Chrome Extension (AAT mini-panel + ‘Explain’ anywhere)" },
      { label: "iOS App (voice chat, alerts, portfolio hooks)" },
      { label: "Android App (voice chat, alerts, portfolio hooks)" },
      { label: "Push notifications & deep links", },
    ],
  },
  {
    title: "Phase 9 — Ecosystem & Ops",
    items: [
      { label: "Docs, whitepaper v1, API marketplace", progress: true },
      { label: "Bug bounty & disclosure policy", },
      { label: "Security review pipeline (static + AI pre-audit + human)" },
      { label: "DAO design (grants, growth, listings, LP incentives)" },
    ],
  },
];

function BadgeLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
      <span className="inline-flex items-center">
        <span className="mr-2">{CHECK}</span> Done
      </span>
      <span className="inline-flex items-center">
        <span className="mr-2">{PROG}</span> In progress
      </span>
      <span className="inline-flex items-center">
        <span className="mr-2">{TODO}</span> Planned
      </span>
    </div>
  );
}

function Row({ item }: { item: Item }) {
  const icon = item.done ? CHECK : item.progress ? PROG : TODO;
  const textCls = item.done ? "text-neutral-900" : item.progress ? "text-neutral-900" : "text-neutral-700";
  const content = (
    <span className={`leading-snug ${textCls}`}>{item.label}</span>
  );
  return (
    <li className="flex items-start gap-2 py-2">
      {icon}
      {item.href ? (
        <Link
          href={item.href}
          target={item.href.startsWith("http") ? "_blank" : "_self"}
          className="hover:underline"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}

export default function RoadmapPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold">American AI — Roadmap</h1>
      <p className="mt-3 text-neutral-600">
        A living plan for shipping $AAT. We build in public: shipped items are marked{" "}
        <strong>green</strong>, in-progress are <strong>amber</strong>, and planned items are{" "}
        <strong>grey</strong>.
      </p>
      <BadgeLegend />

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        {phases.map((p, idx) => (
          <section
            key={idx}
            className="rounded-2xl border bg-white/70 backdrop-blur p-5"
          >
            <h2 className="text-xl font-semibold">{p.title}</h2>
            <ul className="mt-3">
              {p.items.map((it, i) => (
                <Row key={i} item={it} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 text-sm text-neutral-500">
        Need something prioritized? Hop in{" "}
        <Link href="https://t.me/american_aat" className="underline" target="_blank">
          Telegram
        </Link>{" "}
        or{" "}
        <Link href="https://discord.gg/sC84NN33" className="underline" target="_blank">
          Discord
        </Link>
        .
      </div>
    </main>
  );
}
