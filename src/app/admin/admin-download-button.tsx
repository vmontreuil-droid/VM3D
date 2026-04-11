'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Download, Loader } from 'lucide-react'

type Props = {
  filePath: string
  fileName: string
}

export default function AdminDownloadButton({ filePath, fileName }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleDownload = async () => {
    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from('project-files')
      .createSignedUrl(filePath, 60)

    setLoading(false)

    if (error || !data?.signedUrl) {
      setMessage('Download mislukt.')
      return
    }

    window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-card-2)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {loading ? 'Bezig...' : `Download ${fileName}`}
      </button>

      {message && <p className="mt-2 text-xs text-[var(--danger-text)]">{message}</p>}
    </div>
  )
}