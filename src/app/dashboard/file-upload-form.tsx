'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Project = {
  id: number
  title: string
}

export default function FileUploadForm({
  userId,
  projects,
}: {
  userId: string
  projects: Project[]
}) {
  const [projectId, setProjectId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!projectId || !file) {
      setMessage('Kies eerst een project en een bestand.')
      return
    }

    setUploading(true)

    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/${projectId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(filePath, file)

    if (uploadError) {
      setUploading(false)
      setMessage(uploadError.message)
      return
    }

    const { error: dbError } = await supabase.from('project_files').insert({
      project_id: projectId,
      user_id: userId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
    })

    setUploading(false)

    if (dbError) {
      setMessage(dbError.message)
      return
    }

    setProjectId('')
    setFile(null)
    setMessage('Bestand succesvol geüpload.')
    router.refresh()
  }

  return (
    <form onSubmit={handleUpload} className="flex h-full flex-col">
      <div className="flex-1 space-y-4">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="input-dark h-13 w-full px-4 text-sm"
          required
        >
          <option value="">Kies een project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>

        <div className="input-dark flex min-h-[228px] w-full items-center justify-center px-6 py-6">
          <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-3)] text-[var(--accent)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5-5 5 5" />
                <path d="M12 15V5" />
              </svg>
            </div>

            <div className="max-w-md">
              <p className="text-sm font-medium text-[var(--text-main)]">
                {file ? file.name : 'Klik om een bestand te kiezen'}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Upload plannen, PDF’s, DWG’s of bronbestanden
              </p>
            </div>

            <span className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-3)] px-4 py-2 text-xs font-semibold text-[var(--text-soft)] transition hover:bg-[#314153]">
              Bladeren
            </span>

            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
              required
            />
          </label>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={uploading}
          className="btn-primary inline-flex h-12 w-full items-center justify-center px-5 text-sm font-semibold"
        >
          {uploading ? 'Uploaden...' : 'Bestand uploaden'}
        </button>

        {message && (
          <p className="mt-3 text-sm text-[var(--text-soft)]">{message}</p>
        )}
      </div>
    </form>
  )
}