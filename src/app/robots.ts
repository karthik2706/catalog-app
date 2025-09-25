import { MetadataRoute } from 'next'

// Utility function to safely get the base URL
function getBaseUrl(): string {
  const envUrl = process.env.NEXTAUTH_URL;
  
  // If no environment URL, use localhost for development
  if (!envUrl) {
    return "http://localhost:3000";
  }
  
  // If URL already has protocol, use as is
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    return envUrl;
  }
  
  // If URL doesn't have protocol, add https://
  return `https://${envUrl}`;
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()
  
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
