"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";

type RoadmapItem = { label: string; done?: boolean };
type Phase = { title: string; items: RoadmapItem[] };

const PHASES: Phase[] = [
  {
    title: "Phase 0 — Baseline",
    items: [
      { label: "Mainnet $AAT ERC-20 Deploy & Verify" },
      { label: "Token Logo + Tokenlist JSON" },
      { label: "Minimal Website + AI Lab Skeleton" },
      { label: "Wallet Connect + “Add Token” Button" },
    ],
  },
  {
    title: "Phase 1 — Foundation & Security",
    items: [
      { label: "Safe Multisig Treasury" },
      { label: "Contract Timelock & Ownership Plan" },
      { label: "Chainlink Price Oracle Integration" },
      { label: "Monitoring, Alerts & On-chain Analytics" },
    ],
  },
  {
    title: "Phase 2 — AI Core (Tri-Provider)",
    items: [
      { label: "Provider Router (OpenAI / Gemini / Grok)" },
      { label: "Sentiment Ingestion from X (Grok)" },
      { label: "Macro “What-If” Engine (Gemini)" },
      { label: "Portfolio Optimizer & Risk Scoring (OpenAI)" },
      { label: "RAG Data Layer for Market Docs" },
      { label: "Moderation, Guardrails & Compliance Layer" },
      { label: "Caching, Rate-Limits & Cost Controls" },
    ],
  },
  {
    title: "Phase 3 — Product Features",
    items: [
      { label: "AI Signals Feed (Short/Medium-Term)" },
      { label: "Real-Time Alerts & Webhooks" },
      { label: "Watchlists & Custom Screens" },
      { label: "Strategy Backtester (Paper)" },
      { label: "Research Notes Generator" },
      { label: "AAT Staker-Only Premium Endpoints" },
    ],
  },
  {
    title: "Phase 4 — Liquidity & Launch",
    items: [
      { label: "Presale / Auction Module" },
      { label: "Initial Liquidity Plan & Auto LP Tools" },
      { label: "Buyback/Burn Automation Hooks" },
      { label: "CoinGecko/CMC Listings Readiness" },
    ],
  },
  {
    title: "Phase 5 — Multichain Expansion",
    items: [
      { label: "Base + Arbitrum Deploys" },
      { label: "Cross-Chain Bridge (e.g., Wormhole/Axelar)" },
      { label: "Stable Pairs (USDT/USDC) + WETH/WBTC" },
      { label: "Solana Strategy (WLFI / USD1 Synergy)" },
    ],
  },
  {
    title: "Phase 6 — Dev & Ecosystem",
    items: [
      { label: "Public API & SDK" },
      { label: "AAT AI Marketplace (Bounties)" },
      { label: "Example Bots (X, Telegram, Discord)" },
      { label: "Partner Integrations (DEXs, Wallets)" },
    ],
  },
  {
    title: "Phase 7 — Governance & Incentives",
    items: [
      { label: "Staking & Fee-Share Model" },
      { label: "On-chain Voting (Snapshot/SafeSnap)" },
      { label: "Referral & Ambassador Programs" },
      { label: "Grants for Research & Tools" },
    ],
  },
  {
    title: "Phase 8 — Growth & Ops",
    items: [
      { label: "Docs & Playbooks" },
      { label: "Press Kit & Launch Campaigns" },
      { label: "KPI Dashboard & Weekly Reports" },
      { label: "Bug Bounty & Audit Program" },
    ],
  },
  {
    title: "Phase 9 — Enterprise & Data",
    items: [
      { label: "Data Lake & ETL Pipelines" },
      { label: "Fine-Tuning / Toolformer Experiments" },
      { label: "Model Evaluation Harness" },
      { label: "Compliance: Terms, Privacy, Disclaimers" },
    ],
  },
];

const STORAGE_KEY = "aat-roadmap-v1";

type SavedState = Record<string, boolean>;

export default function RoadmapPage() {
  const [checked, setChecked] = useState<SavedState>({});

  // Load progress from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {}
  }, []);

  // Persist progress
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {}
  }, [checked]);

  const totals = useMemo(() => {
    const perPhase = PHASES.map((p) => {
      const total = p.items.length;
      const done = p.items.filter((it) => checked[itemKey(p.title, it.label)]).length;
      const pct = Math.round((done / Math.max(1, total)) * 100);
      return { title: p.title, total, done, pct };
    });
    const allDone = perPhase.reduce((a, b) => a + b.done, 0);
    const allTotal = PHASES.reduce((a, p) => a + p.items.length, 0);
    const allPct = Math.round((allDone / Math.max(1, allTotal)) * 100);
    return { perPhase, allDone, allTotal, allPct };
  }, [checked]);

  function itemKey(phaseTitle: string, label: string) {
    return `${phaseTitle}::${label}`;
  }

  function toggleItem(phaseTitle: string, label: string, value: boolean) {
    const key = itemKey(phaseTitle, label);
    setChecked((prev) => ({ ...prev, [key]: value }));
  }

  function setPhase(phaseTitle: string, value: boolean) {
    const next = { ...checked };
    const phase = PHASES.find((p) => p.title === phaseTitle);
    if (!phase) return;
    phase.items.forEach((it) => {
      next[itemKey(phaseTitle, it.label)] = value;
    });
    setChecked(next);
  }

  function resetAll() {
    setChecked({});
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 rounded-2xl border p-6 bg-gradient-to-br from-indigo-50 via-white to-rose-50">
          <h1 className="text-3xl md:text-5xl font-bold">AAT Roadmap</h1>
          <p className="mt-3 text-neutral-600">
            99% AI (OpenAI + Gemini + Grok), 1% human execution. Progress is saved locally in your browser.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-neutral-700">
              Overall Progress: <b>{totals.allDone}</b> / {totals.allTotal} ({totals.allPct}%)
            </span>
            <div className="h-2 w-full md:w-72 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-black" style={{ width: `${totals.allPct}%` }} />
            </div>
            <button
              onClick={resetAll}
              className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50 text-sm"
              title="Clear local progress"
            >
              Reset Progress
            </button>
            <Link href="/lab" className="px-3 py-1.5 rounded-lg bg-black text-white text-sm">
              Open AI Lab
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PHASES.map((phase, idx) => {
            const state = totals.perPhase[idx];
            return (
              <section key={phase.title} className="rounded-2xl border p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">{phase.title}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-600">
                      {state.done}/{state.total} ({state.pct}%)
                    </span>
                    <button
                      onClick={() => setPhase(phase.title, true)}
                      className="px-2 py-1 rounded-md border text-xs hover:bg-neutral-50"
                    >
                      Mark all
                    </button>
                    <button
                      onClick={() => setPhase(phase.title, false)}
                      className="px-2 py-1 rounded-md border text-xs hover:bg-neutral-50"
                    >
                      Unmark all
                    </button>
                  </div>
                </div>

                <div className="mt-3 h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-full bg-black" style={{ width: `${state.pct}%` }} />
                </div>

                <ul className="mt-4 space-y-2">
                  {phase.items.map((it) => {
                    const key = itemKey(phase.title, it.label);
                    const isChecked = !!checked[key];
                    return (
                      <li key={key} className="flex items-start gap-3">
                        <input
                          id={key}
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={isChecked}
                          onChange={(e) => toggleItem(phase.title, it.label, e.target.checked)}
                        />
                        <label htmlFor={key} className="cursor-pointer">
                          {it.label}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
