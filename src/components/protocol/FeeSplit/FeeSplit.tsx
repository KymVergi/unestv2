import { FEE_SPLIT, POOL_FEE_PERCENT } from '@/config/protocol';
import styles from './FeeSplit.module.css';

export interface FeeSplitProps {
  className?: string;
  compact?: boolean;
}

/** Where a swap fee goes. 95 / 3 / 2, straight from `_depositFees`. */
export function FeeSplit({ className, compact = false }: FeeSplitProps) {
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <div
        className={styles.bar}
        role="img"
        aria-label={`Swap fees split ${FEE_SPLIT.map((s) => `${s.pct}% ${s.label}`).join(', ')}`}
      >
        {FEE_SPLIT.map((slice) => (
          <span
            key={slice.id}
            className={styles.seg}
            style={{ flexGrow: slice.pct, background: slice.color }}
          >
            <span className={styles.segPct}>{slice.pct}%</span>
          </span>
        ))}
      </div>

      <ul className={styles.legend}>
        {FEE_SPLIT.map((slice) => (
          <li key={slice.id} className={styles.item}>
            <span
              className={styles.swatch}
              style={{ background: slice.color }}
              aria-hidden="true"
            />
            <span className={styles.label} style={{ color: slice.color }}>
              {slice.label}
            </span>
            {compact ? null : <span className={styles.desc}>{slice.description}</span>}
          </li>
        ))}
      </ul>

      <p className={styles.note}>
        The pool charges {POOL_FEE_PERCENT}% on every swap. With no revealed eggs in existence, the
        holder share has nowhere to go and is added to the buyback instead.
      </p>
    </div>
  );
}

export default FeeSplit;
