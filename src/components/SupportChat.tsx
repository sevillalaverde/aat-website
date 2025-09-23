'use client';

import React, { useEffect, useRef, useState } from 'react';

// Simple helper to keep SSR/CSR text the same
const Mic = ({ onToggle, listening }: { onToggle: () => void; listening: boolean }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={listening ? 'Stop voice' : 'Use voice'}
      className={`px-3 py-2 rounded-lg border text-sm ${listening ? 'border-red-500' : 'border-neutral-300'}`}
    >
      🎤
    </button>
  );
};

type Msg = { role: 'user' | 'assistant' | 'system'; text: string };

const DEFAULT_PROVIDER =
  (process.env.NEXT_PUBLIC_DEFAULT_PROVIDER as 'grok' | 'gemini' | 'openai' | undefined) || 'grok';

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<'grok' | 'gemini' | 'openai'>(DEFAULT_PROVIDER);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'assistant',
      text:
        "Hi! I’m AAT Support. Ask me anything about the project. I’ll keep it short and helpful. " +
        "I can link you to /lab, /roadmap, and Uniswap if you need.",
    },
  ]);
  const boxRef = useRef<HTMLDivElement>(null);

  // Autoscroll
  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, open]);

  // Voice input (Web Speech API)
  useEffect(() => {
    if (!listening) return;
    const SR: any =
      (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) ||
      (typeof window !== 'undefined' && (window as any).SpeechRecognition);

    if (!SR) {
      setListening(false);
      setMsgs((m) => [
        ...m,
        {
          role: 'system',
          text:
            'Voice not supported by this browser/device. Type your question instead.',
        },
      ]);
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev: any) => {
      const said = ev.results?.[0]?.[0]?.transcript || '';
      setInput((prev) => (prev ? prev + ' ' : '') + said);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();

    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, [listening]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider, prompt: q }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && data?.text) {
        setMsgs((m) => [...m, { role: 'assistant', text: data.text }]);
      } else {
        const reason =
          data?.error ||
          'All AI providers failed. Check API keys/quotas in your environment.';
        setMsgs((m) => [
          ...m,
          {
            role: 'assistant',
            text:
              'I could not reach the AI support brain right now.\n\n' +
              `Reason: ${reason}\n` +
              'Try again in a bit, or peek at /docs.',
          },
        ]);
      }
    } catch (e: any) {
      setMsgs((m) => [
        ...m,
        {
          role: 'assistant',
          text:
            'Network error talking to /api/chat. Are you running the server? ' +
            'Check your .env and console.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ENTER sends, SHIFT+ENTER newline
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <>
      {/* Floating chat icon */}
      <button
        aria-label="Open AAT support chat"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full shadow-lg bg-black text-white flex items-center justify-center"
      >
        💬
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* WhatsApp-like panel */}
      <div
        className={`fixed z-50 right-4 bottom-4 w-[92vw] max-w-[420px] rounded-2xl bg-white shadow-xl border flex flex-col ${
          open ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-2'
        } transition-all`}
        aria-live="polite"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="font-semibold">AAT Support</div>
          <div className="flex items-center gap-2">
            <select
              className="text-sm border rounded-md px-2 py-1"
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
            >
              <option value="grok">Grok (xAI)</option>
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
            <button
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="text-xl leading-none px-2"
            >
              ×
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={boxRef} className="p-3 space-y-2 overflow-y-auto max-h-[60vh]">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap text-sm rounded-2xl px-3 py-2 max-w-[85%] ${
                m.role === 'user'
                  ? 'ml-auto bg-black text-white'
                  : m.role === 'assistant'
                  ? 'bg-neutral-100'
                  : 'text-neutral-500'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        {/* Quick chips */}
        <div className="px-3 pb-2 flex flex-wrap gap-2">
          {[
            'What is $AAT and how do I buy?',
            'How do I add the token to my wallet?',
            'Show me roadmap highlights.',
            'Where can I test the AI Lab?',
          ].map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="text-xs px-2 py-1 rounded-full border"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="p-3 border-t flex items-end gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type or use the mic… (Shift+Enter for newline)"
            className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm"
          />
          <Mic listening={listening} onToggle={() => setListening((v) => !v)} />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50"
          >
            {loading ? '…' : 'Send'}
          </button>
        </div>

        {/* Footer tip */}
        <div className="px-3 pb-3 text-[11px] text-neutral-500">
          Tip: Try “How do I buy?”, “Is AAT safe?”, “Help importing the token”.
        </div>
      </div>
    </>
  );
}