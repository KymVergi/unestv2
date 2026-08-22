'use client';

import Badge from '@/components/ui/Badge/Badge';
import Stat, { StatGrid } from '@/components/ui/Stat/Stat';
import { NOT_CONFIGURED } from '@/config/contracts';
import { INITIAL_SUPPLY, MAX_EGGS, UNIT } from '@/config/protocol';
import { compact, grouped } from '@/lib/utils/format';
import { useProtocolStats } from '@/lib/web3/useProtocolStats';
import styles from './LiveStats.module.css';

/**
 * Headline numbers. Where the chain can answer, it does; where the contracts
 * are not configured yet, the constant is shown and the state says so. No
 * number on this page is invented.
 */
export function LiveStats() {
  const { supply, eggs, minted, totalWeight, isLoading, configured } = useProtocolStats();

  const dash = isLoading ? '····' : '—';
  const burned = supply === null ? null : INITIAL_SUPPLY - supply;

  return (
    <div className={styles.wrap}>
      <div className={styles.status}>
        {configured ? (
          <Badge tone="live" dot>
            {isLoading ? 'READING CHAIN' : 'LIVE'}
          </Badge>
        ) : (
          <Badge tone="gold">{NOT_CONFIGURED} · SHOWING CONTRACT CONSTANTS</Badge>
        )}
      </div>

      <StatGrid columns={4}>
        <Stat
          accent="gold"
          value={supply === null ? compact(INITIAL_SUPPLY) : compact(supply)}
          label="UNEST SUPPLY"
          hint={
            burned === null
              ? `${grouped(INITIAL_SUPPLY)} at launch`
              : `${compact(burned)} burned so far`
          }
        />
        <Stat
          accent="cosmic"
          value={eggs === null ? dash : grouped(eggs)}
          label="EGGS ALIVE"
          hint={minted === null ? `${grouped(MAX_EGGS)} maximum` : `${grouped(minted)} ever issued`}
        />
        <Stat accent="plain" value={grouped(MAX_EGGS)} label="CEILING" hint="Supply ÷ unit" />
        <Stat
          accent="sky"
          value={totalWeight === null ? dash : grouped(totalWeight)}
          label="TOTAL WEIGHT"
          hint={`${compact(UNIT)} UNEST = 1 egg`}
        />
      </StatGrid>
    </div>
  );
}

export default LiveStats;
