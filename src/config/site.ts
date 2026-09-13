/**
 * UNEST — SITE CONFIGURATION
 * Identity, canonical URL and outbound links. Overridable by env so a
 * deployment never needs a code change.
 */

const rawSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim();

/** Canonical origin, no trailing slash. */
export const SITE_URL = (rawSiteUrl || 'https://unest.fun').replace(/\/+$/, '');

export const SITE_NAME = 'UNEST';
export const SITE_DESCRIPTION =
  'An ERC-20 token whose holders are issued fully on-chain generative pixel chicks. Every 50M UNEST held is one egg. Swap fees pay egg holders in ETH.';

export const X_URL = (process.env.NEXT_PUBLIC_X_URL ?? '').trim() || 'https://x.com/unestfun';
export const X_HANDLE = `@${X_URL.replace(/\/+$/, '').split('/').pop() ?? 'unestfun'}`;

export const DISCORD_URL = (process.env.NEXT_PUBLIC_DISCORD_URL ?? '').trim();
export const TELEGRAM_URL = (process.env.NEXT_PUBLIC_TELEGRAM_URL ?? '').trim();
export const GITHUB_URL = (process.env.NEXT_PUBLIC_GITHUB_URL ?? '').trim();

export interface SocialLink {
  label: string;
  href: string;
}

/** Only the links that are actually configured. */
export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'X', href: X_URL },
  { label: 'DISCORD', href: DISCORD_URL },
  { label: 'TELEGRAM', href: TELEGRAM_URL },
  { label: 'GITHUB', href: GITHUB_URL },
].filter((l): l is SocialLink => Boolean(l.href));
