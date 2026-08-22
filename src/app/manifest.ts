import type { MetadataRoute } from 'next';
import { SITE_DESCRIPTION, SITE_NAME } from '@/config/site';
import { TAGLINE } from '@/config/protocol';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0f11',
    theme_color: '#0d0f11',
    categories: ['finance'],
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
