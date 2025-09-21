This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Social Content
- X pinned thread: `content/social/x/pinned-thread.md`
- Instagram captions: `content/social/instagram/captions/*.md`

## Daily Market Cron
- Route: `GET /api/cron/daily-market`
- Vercel Cron in `vercel.json` runs `0 12 * * *` (12:00 UTC daily)
- Env vars:
  - TELEGRAM_BOT_TOKEN
  - TELEGRAM_CHAT_ID (e.g., @american_aat)
  - DISCORD_WEBHOOK_URL
  - XAI_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY / OPENAI_MODEL
  - CRON_SECRET (optional, for manual triggering)

### Test locally
1. `npm run dev`
2. Hit: `http://localhost:3000/api/cron/daily-market?key=YOUR_SECRET`
