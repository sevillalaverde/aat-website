// src/app/lab/page.tsx
import ChatBox from "@/components/ChatBox";
import AIDashboard from "@/components/AIDashboard";

export default function Lab() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Concierge Support Chat (kept exactly as your working widget) */} 
      <section className="rounded-2xl border bg-white p-6">
        <h1 className="text-2xl font-semibold mb-3">Ask the AAT Concierge</h1>
        <p className="text-sm text-neutral-600 mb-4">
          Questions about $AAT? How to buy? Safety? I’m here to help.
        </p>
        <ChatBox />
      </section> 

      {/* Research Aggregator (Grok → Gemini → OpenAI) – independent from SupportChat */}
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold mb-3">
          Research Aggregator (Grok → Gemini → OpenAI)
        </h2>
        <p className="text-sm text-neutral-600 mb-4">
          Experimental multi-AI analyst for markets, tokenomics and DeFi research.
        </p>
        <AIDashboard />
      </section>
    </main>
  );
}
