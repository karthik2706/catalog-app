import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Stock Mind - Inventory Management',
    short_name: 'Stock Mind',
    description: 'Advanced inventory management system for smart stock tracking',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png'
      },
      {
        src: '/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    categories: ['business', 'productivity', 'utilities'],
    lang: 'en',
    dir: 'ltr',
    scope: '/',
    id: 'stock-mind-inventory',
    related_applications: [],
    prefer_related_applications: false,
  }
}
