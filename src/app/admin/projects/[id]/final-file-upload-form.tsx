'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  projectId: number | string
}

const BUCKET_NAME = 'project-files'

export default function FinalFileUploadForm({ projectId }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpload = async () => {
    if (!file) {
      setMessage('Kies eerst een bestand.')
      return
    }

    setUploading(true)
    setMessage('')

    const safeName = file.name.replace(/\s+/g, '-')
    const filePath = `${projectId}/final/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        upsert: false,
      })

    if (uploadError) {
      setUploading(false)
      setMessage(
        'Upload mislukt. Controleer je bucketnaam of storage-instellingen.'
      )
      return
    }

    const { error: insertError } = await supabase.from('project_files').insert({
      project_id: projectId,
      file_name: file.name,
      file_path: filePath,
      file_type: 'final_file',
    })

    setUploading(false)

    if (insertError) {
      setMessage('Bestand werd opgeladen, maar niet in de databank opgeslagen.')
      return
    }

    setFile(null)
    setMessage('Opleverbestand succesvol opgeladen.')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="input-dark w-full px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
      />

      <button
        type="button"
        onClick={handleUpload}
        disabled={uploading}
        className="inline-flex h-[42px] w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 sm:w-fit"
      >
        {uploading ? 'Uploaden...' : 'Opleverbestand uploaden'}
      </button>

      {message ? (
        <p className="text-sm text-[var(--text-soft)]">{message}</p>
      ) : null}

      <p className="text-xs text-[var(--text-muted)]">
        Bucket verondersteld: <span className="font-semibold">{BUCKET_NAME}</span>
      </p>
    </div>
  )
}