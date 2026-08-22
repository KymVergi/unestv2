import type { CSSProperties, ReactNode } from 'react';
import styles from './Stat.module.css';

export type StatAccent = 'gold' | 'cosmic' | 'green' | 'sky' | 'plain';

export interface StatProps {
  value: ReactNode;
  label: string;
  hint?: string;
  accent?: StatAccent;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Stat({ value, label, hint, accent = 'gold', size = 'md', className }: StatProps) {
  return (
    <div
      className={[styles.stat, styles[accent], styles[size], className].filter(Boolean).join(' ')}
    >
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}

export function StatGrid({
  children,
  columns = 3,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={[styles.grid, className].filter(Boolean).join(' ')}
      style={{ '--cols': columns } as CSSProperties}
    >
      {children}
    </div>
  );
}

export default Stat;
