import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const typeParam = searchParams.get('type')
  const explicitNext = searchParams.get('next')
  const next =
    explicitNext ??
    (typeParam === 'invite' || typeParam === 'signup'
      ? '/welkom'
      : typeParam === 'recovery'
        ? '/reset-password'
        : '/dashboard')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If code exchange fails, check for token_hash (older flow)
  const tokenHash = searchParams.get('token_hash')
  const type = typeParam

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'recovery' | 'email' | 'signup' | 'invite',
    })

    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      if (type === 'invite' || type === 'signup') {
        return NextResponse.redirect(`${origin}/welkom`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Fallback: redirect to a branded error page
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
