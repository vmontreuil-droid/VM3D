'use client'

import { useState } from 'react'
import Logo from '@/components/logo'

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

// Direct APK download link van F-Droid (geen zoeken nodig)
const TERMUX_APK = 'https://f-droid.org/repo/com.termux_1000.apk'
const TERMUX_BOOT_APK = 'https://f-droid.org/repo/com.termux.boot_7.apk'

export default function SetupClient({ machine }: Props) {
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const installCmd = `yes | pkg upgrade -y && pkg i curl jq -y && curl -s ${origin}/api/machines/install?code=${machine.connection_code}|bash`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCmd)
    } catch {
      // Clipboard API niet beschikbaar op HTTP — fallback
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
    setStep(3)
    setTimeout(() => setCopied(false), 5000)
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex flex-col">
      {/* Header */}
      <div className="bg-[#111827] border-b border-white/10 px-5 py-4">
        <Logo size="sm" variant="dark" />
        <h1 className="text-lg font-bold mt-1">{machine.brand} {machine.model}</h1>
        <p className="text-sm text-white/50 mt-0.5">
          {machine.name} • {machine.guidance_system || 'GPS'} sync instellen
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 px-5 py-6 space-y-4">

        {/* Step 1 — Download Termux */}
        <div
          className={`rounded-2xl border p-5 transition-all ${
            step === 1
              ? 'border-blue-500/50 bg-blue-500/5'
              : 'border-emerald-500/30 bg-emerald-500/5'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              step > 1 ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-base">Termux downloaden</h2>
              {step === 1 ? (
                <div className="mt-3 space-y-2">
                  <a
                    href={TERMUX_APK}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-500 py-4 text-center text-base font-bold text-white active:bg-blue-600"
                    onClick={() => setTimeout(() => setStep(2), 1500)}
                  >
                    ⬇️ Download Termux APK
                  </a>
                  <p className="text-[11px] text-white/40 text-center mt-1">
                    Tik &quot;Toch installeren&quot; bij waarschuwing
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    className="block w-full rounded-xl bg-white/10 py-3 text-center text-sm font-semibold text-white/50 active:bg-white/20 mt-1"
                  >
                    Al geïnstalleerd →
                  </button>
                </div>
              ) : (
                <p className="text-sm text-emerald-400 mt-1">✓ Termux geïnstalleerd</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 2 — Kopieer commando */}
        <div
          className={`rounded-2xl border p-5 transition-all ${
            step === 2
              ? 'border-emerald-500/50 bg-emerald-500/5 ring-2 ring-emerald-500/20'
              : step > 2
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-white/10 bg-white/5 opacity-40'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              step > 2 ? 'bg-emerald-500 text-white' : step === 2 ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white/50'
            }`}>
              {step > 2 ? '✓' : '2'}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-base">Commando kopiëren</h2>
              {step === 2 && (
                <button
                  onClick={handleCopy}
                  className="mt-3 block w-full rounded-xl bg-emerald-500 py-4 text-center text-base font-bold text-white active:bg-emerald-600"
                >
                  {copied ? '✓ Gekopieerd!' : '📋 Tik hier om te kopiëren'}
                </button>
              )}
              {step > 2 && (
                <p className="text-sm text-emerald-400 mt-1">✓ Gekopieerd</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 3 — Plak in Termux */}
        <div
          className={`rounded-2xl border p-5 transition-all ${
            step === 3
              ? 'border-emerald-500/50 bg-emerald-500/5 ring-2 ring-emerald-500/20'
              : 'border-white/10 bg-white/5 opacity-40'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              step === 3 ? 'bg-emerald-500 text-white animate-pulse' : 'bg-white/20 text-white/50'
            }`}>
              3
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-base">Plak in Termux</h2>
              {step === 3 && (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl bg-black/60 border border-white/10 p-4 space-y-3">
                    <p className="text-base text-white/80 leading-relaxed">
                      <span className="text-emerald-400 font-bold">1.</span> Open <span className="font-bold text-white">Termux</span>
                    </p>
                    <p className="text-base text-white/80 leading-relaxed">
                      <span className="text-emerald-400 font-bold">2.</span> <span className="font-bold text-white">Lang indrukken</span> op scherm
                    </p>
                    <p className="text-base text-white/80 leading-relaxed">
                      <span className="text-emerald-400 font-bold">3.</span> Tik <span className="font-bold text-white">Paste</span>
                    </p>
                    <p className="text-base text-white/80 leading-relaxed">
                      <span className="text-emerald-400 font-bold">4.</span> Druk <span className="inline-block rounded bg-white/20 px-3 py-1 text-sm font-bold text-white">Enter ↵</span>
                    </p>
                  </div>
                  <p className="text-base text-emerald-400 font-bold text-center">
                    Daarna gaat alles automatisch! ✅
                  </p>
                  <button
                    onClick={handleCopy}
                    className="block w-full rounded-xl bg-white/10 py-3 text-center text-sm font-semibold text-white/50 active:bg-white/20"
                  >
                    Opnieuw kopiëren
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-5 py-3 text-center">
        <p className="text-[10px] text-white/30">
          {machine.connection_code}
        </p>
      </div>
    </div>
  )
}
