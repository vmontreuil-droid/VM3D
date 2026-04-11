'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, X, Loader } from 'lucide-react'

type Props = {
  projectId: number
  currentPaid: boolean
}

export default function PaymentToggle({ projectId, currentPaid }: Props) {
  const [paid, setPaid] = useState(currentPaid)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const { error } = await supabase
      .from('projects')
      .update({ paid: !paid })
      .eq('id', projectId)

    setLoading(false)

    if (error) {
      setMessage(`Fout: ${error.message}`)
      return
    }

    setPaid(!paid)
    setMessage('Betaalstatus opgeslagen.')
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm text-[var(--text-soft)]">
        Betaald:{' '}
        <strong
          className={`flex items-center gap-1 ${
            paid ? 'text-[var(--success-text)]' : 'text-[var(--warning-text)]'
          }`}
        >
          {paid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {paid ? 'Ja' : 'Nee'}
        </strong>
      </p>

      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-card-2)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : paid ? (
          <X className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {loading
          ? 'Opslaan...'
          : paid
            ? 'Markeer als niet betaald'
            : 'Markeer als betaald'}
      </button>

      {message ? (
        <p className="text-sm text-[var(--text-soft)]">{message}</p>
      ) : null}
    </div>
  )
}