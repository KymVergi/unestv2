/**
 * UNEST — PROTOCOL CONSTANTS
 * ---------------------------------------------------------------------------
 * Every value here is transcribed from the deployed Solidity in /contracts.
 * If a number appears on screen, it comes from this file, and this file
 * mirrors the contract. Nothing is aspirational.
 *
 *   UNEST = the ERC-20 token
 *   EGG   = the ERC-721 NFT (a pixel chick), minted automatically by holding
 *   The art and the metadata live entirely on-chain in UnestRenderer.
 */

/* -------------------------------------------------------------------------- */
/*  TOKEN — Unest.sol                                                         */
/* -------------------------------------------------------------------------- */

export const TOKEN_NAME = 'UNEST' as const;
export const TOKEN_SYMBOL = 'UNEST' as const;
export const TOKEN_STANDARD = 'ERC-20' as const;
export const TOKEN_DECIMALS = 18 as const;

/** INITIAL_SUPPLY = 100_000_000_000 ether */
export const INITIAL_SUPPLY = 100_000_000_000;

/** UNIT = 100_000_000 ether — one NFT per unit of holding capacity. */
export const UNIT = 50_000_000;

/** INITIAL_SUPPLY / UNIT. A ceiling set by token maths, not a mint cap. */
export const MAX_EGGS = INITIAL_SUPPLY / UNIT; // 1,000

/** REVEAL_FEE = 2_000_000 ether, burned on reveal. */
export const REVEAL_FEE = 2_000_000;

/* -------------------------------------------------------------------------- */
/*  NFT — UnestNFT.sol                                                        */
/* -------------------------------------------------------------------------- */

export const NFT_NAME = 'UNEST' as const;
export const NFT_SYMBOL = 'UNEST' as const;
export const NFT_STANDARD = 'ERC-721' as const;

/**
 * A reveal must happen inside the 256-block window after its target block,
 * because `blockhash` only reaches back that far. Past it, calling reveal
 * simply reschedules the target to the next block.
 */
export const REVEAL_BLOCKHASH_WINDOW = 256;

/* -------------------------------------------------------------------------- */
/*  FEES — Unest.sol                                                          */
/* -------------------------------------------------------------------------- */

/** POOL_FEE = 20_000 with a 1_000_000 denominator → 2% of every swap. */
export const POOL_FEE_BPS = 20_000;
export const FEE_DENOMINATOR = 1_000_000;
export const POOL_FEE_PERCENT = (POOL_FEE_BPS / FEE_DENOMINATOR) * 100; // 2

export interface FeeSlice {
  id: string;
  label: string;
  pct: number;
  color: string;
  description: string;
}

/** HOLDER_SHARE 95 / OFFICIAL_SHARE 3 / BUYBACK_SHARE 2. */
export const FEE_SPLIT: readonly FeeSlice[] = [
  {
    id: 'holders',
    label: 'EGG HOLDERS',
    pct: 95,
    color: 'var(--gold)',
    description: 'Paid in ETH, split across revealed eggs in proportion to reward weight.',
  },
  {
    id: 'official',
    label: 'OFFICIAL',
    pct: 3,
    color: 'var(--sky)',
    description: 'The official address, for building and running the protocol.',
  },
  {
    id: 'buyback',
    label: 'BUYBACK & BURN',
    pct: 2,
    color: 'var(--red)',
    description: 'Buys UNEST from the pool and destroys it, permanently.',
  },
] as const;

/**
 * With no revealed eggs, the holder share has nowhere to go and is added to
 * the buyback instead. Straight from `_depositFees`.
 */
export const HOLDER_SHARE_FALLBACK = 'BUYBACK' as const;

/* -------------------------------------------------------------------------- */
/*  REWARD WEIGHT — UnestRenderer.sol                                         */
/* -------------------------------------------------------------------------- */

export const BASE_REWARD_WEIGHT = 100;
export const MAX_REWARD_WEIGHT = 300;

/** `_rarityBonus` in the renderer, expressed as tiers. */
export interface RarityTier {
  id: string;
  label: string;
  bonus: number;
  color: string;
  note: string;
}

export const RARITY_TIERS: readonly RarityTier[] = [
  { id: 'common', label: 'COMMON', bonus: 0, color: 'var(--dim)', note: 'The base roll.' },
  { id: 'uncommon', label: 'UNCOMMON', bonus: 5, color: 'var(--green)', note: 'Mid-table traits.' },
  { id: 'rare', label: 'RARE', bonus: 15, color: 'var(--sky)', note: 'Trait index 7 and up.' },
  {
    id: 'legendary',
    label: 'LEGENDARY',
    bonus: 35,
    color: 'var(--gold)',
    note: 'The top two or three indices.',
  },
  {
    id: 'mythic',
    label: 'MYTHIC',
    bonus: 75,
    color: 'var(--cosmic-soft)',
    note: 'Index 11 — one in a hundred rolls, per trait.',
  },
] as const;

