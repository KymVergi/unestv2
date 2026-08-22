/**
 * ABIs transcribed from the Solidity in /contracts.
 * Only the surface the interface actually calls is declared.
 *
 * Overloaded functions (`pendingReward`, `claim`) are split into separate
 * single-entry ABIs so viem never has to guess which one you meant.
 */

import { erc20Abi } from 'viem';

export { erc20Abi };

/* -------------------------------------------------------------------------- */
/*  Unest.sol — token + controller                                            */
/* -------------------------------------------------------------------------- */

export const unestAbi = [
  // --- constants -----------------------------------------------------------
  {
    type: 'function',
    name: 'UNIT',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'INITIAL_SUPPLY',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'REVEAL_FEE',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'MAX_REWARD_WEIGHT',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  // --- wiring --------------------------------------------------------------
  {
    type: 'function',
    name: 'nft',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'market',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'official',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'renderer',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  // --- erc20 ---------------------------------------------------------------
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  // --- rewards -------------------------------------------------------------
  {
    type: 'function',
    name: 'totalRewardWeight',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'nftRewardWeight',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'pendingOfficial',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'pendingBuyback',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

/** `pendingReward(address)` — the wallet's total, in wei of ETH. */
export const pendingRewardByAccountAbi = [
  {
    type: 'function',
    name: 'pendingReward',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'amount', type: 'uint256' }],
  },
] as const;

/** `pendingReward(uint256)` — one egg's share. */
export const pendingRewardByTokenAbi = [
  {
    type: 'function',
    name: 'pendingReward',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

/** `claim()` — everything the wallet is owed. */
export const claimAllAbi = [
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'amount', type: 'uint256' }],
  },
] as const;

/** `claim(uint256)` — one egg. */
export const claimOneAbi = [
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'amount', type: 'uint256' }],
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  UnestNFT.sol                                                              */
/* -------------------------------------------------------------------------- */

export const unestNftAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'nextTokenId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'tokenOfOwnerByIndex',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'tokenByIndex',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  /** Returns a base64 data URI containing the art and the traits. */
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
  },
  /** Zero until revealed. */
  {
    type: 'function',
    name: 'revealSeed',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'bytes32' }],
  },
  /** The block the reveal is committed to. Zero once revealed. */
  {
    type: 'function',
    name: 'revealBlock',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'revealDelay',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'reveal',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'seed', type: 'bytes32' }],
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  UnestRenderer.sol                                                         */
/* -------------------------------------------------------------------------- */

export const unestRendererAbi = [
  {
    type: 'function',
    name: 'rewardWeight',
    stateMutability: 'pure',
    inputs: [{ name: 'seed', type: 'bytes32' }],
    outputs: [{ name: 'weight', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'traitIndices',
    stateMutability: 'pure',
    inputs: [{ name: 'seed', type: 'bytes32' }],
    outputs: [{ type: 'uint8[6]' }],
  },
] as const;
