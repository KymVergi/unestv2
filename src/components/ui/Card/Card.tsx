import type { ReactNode } from 'react';
import styles from './Card.module.css';

export type CardTone = 'default' | 'gold' | 'cosmic' | 'danger';

export interface CardProps {
  children: ReactNode;
  title?: string;
  meta?: ReactNode;
  tone?: CardTone;
  className?: string;
  bodyClassName?: string;
  id?: string;
}

export function Card({
  children,
  title,
  meta,
  tone = 'default',
  className,
  bodyClassName,
  id,
}: CardProps) {
  return (
    <section id={id} className={[styles.card, styles[tone], className].filter(Boolean).join(' ')}>
      {(title || meta) && (
        <header className={styles.head}>
          {title ? <h3 className={styles.title}>{title}</h3> : <span />}
          {meta ? <div className={styles.meta}>{meta}</div> : null}
        </header>
      )}
      <div className={[styles.body, bodyClassName].filter(Boolean).join(' ')}>{children}</div>
    </section>
  );
}

export default Card;
