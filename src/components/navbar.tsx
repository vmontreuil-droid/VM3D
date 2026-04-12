'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  isAdmin?: boolean
}

export default function Navbar({ isAdmin = false }: Props) {
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
            <svg width="140" height="40" viewBox="0 0 280 100" className="h-10 w-auto">
              {/* Orange squares */}
              <rect x="10" y="10" width="18" height="18" rx="4" fill="#f28c3a" />
              <rect x="35" y="10" width="18" height="18" rx="4" fill="#f28c3a" />
              <rect x="10" y="35" width="18" height="18" rx="4" fill="#f28c3a" />
              <rect x="35" y="35" width="18" height="18" rx="4" fill="#f28c3a" />
              
              {/* MV3D text */}
              <text x="70" y="62" fontFamily="system-ui, -apple-system" fontSize="48" fontWeight="900" fill="white">MV</text>
              <text x="185" y="62" fontFamily="system-ui, -apple-system" fontSize="48" fontWeight="900" fill="#f28c3a">3</text>
              <text x="220" y="62" fontFamily="system-ui, -apple-system" fontSize="48" fontWeight="700" fill="white">D</text>
            </svg>
          </Link>

          <nav className="hidden items-center gap-1.5 md:flex">
            <Link href="/" className={linkClass('/')}>
              Home
            </Link>

            <Link href="/dashboard" className={linkClass('/dashboard')}>
              Dashboard
            </Link>

            {isAdmin && (
              <Link href="/admin" className={linkClass('/admin')}>
                Admin
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
            Uitloggen
          </button>
        </div>
      </div>
    </header>
  )
}