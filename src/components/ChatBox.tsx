'use client';

import { useState } from 'react';

export default function ChatBox() {
  const [prompt, setPrompt] = useState('');
  const [out, setOut] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    setOut('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Prefer Grok -> Gemini -> OpenAI (server will fallback)
        body: JSON.stringify({ provider: 'grok', prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'API error');
      setOut(data.text || data.response || JSON.stringify(data, null, 2));
    } catch (e: any) {
      setOut('Error: ' + (e.message || String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        className="w-full border rounded p-3 min-h-[120px]"
        placeholder="Ask AAT…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        onClick={ask}
        disabled={loading || !prompt.trim()}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {loading ? 'Thinking…' : 'Ask'}
      </button>
      <pre className="whitespace-pre-wrap text-sm bg-neutral-50 border rounded p-3">{out}</pre>
    </div>
  );
}