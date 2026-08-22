import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Common {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  full?: boolean;
}

function classes({ variant = 'primary', size = 'md', full, className }: Common) {
  return [styles.btn, styles[variant], styles[size], full ? styles.full : '', className]
    .filter(Boolean)
    .join(' ');
}

export interface ButtonLinkProps extends Common {
  href: string;
  external?: boolean;
}

export function ButtonLink({ href, external, children, ...rest }: ButtonLinkProps) {
  const cls = classes({ children, ...rest });

  if (external) {
    return (
      <a className={cls} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className={cls} href={href}>
      {children}
    </Link>
  );
}

export interface ButtonProps
  extends Common, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {}

export function Button({ children, variant, size, full, className, ...rest }: ButtonProps) {
  return (
    <button {...rest} className={classes({ children, variant, size, full, className })}>
      {children}
    </button>
  );
}

export default Button;
