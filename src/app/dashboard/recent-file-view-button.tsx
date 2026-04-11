'use client'

import { useState } from 'react'

type Props = {
  filePath: string
  compact?: boolean
}

export default function RecentFileViewButton({
  filePath,
  compact = false,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleView() {
    try {
      setLoading(true)

      const response = await fetch('/api/files/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Kon bestand niet openen.')
      }

      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Er ging iets mis.')
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleView}
        disabled={loading}
        className="btn-secondary btn-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 11a4 4 0 110-8 4 4 0 010 8z" />
        </svg>
        {loading ? 'Openen...' : 'Bekijk'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleView}
      disabled={loading}
      className="btn-secondary px-3 py-2 text-sm"
    >
      {loading ? 'Openen...' : 'Bekijk'}
    </button>
  )
}