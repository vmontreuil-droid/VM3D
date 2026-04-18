'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/logo'
import TopoBackground from '@/components/topo-background'
import { Lock, CheckCircle, Eye, EyeOff, Sparkles, ShieldCheck, MapPin, Construction } from 'lucide-react'

type Copy = {
  eyebrow: string
  title: (name: string) => string
  subtitle: string
  steps: { icon: 'shield' | 'sparkles' | 'pin' | 'machine'; title: string; body: string }[]
  passwordLabel: string
  passwordPlaceholder: string
  confirmLabel: string
  confirmPlaceholder: string
  submit: string
  submitting: string
  success: string
  redirect: string
  minLength: string
  mismatch: string
  noSession: string
  footerLogin: string
}

const COPY_NL: Copy = {
  eyebrow: 'Welkom bij MV3D.cloud',
  title: (name) => (name ? `Welkom, ${name}` : 'Welkom bij MV3D.cloud'),
  subtitle:
    'Je klantaccount is aangemaakt. Kies hieronder een persoonlijk wachtwoord om je portaal te activeren.',
  steps: [
    { icon: 'shield', title: 'Veilig starten', body: 'Minstens 8 tekens. Je wachtwoord is alleen van jou.' },
    { icon: 'sparkles', title: 'Jouw projecten', body: 'Werven, offertes, facturen en tickets op één plek.' },
    { icon: 'machine', title: 'Jouw machines', body: 'Live status, GPS en werfkoppeling van al je machines.' },
    { icon: 'pin', title: 'Altijd bereikbaar', body: 'Toegang via mv3d.cloud, op desktop, tablet en gsm.' },
  ],
  passwordLabel: 'Nieuw wachtwoord',
  passwordPlaceholder: 'Minstens 8 tekens',
  confirmLabel: 'Bevestig wachtwoord',
  confirmPlaceholder: 'Herhaal je wachtwoord',
  submit: 'Wachtwoord instellen',
  submitting: 'Even geduld…',
  success: 'Alles klaar! We brengen je naar je portaal.',
  redirect: 'Doorsturen naar je dashboard…',
  minLength: 'Het wachtwoord moet minstens 8 tekens bevatten.',
  mismatch: 'De wachtwoorden komen niet overeen.',
  noSession:
    'Deze uitnodigingslink is verlopen of ongeldig. Vraag je beheerder om een nieuwe link te sturen.',
  footerLogin: 'Terug naar login',
}

const COPY_FR: Copy = {
  eyebrow: 'Bienvenue sur MV3D.cloud',
  title: (name) => (name ? `Bienvenue, ${name}` : 'Bienvenue sur MV3D.cloud'),
  subtitle:
    'Votre compte client est prêt. Choisissez ci-dessous un mot de passe personnel pour activer votre portail.',
  steps: [
    { icon: 'shield', title: 'Démarrage sécurisé', body: 'Minimum 8 caractères. Votre mot de passe reste privé.' },
    { icon: 'sparkles', title: 'Vos projets', body: 'Chantiers, devis, factures et tickets au même endroit.' },
    { icon: 'machine', title: 'Vos machines', body: 'Statut en direct, GPS et liaison chantier pour chaque machine.' },
    { icon: 'pin', title: 'Toujours accessible', body: 'Accès via mv3d.cloud, sur ordinateur, tablette et mobile.' },
  ],
  passwordLabel: 'Nouveau mot de passe',
  passwordPlaceholder: 'Au moins 8 caractères',
  confirmLabel: 'Confirmez le mot de passe',
  confirmPlaceholder: 'Répétez votre mot de passe',
  submit: 'Définir le mot de passe',
  submitting: 'Un instant…',
  success: 'C\'est fait ! Direction votre portail.',
  redirect: 'Redirection vers votre tableau de bord…',
  minLength: 'Le mot de passe doit contenir au moins 8 caractères.',
  mismatch: 'Les mots de passe ne correspondent pas.',
  noSession:
    'Ce lien d\'invitation a expiré ou n\'est plus valide. Demandez un nouveau lien à votre administrateur.',
  footerLogin: 'Retour à la connexion',
}

