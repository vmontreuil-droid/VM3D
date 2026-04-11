'use client'

import { useState } from 'react'
import { Zap, Loader } from 'lucide-react'

export default function GeocodeMissingProjectsButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleBulkGeocode() {
    try {
      setLoading(true)
      setMessage('')

      const response = await fetch('/api/projects/geocode-missing', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Bulk geocoding mislukt.')
        return
      }

      setMessage(
        `Klaar: ${data.updated} bijgewerkt, ${data.failed} mislukt, ${data.skipped} overgeslagen.`
      )

      window.location.reload()
    } catch (error) {
      console.error(error)
      setMessage('Er liep iets fout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleBulkGeocode}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {loading
          ? 'Coördinaten ophalen...'
          : 'Ontbrekende coördinaten aanvullen'}
      </button>

      {message ? (
        <p className="max-w-[280px] text-xs text-[var(--text-soft)]">
          {message}
        </p>
      ) : null}
    </div>
  )
}