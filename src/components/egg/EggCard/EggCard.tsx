'use client';

// A plain <img> on purpose: the source is a base64 SVG data URI produced by the
// contract, so there is nothing for next/image to fetch, resize or cache.
import ChickMark from '@/components/egg/ChickMark/ChickMark';
import Badge from '@/components/ui/Badge/Badge';
import TxButton from '@/components/web3/TxButton/TxButton';
import { NFT_ADDRESS, UNEST_ADDRESS } from '@/config/contracts';
import {
  MAX_REWARD_WEIGHT,
  MYTHIC_VALUES,
  REVEAL_FEE,
  type TraitCategory,
} from '@/config/protocol';
import { claimOneAbi, unestNftAbi } from '@/lib/web3/abis';
import type { Egg } from '@/lib/web3/useEggs';
import { compact, formatEth, plural } from '@/lib/utils/format';
import styles from './EggCard.module.css';

export interface EggCardProps {
  egg: Egg;
  /** False when the wallet cannot cover backing + the reveal fee. */
  canPayRevealFee: boolean;
  onDone?: () => void;
}

function isMythic(trait: string, value: string): boolean {
  return MYTHIC_VALUES[trait as TraitCategory] === value;
}

export function EggCard({ egg, canPayRevealFee, onDone }: EggCardProps) {
  const { state, revealed, weight, pending } = egg;

  const weightPct = weight ? Math.round((weight / MAX_REWARD_WEIGHT) * 100) : 0;
  const mythics = egg.attributes.filter((a) => isMythic(a.trait_type, a.value));

  let revealBlocked: string | undefined;
  if (state === 'waiting') {
    revealBlocked = egg.blocksToGo
      ? `READY IN ${egg.blocksToGo} ${plural(egg.blocksToGo, 'BLOCK')}`
      : 'WAITING FOR TARGET BLOCK';
  } else if (!canPayRevealFee) {
    revealBlocked = `NEEDS ${compact(REVEAL_FEE)} UNEST SPARE`;
  }

  return (
    <article className={[styles.card, revealed ? styles.revealed : styles.sealed].join(' ')}>
      <div className={styles.art}>
        {egg.image ? (
          <img src={egg.image} alt={egg.name} className={styles.image} width={256} height={256} />
        ) : (
          <div className={styles.fallback}>
            <ChickMark />
            <span className={styles.fallbackNote}>ART UNAVAILABLE</span>
          </div>
        )}
      </div>

      <header className={styles.head}>
        <span className={styles.id}>#{egg.tokenId}</span>
        {revealed ? (
          <Badge tone={mythics.length ? 'cosmic' : 'gold'}>
            {mythics.length ? `MYTHIC ×${mythics.length}` : 'REVEALED'}
          </Badge>
        ) : (
          <Badge tone={state === 'ready' ? 'live' : state === 'expired' ? 'danger' : 'muted'}>
            {state === 'ready' ? 'READY' : state === 'expired' ? 'MISSED' : 'SEALED'}
          </Badge>
        )}
      </header>

      {revealed ? (
        <>
          <div className={styles.weightRow}>
            <span className={styles.weightLabel}>WEIGHT</span>
            <span className={styles.weightValue}>
              {weight || '—'}
              <small>/ {MAX_REWARD_WEIGHT}</small>
            </span>
          </div>
          <div className={styles.weightTrack} aria-hidden="true">
            <span className={styles.weightFill} style={{ width: `${weightPct}%` }} />
          </div>

          <ul className={styles.traits}>
            {egg.attributes.map((a) => (
              <li
                key={a.trait_type}
                className={isMythic(a.trait_type, a.value) ? styles.mythic : undefined}
              >
                <span>{a.trait_type}</span>
                <b>{a.value}</b>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={styles.sealedNote}>
          {state === 'expired'
            ? 'The 256-block window for this egg passed. Revealing now simply books a new target block — then reveal again.'
            : 'Traits are not decided yet. They are drawn from the hash of a block that has not been mined.'}
        </p>
      )}

      <div className={styles.pending}>
        <span className={styles.pendingLabel}>CLAIMABLE</span>
        <span className={styles.pendingValue}>{formatEth(pending)} ETH</span>
      </div>

      <div className={styles.actions}>
        {revealed ? (
          <TxButton
            label="CLAIM"
            variant="primary"
            address={UNEST_ADDRESS}
            abi={claimOneAbi}
            functionName="claim"
            args={[BigInt(egg.tokenId)]}
            blockedReason={pending === 0n ? 'NOTHING TO CLAIM' : undefined}
            onConfirmed={onDone}
          />
        ) : (
          <TxButton
            label={state === 'expired' ? 'RESCHEDULE' : `REVEAL · ${compact(REVEAL_FEE)}`}
            variant={state === 'ready' ? 'primary' : 'secondary'}
            address={NFT_ADDRESS}
            abi={unestNftAbi}
            functionName="reveal"
            args={[BigInt(egg.tokenId)]}
            blockedReason={revealBlocked}
            onConfirmed={onDone}
          />
        )}
      </div>
    </article>
  );
}

export default EggCard;
