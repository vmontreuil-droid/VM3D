'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useT } from '@/i18n/context'

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
  const { t } = useT()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const supabase = createClient()

    const parsedPrice = price === '' ? null : Number(price)

    if (price !== '' && Number.isNaN(parsedPrice)) {
      setLoading(false)
      setMessage(t.priceForm.invalidAmount)
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
      setMessage(`${t.priceForm.errorPrefix}: ${error.message}`)
      return
    }

    setMessage(t.priceForm.saved)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-soft)]">
          {t.priceForm.price}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          placeholder={t.priceForm.pricePlaceholder}
          disabled={loading}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-soft)]">
          {t.priceForm.currency}
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
        className="btn-primary"
      >
        {loading ? t.priceForm.saving : t.priceForm.savePrice}
      </button>

      {message ? (
        <p className="text-sm text-[var(--text-soft)]">{message}</p>
      ) : null}
    </form>
  )
}