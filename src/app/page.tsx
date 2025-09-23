import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-[70vh]">
      <section className="mx-auto max-w-6xl px-4 pt-10">
        <div className="rounded-3xl border p-8 md:p-12 bg-gradient-to-br from-rose-50 via-white to-blue-50">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            The AI-powered multi-chain token
            <br />for real investors
          </h1>
          <p className="mt-4 text-neutral-600 max-w-2xl">
            $AAT unites Grok XAI, Gemini, and ChatGPT to give retail an edge.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="/lab"
              className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-white"
            >
              Try the AI Lab
            </Link>
            <a
              href="https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0x993aF915901CC6c2b8Ee38260621dc889DCb3C54"
              target="_blank"
              className="inline-flex items-center rounded-xl border px-4 py-2"
              rel="noreferrer"
            >
              Buy on Uniswap
            </a>
          </div>

          <p className="mt-6 text-xs text-neutral-500 select-all">
            Token: 0x993aF915901CC6c2b8Ee38260621dc889DCb3C54
          </p>
        </div>
      </section>
    </main>
  );
}
