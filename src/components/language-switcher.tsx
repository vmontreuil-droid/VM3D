'use client'

import { useT } from '@/i18n/context'

const flags: Record<string, string> = {
  nl: '🇳🇱',
  fr: '🇫🇷',
  en: '🇬🇧',
}

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useT()

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Object.entries(flags).map(([code, flag]) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={`rounded px-1.5 py-1 text-base leading-none transition ${
            code === locale
              ? 'bg-white/10 scale-110'
              : 'opacity-40 hover:opacity-90 hover:bg-white/5'
          }`}
          title={code.toUpperCase()}
        >
          {flag}
        </button>
      ))}
    </div>
  )
}
