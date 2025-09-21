import type { Metadata } from 'next';
import './globals.css';
import Web3Providers from '@/lib/wagmi';
import SupportChat from '@/components/SupportChat';

export const metadata: Metadata = {
  title: 'American AI ($AAT)',
  description: 'Multi-chain AI token with Grok, Gemini & ChatGPT utilities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Web3Providers>{children}</Web3Providers>
        <SupportChat />
      </body>
    </html>
  );
}
