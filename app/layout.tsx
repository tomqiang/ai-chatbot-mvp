import type { Metadata, Viewport } from 'next'
import './globals.css'
import { IosStandaloneGuard } from '@/shared/ui/IosStandaloneGuard'

export const metadata: Metadata = {
  title: 'Moonshadow Chronicle',
  description: 'A Tolkien-like high fantasy storybook journal',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Moonshadow Chronicle',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <IosStandaloneGuard />
        {children}
      </body>
    </html>
  )
}
