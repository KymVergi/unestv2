import { describe, expect, it } from 'vitest';
import { isUnrevealedMetadata, parseTokenUri } from './tokenUri';

/** Builds the exact shape `UnestRenderer.tokenURI` returns. */
function dataUri(json: unknown): string {
  return `data:application/json;base64,${Buffer.from(JSON.stringify(json)).toString('base64')}`;
}

const REVEALED = {
  name: 'UNEST Egg #7',
  description: 'UNEST on-chain chick',
  image: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
  attributes: [
    { trait_type: 'Shell', value: 'Cosmic' },
    { trait_type: 'Pattern', value: 'Galaxy' },
  ],
};

const SEALED = {
  name: 'UNEST Egg #7',
  description: 'Sealed UNEST egg',
  image: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
  attributes: [{ trait_type: 'Status', value: 'Unrevealed' }],
};

describe('parseTokenUri', () => {
  it('decodes a revealed token', () => {
    const meta = parseTokenUri(dataUri(REVEALED));
    expect(meta?.name).toBe('UNEST Egg #7');
    expect(meta?.image.startsWith('data:image/svg+xml;base64,')).toBe(true);
    expect(meta?.attributes).toHaveLength(2);
    expect(meta?.attributes[0]).toEqual({ trait_type: 'Shell', value: 'Cosmic' });
  });

  it('survives non-ASCII names rather than mangling them', () => {
    const meta = parseTokenUri(dataUri({ ...REVEALED, name: 'UNEST Egg — n.º 7 ✦' }));
    expect(meta?.name).toBe('UNEST Egg — n.º 7 ✦');
  });

  it('recognises the sealed placeholder', () => {
    expect(isUnrevealedMetadata(parseTokenUri(dataUri(SEALED)))).toBe(true);
    expect(isUnrevealedMetadata(parseTokenUri(dataUri(REVEALED)))).toBe(false);
  });

  it('drops malformed attributes instead of rendering junk', () => {
    const meta = parseTokenUri(
      dataUri({ ...REVEALED, attributes: [{ trait_type: 'Shell' }, 'nope', null] }),
    );
    expect(meta?.attributes).toEqual([]);
  });

  it('returns null for anything it cannot trust', () => {
    expect(parseTokenUri(undefined)).toBeNull();
    expect(parseTokenUri('')).toBeNull();
    expect(parseTokenUri('https://example.com/7.json')).toBeNull();
    expect(parseTokenUri('data:application/json;base64,not-base64!!')).toBeNull();
    // Valid base64, but no image — refuse rather than render an empty tile.
    expect(parseTokenUri(dataUri({ name: 'x' }))).toBeNull();
  });

  it('accepts a plain (unencoded) data URI too', () => {
    const meta = parseTokenUri(
      `data:application/json,${encodeURIComponent(JSON.stringify(REVEALED))}`,
    );
    expect(meta?.name).toBe('UNEST Egg #7');
  });
});
