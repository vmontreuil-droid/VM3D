'use client'

import { useState } from 'react'
import { Download, Copy, Check, Smartphone, Monitor, Sparkles, Lock } from 'lucide-react'
import Logo from '@/components/logo'
import ThemeToggle from '@/components/theme-toggle'
import LanguageSwitcher from '@/components/language-switcher'
import { useT } from '@/i18n/context'

interface Props {
  machine: {
    id: number
    name: string
    brand: string
    model: string
    guidance_system: string | null
    connection_code: string
  }
}

const TERMUX_APK = 'https://f-droid.org/repo/com.termux_1000.apk'
const DROIDVNC_PLAYSTORE = 'https://play.google.com/store/apps/details?id=net.christianbeier.droidvnc_ng'

export default function SetupClient({ machine }: Props) {
  const { t } = useT()
  const tt = t.machineSetup
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const installCmd = `yes | pkg upgrade -y && pkg i curl jq -y && curl -s ${origin}/api/machines/install?code=${machine.connection_code}|bash`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCmd)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = installCmd
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setStep(s => Math.max(s, 3))
    setTimeout(() => setCopied(false), 5000)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* Decoratieve gradient achtergrond */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-60">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(245,140,55,0.18),transparent_45%),radial-gradient(circle_at_top_left,rgba(245,140,55,0.10),transparent_40%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[var(--border-soft)] bg-[var(--bg-card)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Logo size="sm" variant="adaptive" showText />
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="shrink-0" />
            <div className="h-4 w-px bg-[var(--border-soft)]" />
            <div className="shrink-0">
              <ThemeToggle collapsed />
            </div>
          </div>
        </div>
      </header>

      {/* Hero — machine info */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 pt-6 sm:px-6 sm:pt-10">
        <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-5 py-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_55%)]" />
            </div>
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  {tt.gpsSyncSetup.replace('{system}', machine.guidance_system || 'GPS')}
                </p>
                <h1 className="mt-1 text-xl font-semibold leading-tight text-[var(--text-main)] sm:text-2xl">
                  {machine.brand} {machine.model}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-soft)]">
                  {machine.name}
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] px-2.5 py-1 text-[11px] text-[var(--text-soft)]">
                  <Lock className="h-3 w-3 text-[var(--accent)]" />
                  <span className="font-mono font-semibold text-[var(--text-main)]">{machine.connection_code}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <main className="relative z-10 mx-auto max-w-3xl space-y-3 px-4 py-6 sm:space-y-4 sm:px-6 sm:py-8">
        {/* Step 1 — Termux */}
        <StepCard
          n={1}
          title={tt.downloadTermux}
          done={step > 1}
          active={step === 1}
        >
          {step === 1 ? (
            <div className="space-y-2">
              <a
                href={TERMUX_APK}
                onClick={() => setTimeout(() => setStep(2), 1500)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:opacity-95"
              >
                <Download className="h-4 w-4" />
                {tt.downloadApk.replace('⬇️ ', '')}
              </a>
              <p className="text-center text-[11px] text-[var(--text-muted)]">
                {tt.installWarning}
              </p>
              <button
                onClick={() => setStep(2)}
                className="block w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] py-2.5 text-center text-xs font-medium text-[var(--text-soft)] transition hover:bg-[var(--bg-card)] active:scale-[0.98]"
              >
                {tt.alreadyInstalled}
              </button>
            </div>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              {tt.termuxInstalled}
            </p>
          )}
        </StepCard>

        {/* Step 2 — Kopieer */}
        <StepCard
          n={2}
          title={tt.copyCommand}
          done={step > 2}
          active={step === 2}
          locked={step < 2}
        >
          {step === 2 && (
            <button
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:opacity-95"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? tt.copied : tt.copyCta.replace('📋 ', '')}
            </button>
          )}
          {step > 2 && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              {tt.copiedShort}
            </p>
          )}
        </StepCard>

        {/* Step 3 — Plak */}
        <StepCard
          n={3}
          title={tt.pasteInTermux}
          done={step > 3}
          active={step === 3}
          locked={step < 3}
        >
          {step >= 3 && (
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
                <ol className="space-y-2.5 text-sm text-[var(--text-soft)]">
                  <PasteStep n={1}>
                    {tt.pasteStep1} <strong className="text-[var(--text-main)]">Termux</strong>
                  </PasteStep>
                  <PasteStep n={2}>
                    <strong className="text-[var(--text-main)]">{tt.pasteStep2Prefix}</strong> {tt.pasteStep2}
                  </PasteStep>
                  <PasteStep n={3}>
                    {tt.pasteStep3} <strong className="text-[var(--text-main)]">{tt.pasteStep3Value}</strong>
                  </PasteStep>
                  <PasteStep n={4}>
                    {tt.pasteStep4}{' '}
                    <kbd className="inline-block rounded border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-0.5 text-xs font-mono font-semibold text-[var(--text-main)]">
                      Enter ↵
                    </kbd>
                  </PasteStep>
                </ol>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2.5 text-xs font-semibold text-emerald-300">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                {tt.autoFinish}
              </div>
              <button
                onClick={() => { setStep(4); handleCopy() }}
                className="block w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] py-2.5 text-center text-xs font-medium text-[var(--text-soft)] transition hover:bg-[var(--bg-card)] active:scale-[0.98]"
              >
                {tt.copyAgain}
              </button>
            </div>
          )}
        </StepCard>

        {/* Step 4 — droidVNC-NG */}
        <StepCard
          n={4}
          title={tt.installVnc}
          done={false}
          active={step >= 3}
          locked={step < 3}
        >
          {step >= 3 ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-soft)]">{tt.installVncDesc}</p>

              {/* Grote Play Store CTA */}
              <a
                href={DROIDVNC_PLAYSTORE}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/25 active:scale-[0.98]"
              >
                <Monitor className="h-4 w-4" />
                {tt.installVncCta.replace('⬇️ ', '')}
              </a>

              {/* Banner met de waarschuwing dat dit op de tablet moet */}
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5">
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-xs font-semibold text-amber-300">
                  {tt.vncReminder}
                </p>
              </div>

              {/* Visueel sub-stappen-blok */}
              <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
                <SubStep n={1} title={tt.vncSubStep1Title} desc={tt.vncSubStep1Desc} />
                <SubStep n={2} title={tt.vncSubStep2Title} desc={tt.vncSubStep2Desc} />
                <SubStep
                  n={3}
                  title={tt.vncSubStep3Title}
                  desc={tt.vncSubStep3Desc}
                  highlight
                />
                <SubStep n={4} title={tt.vncSubStep4Title} desc={tt.vncSubStep4Desc} />
                <SubStep n={5} title={tt.vncSubStep5Title} desc={tt.vncSubStep5Desc} optional />
              </div>

              {/* Slot-banner */}
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3.5 py-2.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-xs font-semibold text-emerald-300">
                  {tt.installVncDone}
                </p>
              </div>
            </div>
          ) : null}
        </StepCard>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto max-w-3xl px-4 pb-8 pt-2 text-center sm:px-6">
        <Logo size="sm" variant="adaptive" showText={false} className="mx-auto opacity-50" />
        <p className="mt-2 text-[10px] text-[var(--text-muted)]">
          MV3D Cloud · {machine.connection_code}
        </p>
      </footer>
    </div>
  )
}

