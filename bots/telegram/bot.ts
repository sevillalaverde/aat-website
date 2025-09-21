import 'dotenv/config';
import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN!;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN missing');

const bot = new Telegraf(token);

const LINKS = `Links:
• Website: https://theaat.xyz
• Lab: https://theaat.xyz/lab
• Roadmap: https://theaat.xyz/roadmap
• X: https://x.com/aait_ai
• Telegram: https://t.me/american_aat
• Discord: https://discord.gg/sC84NN33
• Etherscan: https://etherscan.io/token/0x993aF915901CC6c2b8Ee38260621dc889DCb3C54
(NFA. DYOR.)`;

bot.start((ctx) => ctx.reply(`Hi ${ctx.from.first_name}! I’m the AAT helper bot.\nType /links or ask “How do I buy AAT?”`));
bot.command('links', (ctx) => ctx.reply(LINKS));

bot.hears(/how .*buy.*aat|buy aat/i, (ctx) =>
  ctx.reply(`How to buy $AAT:
1) Add token to your wallet: 0x993aF915901CC6c2b8Ee38260621dc889DCb3C54
2) Use Uniswap: https://app.uniswap.org/#/swap?outputCurrency=0x993aF915901CC6c2b8Ee38260621dc889DCb3C54
3) Safety: double-check address, small test first. NFA.`),
);

bot.hears(/is.*scam|safe/i, (ctx) =>
  ctx.reply(`We’re transparent: verified contract, public site & roadmap. Still, always DYOR. We never DM first and never ask for seed phrases. NFA.`),
);

bot.launch().then(() => console.log('AAT Telegram bot running'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
