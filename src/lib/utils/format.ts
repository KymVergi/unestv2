/** Display helpers. Formatting lives here so components stay dumb. */

export function shortAddress(address?: string, size = 4): string {
  if (!address) return '—';
  if (address.length <= size * 2 + 2) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

const UNITS: [number, string][] = [
  [1_000_000_000_000, 'T'],
  [1_000_000_000, 'B'],
  [1_000_000, 'M'],
  [1_000, 'K'],
];

/** 100000000 → "100M". Keeps tight columns readable. */
export function compact(n: number, digits = 1): string {
  const abs = Math.abs(n);
  for (const [size, suffix] of UNITS) {
    if (abs >= size) {
      const v = n / size;
      const s = v % 1 === 0 ? v.toFixed(0) : v.toFixed(digits).replace(/\.0$/, '');
      return `${s}${suffix}`;
    }
  }
  return String(n);
}

/** 100000000000 → "100,000,000,000" */
export function grouped(n: number | bigint): string {
  return n.toLocaleString('en-US');
}

export function pct(n: number, digits = 1): string {
  return `${n.toFixed(digits).replace(/\.0$/, '')}%`;
}

export function eggLabel(id: number): string {
  return `EGG #${id}`;
}

/**
 * Formats a wei amount without pulling in a formatting library.
 * Small ETH rewards need real precision, so this keeps significant digits
 * rather than rounding a claim down to "0".
 */
export function formatUnits(value: bigint, decimals: number, maxDigits = 4): string {
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const frac = value % base;

  if (frac === 0n) return whole.toLocaleString('en-US');

  const fracStr = frac.toString().padStart(decimals, '0');
  // Keep enough decimals to show something meaningful for tiny amounts.
  let keep = maxDigits;
  while (keep < decimals && /^0+$/.test(fracStr.slice(0, keep))) keep += 2;

  const trimmed = fracStr.slice(0, keep).replace(/0+$/, '');
  if (!trimmed) return whole.toLocaleString('en-US');
  return `${whole.toLocaleString('en-US')}.${trimmed}`;
}

/** Whole tokens as a number, for maths the UI needs (capacity, ratios). */
export function toWholeTokens(value: bigint, decimals = 18): number {
  return Number(value / 10n ** BigInt(decimals));
}

export function formatEth(wei: bigint, maxDigits = 5): string {
  return formatUnits(wei, 18, maxDigits);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}
