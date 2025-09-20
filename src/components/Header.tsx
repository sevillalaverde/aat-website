'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/60 border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-xl tracking-tight">
          🇺🇸 American AI <span className="text-neutral-500">($AAT)</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/lab">AI Lab</Link>
          <Link href="/roadmap">Roadmap</Link>
          <Link href="/docs">Docs</Link>
          <ConnectButton />
        </nav>
      </div>
    </header>
  );
}