// --- Subcomponenten -------------------------------------------------------

function StepCard({
  n, title, done, active, locked = false, children,
}: {
  n: number
  title: string
  done: boolean
  active: boolean
  locked?: boolean
  children: React.ReactNode
}) {
  const stateClass = done
    ? 'border-emerald-500/30 bg-[var(--bg-card)]'
    : active
    ? 'border-[var(--accent)]/40 bg-[var(--bg-card)] shadow-[0_4px_20px_-8px_rgba(245,140,55,0.25)]'
    : 'border-[var(--border-soft)] bg-[var(--bg-card)]/60 opacity-60'

  const badgeClass = done
    ? 'bg-emerald-500 text-white'
    : active
    ? 'bg-[var(--accent)] text-white'
    : 'bg-[var(--bg-card-2)] text-[var(--text-muted)]'

  return (
    <section className={`overflow-hidden rounded-2xl border p-5 transition-all ${stateClass}`}>
      <div className="flex items-start gap-3.5">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${badgeClass}`}>
          {done ? <Check className="h-4 w-4" /> : locked ? <Lock className="h-3.5 w-3.5" /> : n}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-[var(--text-main)]">{title}</h2>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </section>
  )
}

function PasteStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[10px] font-bold text-[var(--accent)]">
        {n}
      </span>
      <span className="leading-5">{children}</span>
    </li>
  )
}

function SubStep({
  n, title, desc, highlight = false, optional = false,
}: {
  n: number
  title: string
  desc: string
  highlight?: boolean
  optional?: boolean
}) {
  return (
    <div className={`flex items-start gap-3 border-b border-[var(--border-soft)] px-4 py-3 last:border-b-0 ${optional ? 'opacity-70' : ''}`}>
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        highlight
          ? 'bg-emerald-500 text-white'
          : optional
          ? 'border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-muted)]'
          : 'bg-[var(--accent)]/15 text-[var(--accent)]'
      }`}>
        {n}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${highlight ? 'text-emerald-400' : 'text-[var(--text-main)]'}`}>
          {title}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-soft)]">
          {desc}
        </p>
      </div>
    </div>
  )
}
