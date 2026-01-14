import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Moonshadow Chronicle',
    short_name: 'Moonshadow',
    description: 'A Tolkien-like high fantasy storybook journal',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f3f0',
    theme_color: '#2c3e50',
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
