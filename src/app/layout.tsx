import './globals.css'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { locales, defaultLocale, COOKIE_NAME, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { LocaleProvider } from '@/i18n/context'

export const metadata: Metadata = {
  title: 'MV3D.CLOUD',
  description: 'Beheer al je werven, bestanden en machines met MV3D.CLOUD',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? defaultLocale
  const locale: Locale = (locales as readonly string[]).includes(raw)
    ? (raw as Locale)
    : defaultLocale
  const dictionary = getDictionary(locale)

  return (
    <html lang={locale}>
      <body>
        <LocaleProvider locale={locale} dictionary={dictionary}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  )
}