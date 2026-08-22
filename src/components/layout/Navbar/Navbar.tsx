'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon/Icon';
import ConnectWallet from '@/components/web3/ConnectWallet/ConnectWallet';
import styles from './Navbar.module.css';

const NAV = [
  { href: '/', label: 'HOME' },
  { href: '/eggs', label: 'YOUR EGGS' },
  { href: '/docs', label: 'DOCS' },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className={[styles.navbar, scrolled ? styles.scrolled : ''].join(' ')}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="UNEST — home">
          <Icon name="egg" size={18} className={styles.brandMark} />
          <span className={styles.brandText}>UNEST</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[styles.link, isActive(item.href) ? styles.active : ''].join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.right}>
          <div className={styles.walletDesktop}>
            <ConnectWallet />
          </div>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="unest-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <Icon name={open ? 'close' : 'menu'} size={16} />
          </button>
        </div>
      </div>

      <div
        id="unest-menu"
        className={[styles.menu, open ? styles.menuOpen : ''].join(' ')}
        hidden={!open}
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[styles.menuLink, isActive(item.href) ? styles.active : ''].join(' ')}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <div className={styles.menuWallet}>
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
