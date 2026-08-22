'use client';

import { useSyncExternalStore } from 'react';

const noop = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * True only after hydration.
 *
 * Wallet state lives in the browser, so the first client render has to match
 * the server's markup exactly. This is the pure equivalent of the usual
 * `useState(false)` + `useEffect(() => setMounted(true))` dance, without
 * calling setState from an effect.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(noop, onClient, onServer);
}
