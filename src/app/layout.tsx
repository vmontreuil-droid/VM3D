import './globals.css'
import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { locales, defaultLocale, COOKIE_NAME, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { LocaleProvider } from '@/i18n/context'

function pickLocaleFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null
  // Header format: "fr-FR,fr;q=0.9,en;q=0.8,nl;q=0.7"
  const parts = header.split(',').map(p => {
    const [tag, q] = p.trim().split(';q=')
    return { tag: tag.trim().toLowerCase(), q: q ? Number(q) : 1 }
  }).sort((a, b) => b.q - a.q)
  for (const { tag } of parts) {
    const primary = tag.split('-')[0]
    if ((locales as readonly string[]).includes(primary)) return primary as Locale
  }
  return null
}

async function getLocaleForRequest(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieRaw = cookieStore.get(COOKIE_NAME)?.value
  if (cookieRaw && (locales as readonly string[]).includes(cookieRaw)) {
    return cookieRaw as Locale
  }
  const headerStore = await headers()
  const detected = pickLocaleFromAcceptLanguage(headerStore.get('accept-language'))
  return detected ?? defaultLocale
}

function getLocaleFromCookies(cookieStore: Awaited<ReturnType<typeof cookies>>): Locale {
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? defaultLocale
  return (locales as readonly string[]).includes(raw)
    ? (raw as Locale)
    : defaultLocale
}

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const locale = getLocaleFromCookies(cookieStore)
  const t = getDictionary(locale)

  const baseUrl = 'https://mv3d.be'

  return {
    title: t.og.title,
    description: t.og.description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: 'website',
      locale: locale === 'nl' ? 'nl_BE' : locale === 'fr' ? 'fr_BE' : 'en_US',
      url: baseUrl,
      siteName: 'MV3D Cloud',
      title: t.og.title,
      description: t.og.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: t.og.title,
      description: t.og.description,
    },
    icons: {
      icon: '/icon.svg',
    },
    other: {
      'theme-color': '#08111d',
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocaleForRequest()
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