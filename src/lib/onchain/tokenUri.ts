/**
 * Decodes what `UnestNFT.tokenURI` returns.
 *
 * The contract emits `data:application/json;base64,<...>` where the JSON
 * itself carries `data:image/svg+xml;base64,<...>`. There is no server, no
 * IPFS and no image file anywhere — so this decoder is the only thing standing
 * between the chain and the pixels on screen.
 */

export interface TokenAttribute {
  trait_type: string;
  value: string;
}

export interface TokenMetadata {
  name: string;
  description: string;
  /** A `data:image/svg+xml;base64,…` URI, usable directly as an <img> source. */
  image: string;
  attributes: TokenAttribute[];
}

const JSON_PREFIX = 'data:application/json;base64,';

function decodeBase64(value: string): string {
  if (typeof atob === 'function') {
    // Browsers give us bytes-as-latin1; go through UTF-8 so names survive.
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(value, 'base64').toString('utf8');
}

/**
 * Returns null rather than throwing: a malformed URI means the interface shows
 * "could not read", never a guess at what the token might contain.
 */
export function parseTokenUri(uri?: string | null): TokenMetadata | null {
  if (!uri) return null;

  try {
    let json: string;
    if (uri.startsWith(JSON_PREFIX)) {
      json = decodeBase64(uri.slice(JSON_PREFIX.length));
    } else if (uri.startsWith('data:application/json,')) {
      json = decodeURIComponent(uri.slice('data:application/json,'.length));
    } else {
      return null;
    }

    const parsed = JSON.parse(json) as Partial<TokenMetadata>;
    if (typeof parsed.image !== 'string') return null;

    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
      image: parsed.image,
      attributes: Array.isArray(parsed.attributes)
        ? parsed.attributes.filter(
            (a): a is TokenAttribute =>
              typeof a?.trait_type === 'string' && typeof a?.value === 'string',
          )
        : [],
    };
  } catch {
    return null;
  }
}

/** True when the metadata is the sealed placeholder the renderer serves pre-reveal. */
export function isUnrevealedMetadata(meta: TokenMetadata | null): boolean {
  if (!meta) return false;
  return meta.attributes.some(
    (a) => a.trait_type === 'Status' && a.value.toLowerCase() === 'unrevealed',
  );
}
