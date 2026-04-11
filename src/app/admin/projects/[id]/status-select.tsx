'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  projectId: number | string
  currentStatus: string
}

const STATUS_OPTIONS = [
  { value: 'ingediend', label: 'Ingediend' },
  { value: 'in_behandeling', label: 'In behandeling' },
  { value: 'klaar_voor_betaling', label: 'Klaar voor betaling' },
  { value: 'afgerond', label: 'Afgerond' },
]

export default function StatusSelect({ projectId, currentStatus }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [status, setStatus] = useState(currentStatus || 'ingediend')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', projectId)

    setSaving(false)

    if (error) {
      setMessage('Status opslaan mislukt.')
      return
    }

    setMessage('Status bijgewerkt.')
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
        Status aanpassen
      </p>

      <div className="mt-3 flex flex-col gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input-dark w-full px-4 py-3 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-[40px] items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Opslaan...' : 'Status opslaan'}
        </button>

        {message ? (
          <p className="text-sm text-[var(--text-soft)]">{message}</p>
        ) : null}
      </div>
    </div>
  )
}