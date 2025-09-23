import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Token = {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  contract: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  description?: string;
  submittedAt: string;
  submitter?: string;
};

async function readTokens(): Promise<Token[]> {
  const p = path.join(process.cwd(), "content", "tokens.json");
  try {
    const txt = await fs.readFile(p, "utf8");
    return JSON.parse(txt) as Token[];
  } catch {
    return [];
  }
}

export default async function TokensPage() {
  const tokens = (await readTokens()).sort((a, b) => a.symbol.localeCompare(b.symbol));

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Listed tokens</h1>
      <p className="text-gray-600 mb-6">Community-submitted tokens. DYOR. No endorsements implied.</p>

      <div className="overflow-x-auto border rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Chain</th>
              <th className="px-3 py-2">Contract</th>
              <th className="px-3 py-2">Links</th>
              <th className="px-3 py-2">Added</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-3 py-2 font-semibold">{t.symbol}</td>
                <td className="px-3 py-2">{t.name}</td>
                <td className="px-3 py-2">{t.chain}</td>
                <td className="px-3 py-2">
                  <code className="bg-gray-50 px-2 py-1 rounded border break-all">{t.contract}</code>
                </td>
                <td className="px-3 py-2 space-x-2">
                  {t.website && (
                    <a className="underline" href={t.website} target="_blank" rel="noreferrer">
                      Website
                    </a>
                  )}
                  {t.twitter && (
                    <a className="underline" href={t.twitter} target="_blank" rel="noreferrer">
                      Twitter
                    </a>
                  )}
                  {t.telegram && (
                    <a className="underline" href={t.telegram} target="_blank" rel="noreferrer">
                      Telegram
                    </a>
                  )}
                </td>
                <td className="px-3 py-2">{new Date(t.submittedAt).toLocaleDateString()}</td>
              </tr>
            ))}

            {tokens.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-gray-500" colSpan={6}>
                  No tokens yet. Submit one from{" "}
                  <Link className="underline" href="/memberships">
                    Memberships
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
