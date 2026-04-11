'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  projectId: number
  currentPrice: number | null
  currentCurrency: string | null
}

export default function PriceForm({
  projectId,
  currentPrice,
  currentCurrency,
}: Props) {
  const [price, setPrice] = useState(
    currentPrice !== null && currentPrice !== undefined
      ? String(currentPrice)
      : ''
  )
  const [currency, setCurrency] = useState(currentCurrency || 'EUR')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const supabase = createClient()

    const parsedPrice = price === '' ? null : Number(price)

    if (price !== '' && Number.isNaN(parsedPrice)) {
      setLoading(false)
      setMessage('Geef een geldig bedrag in.')
      return
    }

    const { error } = await supabase
      .from('projects')
      .update({
        price: parsedPrice,
        currency,
      })
      .eq('id', projectId)

    setLoading(false)

    if (error) {
      setMessage(`Fout: ${error.message}`)
      return
    }

    setMessage('Prijs opgeslagen.')
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-soft)]">
          Prijs
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="Bijv. 350.00"
          disabled={loading}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-soft)]">
          Munt
        </label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          <option value="EUR">EUR</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Opslaan...' : 'Prijs opslaan'}
      </button>

      {message ? (
        <p className="text-sm text-[var(--text-soft)]">{message}</p>
      ) : null}
    </form>
  )
}