import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;
const guildId = process.env.DISCORD_GUILD_ID!;
if (!token || !clientId || !guildId) throw new Error('DISCORD envs missing');

const commands = [
  new SlashCommandBuilder().setName('links').setDescription('Get official AAT links.'),
  new SlashCommandBuilder().setName('buy').setDescription('How to buy $AAT safely.'),
  new SlashCommandBuilder().setName('faq').setDescription('Common questions about $AAT.'),
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

async function register() {
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
  console.log('Slash commands registered.');
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => console.log(`Discord bot logged in as ${client.user?.tag}`));

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const i = interaction as ChatInputCommandInteraction;

  if (i.commandName === 'links') {
    await i.reply(`**AAT Links**
• Website: https://theaat.xyz
• Lab: https://theaat.xyz/lab
• Roadmap: https://theaat.xyz/roadmap
• X: https://x.com/aait_ai
• Telegram: https://t.me/american_aat
• Discord: https://discord.gg/sC84NN33
• Etherscan: https://etherscan.io/token/0x993aF915901CC6c2b8Ee38260621dc889DCb3C54
(We never DM first. NFA. DYOR.)`);
  }
  if (i.commandName === 'buy') {
    await i.reply(`How to buy $AAT:
1) Token: 0x993aF915901CC6c2b8Ee38260621dc889DCb3C54
2) Uniswap: https://app.uniswap.org/#/swap?outputCurrency=0x993aF915901CC6c2b8Ee38260621dc889DCb3C54
3) Safety: verify address, small test first. NFA.`);
  }
  if (i.commandName === 'faq') {
    await i.reply(`FAQ:
• Is it a scam? Our site and roadmap are public; contract verified. Still DYOR.
• Is there a presale? Follow #announcements.
• What is AAT? 99% AI (Grok, Gemini, ChatGPT), 1% human. Tools for real investors.`);
  }
});

register()
  .then(() => client.login(token))
  .catch((e) => console.error(e));
