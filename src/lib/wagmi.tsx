"use client";
import { WagmiConfig, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, metaMask, walletConnect } from "@wagmi/connectors";
import { useMemo } from "react";

const queryClient = new QueryClient();

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  process.env.WALLETCONNECT_PROJECT_ID;

const connectors = [
  injected(),
  metaMask(),
  ...(projectId ? [walletConnect({ projectId })] : []),
];

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL) },
  connectors,
});

declare global { interface Window { __WALLET_INIT_ONCE?: boolean } }

export default function Web3Providers({ children }: { children: React.ReactNode }) {
  if (typeof window !== "undefined" && !window.__WALLET_INIT_ONCE) {
    window.__WALLET_INIT_ONCE = true; // prevent double init in dev
  }
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
    </QueryClientProvider>
  );
}
