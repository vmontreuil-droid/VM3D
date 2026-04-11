'use client'

import { useState } from 'react'

type Props = {
  filePath: string
  fileName: string
  compact?: boolean
}

export default function RecentFileDownloadButton({
  filePath,
  fileName,
  compact = false,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    try {
      setLoading(true)

      const response = await fetch('/api/files/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Kon download niet starten.')
      }

      if (result.url) {
        const link = document.createElement('a')
        link.href = result.url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        link.remove()
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
        onClick={handleDownload}
        disabled={loading}
        className="btn-secondary btn-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7 7-7z" />
        </svg>
        {loading ? 'Download...' : 'Download'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="btn-secondary px-3 py-2 text-sm"
    >
      {loading ? 'Download...' : 'Download'}
    </button>
  )
}