import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

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

const TOKENS_PATH = path.join(process.cwd(), "content", "tokens.json");

async function readTokens(): Promise<Token[]> {
  try {
    const txt = await (await fs.readFile(TOKENS_PATH, "utf8")).toString();
    return JSON.parse(txt) as Token[];
  } catch {
    return [];
  }
}

async function writeTokens(tokens: Token[]) {
  await fs.mkdir(path.dirname(TOKENS_PATH), { recursive: true });
  await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2), "utf8");
}

function slugify(s: string) {
  return String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, symbol, chain, contract, website, twitter, telegram, description, contact, tier, membershipTx } = body || {};
    if (!name || !symbol || !chain || !contract) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    const id = slugify(`${symbol}-${chain}`);
    const contractNorm = String(contract).trim();
    const tokens = await readTokens();

    const exists = tokens.find(
      (t) =>
        t.id === id ||
        (t.chain.toLowerCase() === String(chain).toLowerCase() && t.contract.toLowerCase() === contractNorm.toLowerCase())
    );
    if (exists) return NextResponse.json({ ok: false, error: "already_listed" }, { status: 409 });

    const token: Token = {
      id,
      name: String(name).trim(),
      symbol: String(symbol).trim().toUpperCase(),
      chain: String(chain).trim(),
      contract: contractNorm,
      website: website?.trim(),
      twitter: twitter?.trim(),
      telegram: telegram?.trim(),
      description: description?.trim(),
      submittedAt: new Date().toISOString(),
      submitter: contact?.trim(),
    };

    tokens.push(token);
    await writeTokens(tokens);
    console.log("token-registered:", { id: token.id, symbol: token.symbol });

    return NextResponse.json({ ok: true, token }, { status: 200 });
  } catch (e: any) {
    console.error("register-error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}
