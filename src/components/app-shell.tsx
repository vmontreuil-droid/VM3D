'use client'

import { useEffect, useState } from 'react'
import Sidebar from './sidebar'

type Props = {
  children: React.ReactNode
  isAdmin?: boolean
}

export default function AppShell({ children, isAdmin = false }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
      }
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
          <Sidebar
            isAdmin={isAdmin}
            collapsed={collapsed}
            onToggle={() => setCollapsed((prev) => !prev)}
          />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Sluit navigatie"
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />

            <div className="absolute inset-y-0 left-0 max-w-[86vw]">
              <div className="h-full shadow-2xl">
                <Sidebar
                  isAdmin={isAdmin}
                  collapsed={false}
                  mobile
                  onCloseMobile={() => setMobileOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 border-b border-[var(--border-soft)] bg-[var(--bg-card)]/95 backdrop-blur lg:hidden">
            <div className="px-3 py-3 sm:px-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-[var(--text-main)] transition hover:bg-[#223246]"
                  aria-label="Open navigatie"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4.5 w-4.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>

                <div className="min-w-0 flex-1 text-center">
                  <p className="truncate text-sm font-semibold tracking-wide text-[var(--text-main)]">
                    VM3D
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                    {isAdmin ? 'ADMIN CLOUD' : 'CLIENT CLOUD'}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-xs font-bold text-[var(--text-main)]">
                  {isAdmin ? 'AD' : 'KP'}
                </div>
              </div>
            </div>
          </div>

          <div className="px-2.5 py-2.5 sm:px-4 sm:py-4 lg:px-4 lg:py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}