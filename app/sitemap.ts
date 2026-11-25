import type { MetadataRoute } from 'next';

const BASE = 'https://orm-pran.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE}/demo`, changeFrequency: 'daily', priority: 0.8 },
  ];
}