/**
 * Six traits, twelve values each, drawn from the reveal seed.
 * Names and order are exactly those returned by `UnestRenderer.traits`.
 */
export const TRAIT_CATEGORIES = [
  'Shell',
  'Pattern',
  'Crown',
  'Speckle',
  'Emblem',
  'Backdrop',
] as const;

export type TraitCategory = (typeof TRAIT_CATEGORIES)[number];

export const TRAIT_VALUES: Record<TraitCategory, readonly string[]> = {
  Shell: [
    'Cream',
    'Purple',
    'Sky',
    'Green',
    'Butter',
    'Grey',
    'Red',
    'Orange',
    'Aqua',
    'White',
    'Gold',
    'Cosmic',
  ],
  Pattern: [
    'Plain',
    'Stripes',
    'Bands',
    'Dots',
    'Zigzag',
    'Diamonds',
    'Splatter',
    'Marble',
    'Hearts',
    'Circuit',
    'Glitch',
    'Galaxy',
  ],
  Crown: [
    'None',
    'Leaf',
    'Bow',
    'Halo',
    'Sprout',
    'Flame',
    'Party Hat',
    'Antenna',
    'Crack',
    'Feather',
    'Snow Cap',
    'Gold Halo',
  ],
  Speckle: [
    'Smooth',
    'Freckled',
    'Dotted',
    'Speckled',
    'Flecked',
    'Dusted',
    'Peppered',
    'Mottled',
    'Stippled',
    'Scattered',
    'Starred',
    'Prismatic',
  ],
  Emblem: [
    'None',
    'Heart',
    'Star',
    'Lightning',
    'Flame',
    'Moon',
    'Eye',
    'Chick',
    'Diamond',
    'Planet',
    'Crown',
    'Phoenix',
  ],
  Backdrop: [
    'Forest',
    'Dusk',
    'Night',
    'Moss',
    'Amber',
    'Charcoal',
    'Ember',
    'Copper',
    'Deep Sea',
    'Slate',
    'Gold',
    'Void',
  ],
};

/** The index-11 value of each trait — the +75 roll. */
export const MYTHIC_VALUES: Record<TraitCategory, string> = {
  Shell: 'Cosmic',
  Pattern: 'Galaxy',
  Crown: 'Gold Halo',
  Speckle: 'Prismatic',
  Emblem: 'Phoenix',
  Backdrop: 'Void',
};

/**
 * `_rarityBonus(id, trait)` reimplemented for display only.
 * The number that actually pays is `nftRewardWeight(tokenId)` on the token
 * contract — this is here so the docs can show the maths.
 */
export function rarityBonus(id: number, trait: number): number {
  if (id === 11) return 75;
  const legendaryStart = trait === 0 || trait === 3 || trait === 5 ? 9 : 10;
  if (id >= legendaryStart) return 35;
  if (id >= 7) return 15;
  const uncommonStart = trait < 2 ? 4 : trait === 2 || trait === 4 || trait === 5 ? 3 : 4;
  if (id >= uncommonStart) return 5;
  return 0;
}

/** Total weight for a full set of trait indices, capped like the contract. */
export function rewardWeightOf(indices: number[]): number {
  const total = indices.reduce(
    (sum, id, trait) => sum + rarityBonus(id, trait),
    BASE_REWARD_WEIGHT,
  );
  return Math.min(MAX_REWARD_WEIGHT, total);
}

/** Share of the holder pool one egg earns, given the whole collection's weight. */
export function weightShare(weight: number, totalWeight: number): number {
  if (!totalWeight) return 0;
  return (weight / totalWeight) * 100;
}

/* -------------------------------------------------------------------------- */
/*  THE LOOP                                                                  */
/* -------------------------------------------------------------------------- */

export const LOOP_STEPS = [
  {
    n: '01',
    title: 'HOLD',
    body: `Every ${UNIT / 1_000_000}M UNEST in your wallet is one egg. Buy, and the eggs appear on their own.`,
    tag: 'AUTOMATIC',
  },
  {
    n: '02',
    title: 'WAIT',
    body: 'Each egg commits to a future block. Its traits are not decided until that block exists.',
    tag: 'COMMIT–REVEAL',
  },
  {
    n: '03',
    title: 'REVEAL',
    body: `Burn ${REVEAL_FEE / 1_000_000}M UNEST to open the egg. Six traits and a reward weight are written on-chain.`,
    tag: `${REVEAL_FEE / 1_000_000}M BURNED`,
  },
  {
    n: '04',
    title: 'EARN',
    body: 'Revealed eggs take 95% of every swap fee, in ETH, by weight. Claim whenever.',
    tag: '95% OF FEES',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  COPY                                                                      */
/* -------------------------------------------------------------------------- */

export const TAGLINE = 'HOLD THE TOKEN. HATCH THE CHICK.';
export const SUBTAGLINE = 'An ERC-20 that lays fully on-chain pixel chicks.';
