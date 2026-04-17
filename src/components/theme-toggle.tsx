'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useT } from '@/i18n/context'

const THEME_KEY = 'theme'

export default function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useT()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as 'dark' | 'light' | null
    const initial = saved || 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem(THEME_KEY, next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={collapsed ? (theme === 'dark' ? t.platform.light : t.platform.dark) : undefined}
      className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--text-soft)] transition hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
    >
      <span className="shrink-0">
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </span>
      {!collapsed && (
        <span>{theme === 'dark' ? t.platform.light : t.platform.dark}</span>
      )}
    </button>
  )
}
