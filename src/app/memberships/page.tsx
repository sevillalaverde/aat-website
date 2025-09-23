import type { Metadata } from "next";
import VerifyFormClient from "./VerifyFormClient";
import TokenRegisterClient from "./TokenRegisterClient";

export const metadata: Metadata = {
  title: "Memberships — American AI ($AAT)",
  description: "Pay in crypto (ETH or SOL) to activate your AAT membership and register tokens.",
};

const ETH = "0xfD548c04aE37B949ADe624C4a91b16A871d64d82";
const SOL = "HykcPLCPscrfnjVSxkoxR4Fgp6MWGmgj5DTzx5oKZZt5";

const tiers = [
  { name: "Starter",     price: "19 / mo",  perks: ["AI Lab access", "Daily market brief", "Support chat"], tag: "Most friendly" },
  { name: "Pro",         price: "49 / mo",  perks: ["Everything in Starter", "Advanced token scans", "Roadmap alpha"], tag: "Popular" },
  { name: "Enterprise",  price: "199 / mo", perks: ["All Pro features", "Priority support", "Research requests"], tag: "For teams" },
];

export default function MembershipsPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Memberships</h1>
      <p className="text-gray-600 mb-8">
        Pay in crypto (<b>ETH</b> or <b>SOL</b>). Prices are USD equivalent; send the current USD value at payment time.
        After you pay, submit your TX hash below. Then you can <b>register your token</b> to appear on the public list.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div key={t.name} className="rounded-2xl border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t.name}</h2>
              <span className="text-xs rounded-full px-2 py-1 border">{t.tag}</span>
            </div>

            <div className="text-3xl font-bold mt-3">${t.price}</div>

            <ul className="mt-4 text-sm space-y-2">
              {t.perks.map((p) => <li key={p}>• {p}</li>)}
            </ul>

            <div className="mt-5 space-y-3">
              <div className="text-sm font-medium">Pay with ETH (ERC-20)</div>
              <div className="text-xs break-all">
                <code className="bg-gray-50 px-2 py-1 rounded border">{ETH}</code>
              </div>

              <div className="text-sm font-medium">Pay with SOL (Solana)</div>
              <div className="text-xs break-all">
                <code className="bg-gray-50 px-2 py-1 rounded border">{SOL}</code>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm underline">How much to send?</summary>
                <div className="text-sm mt-2">
                  Convert the tier’s USD price at the time of payment (use your wallet’s USD quote). Memo: <b>{t.name}</b>.
                </div>
              </details>

              <a href="#verify" className="inline-block mt-4 w-full text-center rounded-xl bg-black text-white py-2">
                I’ve paid — submit TX
              </a>
            </div>
          </div>
        ))}
      </div>

      <div id="verify" className="mt-12 rounded-2xl border p-6">
        <h3 className="text-xl font-semibold mb-2">Verify your payment</h3>
        <p className="text-sm text-gray-600 mb-4">
          Paste your transaction hash and contact email/Telegram. We’ll confirm and activate your membership.
        </p>
        <VerifyFormClient />
      </div>

      <div className="mt-12 rounded-2xl border p-6">
        <h3 className="text-xl font-semibold mb-2">Register your token</h3>
        <p className="text-sm text-gray-600 mb-4">
          After your membership is active, submit your token details. Approved tokens appear on the{" "}
          <a className="underline" href="/tokens">public list</a>.
        </p>
        <TokenRegisterClient />
      </div>
    </main>
  );
}
