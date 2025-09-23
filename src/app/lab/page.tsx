// src/app/lab/page.tsx
import type { Metadata } from "next";
import AIDashboard from "@/components/AIDashboard";

export const metadata: Metadata = {
  title: "Ask AAT – Your AI Research Assistant",
  description:
    "One chat that consults Grok, Gemini, and ChatGPT, cross-checks facts, and answers clearly for investors.",
};

export default function Lab() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold">
        Ask AAT — your AI research assistant
      </h1>
      <p className="mt-3 text-neutral-600">
        Type a question and AAT will consult <strong>Grok</strong>,{" "}
        <strong>Gemini</strong>, and <strong>ChatGPT</strong>, then return{" "}
        <em>one clear, verified answer</em>. It’s like having three analysts in
        one chat.
      </p>

      <div className="mt-8">
        <AIDashboard />
      </div>

      <p className="mt-6 text-xs text-neutral-500">
        AAT helps with research and education. This is not financial advice.
      </p>
    </main>
  );
}
