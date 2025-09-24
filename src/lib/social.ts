// Lightweight helpers for posting to Telegram & Discord from server routes.
// Keep this file dependency-free (except fetch) so it compiles on Vercel easily.

export type PostResult = {
  ok: boolean;
  id?: string | number;
  error?: string;
  skipped?: string;
};

const env = (k: string) => process.env[k] || "";

/** Post plain text to a Telegram channel/group via Bot API. */
export async function postToTelegram(text: string): Promise<PostResult> {
  const token = env("TELEGRAM_BOT_TOKEN");
  // Accept either TELEGRAM_CHAT_ID or TELEGRAM_CHANNEL_ID for flexibility
  const chatId = env("TELEGRAM_CHAT_ID") || env("TELEGRAM_CHANNEL_ID");

  if (!token || !chatId) {
    return { ok: false, skipped: "telegram env missing (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        // Set to true if you *don't* want rich link previews
        disable_web_page_preview: false
      }),
    });

    const j = await res.json().catch(() => null as any);
    if (!res.ok || !j?.ok) {
      return { ok: false, error: j?.description || `HTTP ${res.status}` };
    }
    return { ok: true, id: j?.result?.message_id };
  } catch (e: any) {
    return { ok: false, error: e?.message || "telegram error" };
  }
}

/** Post plain text to a Discord channel via Incoming Webhook. */
export async function postToDiscord(text: string): Promise<PostResult> {
  const url = env("DISCORD_WEBHOOK_URL");
  if (!url) return { ok: false, skipped: "discord env missing (DISCORD_WEBHOOK_URL)" };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "discord error" };
  }
}

// (Optional) If other parts of the app import these names, keep friendly aliases.
export const sendTelegram = postToTelegram;
export const sendDiscord = postToDiscord;
