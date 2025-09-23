"use client";

import { useState, type FormEvent } from "react";

export default function VerifyFormClient() {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setStatus(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/memberships/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const j = await res.json().catch(() => null);

      if (res.ok && j?.ok) {
        setStatus("✅ Submitted. We’ll confirm shortly.");
        form.reset();
      } else {
        setStatus("⚠️ There was an issue. Please try again.");
      }
    } catch {
      setStatus("⚠️ Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid md:grid-cols-3 gap-3">
      <input
        name="tier"
        required
        placeholder="Tier (Starter / Pro / Enterprise)"
        className="border rounded-lg px-3 py-2"
        autoComplete="off"
      />
      <input
        name="txhash"
        required
        placeholder="TX hash (ETH or SOL)"
        className="border rounded-lg px-3 py-2"
        autoComplete="off"
      />
      <input
        name="contact"
        required
        placeholder="Your email or Telegram @"
        className="border rounded-lg px-3 py-2"
        autoComplete="email"
      />
      <textarea
        name="notes"
        placeholder="Notes (optional)"
        className="md:col-span-3 border rounded-lg px-3 py-2 min-h-[80px]"
      />
      <button
        className="md:col-span-3 rounded-lg bg-black text-white py-2 disabled:opacity-60"
        disabled={submitting}
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>

      {status && (
        <div className="md:col-span-3 text-sm text-gray-700" aria-live="polite">
          {status}
        </div>
      )}
    </form>
  );
}
