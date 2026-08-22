import {
  BASE_REWARD_WEIGHT,
  INITIAL_SUPPLY,
  MAX_EGGS,
  MAX_REWARD_WEIGHT,
  POOL_FEE_PERCENT,
  REVEAL_BLOCKHASH_WINDOW,
  REVEAL_FEE,
  TOKEN_DECIMALS,
  UNIT,
} from '@/config/protocol';
import { compact, grouped } from '@/lib/utils/format';

export interface DocBlock {
  kind: 'p' | 'list' | 'code' | 'note' | 'warn';
  text?: string;
  items?: string[];
}

export interface DocSection {
  id: string;
  index: string;
  title: string;
  blocks: DocBlock[];
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'overview',
    index: '01',
    title: 'OVERVIEW',
    blocks: [
      {
        kind: 'p',
        text: 'UNEST is an ERC-20 token whose holders are issued fully on-chain generative NFTs — pixel chicks. The token contract is also the controller: it mints and burns the NFTs as balances move, splits swap fees, and pays rewards in ETH.',
      },
      {
        kind: 'list',
        items: [
          'UNEST — the ERC-20 token.',
          'EGG — the ERC-721 NFT. One per unit of holding capacity.',
          'UnestRenderer — the art and metadata, generated on-chain.',
          'UnestMarket + LaunchGuardHook — the Uniswap v4 pool and its router.',
          'PermanentLiquidityLocker — the LP, locked forever.',
        ],
      },
      {
        kind: 'note',
        text: 'There is no staking, no feeding, no breeding and no evolution. If a mechanic is not on this page, it does not exist in the contracts.',
      },
    ],
  },
  {
    id: 'token',
    index: '02',
    title: 'THE TOKEN',
    blocks: [
      {
        kind: 'p',
        text: 'UNEST is a standard ERC-20 with one unusual habit: transfers move NFTs.',
      },
      {
        kind: 'list',
        items: [
          `Initial supply: ${grouped(INITIAL_SUPPLY)}`,
          `Decimals: ${TOKEN_DECIMALS}`,
          `Unit of capacity: ${grouped(UNIT)} UNEST per egg`,
          'Supply only ever falls — reveals and buybacks burn.',
        ],
      },
      {
        kind: 'p',
        text: 'When you send UNEST to another wallet, the contract moves as many of your eggs as the transfer covers and the receiver can hold. Anything you can no longer back is burned on the spot.',
      },
    ],
  },
  {
    id: 'eggs',
    index: '03',
    title: 'HOW EGGS APPEAR',
    blocks: [
      {
        kind: 'p',
        text: `Your capacity is your balance divided by ${compact(UNIT)}. Buy through the pool and the controller issues eggs up to that capacity. There is no mint button, and there is nothing to claim.`,
      },
      { kind: 'code', text: `capacity = balance / ${grouped(UNIT)}\neggs held ≤ capacity` },
      {
        kind: 'warn',
        text: 'The reverse is just as automatic. Sell, send, or burn UNEST until your balance no longer covers the eggs you hold, and the surplus eggs are burned — including any unclaimed rewards attached to them, which are redirected to the buyback.',
      },
      {
        kind: 'note',
        text: 'Only a buy routed through the pool issues eggs. Receiving UNEST from another wallet transfers existing eggs instead of creating new ones.',
      },
    ],
  },
  {
    id: 'reveal',
    index: '04',
    title: 'REVEAL',
    blocks: [
      {
        kind: 'p',
        text: 'A new egg is sealed. At mint it commits to a block a fixed distance in the future, and its traits are drawn from that block hash — so nobody, including the deployer, can know or steer what an egg will become.',
      },
      { kind: 'code', text: 'seed = keccak256(blockhash(targetBlock), tokenId, nftAddress)' },
      {
        kind: 'list',
        items: [
          'Only the owner can reveal.',
          `Reveal burns ${compact(REVEAL_FEE)} UNEST.`,
          `It must happen within ${REVEAL_BLOCKHASH_WINDOW} blocks of the target.`,
          'Miss that window and revealing books a new target block instead — then reveal again.',
        ],
      },
      {
        kind: 'warn',
        text: `To reveal you need your full backing plus the fee: ${compact(REVEAL_FEE)} UNEST spare on top of ${compact(UNIT)} for every egg you hold. Otherwise the burn would drop you under your backing and cost you an egg.`,
      },
    ],
  },
  {
    id: 'rewards',
    index: '05',
    title: 'REWARDS',
    blocks: [
      {
        kind: 'p',
        text: `The pool charges ${POOL_FEE_PERCENT}% per swap. Those fees arrive as ETH and are split on the way in.`,
      },
      {
        kind: 'list',
        items: ['95% — egg holders', '3% — official address', '2% — buyback and burn'],
      },
      {
        kind: 'p',
        text: 'The holder slice is divided by reward weight across revealed eggs. Claim with `claim()` for everything, or per egg. Rewards are ETH, not tokens.',
      },
      {
        kind: 'note',
        text: 'A sealed egg has no weight and earns nothing. While no revealed egg exists at all, the holder slice is added to the buyback instead.',
      },
      {
        kind: 'warn',
        text: 'No rate is promised. Distribution depends entirely on how much the pool is traded, and can be zero for as long as nobody trades.',
      },
    ],
  },
  {
    id: 'weight',
    index: '06',
    title: 'REWARD WEIGHT',
    blocks: [
      {
        kind: 'p',
        text: `Every revealed chick starts at ${BASE_REWARD_WEIGHT}. Each of its six traits adds a bonus depending on how rare the rolled value is. The contract caps the total at ${MAX_REWARD_WEIGHT}.`,
      },
      {
        kind: 'code',
        text: `weight = ${BASE_REWARD_WEIGHT} + Σ bonus(trait)\nweight = min(weight, ${MAX_REWARD_WEIGHT})`,
      },
      { kind: 'list', items: ['Uncommon +5', 'Rare +15', 'Legendary +35', 'Mythic +75'] },
      {
        kind: 'p',
        text: 'Six mythic rolls would total 550, so the cap bites well before a perfect set. Your share is your weight over the sum of every revealed egg.',
      },
    ],
  },
  {
    id: 'burns',
    index: '07',
    title: 'BURNS',
    blocks: [
      { kind: 'p', text: 'UNEST leaves circulation in three ways, all of them permanent:' },
      {
        kind: 'list',
        items: [
          `Reveal — ${compact(REVEAL_FEE)} UNEST per egg.`,
          '2% of swap fees buy UNEST from the pool and destroy it.',
          'Rewards attached to a burned egg are redirected into the buyback.',
        ],
      },
      {
        kind: 'p',
        text: `${grouped(MAX_EGGS)} eggs is what the supply allows today. Because supply only falls, that ceiling falls with it.`,
      },
    ],
  },
  {
    id: 'liquidity',
    index: '08',
    title: 'POOL & LIQUIDITY',
    blocks: [
      {
        kind: 'p',
        text: 'The pool is ETH / UNEST on Uniswap v4 with LaunchGuardHook attached. The hook validates the pool, tracks buy credit inside the swap so the controller knows a real purchase happened, and routes fees back to the token.',
      },
      {
        kind: 'p',
        text: 'Liquidity is seeded as a token-only position by PermanentLiquidityLocker and locked permanently. Collected fees are forwarded to the token contract, where the 95 / 3 / 2 split happens.',
      },
    ],
  },
  {
    id: 'contracts',
    index: '09',
    title: 'CONTRACTS',
    blocks: [
      {
        kind: 'p',
        text: 'All six addresses are read from configuration. Until a real deployment is published, entries render as placeholders and say NOT CONFIGURED. No address is ever invented for display.',
      },
      {
        kind: 'p',
        text: 'The Solidity for every contract ships in the /contracts folder of this repository, so you can diff what is deployed against what is published.',
      },
    ],
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: FaqItem[] = [
  {
    q: 'How do I get an egg?',
    a: `Buy UNEST. Once your balance reaches ${compact(UNIT)}, the contract issues an egg to your wallet on its own. There is no mint transaction.`,
  },
  {
    q: 'Do I have to lock my tokens?',
    a: 'No. Nothing is staked or escrowed. Your UNEST stays liquid and you can sell any time — doing so simply reduces how many eggs your balance can back.',
  },
  {
    q: 'What happens if I sell?',
    a: 'Eggs you can no longer back are burned automatically by the token contract, newest first. Any unclaimed rewards on them go to the buyback.',
  },
  {
    q: 'What does reveal cost?',
    a: `${compact(REVEAL_FEE)} UNEST, burned. You need that spare on top of the ${compact(UNIT)} backing each egg you hold, or the burn would cost you an egg.`,
  },
  {
    q: 'Can the team pick the rare ones?',
    a: 'No. Traits come from the hash of a block chosen at mint time and not yet mined. Nobody can know the outcome in advance, and the reveal can only be called by the owner.',
  },
  {
    q: 'I missed the reveal window. Is my egg ruined?',
    a: `No. Block hashes are only readable for ${REVEAL_BLOCKHASH_WINDOW} blocks, so past that the contract books a new target block. Call reveal once to reschedule, then again to reveal.`,
  },
  {
    q: 'Where is the art stored?',
    a: 'Nowhere. UnestRenderer generates the SVG and the metadata from the seed every time they are requested. There is no image file, no IPFS pin and no server to fail.',
  },
  {
    q: 'What are the rewards paid in?',
    a: 'ETH, from swap fees. Not tokens, and not on a schedule — you claim whatever has accrued whenever you like.',
  },
  {
    q: 'Is it audited?',
    a: 'No. Nothing on this site claims otherwise. Read the contracts, or have someone you trust read them, before you interact.',
  },
];

export interface RiskItem {
  title: string;
  body: string;
}

export const RISKS: RiskItem[] = [
  {
    title: 'TOTAL LOSS IS POSSIBLE',
    body: 'UNEST can lose all of its value and the eggs with it. Only spend what you are prepared to lose entirely.',
  },
  {
    title: 'EGGS BURN AUTOMATICALLY',
    body: 'Dropping below your backing destroys eggs without asking. This is designed behaviour in the token contract, not a failure.',
  },
  {
    title: 'REVEAL IS IRREVERSIBLE',
    body: 'The fee is burned and the traits are written once. There is no reroll and no refund.',
  },
  {
    title: 'REWARDS MAY BE NOTHING',
    body: 'Fees only exist when people swap. A quiet pool pays nothing, however rare your chick is.',
  },
  {
    title: 'NOT AUDITED',
    body: 'The contracts may contain bugs. No audit is claimed. If one is ever published, it will appear here with the evidence attached.',
  },
  {
    title: 'NO CUSTODY, NO RECOVERY',
    body: 'This interface never holds your keys or your assets, and nobody can reverse a transaction you signed.',
  },
];
