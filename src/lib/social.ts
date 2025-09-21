export async function formatMarketBrief(): Promise<string> {
  return `📰 Daily Market Brief
- BTC: —
- ETH: —
- Highlights: —

(This is a stub. Fill with real data later.)`;
}

export async function postToTelegram(text: string) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!chatId || !botToken) return { ok: false, skipped: true, reason: 'missing env' };
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  return { ok: res.ok, status: res.status };
}

export async function postToDiscord(text: string) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return { ok: false, skipped: true, reason: 'missing env' };
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text }),
  });
  return { ok: res.ok, status: res.status };
}
