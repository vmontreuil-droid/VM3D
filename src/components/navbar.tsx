'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/logo'
import { useT } from '@/i18n/context'

type Props = {
  isAdmin?: boolean
}

export default function Navbar({ isAdmin = false }: Props) {
  const { t } = useT()
  const pathname = usePathname()
  const router = useRouter()

  const supabase = createClient()

  const isActive = (href: string) => pathname === href

  const linkClass = (href: string) =>
    `rounded-md px-3 py-1.5 text-xs font-medium transition ${
      isActive(href)
        ? 'bg-[var(--bg-card-2)] text-[var(--text-main)] border border-[var(--border-soft)]'
        : 'text-[var(--text-soft)] hover:bg-[var(--bg-card-2)] hover:text-[var(--text-main)]'
    }`

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-soft)] bg-[var(--bg-main)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        
        {/* LEFT */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition"
          >
            <Logo size="md" variant="dark" />
          </Link>

          <nav className="hidden items-center gap-1.5 md:flex">
            <Link href="/" className={linkClass('/')}>
              {t.platform.home}
            </Link>

            <Link href="/dashboard" className={linkClass('/dashboard')}>
              {t.platform.dashboard}
            </Link>

            {isAdmin && (
              <Link href="/admin" className={linkClass('/admin')}>
                {t.platform.admin}
              </Link>
            )}
          </nav>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] transition hover:bg-[#223246]"
          >
            {t.platform.logout}
          </button>
        </div>
      </div>
    </header>
  )
}