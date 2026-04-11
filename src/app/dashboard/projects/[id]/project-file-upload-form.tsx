'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  userId: string
  projectId: number
}

export default function ProjectFileUploadForm({ userId, projectId }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!file) {
      setMessage('Kies eerst een bestand.')
      return
    }

    setLoading(true)

    const supabase = createClient()

    const safeFileName = file.name.replaceAll(' ', '_')
    const filePath = `${userId}/${projectId}/client-${Date.now()}-${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      setLoading(false)
      setMessage(`Upload fout: ${uploadError.message}`)
      return
    }

    const { error: dbError } = await supabase.from('project_files').insert({
      project_id: projectId,
      user_id: userId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type || null,
      file_type: 'client_upload',
    })

    setLoading(false)

    if (dbError) {
      setMessage(`Database fout: ${dbError.message}`)
      return
    }

    setMessage('Bestand succesvol geüpload.')
    setFile(null)
    router.refresh()
  }

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        disabled={loading}
        className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--bg-card-2)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--text-main)] hover:file:bg-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-60"
      />

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Uploaden...' : 'Bestand uploaden'}
        </button>
      </div>

      {message ? (
        <p className="pt-1 text-sm text-[var(--text-soft)]">{message}</p>
      ) : null}
    </form>
  )
}