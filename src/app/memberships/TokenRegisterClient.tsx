"use client";

import { useState, type FormEvent } from "react";

export default function TokenRegisterClient() {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setStatus(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/memberships/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => null);

      if (res.ok && j?.ok) {
        setStatus("✅ Token submitted for listing.");
        form.reset();
      } else if (j?.error === "already_listed") {
        setStatus("ℹ️ This token is already listed.");
      } else if (j?.error === "missing_fields") {
        setStatus("⚠️ Please fill all required fields.");
      } else {
        setStatus("⚠️ Could not submit. Try again.");
      }
    } catch {
      setStatus("⚠️ Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid md:grid-cols-3 gap-3">
        <input name="name" required placeholder="Token name (e.g., Wallfair)" className="border rounded-lg px-3 py-2" />
        <input name="symbol" required placeholder="Symbol (e.g., WLFI)" className="border rounded-lg px-3 py-2" />
        <select name="chain" required className="border rounded-lg px-3 py-2">
          <option value="">Select chain…</option>
          <option>Ethereum</option>
          <option>Solana</option>
          <option>BNB</option>
          <option>Polygon</option>
          <option>Base</option>
          <option>Arbitrum</option>
          <option>Optimism</option>
        </select>

        <input name="contract" required placeholder="Contract / Mint address" className="border rounded-lg px-3 py-2 md:col-span-3" />

        <input name="website" placeholder="Website (https://…)" className="border rounded-lg px-3 py-2" />
        <input name="twitter" placeholder="Twitter/X (https://…)" className="border rounded-lg px-3 py-2" />
        <input name="telegram" placeholder="Telegram (https://…)" className="border rounded-lg px-3 py-2" />

        <textarea name="description" placeholder="Short description (optional)" className="border rounded-lg px-3 py-2 md:col-span-3 min-h-[80px]" />

        {/* Optional proof fields (not enforced yet) */}
        <input name="tier" placeholder="Membership tier (Starter/Pro/Enterprise)" className="border rounded-lg px-3 py-2" />
        <input name="membershipTx" placeholder="Your membership TX hash" className="border rounded-lg px-3 py-2" />
        <input name="contact" placeholder="Email or Telegram @" className="border rounded-lg px-3 py-2" />
      </div>

      <button className="rounded-lg bg-black text-white py-2 px-4 w-full md:w-auto disabled:opacity-60" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit token"}
      </button>

      {status && <div className="text-sm text-gray-700" aria-live="polite">{status}</div>}
    </form>
  );
}
