'use client';

import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { ENUMERATION_LIMIT, NFT_ADDRESS, UNEST_ADDRESS, isConfigured } from '@/config/contracts';
import { REVEAL_BLOCKHASH_WINDOW } from '@/config/protocol';
import { pendingRewardByTokenAbi, unestAbi, unestNftAbi } from '@/lib/web3/abis';
import { parseTokenUri, type TokenAttribute } from '@/lib/onchain/tokenUri';

export type RevealState =
  | 'revealed'
  /** Committed to a future block that has not been mined yet. */
  | 'waiting'
  /** Inside the 256-block window — reveal works right now. */
  | 'ready'
  /** Past the window; calling reveal reschedules instead of revealing. */
  | 'expired';

export interface Egg {
  tokenId: number;
  revealed: boolean;
  seed: `0x${string}` | null;
  /** 0 once revealed. */
  revealBlock: number;
  state: RevealState;
  /** Blocks left before the reveal can be attempted. */
  blocksToGo: number;
  name: string;
  /** `data:image/svg+xml;base64,…` straight from the renderer. */
  image: string | null;
  attributes: TokenAttribute[];
  /** `nftRewardWeight` on the token contract. 0 until revealed. */
  weight: number;
  /** Claimable ETH, in wei. */
  pending: bigint;
}

export interface EggsResult {
  eggs: Egg[];
  /** How many the wallet holds, before any enumeration cap. */
  total: number;
  truncated: boolean;
  isLoading: boolean;
  isError: boolean;
  configured: boolean;
  refetch: () => void;
}

function resolveState(revealed: boolean, revealBlock: number, currentBlock: number): RevealState {
  if (revealed) return 'revealed';
  if (!revealBlock || !currentBlock) return 'waiting';
  if (currentBlock <= revealBlock) return 'waiting';
  if (currentBlock - revealBlock > REVEAL_BLOCKHASH_WINDOW) return 'expired';
  return 'ready';
}

/**
 * Everything the interface knows about a wallet's eggs, read from the chain.
 *
 * Enumeration is per-owner, so no indexer is involved: balanceOf, then
 * tokenOfOwnerByIndex, then a batch of reads per token. wagmi folds them into
 * multicall for us.
 */
export function useEggs(owner?: `0x${string}`, currentBlock = 0): EggsResult {
  const nft = isConfigured(NFT_ADDRESS) ? NFT_ADDRESS : undefined;
  const token = isConfigured(UNEST_ADDRESS) ? UNEST_ADDRESS : undefined;
  const enabled = Boolean(nft && owner);

  const {
    data: balance,
    isLoading: loadingBalance,
    isError: balanceError,
    refetch: refetchBalance,
  } = useReadContract({
    address: nft,
    abi: unestNftAbi,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    chainId: mainnet.id,
    query: { enabled },
  });

  const total = Number(balance ?? 0n);
  const take = Math.min(total, ENUMERATION_LIMIT);

  const idContracts = useMemo(() => {
    if (!nft || !owner) return [];
    return Array.from({ length: take }, (_, i) => ({
      address: nft,
      abi: unestNftAbi,
      functionName: 'tokenOfOwnerByIndex' as const,
      args: [owner, BigInt(i)] as const,
      chainId: mainnet.id,
    }));
  }, [nft, owner, take]);

  const {
    data: idResults,
    isLoading: loadingIds,
    isError: idsError,
    refetch: refetchIds,
  } = useReadContracts({
    contracts: idContracts,
    query: { enabled: enabled && take > 0 },
  });

  const tokenIds = useMemo(
    () =>
      (idResults ?? [])
        .map((r) => (r.status === 'success' ? Number(r.result as bigint) : null))
        .filter((v): v is number => v !== null),
    [idResults],
  );

  /** Four reads per token: art+traits, seed, commit block, weight, reward. */
  const detailContracts = useMemo(() => {
    if (!nft) return [];
    return tokenIds.flatMap((id) => {
      const tokenId = BigInt(id);
      const calls = [
        {
          address: nft,
          abi: unestNftAbi,
          functionName: 'tokenURI' as const,
          args: [tokenId] as const,
          chainId: mainnet.id,
        },
        {
          address: nft,
          abi: unestNftAbi,
          functionName: 'revealSeed' as const,
          args: [tokenId] as const,
          chainId: mainnet.id,
        },
        {
          address: nft,
          abi: unestNftAbi,
          functionName: 'revealBlock' as const,
          args: [tokenId] as const,
          chainId: mainnet.id,
        },
      ];
      if (!token) return calls;
      return [
        ...calls,
        {
          address: token,
          abi: unestAbi,
          functionName: 'nftRewardWeight' as const,
          args: [tokenId] as const,
          chainId: mainnet.id,
        },
        {
          address: token,
          abi: pendingRewardByTokenAbi,
          functionName: 'pendingReward' as const,
          args: [tokenId] as const,
          chainId: mainnet.id,
        },
      ];
    });
  }, [nft, token, tokenIds]);

  const perToken = token ? 5 : 3;

  const {
    data: detailResults,
    isLoading: loadingDetails,
    isError: detailsError,
    refetch: refetchDetails,
  } = useReadContracts({
    contracts: detailContracts,
    query: { enabled: enabled && tokenIds.length > 0 },
  });

  const eggs = useMemo(() => {
    if (!detailResults) return [];

    return tokenIds.map((tokenId, i) => {
      const base = i * perToken;
      const uriResult = detailResults[base];
      const seedResult = detailResults[base + 1];
      const blockResult = detailResults[base + 2];
      const weightResult = token ? detailResults[base + 3] : undefined;
      const pendingResult = token ? detailResults[base + 4] : undefined;

      const uri = uriResult?.status === 'success' ? (uriResult.result as string) : null;
      const meta = parseTokenUri(uri);

      const rawSeed =
        seedResult?.status === 'success' ? (seedResult.result as `0x${string}`) : null;
      const revealed = Boolean(rawSeed && /[1-9a-f]/i.test(rawSeed.slice(2)));

      const revealBlock =
        blockResult?.status === 'success' ? Number(blockResult.result as bigint) : 0;

      const state = resolveState(revealed, revealBlock, currentBlock);

      return {
        tokenId,
        revealed,
        seed: revealed ? rawSeed : null,
        revealBlock,
        state,
        blocksToGo:
          state === 'waiting' && revealBlock && currentBlock
            ? Math.max(0, revealBlock - currentBlock + 1)
            : 0,
        name: meta?.name ?? `UNEST Egg #${tokenId}`,
        image: meta?.image ?? null,
        attributes: meta?.attributes ?? [],
        weight: weightResult?.status === 'success' ? Number(weightResult.result as bigint) : 0,
        pending: pendingResult?.status === 'success' ? (pendingResult.result as bigint) : 0n,
      } satisfies Egg;
    });
  }, [detailResults, tokenIds, perToken, token, currentBlock]);

  return {
    eggs,
    total,
    truncated: total > take,
    isLoading: loadingBalance || loadingIds || loadingDetails,
    isError: balanceError || idsError || detailsError,
    configured: Boolean(nft),
    refetch: () => {
      void refetchBalance();
      void refetchIds();
      void refetchDetails();
    },
  };
}
