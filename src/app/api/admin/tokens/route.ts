import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type Token = {
  id: string; name: string; symbol: string; chain: string; contract: string;
  website?: string; twitter?: string; telegram?: string; description?: string;
  submittedAt: string; submitter?: string;
};

const TOKENS_PATH = path.join(process.cwd(), "content", "tokens.json");
const ADMIN_KEY = process.env.ADMIN_KEY || "";

async function readTokens(): Promise<Token[]> {
  try { return JSON.parse(await fs.readFile(TOKENS_PATH, "utf8")) as Token[]; }
  catch { return []; }
}
async function writeTokens(tokens: Token[]) {
  await fs.mkdir(path.dirname(TOKENS_PATH), { recursive: true });
  await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2), "utf8");
}
function requireKey(req: Request) {
  const k = req.headers.get("x-admin-key") || "";
  if (!ADMIN_KEY || k !== ADMIN_KEY) throw new Error("unauthorized");
}
function slugify(s: string) {
  return String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(req: Request) {
  try {
    requireKey(req);
    const tokens = await readTokens();
    return NextResponse.json({ ok: true, tokens });
  } catch (e: any) {
    const code = e?.message === "unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: code });
  }
}

export async function POST(req: Request) {
  try {
    requireKey(req);
    const body = await req.json();
    const { name, symbol, chain, contract, website, twitter, telegram, description } = body;
    if (!name || !symbol || !chain || !contract) return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });

    const id = slugify(`${symbol}-${chain}`);
    const tokens = await readTokens();
    if (tokens.find(t => t.id === id)) return NextResponse.json({ ok: false, error: "already_exists" }, { status: 409 });

    const token: Token = {
      id,
      name: String(name).trim(),
      symbol: String(symbol).trim().toUpperCase(),
      chain: String(chain).trim(),
      contract: String(contract).trim(),
      website: website?.trim(),
      twitter: twitter?.trim(),
      telegram: telegram?.trim(),
      description: description?.trim(),
      submittedAt: new Date().toISOString(),
    };
    tokens.push(token);
    await writeTokens(tokens);
    return NextResponse.json({ ok: true, token });
  } catch (e: any) {
    const code = e?.message === "unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: code });
  }
}

export async function PUT(req: Request) {
  try {
    requireKey(req);
    const body = await req.json();
    const { id, ...updates } = body || {};
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const tokens = await readTokens();
    const i = tokens.findIndex(t => t.id === id);
    if (i === -1) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    tokens[i] = { ...tokens[i], ...updates };
    await writeTokens(tokens);
    return NextResponse.json({ ok: true, token: tokens[i] });
  } catch (e: any) {
    const code = e?.message === "unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: code });
  }
}

export async function DELETE(req: Request) {
  try {
    requireKey(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const tokens = await readTokens();
    const next = tokens.filter(t => t.id !== id);
    if (next.length === tokens.length) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    await writeTokens(next);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const code = e?.message === "unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: code });
  }
}
