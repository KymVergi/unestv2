import { describe, expect, it } from 'vitest';
import {
  CHAIN_ID,
  CONTRACT_REGISTRY,
  NETWORK_NAME,
  etherscanAddress,
  etherscanTx,
  isConfigured,
  uniswapSwap,
} from './contracts';
import { SITE_URL, X_HANDLE, X_URL } from './site';
import {
  BASE_REWARD_WEIGHT,
  FEE_SPLIT,
  INITIAL_SUPPLY,
  MAX_EGGS,
  MAX_REWARD_WEIGHT,
  POOL_FEE_BPS,
  POOL_FEE_PERCENT,
  REVEAL_BLOCKHASH_WINDOW,
  REVEAL_FEE,
  TRAIT_CATEGORIES,
  TRAIT_VALUES,
  UNIT,
  rarityBonus,
  rewardWeightOf,
  weightShare,
} from './protocol';

/* -------------------------------------------------------------------------- */
/*  These assert the site matches /contracts. If a contract changes, they fail. */
/* -------------------------------------------------------------------------- */

describe('token constants (Unest.sol)', () => {
  it('matches INITIAL_SUPPLY and UNIT', () => {
    expect(INITIAL_SUPPLY).toBe(100_000_000_000);
    expect(UNIT).toBe(100_000_000);
  });

  it('derives the egg ceiling from supply ÷ unit', () => {
    expect(MAX_EGGS).toBe(INITIAL_SUPPLY / UNIT);
    expect(MAX_EGGS).toBe(1_000);
  });

  it('matches REVEAL_FEE', () => {
    expect(REVEAL_FEE).toBe(2_000_000);
  });

  it('keeps the reveal fee far below one unit of backing', () => {
    expect(REVEAL_FEE).toBeLessThan(UNIT);
  });
});

describe('fee split (_depositFees)', () => {
  it('is 95 / 3 / 2', () => {
    expect(FEE_SPLIT.map((s) => s.pct)).toEqual([95, 3, 2]);
  });

  it('adds up to 100', () => {
    expect(FEE_SPLIT.reduce((a, s) => a + s.pct, 0)).toBe(100);
  });

  it('charges 2% per swap', () => {
    expect(POOL_FEE_BPS).toBe(20_000);
    expect(POOL_FEE_PERCENT).toBe(2);
  });
});

describe('reward weight (UnestRenderer._rarityBonus)', () => {
  it('starts at 100 and caps at 300', () => {
    expect(BASE_REWARD_WEIGHT).toBe(100);
    expect(MAX_REWARD_WEIGHT).toBe(300);
  });

  it('gives the mythic roll +75 on every trait', () => {
    for (let trait = 0; trait < 6; trait += 1) {
      expect(rarityBonus(11, trait), `trait ${trait}`).toBe(75);
    }
  });

  it('starts legendary at index 9 for shell, speckle and backdrop', () => {
    for (const trait of [0, 3, 5]) {
      expect(rarityBonus(9, trait), `trait ${trait}`).toBe(35);
    }
    // …and at 10 for pattern, crown and emblem.
    for (const trait of [1, 2, 4]) {
      expect(rarityBonus(9, trait), `trait ${trait}`).toBe(15);
      expect(rarityBonus(10, trait), `trait ${trait}`).toBe(35);
    }
  });

  it('gives the plainest roll no bonus at all', () => {
    for (let trait = 0; trait < 6; trait += 1) {
      expect(rarityBonus(0, trait), `trait ${trait}`).toBe(0);
    }
  });

  it('caps a full mythic set instead of paying 550', () => {
    expect(rewardWeightOf([11, 11, 11, 11, 11, 11])).toBe(MAX_REWARD_WEIGHT);
  });

  it('leaves the plainest chick on the base weight', () => {
    expect(rewardWeightOf([0, 0, 0, 0, 0, 0])).toBe(BASE_REWARD_WEIGHT);
  });

  it('never exceeds the cap for any combination', () => {
    for (let a = 0; a < 12; a += 1) {
      for (let b = 0; b < 12; b += 1) {
        const weight = rewardWeightOf([a, b, a, b, a, b]);
        expect(weight).toBeGreaterThanOrEqual(BASE_REWARD_WEIGHT);
        expect(weight).toBeLessThanOrEqual(MAX_REWARD_WEIGHT);
      }
    }
  });
});

describe('weightShare', () => {
  it('is zero when nothing is revealed, rather than dividing by zero', () => {
    expect(weightShare(300, 0)).toBe(0);
  });

  it('is the whole pool when you are the only revealed egg', () => {
    expect(weightShare(180, 180)).toBe(100);
  });
});

describe('traits (UnestRenderer)', () => {
  it('has six traits with twelve values each', () => {
    expect(TRAIT_CATEGORIES).toHaveLength(6);
    for (const cat of TRAIT_CATEGORIES) {
      expect(TRAIT_VALUES[cat], cat).toHaveLength(12);
    }
  });

  it('names them in the order the contract returns them', () => {
    expect([...TRAIT_CATEGORIES]).toEqual([
      'Shell',
      'Pattern',
      'Crown',
      'Speckle',
      'Emblem',
      'Backdrop',
    ]);
  });
});

describe('reveal', () => {
  it('uses the 256-block blockhash window', () => {
    expect(REVEAL_BLOCKHASH_WINDOW).toBe(256);
  });
});

describe('network + registry', () => {
  it('targets Ethereum mainnet', () => {
    expect(CHAIN_ID).toBe(1);
    expect(NETWORK_NAME).toBe('Ethereum Mainnet');
  });

  it('lists all six contracts', () => {
    expect(CONTRACT_REGISTRY.map((e) => e.id)).toEqual([
      'unest',
      'nft',
      'renderer',
      'market',
      'hook',
      'locker',
    ]);
  });

  it('never invents an address', () => {
    for (const entry of CONTRACT_REGISTRY) {
      if (!entry.value) continue;
      expect(/^0x[a-fA-F0-9]{40}$/.test(entry.value), `${entry.id} → ${entry.value}`).toBe(true);
    }
  });

  it('offers no explorer link while an address is missing', () => {
    for (const entry of CONTRACT_REGISTRY) {
      if (!entry.value) expect(entry.explorer).toBeNull();
    }
  });

  it('points every entry at its source file', () => {
    for (const entry of CONTRACT_REGISTRY) {
      expect(entry.file.endsWith('.sol'), entry.id).toBe(true);
    }
  });
});

describe('link helpers', () => {
  it('returns null instead of a broken link', () => {
    expect(etherscanAddress('')).toBeNull();
    expect(etherscanTx(undefined)).toBeNull();
  });

  it('still offers a swap page with no token configured', () => {
    expect(uniswapSwap('')).toContain('app.uniswap.org');
  });

  it('treats the empty string as not configured', () => {
    expect(isConfigured('')).toBe(false);
    expect(isConfigured('0xabc')).toBe(true);
  });
});

describe('site config', () => {
  it('has no trailing slash on the canonical url', () => {
    expect(SITE_URL.endsWith('/')).toBe(false);
  });

  it('defaults to the project X account', () => {
    expect(X_URL).toBe('https://x.com/unest_fun');
    expect(X_HANDLE).toBe('@unest_fun');
  });
});
