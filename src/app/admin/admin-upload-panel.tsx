'use client'

import { useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, FileArchive, FolderOpen, Loader2, UploadCloud } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ProjectItem = {
  id: string | number
  user_id?: string | null
  title?: string | null
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
  const clientInputRef = useRef<HTMLInputElement | null>(null)
  const finalInputRef = useRef<HTMLInputElement | null>(null)

  const [clientProjectId, setClientProjectId] = useState('')
  const [finalProjectId, setFinalProjectId] = useState('')
  const [clientFile, setClientFile] = useState<File | null>(null)
  const [finalFile, setFinalFile] = useState<File | null>(null)
  const [clientLoading, setClientLoading] = useState(false)
  const [finalLoading, setFinalLoading] = useState(false)
  const [clientMessage, setClientMessage] = useState('')
  const [finalMessage, setFinalMessage] = useState('')
  const [clientDragging, setClientDragging] = useState(false)
  const [finalDragging, setFinalDragging] = useState(false)

  const projectOptions = useMemo<ProjectOption[]>(() => {
    return projects
      .filter((project) => project.user_id)
      .map((project) => {
        const customerName = getCustomerName(project)
        const title = project.title || 'Onbenoemde werf'
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

  const clientReady = Boolean(clientProjectId && clientFile && !clientLoading)
  const finalReady = Boolean(finalProjectId && finalFile && !finalLoading)

  function setSelectedFile(kind: UploadKind, fileList: FileList | null) {
    const file = fileList?.[0] ?? null

    if (kind === 'client_upload') {
      setClientFile(file)
      if (file) setClientMessage('')
      return
    }

    setFinalFile(file)
    if (file) setFinalMessage('')
  }

  function handleDrop(kind: UploadKind, event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault()

    if (kind === 'client_upload') {
      setClientDragging(false)
    } else {
      setFinalDragging(false)
    }

    const files = event.dataTransfer.files
    if (!files?.length) return

    setSelectedFile(kind, files)
  }

  async function uploadFile(kind: UploadKind) {
    const selectedProjectId = kind === 'client_upload' ? clientProjectId : finalProjectId
    const selectedFile = kind === 'client_upload' ? clientFile : finalFile
    const setLoading = kind === 'client_upload' ? setClientLoading : setFinalLoading
    const setMessage = kind === 'client_upload' ? setClientMessage : setFinalMessage

    setMessage('')

    if (!selectedProjectId || !selectedFile) {
      setMessage('Kies eerst een dossier en een bestand.')
      return
    }

    const project = projectMap.get(selectedProjectId)
    if (!project?.userId) {
      setMessage('Ongeldig dossier gekozen.')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('projectId', selectedProjectId)
      formData.append('uploadType', kind)
      formData.append('file', selectedFile)

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
          (kind === 'client_upload'
            ? 'Upload geslaagd: klantbestand staat nu in het gekozen dossier.'
            : 'Upload geslaagd: opleverbestand staat nu in het gekozen dossier.')
      )
    } catch (error) {
      console.error('admin upload panel error:', error)
      setLoading(false)
      setMessage('Upload mislukt door een onverwachte fout.')
      return
    }

    if (kind === 'client_upload') {
      setClientFile(null)
      if (clientInputRef.current) clientInputRef.current.value = ''
    } else {
      setFinalFile(null)
      if (finalInputRef.current) finalInputRef.current.value = ''
    }

    router.refresh()
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
      <div className="grid gap-3 px-4 py-3.5 sm:px-5 lg:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void uploadFile('client_upload')
          }}
          className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]"
        >
          <div className="border-b border-[var(--border-soft)] px-3.5 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Uploads
            </p>
            <h3 className="mt-0.5 text-[13px] font-semibold text-[var(--text-main)]">
              Klantbestand uploaden
            </h3>
            <p className="mt-0.5 text-[10px] text-[var(--text-soft)]">
              Voor plannen, PDF’s, foto’s en bronmateriaal.
            </p>
          </div>

          <div className="space-y-2.5 px-3.5 py-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-soft)]">
                Kies dossier
              </label>
              <select
                value={clientProjectId}
                onChange={(e) => {
                  setClientProjectId(e.target.value)
                  setClientMessage('')
                }}
                className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                required
              >
                <option value="">Selecteer klant / werf</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.label}
                  </option>
                ))}
              </select>
            </div>

            <label
              onDragOver={(event) => {
                event.preventDefault()
                setClientDragging(true)
              }}
              onDragLeave={(event) => {
                event.preventDefault()
                setClientDragging(false)
              }}
              onDrop={(event) => handleDrop('client_upload', event)}
              className={`flex min-h-[92px] cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3 py-3 text-left transition ${
                clientDragging
                  ? 'border-[var(--accent)] bg-[var(--accent)]/8'
                  : 'border-[var(--border-soft)] bg-[var(--bg-card)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                <UploadCloud className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-[var(--text-main)]">
                  {clientFile ? clientFile.name : 'Sleep je bestand hierheen'}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                  of klik om een bestand te kiezen
                </p>
              </div>

              <input
                ref={clientInputRef}
                type="file"
                onChange={(e) => setSelectedFile('client_upload', e.target.files)}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={clientLoading}
              className={`group relative inline-flex h-9 items-center overflow-hidden rounded-lg border bg-[var(--bg-card)] px-3.5 text-[12px] font-semibold text-[var(--text-main)] transition hover:bg-[var(--bg-card)]/80 disabled:cursor-not-allowed disabled:opacity-70 ${
                clientReady
                  ? 'animate-pulse border-[var(--accent)]/60 shadow-[0_0_0_1px_rgba(247,148,29,0.18)]'
                  : 'border-[var(--border-soft)] hover:border-[var(--accent)]/50'
              }`}
            >
              <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
              <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                {clientLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
              </span>
              Upload klantbestand
            </button>

            {clientMessage ? (
              <div
                className={`rounded-lg border px-3 py-2 text-[12px] ${
                  getMessageTone(clientMessage) === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : getMessageTone(clientMessage) === 'error'
                      ? 'border-red-500/30 bg-red-500/10 text-red-200'
                      : 'border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-soft)]'
                }`}
              >
                <div className="flex items-start gap-2">
                  {getMessageTone(clientMessage) === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{clientMessage}</span>
                </div>
              </div>
            ) : null}
          </div>
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void uploadFile('final_file')
          }}
          className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]"
        >
          <div className="border-b border-[var(--border-soft)] px-3.5 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Uploads
            </p>
            <h3 className="mt-0.5 text-[13px] font-semibold text-[var(--text-main)]">
              Opleverbestand uploaden
            </h3>
            <p className="mt-0.5 text-[10px] text-[var(--text-soft)]">
              Voor finale bestanden, ZIP’s en oplevermappen.
            </p>
          </div>

          <div className="space-y-2.5 px-3.5 py-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-soft)]">
                Kies dossier
              </label>
              <select
                value={finalProjectId}
                onChange={(e) => {
                  setFinalProjectId(e.target.value)
                  setFinalMessage('')
                }}
                className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                required
              >
                <option value="">Selecteer werf / dossier</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.label}
                  </option>
                ))}
              </select>
            </div>

            <label
              onDragOver={(event) => {
                event.preventDefault()
                setFinalDragging(true)
              }}
              onDragLeave={(event) => {
                event.preventDefault()
                setFinalDragging(false)
              }}
              onDrop={(event) => handleDrop('final_file', event)}
              className={`flex min-h-[92px] cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3 py-3 text-left transition ${
                finalDragging
                  ? 'border-sky-400/60 bg-sky-500/8'
                  : 'border-[var(--border-soft)] bg-[var(--bg-card)] hover:border-sky-400/40 hover:bg-[var(--bg-card)]/80'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-300">
                <FileArchive className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-[var(--text-main)]">
                  {finalFile ? finalFile.name : 'Sleep je bestand hierheen'}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                  of klik om een bestand te kiezen
                </p>
              </div>

              <input
                ref={finalInputRef}
                type="file"
                onChange={(e) => setSelectedFile('final_file', e.target.files)}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={finalLoading}
              className={`group relative inline-flex h-9 items-center overflow-hidden rounded-lg border bg-[var(--bg-card)] px-3.5 text-[12px] font-semibold text-[var(--text-main)] transition hover:bg-[var(--bg-card)]/80 disabled:cursor-not-allowed disabled:opacity-70 ${
                finalReady
                  ? 'animate-pulse border-sky-400/60 shadow-[0_0_0_1px_rgba(56,189,248,0.18)]'
                  : 'border-[var(--border-soft)] hover:border-sky-400/50'
              }`}
            >
              <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-sky-400/80" />
              <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/12 text-sky-300">
                {finalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              </span>
              Upload opleverbestand
            </button>

            {finalMessage ? (
              <div
                className={`rounded-lg border px-3 py-2 text-[12px] ${
                  getMessageTone(finalMessage) === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : getMessageTone(finalMessage) === 'error'
                      ? 'border-red-500/30 bg-red-500/10 text-red-200'
                      : 'border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-soft)]'
                }`}
              >
                <div className="flex items-start gap-2">
                  {getMessageTone(finalMessage) === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{finalMessage}</span>
                </div>
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  )
}
