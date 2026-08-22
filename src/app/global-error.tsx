'use client';

import { useEffect } from 'react';

/**
 * Replaces the whole document when the root layout itself fails, so it cannot
 * rely on any of the app's providers, fonts or CSS modules.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[unest] fatal error', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          padding: 24,
          textAlign: 'center',
          background: '#11130f',
          color: '#fff1c7',
          fontFamily: "'Courier New', monospace",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 48,
            height: 60,
            background: '#f4c95d',
            clipPath: 'polygon(50% 0, 100% 45%, 100% 80%, 50% 100%, 0 80%, 0 45%)',
          }}
        />
        <h1 style={{ fontSize: 20, letterSpacing: 4, margin: 0 }}>UNEST IS DOWN</h1>
        <p style={{ maxWidth: 480, lineHeight: 1.5, color: '#b9ad8c' }}>
          The application failed to start. Nothing on-chain was affected. Reload, or try again
          later.
        </p>
        {error.digest ? (
          <code style={{ fontSize: 12, color: '#7c765f' }}>DIGEST {error.digest}</code>
        ) : null}
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '12px 20px',
            fontFamily: 'inherit',
            fontSize: 14,
            letterSpacing: 2,
            color: '#241a06',
            background: '#f4c95d',
            border: '4px solid #0b0d09',
            cursor: 'pointer',
          }}
        >
          RELOAD
        </button>
      </body>
    </html>
  );
}
