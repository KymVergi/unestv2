'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon/Icon';
import { CONTRACT_REGISTRY, NOT_CONFIGURED, type RegistryEntry } from '@/config/contracts';
import { shortAddress } from '@/lib/utils/format';
import styles from './ContractList.module.css';

function Row({ entry }: { entry: RegistryEntry }) {
  const [copied, setCopied] = useState(false);
  const configured = entry.value.length > 0;

  async function copy() {
    if (!configured) return;
    try {
      await navigator.clipboard.writeText(entry.value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <li className={[styles.row, configured ? '' : styles.pending].join(' ')}>
      <div className={styles.head}>
        <span className={styles.name}>{entry.name}</span>
        <code className={styles.file}>{entry.file}</code>
      </div>

      <p className={styles.desc}>{entry.description}</p>

      <div className={styles.footer}>
        <span className={styles.standard}>{entry.standard}</span>

        {configured ? (
          <code className={styles.address} title={entry.value}>
            {shortAddress(entry.value, 6)}
          </code>
        ) : (
          <span className={styles.placeholder}>0x… · {NOT_CONFIGURED}</span>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={copy}
            disabled={!configured}
            aria-label={`Copy the ${entry.name} address`}
          >
            <Icon name={copied ? 'check' : 'copy'} size={12} />
          </button>
          {entry.explorer ? (
            <a
              className={styles.iconBtn}
              href={entry.explorer}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${entry.name} on Etherscan`}
            >
              <Icon name="external" size={12} />
            </a>
          ) : (
            <span className={[styles.iconBtn, styles.disabled].join(' ')} aria-hidden="true">
              <Icon name="external" size={12} />
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

/** The six contracts, in the order they depend on each other. */
export function ContractList({ className }: { className?: string }) {
  return (
    <ul className={[styles.list, className].filter(Boolean).join(' ')}>
      {CONTRACT_REGISTRY.map((entry) => (
        <Row key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}

export default ContractList;
