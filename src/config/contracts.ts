/**
 * UNEST — CONTRACT REGISTRY
 * ---------------------------------------------------------------------------
 * NETWORK: ETHEREUM MAINNET (chainId 1).
 *
 * Every address is a PLACEHOLDER until the real deployment is supplied via
 * environment variables. NEVER invent an address. An empty value means "not
 * configured" and the interface is required to say so rather than fake state.
 *
 * The source for all six contracts lives in /contracts.
 */

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 1);
export const NETWORK_NAME = 'Ethereum Mainnet';
export const NETWORK_SHORT = 'ETHEREUM';

export const RPC_URL = (process.env.NEXT_PUBLIC_RPC_URL ?? '').trim();

/** Optional WalletConnect v2 project id. Without it, only injected wallets. */
export const WALLETCONNECT_PROJECT_ID = (
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''
).trim();

/**
 * Cap on how many token ids the interface will enumerate in one pass.
 * Per-owner enumeration is cheap; the whole collection is not.
 */
export const ENUMERATION_LIMIT = Number(process.env.NEXT_PUBLIC_ENUMERATION_LIMIT ?? 60);

export type MaybeAddress = `0x${string}` | '';

/**
 * NOTE: `process.env.NEXT_PUBLIC_*` must be read with STATIC member access so
 * the bundler can inline it. Dynamic lookups resolve to undefined in the browser.
 */
function addr(raw: string | undefined): MaybeAddress {
  const v = (raw ?? '').trim();
  return /^0x[a-fA-F0-9]{40}$/.test(v) ? (v as `0x${string}`) : '';
}

/* -------------------------------------------------------------------------- */
/*  ADDRESSES                                                                 */
/* -------------------------------------------------------------------------- */

/** Unest.sol — the ERC-20 and the controller for everything else. */
export const UNEST_ADDRESS: MaybeAddress = addr(process.env.NEXT_PUBLIC_UNEST_ADDRESS);

/** UnestNFT.sol — deployed by the token's constructor. */
export const NFT_ADDRESS: MaybeAddress = addr(process.env.NEXT_PUBLIC_NFT_ADDRESS);

/** UnestRenderer.sol — the on-chain art. */
export const RENDERER_ADDRESS: MaybeAddress = addr(process.env.NEXT_PUBLIC_RENDERER_ADDRESS);

/** UnestMarket.sol — the buy/sell router over the v4 pool. */
export const MARKET_ADDRESS: MaybeAddress = addr(process.env.NEXT_PUBLIC_MARKET_ADDRESS);

/** LaunchGuardHook.sol — the Uniswap v4 hook attached to the pool. */
export const HOOK_ADDRESS: MaybeAddress = addr(process.env.NEXT_PUBLIC_HOOK_ADDRESS);

/** PermanentLiquidityLocker.sol — holds the permanently locked LP. */
export const LOCKER_ADDRESS: MaybeAddress = addr(process.env.NEXT_PUBLIC_LOCKER_ADDRESS);

/** The address receiving the 3% official share. */
export const OFFICIAL_ADDRESS: MaybeAddress = addr(process.env.NEXT_PUBLIC_OFFICIAL_ADDRESS);

/* -------------------------------------------------------------------------- */
/*  EXPLORERS                                                                 */
/* -------------------------------------------------------------------------- */

export const ETHERSCAN_BASE = 'https://etherscan.io';
export const UNISWAP_BASE = 'https://app.uniswap.org';
export const OPENSEA_BASE = 'https://opensea.io';

export function isConfigured(value: string): value is `0x${string}` {
  return value.length > 0;
}

export function etherscanAddress(address: MaybeAddress): string | null {
  return address ? `${ETHERSCAN_BASE}/address/${address}` : null;
}

export function etherscanToken(address: MaybeAddress): string | null {
  return address ? `${ETHERSCAN_BASE}/token/${address}` : null;
}

export function etherscanTx(hash?: `0x${string}`): string | null {
  return hash ? `${ETHERSCAN_BASE}/tx/${hash}` : null;
}

export function openseaCollection(address: MaybeAddress): string | null {
  return address ? `${OPENSEA_BASE}/assets/ethereum/${address}` : null;
}

/** The pool is ETH / UNEST. Uniswap resolves it from the output token. */
export function uniswapSwap(address: MaybeAddress): string {
  return address
    ? `${UNISWAP_BASE}/swap?chain=mainnet&outputCurrency=${address}`
    : `${UNISWAP_BASE}/swap`;
}

/* -------------------------------------------------------------------------- */
/*  REGISTRY                                                                  */
/* -------------------------------------------------------------------------- */

export interface RegistryEntry {
  id: string;
  name: string;
  file: string;
  standard: string;
  value: MaybeAddress;
  description: string;
  explorer: string | null;
}

export const CONTRACT_REGISTRY: readonly RegistryEntry[] = [
  {
    id: 'unest',
    name: 'UNEST',
    file: 'Unest.sol',
    standard: 'ERC-20 · controller',
    value: UNEST_ADDRESS,
    description:
      'The token. Also the controller: it mints and burns eggs as balances move, splits fees, and pays rewards.',
    explorer: etherscanToken(UNEST_ADDRESS),
  },
  {
    id: 'nft',
    name: 'UNEST EGG',
    file: 'UnestNFT.sol',
    standard: 'ERC-721 · ERC-4906',
    value: NFT_ADDRESS,
    description:
      'The collection. Commit–reveal metadata seeded from a block hash. Deployed by the token constructor.',
    explorer: etherscanAddress(NFT_ADDRESS),
  },
  {
    id: 'renderer',
    name: 'RENDERER',
    file: 'UnestRenderer.sol',
    standard: 'Pure · on-chain SVG',
    value: RENDERER_ADDRESS,
    description:
      'The art. Six traits and a full pixel SVG generated from the seed. No server, no IPFS, no image files.',
    explorer: etherscanAddress(RENDERER_ADDRESS),
  },
  {
    id: 'market',
    name: 'MARKET',
    file: 'UnestMarket.sol',
    standard: 'Router · v4',
    value: MARKET_ADDRESS,
    description:
      'Buy and sell over the Uniswap v4 pool. Also runs buybacks and converts collected fees.',
    explorer: etherscanAddress(MARKET_ADDRESS),
  },
  {
    id: 'hook',
    name: 'LAUNCH GUARD HOOK',
    file: 'LaunchGuardHook.sol',
    standard: 'Uniswap v4 hook',
    value: HOOK_ADDRESS,
    description:
      'Attached to the pool. Validates it, tracks buy credit inside the swap, and forwards fees.',
    explorer: etherscanAddress(HOOK_ADDRESS),
  },
  {
    id: 'locker',
    name: 'LIQUIDITY LOCKER',
    file: 'PermanentLiquidityLocker.sol',
    standard: 'LP · permanent',
    value: LOCKER_ADDRESS,
    description:
      'Seeds the pool with a token-only position and locks it permanently. Collected fees route back to the token.',
    explorer: etherscanAddress(LOCKER_ADDRESS),
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  STATUS                                                                    */
/* -------------------------------------------------------------------------- */

export const NOT_CONFIGURED = 'NOT CONFIGURED';

/** The interface can read chain state only once these two exist. */
export const IS_LIVE = isConfigured(UNEST_ADDRESS) && isConfigured(NFT_ADDRESS);

export const PENDING_COUNT = CONTRACT_REGISTRY.filter((e) => !e.value).length;
