"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

/* Icons */
function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2H21l-6.5 7.43L22.5 22H15l-5-6.7L4 22H1.244l6.99-7.997L1.5 2H9l4.5 6 4.744-6zM16 20h1.5L7.5 4H6z"/>
    </svg>
  );
}
function IconTelegram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden {...props}>
      <path d="M9.036 15.803 8.9 19.9c.4 0 .57-.17.78-.37l1.87-1.8 3.88 2.85c.71.39 1.22.19 1.41-.66l2.55-11.97c.23-1.03-.37-1.43-1.06-1.18L3.4 10.2c-1 .39-.98.95-.17 1.2l4.6 1.43 10.67-6.23c.5-.3.95-.13.58.17z"/>
    </svg>
  );
}
function IconDiscord(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden {...props}>
      <path d="M20.317 4.37A18.07 18.07 0 0 0 16.887 3a12.4 12.4 0 0 0-.6 1.24 17.31 17.31 0 0 0-4.574 0A11.3 11.3 0 0 0 11.1 3a18.1 18.1 0 0 0-3.432 1.37C3.94 8.088 3.13 11.64 3.36 15.142a18.2 18.2 0 0 0 5.48 2.8 13.2 13.2 0 0 0 1.16-1.88 10.9 10.9 0 0 1-1.84-.89c.16-.12.32-.25.47-.39a12.8 12.8 0 0 0 10.71 0c.15.14.3.27.47.39-.58.35-1.2.65-1.85.9.33.65.72 1.28 1.16 1.88a18.14 18.14 0 0 0 5.47-2.8c.34-4.86-.82-8.38-3.71-10.77ZM9.6 13.6c-.84 0-1.53-.78-1.53-1.73 0-.95.67-1.73 1.53-1.73s1.55.78 1.53 1.73c0 .95-.67 1.73-1.53 1.73Zm4.8 0c-.84 0-1.53-.78-1.53-1.73 0-.95.67-1.73 1.53-1.73s1.55.78 1.53 1.73c0 .95-.67 1.73-1.53 1.73Z"/>
    </svg>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold hover:opacity-80">
          American AI ($AAT)
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/lab" className="hover:underline">AI Lab</Link>
          {/* Agents link removed (automation only) */}
          <Link href="/roadmap" className="hover:underline">Roadmap</Link>
          <Link href="/memberships" className="hover:underline">Memberships</Link>
          <Link href="/tokens" className="hover:underline">Tokens</Link>
        </nav>

        <div className="flex items-center gap-2">
          <a href="https://x.com/aait_ai" target="_blank" rel="noreferrer" aria-label="X (Twitter)" title="X (Twitter)" className="p-1.5 rounded text-neutral-700 hover:text-black hover:bg-neutral-100"><IconX /></a>
          <a href="https://t.me/american_aat" target="_blank" rel="noreferrer" aria-label="Telegram" title="Telegram" className="p-1.5 rounded text-neutral-700 hover:text-black hover:bg-neutral-100"><IconTelegram /></a>
          <a href="https://discord.gg/sC84NN33" target="_blank" rel="noreferrer" aria-label="Discord" title="Discord" className="p-1.5 rounded text-neutral-700 hover:text-black hover:bg-neutral-100"><IconDiscord /></a>
          <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
        </div>
      </div>

      <div className="md:hidden border-t px-4 py-2 flex gap-4 text-sm">
        <Link href="/" className="hover:underline">Home</Link>
        <Link href="/lab" className="hover:underline">AI Lab</Link>
        <Link href="/roadmap" className="hover:underline">Roadmap</Link>
        <Link href="/memberships" className="hover:underline">Memberships</Link>
        <Link href="/tokens" className="hover:underline">Tokens</Link>
      </div>
    </header>
  );
}
