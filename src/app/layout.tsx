import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MV3D.CLOUD',
  description: 'Beheer al je werven, bestanden en machines met MV3D.CLOUD',
  icons: {
    icon: '/mv3d-logo.svg',
    shortcut: '/mv3d-logo.svg',
    apple: '/mv3d-logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}