'use client'

import { useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, FileArchive, FolderOpen, Loader2, UploadCloud } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ProjectItem = {
  id: string | number
  user_id?: string | null
  name?: string | null
  address?: string | null
  profiles?: {
    full_name?: string | null
    company_name?: string | null
    email?: string | null
  } | null
}

type Props = {
  projects: ProjectItem[]
}

type UploadKind = 'client_upload' | 'final_file'

type ProjectOption = {
  id: string
  userId: string
  label: string
}

function getCustomerName(project: ProjectItem) {
  return (
    project.profiles?.company_name ||
    project.profiles?.full_name ||
    project.profiles?.email ||
    'Onbekende klant'
  )
}

function getMessageTone(message: string) {
  const value = message.toLowerCase()

  if (value.includes('succes') || value.includes('geslaagd')) return 'success'
  if (
    value.includes('fout') ||
    value.includes('mislukt') ||
    value.includes('kies eerst') ||
    value.includes('ongeldig')
  ) {
    return 'error'
  }

  return 'info'
}

export default function AdminUploadPanel({ projects }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [uploadKind, setUploadKind] = useState<UploadKind>('client_upload')
  const [projectId, setProjectId] = useState('')
  const [projectQuery, setProjectQuery] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [dragging, setDragging] = useState(false)

  const projectOptions = useMemo<ProjectOption[]>(() => {
    return projects
      .filter((project) => project.user_id)
      .map((project) => {
        const customerName = getCustomerName(project)
        const title = project.name || 'Onbenoemde werf'
        const address = project.address ? ` · ${project.address}` : ''

        return {
          id: String(project.id),
          userId: String(project.user_id),
          label: `${customerName} — ${title}${address}`,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'nl-BE'))
  }, [projects])

  const projectMap = useMemo(
    () => new Map(projectOptions.map((project) => [project.id, project])),
    [projectOptions]
  )

  const ready = Boolean(projectId && file && !loading)

  function handleProjectInput(value: string) {
    const normalized = value.trim().toLowerCase()
    const exactMatch = projectOptions.find(
      (project) => project.label.trim().toLowerCase() === normalized
    )
    const partialMatches = normalized
      ? projectOptions.filter((project) =>
          project.label.toLowerCase().includes(normalized)
        )
      : []
    const resolvedProject = exactMatch || (partialMatches.length === 1 ? partialMatches[0] : null)

    setProjectQuery(value)
    setProjectId(resolvedProject?.id ?? '')
    setMessage('')
  }

  function pickFile(fileList: FileList | null) {
    const f = fileList?.[0] ?? null
    setFile(f)
    if (f) setMessage('')
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    const files = event.dataTransfer.files
    if (files?.length) pickFile(files)
  }

  async function uploadFile() {
    setMessage('')

    if (!projectId || !file) {
      setMessage('Kies eerst een dossier en een bestand.')
      return
    }

    const project = projectMap.get(projectId)
    if (!project?.userId) {
      setMessage('Ongeldig dossier gekozen.')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('projectId', projectId)
      formData.append('uploadType', uploadKind)
      formData.append('file', file)

      const response = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      setLoading(false)

      if (!response.ok) {
        setMessage(result?.error || 'Upload mislukt. Probeer opnieuw.')
        return
      }

      setMessage(
        result?.message ||
          (uploadKind === 'client_upload'
            ? 'Upload geslaagd: klantbestand staat nu in het gekozen dossier.'
            : 'Upload geslaagd: opleverbestand staat nu in het gekozen dossier.')
      )
    } catch (error) {
      console.error('admin upload panel error:', error)
      setLoading(false)
      setMessage('Upload mislukt door een onverwachte fout.')
      return
    }

    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    router.refresh()
  }

  const kindLabel = uploadKind === 'client_upload' ? 'klantbestand' : 'opleverbestand'

  return (
    <section id="uploads" className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void uploadFile()
        }}
        className="px-3 py-2.5 sm:px-4"
      >
        <div className="space-y-2">
          {/* Type toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-0.5">
            <button
              type="button"
              onClick={() => { setUploadKind('client_upload'); setMessage('') }}
              className={`flex-1 rounded-md px-2.5 py-1 text-[10px] font-semibold transition ${
                uploadKind === 'client_upload'
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
              }`}
            >
              <FolderOpen className="mr-1 inline h-3 w-3" />
              Klantbestand
            </button>
            <button
              type="button"
              onClick={() => { setUploadKind('final_file'); setMessage('') }}
              className={`flex-1 rounded-md px-2.5 py-1 text-[10px] font-semibold transition ${
                uploadKind === 'final_file'
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
              }`}
            >
              <FileArchive className="mr-1 inline h-3 w-3" />
              Opleverbestand
            </button>
          </div>

          {/* Project search */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-medium text-[var(--text-soft)]">Zoek dossier</label>
            <input
              type="text"
              value={projectQuery}
              onChange={(e) => handleProjectInput(e.target.value)}
              list="upload-project-options"
              placeholder="Typ klant, werf of adres..."
              className="input-dark h-7 w-full px-2 text-[11px]"
              required
            />
            <datalist id="upload-project-options">
              {projectOptions.map((project) => (
                <option key={project.id} value={project.label} />
              ))}
            </datalist>
            <p className={`text-[9px] ${projectId ? 'text-emerald-300' : 'text-[var(--text-muted)]'}`}>
              {projectId ? 'Dossier geselecteerd.' : 'Typ en kies een dossier.'}
            </p>
          </div>

          {/* Drop zone */}
          <label
            onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
            onDragLeave={(event) => { event.preventDefault(); setDragging(false) }}
            onDrop={handleDrop}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-2.5 py-2 text-left transition ${
              dragging
                ? 'border-[var(--accent)] bg-[var(--accent)]/8'
                : 'border-[var(--border-soft)] bg-[var(--bg-card-2)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card-2)]/80'
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <UploadCloud className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-[var(--text-main)]">
                {file ? file.name : 'Sleep bestand hierheen'}
              </p>
              <p className="text-[9px] text-[var(--text-muted)]">of klik om te kiezen</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => pickFile(e.target.files)}
              className="hidden"
            />
          </label>

          {/* Upload button */}
          <button
            type="submit"
            disabled={loading}
            className={`group relative inline-flex h-7 items-center overflow-hidden rounded-md border bg-[var(--bg-card)] px-2.5 text-[11px] font-semibold text-[var(--text-main)] transition hover:bg-[var(--bg-card)]/80 disabled:cursor-not-allowed disabled:opacity-70 ${
              ready
                ? 'animate-pulse border-[var(--accent)]/60 shadow-[0_0_0_1px_rgba(247,148,29,0.18)]'
                : 'border-[var(--border-soft)] hover:border-[var(--accent)]/50'
            }`}
          >
            <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
            <span className="mr-1.5 flex h-5 w-5 items-center justify-center rounded bg-[var(--accent)]/12 text-[var(--accent)]">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
            </span>
            Upload {kindLabel}
          </button>

          {/* Message */}
          {message ? (
            <div
              className={`rounded-lg border px-3 py-2 text-[12px] ${
                getMessageTone(message) === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : getMessageTone(message) === 'error'
                    ? 'border-red-500/30 bg-red-500/10 text-red-200'
                    : 'border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-soft)]'
              }`}
            >
              <div className="flex items-start gap-2">
                {getMessageTone(message) === 'success' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{message}</span>
              </div>
            </div>
          ) : null}
        </div>
      </form>
    </section>
  )
}
