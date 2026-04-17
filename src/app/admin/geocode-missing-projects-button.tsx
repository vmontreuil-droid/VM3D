'use client'

import { useState } from 'react'
import { Zap, Loader } from 'lucide-react'
import { useT } from '@/i18n/context'

export default function GeocodeMissingProjectsButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { t } = useT()

  async function handleBulkGeocode() {
    try {
      setLoading(true)
      setMessage('')

      const response = await fetch('/api/projects/geocode-missing', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || t.geocodeBtn.failed)
        return
      }

      setMessage(
        t.geocodeBtn.done
          .replace('{updated}', String(data.updated))
          .replace('{failed}', String(data.failed))
          .replace('{skipped}', String(data.skipped))
      )

      window.location.reload()
    } catch (error) {
      console.error(error)
      setMessage(t.geocodeBtn.error)
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
        className="btn-primary"
      >
        {loading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {loading
          ? t.geocodeBtn.fetching
          : t.geocodeBtn.fillMissing}
      </button>

      {message ? (
        <p className="max-w-[280px] text-xs text-[var(--text-soft)]">
          {message}
        </p>
      ) : null}
    </div>
  )
}