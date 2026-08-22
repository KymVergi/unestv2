'use client';

import { useReadContracts } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { NFT_ADDRESS, UNEST_ADDRESS, isConfigured } from '@/config/contracts';
import { unestAbi, unestNftAbi } from '@/lib/web3/abis';

export interface ProtocolStats {
  /** Circulating UNEST, whole tokens. Falls as burns accumulate. */
  supply: number | null;
  /** Eggs alive right now. */
  eggs: number | null;
  /** Ids ever issued, including burned ones. */
  minted: number | null;
  /** Sum of reward weight across revealed eggs. */
  totalWeight: number | null;
  isLoading: boolean;
  configured: boolean;
}

const WEI = 10n ** 18n;

/** Headline numbers for the home page, straight from the two main contracts. */
export function useProtocolStats(): ProtocolStats {
  const token = isConfigured(UNEST_ADDRESS) ? UNEST_ADDRESS : undefined;
  const nft = isConfigured(NFT_ADDRESS) ? NFT_ADDRESS : undefined;
  const configured = Boolean(token && nft);

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: token,
        abi: unestAbi,
        functionName: 'totalSupply',
        chainId: mainnet.id,
      },
      {
        address: token,
        abi: unestAbi,
        functionName: 'totalRewardWeight',
        chainId: mainnet.id,
      },
      {
        address: nft,
        abi: unestNftAbi,
        functionName: 'totalSupply',
        chainId: mainnet.id,
      },
      {
        address: nft,
        abi: unestNftAbi,
        functionName: 'nextTokenId',
        chainId: mainnet.id,
      },
    ],
    query: { enabled: configured },
  });

  const value = (index: number): bigint | null => {
    const entry = data?.[index];
    return entry?.status === 'success' ? (entry.result as bigint) : null;
  };

  const supplyWei = value(0);
  const weight = value(1);
  const eggs = value(2);
  const next = value(3);

  return {
    supply: supplyWei === null ? null : Number(supplyWei / WEI),
    totalWeight: weight === null ? null : Number(weight),
    eggs: eggs === null ? null : Number(eggs),
    // nextTokenId starts at 1, so ids issued is one less.
    minted: next === null ? null : Math.max(0, Number(next) - 1),
    isLoading,
    configured,
  };
}
