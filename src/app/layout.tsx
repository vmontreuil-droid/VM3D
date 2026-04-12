import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MV3D Cloud',
  description: 'Platform voor werven, bestanden en opleveringen',
  icons: {
    icon: '/mv3d-favicon.svg',
    shortcut: '/mv3d-favicon.svg',
    apple: '/mv3d-favicon.svg',
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