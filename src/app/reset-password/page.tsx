'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/logo'
import TopoBackground from '@/components/topo-background'
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), [])
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!password || password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens bevatten.')
      return
    }

    if (password !== passwordConfirm) {
      setError('Wachtwoorden komen niet overeen.')
      return
    }

    try {
      setLoading(true)
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setDone(true)
      setMessage('Wachtwoord succesvol gewijzigd! U wordt doorgestuurd...')

      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Er liep iets fout. Probeer het later opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg-main)] px-4">
      <TopoBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-6 py-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%)]" />
            </div>
            <div className="relative">
              <Logo size="lg" variant="dark" />
              <h1 className="mt-3 text-xl font-semibold text-[var(--text-main)]">
                Wachtwoord instellen
              </h1>
              <p className="mt-1.5 text-sm text-[var(--text-soft)]">
                Kies een nieuw wachtwoord voor uw account.
              </p>
            </div>
          </div>

          <div className="px-6 py-5">
            {done ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/10">
                  <CheckCircle className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-300">{message}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <div className="grid gap-1.5">
                  <label htmlFor="password" className="text-[11px] font-medium text-[var(--text-soft)]">
                    Nieuw wachtwoord *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min. 8 tekens"
                      className="input-dark h-10 w-full px-3 py-2 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-soft)] transition"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="passwordConfirm" className="text-[11px] font-medium text-[var(--text-soft)]">
                    Bevestig wachtwoord *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="passwordConfirm"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Herhaal wachtwoord"
                    className="input-dark h-10 w-full px-3 py-2 text-sm"
                  />
                </div>

                {password && passwordConfirm && password !== passwordConfirm && (
                  <p className="text-[11px] text-red-400">Wachtwoorden komen niet overeen.</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-sm font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80 disabled:pointer-events-none disabled:opacity-60"
                >
                  <Lock className="h-4 w-4 text-[var(--accent)]" />
                  {loading ? 'Opslaan...' : 'Wachtwoord opslaan'}
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
