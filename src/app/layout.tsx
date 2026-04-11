import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VM3D Cloud',
  description: 'Platform voor projecten, bestanden en opleveringen',
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