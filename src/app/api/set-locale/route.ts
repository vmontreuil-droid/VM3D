import { NextRequest, NextResponse } from 'next/server'
import { locales, COOKIE_NAME, type Locale } from '@/i18n/config'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const lang = searchParams.get('lang')?.toLowerCase() ?? ''
  const redirectTo = searchParams.get('redirect') ?? '/login'

  const safe: Locale = (locales as readonly string[]).includes(lang)
    ? (lang as Locale)
    : 'nl'

  const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/login'

  const res = NextResponse.redirect(new URL(safeRedirect, origin))
  res.cookies.set(COOKIE_NAME, safe, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return res
}
