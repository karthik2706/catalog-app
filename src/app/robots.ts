import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/products',
          '/products/*',
          '/api/public/*',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/login',
          '/register',
          '/settings',
          '/inventory',
          '/media',
          '/reports',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/products',
          '/products/*',
          '/api/public/*',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/login',
          '/register',
          '/settings',
          '/inventory',
          '/media',
          '/reports',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/products',
          '/products/*',
          '/api/public/*',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/login',
          '/register',
          '/settings',
          '/inventory',
          '/media',
          '/reports',
          '/_next/',
          '/private/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
