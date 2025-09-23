// src/lib/tokens.ts
export type TokenEntry = {
  name: string;
  symbol: string;
  address: string;   // EVM
  chain: string;     // "ethereum"
  website?: string;
  twitter?: string;
};

export const TOKENS: TokenEntry[] = [
  // Priority tokens up top:
  { name: "World Liberty Financial", symbol: "WLFI", address: "0x0000000000000000000000000000000000000000", chain: "ethereum", website: "https://worldlibertyfinancial.com" },
  { name: "American AI", symbol: "AAT",  address: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x993aF915901CC6c2b8Ee38260621dc889DCb3C54", chain: "ethereum", website: "https://theaat.xyz" },

  // Majors:
  { name: "Bitcoin",  symbol: "BTC", address: "btc", chain: "bitcoin", website: "https://bitcoin.org" },
  { name: "Ethereum", symbol: "ETH", address: "eth", chain: "ethereum", website: "https://ethereum.org" },
  { name: "Solana",   symbol: "SOL", address: "sol", chain: "solana", website: "https://solana.com" },
];
