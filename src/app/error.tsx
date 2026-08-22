'use client';

import { useEffect } from 'react';
import ChickMark from '@/components/egg/ChickMark/ChickMark';
import { Button, ButtonLink } from '@/components/ui/Button/Button';
import styles from './error.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[unest] route error', error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <div className={styles.art}>
        <ChickMark fill="#4a2020" eye="#e74c3c" beak="#3d3020" feet="#111111" />
      </div>
      <span className={styles.code}>SOMETHING BROKE</span>
      <h1 className={styles.title}>THIS PAGE FAILED TO RENDER</h1>
      <p className={styles.text}>
        Nothing on-chain was affected — this interface only reads, and asks your wallet to sign.
      </p>
      {error.digest ? <code className={styles.digest}>DIGEST {error.digest}</code> : null}
      <div className={styles.actions}>
        <Button size="lg" onClick={reset}>
          TRY AGAIN
        </Button>
        <ButtonLink href="/" size="lg" variant="ghost">
          BACK HOME
        </ButtonLink>
      </div>
    </div>
  );
}
