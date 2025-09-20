// src/app/page.tsx
'use client';

import Link from 'next/link';
import Header from '@/components/Header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="rounded-3xl p-10 bg-gradient-to-br from-indigo-50 via-white to-rose-50 border">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            The AI-powered multi-chain token for real investors
          </h1>

          <p className="mt-4 text-lg text-neutral-600">
            $AAT unites Grok XAI, Gemini, and ChatGPT to give retail an edge:
            live sentiment, macro scenarios, and portfolio insights.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/lab"
              className="px-5 py-3 rounded-xl bg-black text-white"
            >
              Try the AI Lab
            </Link>

            <a
              className="px-5 py-3 rounded-xl border"
              href="https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0x993aF915901CC6c2b8Ee38260621dc889DCb3C54"
              target="_blank"
              rel="noreferrer"
            >
              Buy on Uniswap
            </a>
          </div>

          <div className="mt-6 text-sm text-neutral-500">
            Token:{' '}
            <code>0x993aF915901CC6c2b8Ee38260621dc889DCb3C54</code>
          </div>
        </div>
      </main>
    </>
  );
}
