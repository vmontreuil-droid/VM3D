'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type FileItem = {
  id: number
  file_name: string
  file_path: string
  file_size?: number | null
  created_at?: string | null
  mime_type?: string | null
}

type Props = {
  title: string
  subtitle?: string
  files: FileItem[]
  allowDelete?: boolean
}

function formatDate(value?: string | null) {
  if (!value) return 'Onbekend'
  return new Date(value).toLocaleDateString('nl-BE')
}

function formatFileSize(size?: number | null) {
  if (!size || size <= 0) return 'Onbekend'

  const units = ['B', 'KB', 'MB', 'GB']
  let value = size
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export default function ProjectFilesTableAdmin({
  title,
  subtitle,
  files,
  allowDelete = false,
}: Props) {
  const [busyId, setBusyId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleDelete = async (file: FileItem) => {
    const confirmed = window.confirm(
      `Weet je zeker dat je "${file.file_name}" wilt verwijderen?`
    )

    if (!confirmed) return

    try {
      setBusyId(file.id)
      setMessage('')

      const supabase = createClient()

      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([file.file_path])

      if (storageError) {
        setMessage(`Storage fout: ${storageError.message}`)
        setBusyId(null)
        return
      }

      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', file.id)

      if (dbError) {
        setMessage(`Database fout: ${dbError.message}`)
        setBusyId(null)
        return
      }

      setMessage('Bestand verwijderd.')
      router.refresh()
    } catch (error) {
      console.error(error)
      setMessage('Er liep iets fout bij het verwijderen.')
    } finally {
      setBusyId(null)
    }
  }

  const handleDownload = async (file: FileItem) => {
    try {
      setMessage('')
      const supabase = createClient()

      const { data, error } = await supabase.storage
        .from('project-files')
        .createSignedUrl(file.file_path, 60)

      if (error || !data?.signedUrl) {
        setMessage(error?.message || 'Kon downloadlink niet maken.')
        return
      }

      window.open(data.signedUrl, '_blank')
    } catch (error) {
      console.error(error)
      setMessage('Er liep iets fout bij het openen van het bestand.')
    }
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
      <div className="border-b border-[var(--border-soft)] px-5 py-4">
        <h2 className="text-xl font-semibold text-[var(--text-main)]">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--text-soft)]">{subtitle}</p>
        ) : null}
      </div>

      {message ? (
        <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-5 py-3 text-sm text-[var(--text-soft)]">
          {message}
        </div>
      ) : null}

      {files.length === 0 ? (
        <div className="px-5 py-6 text-sm text-[var(--text-soft)]">
          Geen bestanden gevonden.
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[2.3fr_1fr_1fr_220px] gap-4 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-5 py-4 md:grid">
            <div className="text-sm font-semibold text-[var(--text-soft)]">
              Bestand
            </div>
            <div className="text-sm font-semibold text-[var(--text-soft)]">
              Grootte
            </div>
            <div className="text-sm font-semibold text-[var(--text-soft)]">
              Datum
            </div>
            <div className="text-sm font-semibold text-[var(--text-soft)]">
              Acties
            </div>
          </div>

          <div className="divide-y divide-[var(--border-soft)]">
            {files.map((file) => (
              <div
                key={file.id}
                className="grid gap-4 px-5 py-4 md:grid-cols-[2.3fr_1fr_1fr_220px] md:items-center"
              >
                <div>
                  <p className="font-medium text-[var(--text-main)]">
                    {file.file_name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {file.mime_type || 'Onbekend type'}
                  </p>
                </div>

                <div className="text-sm text-[var(--text-soft)]">
                  {formatFileSize(file.file_size)}
                </div>

                <div className="text-sm text-[var(--text-soft)]">
                  {formatDate(file.created_at)}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    className="inline-flex rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-card)]"
                  >
                    Open
                  </button>

                  {allowDelete ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(file)}
                      disabled={busyId === file.id}
                      className="inline-flex rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyId === file.id ? 'Verwijderen...' : 'Verwijder'}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}