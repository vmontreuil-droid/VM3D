'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getStatusLabel } from '@/lib/status'
import { FileText, Clock, CheckCircle, Check, Loader } from 'lucide-react'

type Props = {
  projectId: number
  currentStatus: string
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'ingediend':
      return <FileText className="h-4 w-4" />
    case 'in_behandeling':
      return <Clock className="h-4 w-4" />
    case 'klaar_voor_betaling':
      return <CheckCircle className="h-4 w-4" />
    case 'afgerond':
      return <Check className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export default function StatusSelect({ projectId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleChange = async (newStatus: string) => {
    setStatus(newStatus)
    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const updatePayload: Record<string, any> = {
      status: newStatus,
    }

    if (newStatus === 'in_behandeling') {
      updatePayload.in_progress_at = new Date().toISOString()
    }

    if (newStatus === 'klaar_voor_betaling') {
      updatePayload.ready_for_payment_at = new Date().toISOString()
    }

    if (newStatus === 'afgerond') {
      updatePayload.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId)

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Status bijgewerkt.')
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-soft)]">
        {getStatusIcon(currentStatus)}
        Status wijzigen
      </label>

      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="ingediend">{getStatusLabel('ingediend')}</option>
        <option value="in_behandeling">{getStatusLabel('in_behandeling')}</option>
        <option value="klaar_voor_betaling">
          {getStatusLabel('klaar_voor_betaling')}
        </option>
        <option value="afgerond">{getStatusLabel('afgerond')}</option>
      </select>

      {loading ? (
        <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader className="h-3 w-3 animate-spin" />
          Status wordt opgeslagen...
        </p>
      ) : null}

      {message ? (
        <p className="text-sm text-[var(--text-soft)]">{message}</p>
      ) : null}
    </div>
  )
}