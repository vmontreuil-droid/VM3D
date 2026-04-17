'use client'

import { useT } from '@/i18n/context'
import { COOKIE_NAME } from '@/i18n/config'

const flags: Record<string, string> = {
  nl: '🇳🇱',
  fr: '🇫🇷',
  en: '🇬🇧',
}

export default function LanguageSwitcher({ className = '', collapsed = false }: { className?: string; collapsed?: boolean }) {
  const { locale, setLocale } = useT()

  function handleSwitch(code: string) {
    document.cookie = `${COOKIE_NAME}=${code};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
    setLocale(code)
    window.location.reload()
  }

  if (collapsed) {
    return (
      <div className={`flex flex-col items-center gap-0.5 ${className}`}>
        {Object.entries(flags).map(([code, flag]) => (
          <button
            key={code}
            onClick={() => handleSwitch(code)}
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

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Object.entries(flags).map(([code, flag]) => (
        <button
          key={code}
          onClick={() => handleSwitch(code)}
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
