'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import Icon from '@/components/ui/Icon/Icon';
import { useIsHydrated } from '@/lib/hooks/useIsHydrated';
import { TARGET_CHAIN } from '@/lib/web3/config';
import { shortAddress } from '@/lib/utils/format';
import styles from './ConnectWallet.module.css';

export interface ConnectWalletProps {
  compact?: boolean;
  className?: string;
}

export function ConnectWallet({ compact = false, className }: ConnectWalletProps) {
  const mounted = useIsHydrated();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { address, isConnected, connector: active } = useAccount();
  const { connect, connectors, isPending, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN.id;

  if (!mounted) {
    return (
      <span className={[styles.btn, styles.shell, className].filter(Boolean).join(' ')} aria-hidden>
        <Icon name="wallet" size={12} />
        {compact ? 'CONNECT' : 'CONNECT WALLET'}
      </span>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        type="button"
        className={[styles.btn, styles.warn, className].filter(Boolean).join(' ')}
        onClick={() => switchChain({ chainId: TARGET_CHAIN.id })}
        disabled={switching}
      >
        <Icon name="alert" size={12} />
        {switching ? 'SWITCHING…' : 'SWITCH TO ETHEREUM'}
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className={[styles.connected, className].filter(Boolean).join(' ')}>
        <span className={styles.chainDot} aria-hidden="true" />
        <span className={styles.address} title={`${address} · ${active?.name ?? 'wallet'}`}>
          {shortAddress(address)}
        </span>
        <button
          type="button"
          className={styles.disconnect}
          onClick={() => disconnect()}
          aria-label="Disconnect wallet"
        >
          <Icon name="logout" size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={[styles.btn, className].filter(Boolean).join(' ')}
        onClick={() => {
          reset();
          setOpen((v) => !v);
        }}
        disabled={isPending}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon name="wallet" size={12} />
        {isPending ? 'CONFIRM IN WALLET' : compact ? 'CONNECT' : 'CONNECT WALLET'}
      </button>

      {open ? (
        <div className={styles.menu} role="menu">
          <span className={styles.menuHead}>CHOOSE A WALLET</span>
          {connectors.map((c) => (
            <button
              key={c.uid}
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => {
                connect({ connector: c });
                setOpen(false);
              }}
            >
              <span className={styles.menuMark} aria-hidden="true">
                ▸
              </span>
              {c.name.toUpperCase()}
            </button>
          ))}
          <a
            className={styles.menuFoot}
            href="https://ethereum.org/en/wallets/find-wallet/"
            target="_blank"
            rel="noopener noreferrer"
          >
            NO WALLET? <Icon name="external" size={10} />
          </a>
        </div>
      ) : null}

      {error ? <span className={styles.error}>{error.message.slice(0, 90)}</span> : null}
    </div>
  );
}

export default ConnectWallet;
