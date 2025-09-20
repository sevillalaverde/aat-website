// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatOpenAI, chatGemini, chatXAI, type ChatMessage } from "@/lib/providers";

const Body = z.object({
  provider: z.enum(["openai", "gemini", "xai"]),
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1)
  })).min(1)
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { provider, messages } = Body.parse(data) as { provider: "openai"|"gemini"|"xai"; messages: ChatMessage[] };

    let text = "";
    if (provider === "openai") text = await chatOpenAI(messages);
    else if (provider === "gemini") text = await chatGemini(messages);
    else text = await chatXAI(messages);

    return NextResponse.json({ provider, text });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}
