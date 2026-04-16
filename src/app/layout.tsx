import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MV3D.CLOUD',
  description: 'Beheer al je werven, bestanden en machines met MV3D.CLOUD',
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