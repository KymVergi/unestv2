import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'live' | 'gold' | 'cosmic' | 'sky' | 'danger' | 'muted';

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  /** A blinking dot before the label, for anything reading live state. */
  dot?: boolean;
  className?: string;
}

export function Badge({ children, tone = 'muted', dot = false, className }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[tone], className].filter(Boolean).join(' ')}>
      {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export default Badge;
