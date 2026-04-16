'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Logo from '@/components/logo'
import { LogIn, UserPlus, Loader } from 'lucide-react'

export default function LoginPage() {
  const [rememberMe, setRememberMe] = useState(false);
  const supabase = useMemo(() => createClient(), [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleForgotPassword = async () => {
    setMessage('')
    if (!email) {
      setMessage('Vul eerst uw e-mailadres in.')
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Er is een e-mail verstuurd om uw wachtwoord te herstellen.')
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      setMessage('Er liep iets fout. Probeer het later opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setMessage('')

    if (!email || !password) {
      setMessage('Vul e-mail en wachtwoord in.')
      return
    }

    try {
      if (rememberMe && window && window.localStorage) {
        window.localStorage.setItem('rememberedEmail', email);
      } else if (window && window.localStorage) {
        window.localStorage.removeItem('rememberedEmail');
      }
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

  // Vul e-mailveld automatisch in als onthouden
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('rememberedEmail');
      if (saved) setEmail(saved);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-white">
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mb-5 flex justify-center">
              <Logo size="xl" variant="dark" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">Welkom terug</h1>
            <p className="mt-3 text-sm text-[var(--text-soft)]">
              Log in om je werven, bestanden en opleveringen te bekijken.
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

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-[var(--text-soft)] focus:ring-[var(--accent)]/20"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-[var(--text-soft)] select-none cursor-pointer">
                    Onthoud mij
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-[var(--accent)] hover:text-orange-300 transition"
                >
                  Wachtwoord vergeten?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
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
                className="btn-secondary w-full py-3"
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