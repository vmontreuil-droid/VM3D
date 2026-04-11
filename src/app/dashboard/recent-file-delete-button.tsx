'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  fileId: number
  filePath: string
  compact?: boolean
}

export default function RecentFileDeleteButton({
  fileId,
  filePath,
  compact = false,
}: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    const confirmed = window.confirm(
      'Weet je zeker dat je dit bestand wilt verwijderen?'
    )

    if (!confirmed) return

    try {
      setLoading(true)

      const response = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, filePath }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Kon bestand niet verwijderen.')
      }

      router.refresh()
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
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
        {loading ? 'Bezig...' : 'Verwijder'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Bezig...' : 'Verwijder'}
    </button>
  )
}