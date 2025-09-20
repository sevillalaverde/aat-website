"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          $AAT — American AI
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/lab" className="hover:underline">AI Lab</Link>
          <Link href="/roadmap" className="hover:underline">Roadmap</Link>
          <a
            className="hover:underline"
            href="https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0x993af915901cc6c2b8ee38260621dc889dcb3c54"
            target="_blank"
            rel="noreferrer"
          >
            Buy
          </a>
          <a
            className="hover:underline"
            href="https://etherscan.io/token/0x993aF915901CC6c2b8Ee38260621dc889DCb3C54"
            target="_blank"
            rel="noreferrer"
          >
            Etherscan
          </a>
        </nav>
      </div>
    </header>
  );
}
