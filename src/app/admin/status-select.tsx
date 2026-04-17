'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getStatusLabel } from '@/lib/status'
import { useT } from '@/i18n/context'
import { FileText, Clock, CheckCircle, Check, Loader, Send, Receipt, Mail } from 'lucide-react'

type Props = {
  projectId: number
  currentStatus: string
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'offerte_aangevraagd':
      return <FileText className="h-4 w-4" />
    case 'offerte_verstuurd':
      return <Send className="h-4 w-4" />
    case 'in_behandeling':
      return <Clock className="h-4 w-4" />
    case 'facturatie':
      return <Receipt className="h-4 w-4" />
    case 'factuur_verstuurd':
      return <Mail className="h-4 w-4" />
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
  const [canEdit, setCanEdit] = useState(false)
  const router = useRouter()
  const { t } = useT()

  useEffect(() => {
    let active = true

    async function loadRole() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (active) setCanEdit(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (active) {
        setCanEdit(profile?.role === 'admin')
      }
    }

    loadRole()

    return () => {
      active = false
    }
  }, [])

  const handleChange = async (newStatus: string) => {
    if (!canEdit) {
      setMessage(t.statusSelect.adminOnly)
      return
    }

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

    if (newStatus === 'facturatie') {
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

    setMessage(t.statusSelect.saved)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-soft)]">
        {getStatusIcon(currentStatus)}
        {t.statusSelect.changeStatus}
      </label>

      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading || !canEdit}
        className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="offerte_aangevraagd">{getStatusLabel('offerte_aangevraagd', t)}</option>
        <option value="offerte_verstuurd">{getStatusLabel('offerte_verstuurd', t)}</option>
        <option value="in_behandeling">{getStatusLabel('in_behandeling', t)}</option>
        <option value="facturatie">{getStatusLabel('facturatie', t)}</option>
        <option value="factuur_verstuurd">
          {getStatusLabel('factuur_verstuurd', t)}
        </option>
        <option value="afgerond">{getStatusLabel('afgerond', t)}</option>
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

      {!canEdit ? (
        <p className="text-xs text-[var(--text-muted)]">
          {t.statusSelect.adminOnlyHint}
        </p>
      ) : null}
    </div>
  )
}