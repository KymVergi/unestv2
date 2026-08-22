import type { ReactNode } from 'react';
import styles from './Section.module.css';

export interface SectionProps {
  children: ReactNode;
  id?: string;
  width?: 'narrow' | 'default' | 'wide';
  tone?: 'plain' | 'sunken';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Section({
  children,
  id,
  width = 'default',
  tone = 'plain',
  size = 'md',
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      className={[styles.section, styles[tone], styles[size], className].filter(Boolean).join(' ')}
    >
      <div className={[styles.container, styles[width]].join(' ')}>{children}</div>
    </section>
  );
}

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = 'left',
  as: Tag = 'h2',
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={[styles.header, align === 'center' ? styles.center : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
      <Tag className={styles.title}>{title}</Tag>
      {lead ? <div className={styles.lead}>{lead}</div> : null}
    </header>
  );
}

export default Section;
