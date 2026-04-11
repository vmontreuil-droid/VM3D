'use client'

import { Loader2, Power, PowerOff, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type Props = {
  customerId: string
  customerName: string
  currentActive?: boolean | null
  redirectTo?: string
  compact?: boolean
}

export default function AdminCustomerActions({
  customerId,
  customerName,
  currentActive = true,
  redirectTo,
  compact = false,
}: Props) {
  const router = useRouter()
  const [isActive, setIsActive] = useState(currentActive !== false)
  const [loadingAction, setLoadingAction] = useState<'toggle' | 'delete' | null>(null)
  const [message, setMessage] = useState('')

  const toggleLabel = useMemo(
    () => (isActive ? 'Zet inactief' : 'Zet actief'),
    [isActive]
  )

  async function handleToggle() {
    setLoadingAction('toggle')
    setMessage('')

    const nextActive = !isActive

    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: nextActive }),
      })

      const data = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null

      if (!response.ok) {
        setMessage(data?.error || 'Status wijzigen mislukt.')
        return
      }

      setIsActive(nextActive)
      setMessage(data?.message || (nextActive ? 'Klant geactiveerd.' : 'Klant gedeactiveerd.'))
      router.refresh()
    } catch {
      setMessage('Status wijzigen mislukt.')
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Ben je zeker dat je klant "${customerName}" wilt verwijderen? Dit verwijdert ook gekoppelde werven en bestanden.`
    )

    if (!confirmed) return

    setLoadingAction('delete')
    setMessage('')

    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      })

      const data = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null

      if (!response.ok) {
        setMessage(data?.error || 'Klant verwijderen mislukt.')
        return
      }

      if (redirectTo) {
        router.push(redirectTo)
      }

      router.refresh()
    } catch {
      setMessage('Klant verwijderen mislukt.')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2.5'}>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={handleToggle}
          disabled={loadingAction !== null}
          className={`group relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-lg border px-2.5 text-[10px] font-semibold transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${
            isActive
              ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/45 hover:bg-emerald-500/15'
              : 'border-amber-400/25 bg-amber-500/10 text-amber-100 hover:border-amber-400/45 hover:bg-amber-500/15'
          }`}
        >
          <span className={`flex h-5 w-5 items-center justify-center rounded-md ${
            isActive ? 'bg-emerald-500/12' : 'bg-amber-500/12'
          }`}>
            {loadingAction === 'toggle' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isActive ? (
              <PowerOff className="h-3 w-3" />
            ) : (
              <Power className="h-3 w-3" />
            )}
          </span>
          <span className="pr-1">{loadingAction === 'toggle' ? 'Opslaan...' : toggleLabel}</span>
          <span className={`absolute right-0 top-0 h-full w-[2px] rounded-l-full ${
            isActive ? 'bg-emerald-400/80' : 'bg-amber-400/80'
          }`} />
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={loadingAction !== null}
          className="group relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 text-[10px] font-semibold text-red-200 transition hover:-translate-y-px hover:border-red-400/45 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-red-500/12">
            {loadingAction === 'delete' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </span>
          <span className="pr-1">{loadingAction === 'delete' ? 'Verwijderen...' : 'Verwijder klant'}</span>
          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-red-400/80" />
        </button>
      </div>

      {!compact && message ? (
        <p className="text-xs text-[var(--text-soft)]">{message}</p>
      ) : null}
    </div>
  )
}
