'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-card-2)]"
    >
      <LogOut className="h-4 w-4" />
      Uitloggen
    </button>
  )
}