import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.orbitx-notes.in';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/signup', '/subscription'],
      disallow: ['/api/', '/notes/', '/dashboard/', '/shared/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
