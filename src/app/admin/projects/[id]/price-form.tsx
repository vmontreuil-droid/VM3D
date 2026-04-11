'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  projectId: number | string
  currentPrice: number | null
  currentCurrency: string | null
}

export default function PriceForm({
  projectId,
  currentPrice,
  currentCurrency,
}: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [price, setPrice] = useState(
    currentPrice !== null && currentPrice !== undefined ? String(currentPrice) : ''
  )
  const [currency, setCurrency] = useState(currentCurrency || 'EUR')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    const parsedPrice =
      price.trim() === '' ? null : Number(price.replace(',', '.'))

    if (price.trim() !== '' && Number.isNaN(parsedPrice)) {
      setSaving(false)
      setMessage('Voer een geldige prijs in.')
      return
    }

    const { error } = await supabase
      .from('projects')
      .update({
        price: parsedPrice,
        currency,
      })
      .eq('id', projectId)

    setSaving(false)

    if (error) {
      setMessage('Prijs opslaan mislukt.')
      return
    }

    setMessage('Prijs bijgewerkt.')
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
        Prijs instellen
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px]">
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Bijv. 1250"
          className="input-dark w-full px-4 py-3 text-sm"
        />

        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="input-dark w-full px-4 py-3 text-sm"
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-[40px] items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Opslaan...' : 'Prijs opslaan'}
        </button>

        {message ? (
          <p className="text-sm text-[var(--text-soft)]">{message}</p>
        ) : null}
      </div>
    </div>
  )
}