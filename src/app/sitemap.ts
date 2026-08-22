import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';

const ROUTES = [
  { path: '', priority: 1 },
  { path: '/eggs', priority: 0.8 },
  { path: '/docs', priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: r.priority,
  }));
}
