import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AniVerse',
    short_name: 'AniVerse',
    description: 'Track and discover your favorite anime',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0F',
    theme_color: '#6C63FF',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
