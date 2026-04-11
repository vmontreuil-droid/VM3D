'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { LogIn, UserPlus, Loader } from 'lucide-react'

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setMessage('')

    if (!email || !password) {
      setMessage('Vul e-mail en wachtwoord in.')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setMessage(error.message)
        return
      }

      setMessage('Succesvol ingelogd, even doorsturen...')

      // 🔑 Belangrijk voor iPhone / Safari
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 500)
    } catch (err) {
      console.error('Login error:', err)
      setMessage('Er liep iets fout bij het inloggen.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    setMessage('')

    if (!email || !password) {
      setMessage('Vul e-mail en wachtwoord in.')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (error) {
        setMessage(error.message)
        return
      }

      setMessage('Account aangemaakt. Je kan nu inloggen.')
    } catch (err) {
      console.error('Signup error:', err)
      setMessage('Er liep iets fout bij het aanmaken van je account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-white">
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
              VM3D Cloud
            </p>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">Welkom terug</h1>
            <p className="mt-3 text-sm text-[var(--text-soft)]">
              Log in om je projecten, bestanden en opleveringen te bekijken.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)]/80 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-soft)]">
                  E-mail
                </label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="naam@bedrijf.be"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-soft)]">
                  Wachtwoord
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Je wachtwoord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white shadow-lg shadow-[var(--accent)]/20 transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {loading ? 'Bezig...' : 'Inloggen'}
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {loading ? 'Bezig...' : 'Account aanmaken'}
              </button>

              {message && (
                <p className="rounded-xl bg-[var(--bg-card-2)] px-4 py-3 text-sm text-[var(--text-soft)]">
                  {message}
                </p>
              )}
            </form>

            <div className="mt-6 border-t border-[var(--border-soft)] pt-4 text-center">
              <Link
                href="/"
                className="text-sm font-medium text-orange-400 hover:text-orange-300"
              >
                ← Terug naar home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}