export default function WelkomPage() {
  const supabase = useMemo(() => createClient(), [])
  const [copy, setCopy] = useState<Copy>(COPY_NL)
  const [displayName, setDisplayName] = useState<string>('')
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        if (active) {
          setHasSession(false)
        }
        return
      }

      const meta = user.user_metadata || {}
      const name =
        meta.full_name ||
        meta.first_name ||
        meta.company_name ||
        (typeof user.email === 'string' ? user.email.split('@')[0] : '')
      if (active) {
        setHasSession(true)
        setDisplayName(name || '')
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('language, full_name, company_name')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return
      if (profile) {
        const lang = (profile.language || '').toLowerCase()
        if (lang === 'fr' || lang === 'fra' || lang === 'french') {
          setCopy(COPY_FR)
        }
        const prettyName = profile.full_name || profile.company_name || name
        if (prettyName) setDisplayName(prettyName)
      }
    })()
    return () => {
      active = false
    }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!password || password.length < 8) {
      setError(copy.minLength)
      return
    }
    if (password !== passwordConfirm) {
      setError(copy.mismatch)
      return
    }

    try {
      setLoading(true)
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      setDone(true)
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1600)
    } catch (err) {
      console.error('Welkom error:', err)
      setError('Er ging iets mis. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  const iconFor = (key: 'shield' | 'sparkles' | 'pin' | 'machine') => {
    if (key === 'shield') return <ShieldCheck className="h-4 w-4 text-emerald-400" />
    if (key === 'sparkles') return <Sparkles className="h-4 w-4 text-[var(--accent)]" />
    if (key === 'machine') return <Construction className="h-4 w-4 text-amber-400" />
    return <MapPin className="h-4 w-4 text-sky-400" />
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg-main)] px-4 py-8">
      <TopoBackground />
      <div className="relative z-10 grid w-full max-w-5xl gap-5 md:grid-cols-[1.1fr_1fr]">
        {/* Left: welcome panel */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-6 py-6">
            <div className="absolute inset-0 opacity-40">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.22),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_35%)]" />
            </div>
            <div className="relative">
              <Logo size="lg" variant="dark" />
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                {copy.eyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                {copy.title(displayName)}
              </h1>
              <p className="mt-2 max-w-md text-sm text-[var(--text-soft)]">{copy.subtitle}</p>
            </div>
          </div>
          <div className="space-y-3 px-6 py-5">
            {copy.steps.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]/60 px-3 py-2.5"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card)]">
                  {iconFor(s.icon)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-main)]">{s.title}</p>
                  <p className="text-xs text-[var(--text-soft)]">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-6 py-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%)]" />
            </div>
            <div className="relative flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/12">
                <Lock className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  Setup
                </p>
                <h2 className="text-base font-semibold text-[var(--text-main)]">
                  {copy.passwordLabel}
                </h2>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            {hasSession === false ? (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {copy.noSession}
                <div className="mt-3">
                  <Link
                    href="/login"
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/50"
                  >
                    {copy.footerLogin}
                  </Link>
                </div>
              </div>
            ) : done ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/10">
                  <CheckCircle className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-300">{copy.success}</p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">{copy.redirect}</p>
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
                    {copy.passwordLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder={copy.passwordPlaceholder}
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
                    {copy.confirmLabel}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="passwordConfirm"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                    placeholder={copy.confirmPlaceholder}
                    className="input-dark h-10 w-full px-3 py-2 text-sm"
                  />
                </div>

                {password && passwordConfirm && password !== passwordConfirm && (
                  <p className="text-[11px] text-red-400">{copy.mismatch}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-sm font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80 disabled:pointer-events-none disabled:opacity-60"
                >
                  <Lock className="h-4 w-4 text-[var(--accent)]" />
                  {loading ? copy.submitting : copy.submit}
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
