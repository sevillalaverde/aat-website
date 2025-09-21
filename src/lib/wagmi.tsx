'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;
const config = createConfig(
  getDefaultConfig({
    appName: 'AAT',
    projectId: wcProjectId,
    chains: [mainnet],
    transports: { [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL) }
  })
);

export default function Web3Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
