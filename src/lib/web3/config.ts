'use client';

import { createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';
import { RPC_URL, WALLETCONNECT_PROJECT_ID } from '@/config/contracts';
import { SITE_NAME, SITE_URL } from '@/config/site';

/**
 * UNEST runs on ETHEREUM MAINNET.
 *
 * Injected wallets always work with zero configuration. WalletConnect is added
 * only when a project id is present, so the app never ships a broken connector
 * or leaks a placeholder id.
 */
const connectors = [
  injected({ shimDisconnect: true }),
  coinbaseWallet({ appName: SITE_NAME, appLogoUrl: `${SITE_URL}/icon.svg` }),
  ...(WALLETCONNECT_PROJECT_ID
    ? [
        walletConnect({
          projectId: WALLETCONNECT_PROJECT_ID,
          showQrModal: true,
          metadata: {
            name: SITE_NAME,
            description: 'The fuel for a living on-chain economy.',
            url: SITE_URL,
            icons: [`${SITE_URL}/icon.svg`],
          },
        }),
      ]
    : []),
];

export const wagmiConfig = createConfig({
  chains: [mainnet],
  connectors,
  transports: {
    [mainnet.id]: http(RPC_URL || undefined),
  },
  ssr: true,
});

export const TARGET_CHAIN = mainnet;

export const HAS_WALLETCONNECT = Boolean(WALLETCONNECT_PROJECT_ID);

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
