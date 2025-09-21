// src/lib/kb.ts
export type KBEntry = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  disclaimers?: string[];
};

export const KB: Record<string, KBEntry> = {
  aat: {
    id: "aat",
    title: "American AI Token ($AAT)",
    summary:
      "AAT is a multi-chain AI utility token integrating Grok (xAI), Gemini, and ChatGPT. It powers an investor assistant with sentiment, macro scenarios, portfolio insights, and future agent features.",
    bullets: [
      "Utilities: AI concierge, sentiment + macro analysis, roadmap with strategy vaults & agents.",
      "Focus: Retail-first analytics with clear, verified summaries (no link-dumping).",
      "Website: theaat.xyz — support chat + AI Lab.",
    ],
    disclaimers: [
      "AAT is not investment advice. Always do your own research.",
      "Features roll out in phases; check roadmap for status.",
    ],
  },
  wlfi: {
    id: "wlfi",
    title: "World Liberty Financial ($WLFI / $USD1 ecosystem)",
    summary:
      "WLFI community and USD1 stablecoin ecosystem; often referenced by AAT for yield and hedging synergies.",
    bullets: [
      "Typical uses: stablecoin yield strategies, hedging flows.",
      "AAT roadmap includes WLFI-specific analytics & yield optimizer ideas.",
    ],
  },
  // Add more assets/projects as needed:
  btc: {
    id: "btc",
    title: "Bitcoin (BTC)",
    summary: "Macro benchmark asset; used as market regime signal in analytics.",
    bullets: [],
  },
  eth: {
    id: "eth",
    title: "Ethereum (ETH)",
    summary:
      "Smart contract backbone. AAT token is deployed on Ethereum mainnet (0x993aF9...).",
    bullets: [],
  },
};

export function kbContextFor(assets: string[]) {
  const idSet = new Set(
    assets.map((a) => a.trim().toLowerCase()).filter(Boolean)
  );
  const picked = Object.values(KB).filter((e) => idSet.has(e.id));
  if (picked.length === 0) return "";
  const lines: string[] = [];
  for (const e of picked) {
    lines.push(`### ${e.title}\n${e.summary}`);
    if (e.bullets?.length) {
      for (const b of e.bullets) lines.push(`- ${b}`);
    }
    if (e.disclaimers?.length) {
      lines.push("Disclaimers:");
      for (const d of e.disclaimers) lines.push(`- ${d}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
