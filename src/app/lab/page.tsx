'use client';
import Header from '@/components/Header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useState } from 'react';

async function askAI(provider: string, prompt: string, system?: string) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider, prompt, system }),
  });
  return res.json();
}

export default function Lab() {
  const [provider, setProvider] = useState<'openai'|'gemini'|'grok'>('openai');
  const [input, setInput] = useState('');
  const [out, setOut] = useState<string>('');

  const run = async (p: string, s?: string) => {
    setOut('Thinking...');
    const r = await askAI(provider, p, s);
    setOut(r.output || r.error || '');
  };

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold">AI Lab</h1>
          <select
            className="border rounded-lg px-3 py-2"
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
          >
            <option value="openai">ChatGPT (OpenAI)</option>
            <option value="gemini">Gemini</option>
            <option value="grok">Grok (xAI) — stub</option>
          </select>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <div className="grid gap-3">
              <textarea
                className="border rounded-xl p-3 h-40"
                placeholder="Ask anything…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button className="bg-black text-white rounded-xl px-4 py-2 w-fit"
                onClick={() => run(input)}>
                Run
              </button>
              <pre className="whitespace-pre-wrap p-4 bg-neutral-50 rounded-xl border">{out}</pre>
            </div>
          </TabsContent>

          <TabsContent value="sentiment">
            <div className="grid gap-3">
              <textarea
                className="border rounded-xl p-3 h-40"
                placeholder="Paste a tweet/thread or write: “Sentiment on WLFI today?”"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button className="bg-black text-white rounded-xl px-4 py-2 w-fit"
                onClick={() =>
                  run(`Classify sentiment (bearish/neutral/bullish) and give 0-100 score. Text:\n\n${input}`,
                      'You are a precise financial sentiment rater. Be concise and justify with 1-2 bullets.')
                }>
                Analyze
              </button>
              <pre className="whitespace-pre-wrap p-4 bg-neutral-50 rounded-xl border">{out}</pre>
            </div>
          </TabsContent>

          <TabsContent value="portfolio">
            <div className="grid gap-3">
              <textarea
                className="border rounded-xl p-3 h-40"
                placeholder="Describe risk profile & goals. Ex: “Crypto-heavy, 1y horizon, moderate risk.”"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button className="bg-black text-white rounded-xl px-4 py-2 w-fit"
                onClick={() =>
                  run(`Propose a sample allocation table (tickers + %) and a 3-bullet rationale.\n\nUser profile:\n${input}`,
                      'You are a cautious portfolio assistant. No financial advice; provide educational illustration only.')
                }>
                Propose Allocation
              </button>
              <pre className="whitespace-pre-wrap p-4 bg-neutral-50 rounded-xl border">{out}</pre>
            </div>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-xs text-neutral-500">
          Educational only. Not financial advice. Models may hallucinate; verify independently.
        </p>
      </main>
    </>
  );
}
