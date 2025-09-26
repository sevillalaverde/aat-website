// src/app/admin/tokens/page.tsx
import { promises as fs } from "fs";
import { join } from "path";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Tokens",
  description: "Admin tokens list (read-only on Vercel).",
};

async function readTokens() {
  try {
    const file = await fs.readFile(join(process.cwd(), "content", "tokens.json"), "utf8");
    const json = JSON.parse(file);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

export default async function AdminTokensPage() {
  const tokens = await readTokens();

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin — Tokens</h1>
        <Link href="/" className="underline">← Home</Link>
      </div>

      {tokens.length === 0 ? (
        <p className="mt-6 text-neutral-600">No tokens found.</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {tokens.map((t: any, i: number) => (
            <div key={i} className="rounded-xl border p-4 bg-white/70">
              <div className="text-lg font-semibold">
                {t.name} <span className="text-sm text-neutral-500">({t.symbol})</span>
              </div>
              <div className="text-sm text-neutral-700 mt-1 space-y-1">
                <div><span className="font-medium">ID:</span> {t.id}</div>
                <div><span className="font-medium">Chain:</span> {t.chain}</div>
                <div><span className="font-medium">Contract:</span> {t.contract}</div>
                {t.website && (
                  <div>
                    <span className="font-medium">Website:</span>{" "}
                    <a className="underline" href={t.website} target="_blank" rel="noreferrer">
                      {t.website}
                    </a>
                  </div>
                )}
                {t.submittedAt && (
                  <div><span className="font-medium">Submitted:</span> {t.submittedAt}</div>
                )}
                {t.submitter && (
                  <div><span className="font-medium">By:</span> {t.submitter}</div>
                )}
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                Note: editing/deleting requires a database or KV in production. File writes are not supported on Vercel serverless.
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
