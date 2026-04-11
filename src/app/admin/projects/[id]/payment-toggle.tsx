'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  projectId: number | string
  isPaid: boolean
}

export default function PaymentToggle({ projectId, isPaid }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [paid, setPaid] = useState(!!isPaid)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleToggle = async () => {
    setSaving(true)
    setMessage('')

    const nextValue = !paid

    const { error } = await supabase
      .from('projects')
      .update({ is_paid: nextValue })
      .eq('id', projectId)

    setSaving(false)

    if (error) {
      setMessage('Betaalstatus wijzigen mislukt.')
      return
    }

    setPaid(nextValue)
    setMessage(nextValue ? 'Project staat nu op betaald.' : 'Project staat nu op onbetaald.')
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
        Betaalstatus
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-main)]">
            {paid ? 'Betaald' : 'Nog niet betaald'}
          </p>
          <p className="mt-1 text-xs text-[var(--text-soft)]">
            Zet dit project manueel op betaald of onbetaald.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
          className={`inline-flex h-[40px] min-w-[120px] items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:opacity-60 ${
            paid
              ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              : 'border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[#2a3745]'
          }`}
        >
          {saving ? 'Bezig...' : paid ? 'Markeer onbetaald' : 'Markeer betaald'}
        </button>
      </div>

      {message ? (
        <p className="mt-3 text-sm text-[var(--text-soft)]">{message}</p>
      ) : null}
    </div>
  )
}