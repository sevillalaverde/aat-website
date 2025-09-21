export async function postToTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Telegram post failed: ${res.status} ${t}`);
  }
  return true;
}

export async function postToDiscord(text: string) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) throw new Error("Missing DISCORD_WEBHOOK_URL");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Discord post failed: ${res.status} ${t}`);
  }
  return true;
}
