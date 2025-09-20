import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { provider = 'openai', prompt, system } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400 });
    }

    if (provider === 'openai') {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system || 'You are an AI assistant for the $AAT token.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      });
      return Response.json({ output: res.choices[0]?.message?.content || '' });
    }

    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const res = await model.generateContent([
        { text: system || 'You are an AI assistant for the $AAT token.' },
        { text: prompt }
      ]);
      const text = res.response.text();
      return Response.json({ output: text });
    }

    if (provider === 'grok') {
      // Stub – fill when you have an xAI API key + endpoint
      return Response.json({ output: 'Grok not configured yet. Add XAI_API_KEY and endpoint.' });
    }

    return new Response(JSON.stringify({ error: 'Unknown provider' }), { status: 400 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'AI error' }), { status: 500 });
  }
}
