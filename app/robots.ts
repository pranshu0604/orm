import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: ['/', '/demo'], disallow: ['/api/', '/onboarding', '/settings'] },
    sitemap: 'https://orm-pran.vercel.app/sitemap.xml',
  };
}
