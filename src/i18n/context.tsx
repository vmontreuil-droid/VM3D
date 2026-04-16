'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Dictionary } from './nl'

type Ctx = { locale: string; t: Dictionary; setLocale: (l: string) => void }

const LocaleContext = createContext<Ctx | null>(null)

export function LocaleProvider({
  locale,
  dictionary,
  children,
}: {
  locale: string
  dictionary: Dictionary
  children: ReactNode
}) {
  const setLocale = (newLocale: string) => {
    document.cookie = `locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`
    window.location.reload()
  }

  return (
    <LocaleContext.Provider value={{ locale, t: dictionary, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useT() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useT must be used within LocaleProvider')
  return ctx
}
