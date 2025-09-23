import type { Metadata } from "next";
import "./globals.css";

import Web3Providers from "@/lib/wagmi";   // ✅ RainbowKit provider
import Header from "@/components/Header";
import SupportChat from "@/components/SupportChat";



export const metadata: Metadata = {
  title: "American AI ($AAT)",
  description: "Multi-chain AI token with Grok, Gemini & ChatGPT utilities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Web3Providers>
          <Header />
          {children}
          <SupportChat />
        </Web3Providers>
      </body>
    </html>
  );
}
