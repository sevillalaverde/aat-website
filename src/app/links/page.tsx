import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Links — American AI ($AAT)",
  description: "All official links for American AI ($AAT).",
  alternates: { canonical: "https://theaat.xyz/links" },
  openGraph: {
    title: "Links — American AI ($AAT)",
    description: "Official links.",
    url: "https://theaat.xyz/links",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Links — American AI ($AAT)",
    description: "Official links.",
    images: ["/opengraph-image.png"],
  },
};

export default function LinksPage() {
  const items = [
    { label: "🚀 Try the AI Lab", href: "/lab" },
    { label: "🧭 Roadmap", href: "/roadmap" },
    { label: "🐦 X (Twitter)", href: "https://x.com/aait_ai", external: true },
    { label: "📣 Telegram", href: "https://t.me/american_aat", external: true },
    { label: "💬 Discord", href: "https://discord.gg/sC84NN33", external: true },
    { label: "🔎 Etherscan (AAT)", href: "https://etherscan.io/token/0x993aF915901CC6c2b8Ee38260621dc889DCb3C54", external: true },
    { label: "💧 Uniswap", href: "https://app.uniswap.org/#/swap?outputCurrency=0x993aF915901CC6c2b8Ee38260621dc889DCb3C54", external: true },
    { label: "🌐 Website", href: "/", external: false },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      <section className="max-w-md mx-auto px-4 py-10 text-center">
        <img src="/favicon.ico" alt="AAT" className="mx-auto w-20 h-20 rounded-2xl mb-4" />
        <h1 className="text-2xl font-semibold">American AI ($AAT)</h1>
        <p className="text-neutral-600 mt-2">99% AI • 1% human — Grok, Gemini & ChatGPT investor tools.</p>

        <div className="mt-6 space-y-3">
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href}
              target={it.external ? "_blank" : undefined}
              rel={it.external ? "noreferrer" : undefined}
              className="block w-full rounded-xl border px-5 py-4 hover:bg-neutral-50 active:scale-[.99]"
            >
              {it.label}
            </a>
          ))}
        </div>

        <p className="text-xs text-neutral-500 mt-8">
          We never DM first. Never share seed phrases. NFA. DYOR.
        </p>
      </section>
    </main>
  );
}
