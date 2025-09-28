export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function has(v?: string) { return !!(v && v.trim()); }

export async function GET(req: Request) {
  const url = new URL(req.url);
  const provider = url.searchParams.get('provider') ?? 'all';
  const input = 'Ping';

  const results: any = {};

  // OpenAI
  if (provider === 'openai' || provider === 'all') {
    try {
      const key = process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      if (!has(key)) throw new Error('OPENAI_API_KEY missing');
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ model, messages: [{ role:'user', content: input }], max_tokens: 5 })
      });
      results.openai = r.ok ? 'ok' : `http ${r.status}`;
      if (!r.ok) results.openai_body = await r.text();
    } catch (e:any) { results.openai = `error: ${e.message}`; }
  }

  // Gemini
  if (provider === 'gemini' || provider === 'all') {
    try {
      const key = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
      if (!has(key)) throw new Error('GEMINI_API_KEY missing');
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ contents:[{ role:'user', parts:[{ text: input }]}] })
      });
      results.gemini = r.ok ? 'ok' : `http ${r.status}`;
      if (!r.ok) results.gemini_body = await r.text();
    } catch (e:any) { results.gemini = `error: ${e.message}`; }
  }

  // Grok (xAI)
  if (provider === 'grok' || provider === 'all') {
    try {
      const key = process.env.XAI_API_KEY;
      const model = process.env.XAI_MODEL || 'grok-2-latest';
      if (!has(key)) throw new Error('XAI_API_KEY missing');
      const r = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ model, messages: [{ role:'user', content: input }] })
      });
      results.grok = r.ok ? 'ok' : `http ${r.status}`;
      if (!r.ok) results.grok_body = await r.text();
    } catch (e:any) { results.grok = `error: ${e.message}`; }
  }

  return new Response(JSON.stringify(results, null, 2), { headers: { 'Content-Type':'application/json' }, status: 200 });
}
