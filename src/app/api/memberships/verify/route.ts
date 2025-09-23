import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime

export async function POST(req: Request) {
  try {
    const { tier, txhash, contact, notes } = await req.json().catch(() => ({}));
    if (!tier || !txhash || !contact) {
      console.warn("verify: missing fields", { tier, txhashLen: String(txhash || "").length, contact });
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }
    console.log("memberships-verify:", { tier, txhash, contact, notes });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("verify-error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}
