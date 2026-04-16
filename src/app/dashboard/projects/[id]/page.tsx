import CustomerLogoHeaderBlock from "@/components/customers/customer-logo-header-block"
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import AppShell from '@/components/app-shell'
import ProjectMap from '@/components/projects/project-map'
import FileList from '@/components/files/file-list'
import FileUploadDropzone from '@/components/files/file-upload-dropzone'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, getLogoSignedUrl } from '@/lib/supabase/admin'
import FileSubmitButton from '@/components/files/file-submit-button'
import { geocodeAddress } from '@/lib/geocode'
const BUCKET_NAME = 'project-files'

const PROJECT_STATUS_STEPS = [
  { key: 'ingediend', label: 'Ingediend' },
  { key: 'in_behandeling', label: 'In behandeling' },
  { key: 'klaar_voor_betaling', label: 'Klaar voor betaling' },
  { key: 'afgerond', label: 'Afgerond' },
] as const

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    uploaded?: string
    deleted?: string
    error?: string
  }>
}

function display(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case 'ingediend':
      return 'Ingediend'
    case 'in_behandeling':
      return 'In behandeling'
    case 'klaar_voor_betaling':
      return 'Klaar voor betaling'
    case 'afgerond':
      return 'Afgerond'
    default:
      return 'Onbekend'
  }
}

function getStatusClass(status: string | null) {
  switch (status) {
    case 'ingediend':
      return 'badge-info'
    case 'in_behandeling':
      return 'badge-warning'
    case 'klaar_voor_betaling':
      return 'badge-warning'
    case 'afgerond':
      return 'badge-success'
    default:
      return 'badge-neutral'
  }
}

function getStatusStepIndex(status: string | null) {
  return PROJECT_STATUS_STEPS.findIndex((step) => step.key === status)
}

function getProjectProgressPercent(status: string | null) {
  const index = getStatusStepIndex(status)

  switch (index) {
    case 0:
      return 25
    case 1:
      return 50
    case 2:
      return 75
    case 3:
      return 100
    default:
      return 0
  }
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function requireCustomerProjectAccess(projectId: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()

  const { data: project, error } = await adminSupabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (error || !project) {
    notFound()
  }

  return { supabase, user, project, adminSupabase }
}

async function uploadCustomerFileAction(formData: FormData) {
  'use server'

  const projectId = Number(String(formData.get('project_id') || '').trim())
  const fileEntry = formData.get('file')

  if (Number.isNaN(projectId)) {
    redirect('/dashboard')
  }

  const { supabase, adminSupabase } = await requireCustomerProjectAccess(projectId)

  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    redirect(`/dashboard/projects/${projectId}?error=no_file`)
  }

  const fileName = safeFileName(fileEntry.name)
  const filePath = `${projectId}/client-${Date.now()}-${fileName}`

  const arrayBuffer = await fileEntry.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await adminSupabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: fileEntry.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    console.error('uploadCustomerFileAction storage error:', uploadError)
    redirect(`/dashboard/projects/${projectId}?error=upload_failed`)
  }

  const { error: dbError } = await adminSupabase.from('project_files').insert({
    project_id: projectId,
    file_name: fileName,
    file_path: filePath,
    file_type: 'client_upload',
  })

  if (dbError) {
    console.error('uploadCustomerFileAction db error:', dbError)
    redirect(`/dashboard/projects/${projectId}?error=file_db_failed`)
  }

  redirect(`/dashboard/projects/${projectId}?uploaded=1`)
}

async function deleteCustomerFileAction(formData: FormData) {
  'use server'

  const projectId = Number(String(formData.get('project_id') || '').trim())
  const fileId = String(formData.get('file_id') || '').trim()
  const filePath = String(formData.get('file_path') || '').trim()

  if (Number.isNaN(projectId) || !fileId || !filePath) {
    redirect('/dashboard?error=delete_missing')
  }

  const { supabase, adminSupabase } = await requireCustomerProjectAccess(projectId)

  const { data: fileRow, error: fileError } = await adminSupabase
    .from('project_files')
    .select('id, project_id, file_type, file_path')
    .eq('id', fileId)
    .eq('project_id', projectId)
    .single()

  if (fileError || !fileRow) {
    redirect(`/dashboard/projects/${projectId}?error=file_access`)
  }

  if (fileRow.file_type !== 'client_upload') {
    redirect(`/dashboard/projects/${projectId}?error=delete_forbidden`)
  }

  const { error: storageError } = await adminSupabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])

  if (storageError) {
    console.error('deleteCustomerFileAction storage error:', storageError)
    redirect(`/dashboard/projects/${projectId}?error=delete_storage_failed`)
  }

  const { error: dbError } = await adminSupabase
    .from('project_files')
    .delete()
    .eq('id', fileId)
    .eq('project_id', projectId)

  if (dbError) {
    console.error('deleteCustomerFileAction db error:', dbError)
    redirect(`/dashboard/projects/${projectId}?error=delete_db_failed`)
  }

  redirect(`/dashboard/projects/${projectId}?deleted=1`)
}

export default async function DashboardProjectDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params
  const projectId = Number(id)
  const resolvedSearchParams = searchParams ? await searchParams : {}

  if (Number.isNaN(projectId)) {
    notFound()
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role, full_name, company_name, logo_url')
    .eq('id', user.id)
    .single()

  const logoSignedUrl = await getLogoSignedUrl(adminSupabase, profile?.logo_url)

  const { data: projectData, error: projectError } = await adminSupabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (projectError || !projectData) {
    notFound()
  }

  let project = projectData

  if (
    (project.latitude == null || project.longitude == null) &&
    project.address
  ) {
    const { latitude, longitude } = await geocodeAddress(project.address)

    if (latitude != null && longitude != null) {
      project = { ...project, latitude, longitude }
    }
  }

  const { data: files, error: filesError } = await adminSupabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  const safeFiles = files ?? []

  const filesWithUrls = await Promise.all(
    safeFiles.map(async (file: any) => {
      const { data, error } = await adminSupabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(file.file_path, 3600)

      return {
        ...file,
        signedUrl: !error ? data?.signedUrl || null : null,
      }
    })
  )

  const clientUploads = filesWithUrls.filter(
    (file: any) => file.file_type === 'client_upload'
  )
  const finalFiles = filesWithUrls.filter(
    (file: any) => file.file_type === 'final_file'
  )

  const uploaded = resolvedSearchParams?.uploaded === '1'
  const deleted = resolvedSearchParams?.deleted === '1'
  const errorCode = resolvedSearchParams?.error || ''
  const currentIndex = getStatusStepIndex(project.status)

  return (
    <AppShell>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        <div className="flex justify-end mb-2">
          <CustomerLogoHeaderBlock logoUrl={logoSignedUrl} />
        </div>
        {(uploaded || deleted || errorCode) && (
          <section className="space-y-3">
            {uploaded && (
              <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                Bestand werd succesvol geüpload.
              </div>
            )}

            {deleted && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Bestand werd succesvol verwijderd.
              </div>
            )}

            {errorCode && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorCode === 'no_file' && 'Geen bestand geselecteerd.'}
                {errorCode === 'upload_failed' &&
                  'Upload naar storage is mislukt.'}
                {errorCode === 'file_db_failed' &&
                  'Bestand werd geüpload, maar kon niet geregistreerd worden.'}
                {errorCode === 'file_access' &&
                  'Bestand kon niet veilig geopend worden.'}
                {errorCode === 'delete_missing' &&
                  'Bestandsgegevens ontbreken voor verwijderen.'}
                {errorCode === 'delete_storage_failed' &&
                  'Bestand kon niet uit storage verwijderd worden.'}
                {errorCode === 'delete_db_failed' &&
                  'Bestandsrecord kon niet verwijderd worden.'}
                {errorCode === 'delete_forbidden' &&
                  'Je mag dit bestand niet verwijderen.'}
                {![
                  'no_file',
                  'upload_failed',
                  'file_db_failed',
                  'file_access',
                  'delete_missing',
                  'delete_storage_failed',
                  'delete_db_failed',
                  'delete_forbidden',
                ].includes(errorCode) && 'Er is een onverwachte fout opgetreden.'}
              </div>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/dashboard" className="btn-secondary">
                    ← Terug
                  </Link>
                </div>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Projectoverzicht
                </p>

                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                  {display(project.name)}
                </h1>

                <p className="mt-2 max-w-3xl text-sm text-[var(--text-soft)]">
                  {display(project.address)}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                      project.status
                    )}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>

                  <span className="badge-neutral px-3 py-1 text-xs font-semibold">
                    Prijs:{' '}
                    {project.price != null
                      ? `${project.price} ${project.currency || 'EUR'}`
                      : 'Nog niet bepaald'}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)]/70 px-4 py-4">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          Voortgang
                        </p>
                        <p className="text-xs font-semibold text-[var(--text-main)]">
                          {getProjectProgressPercent(project.status)}%
                        </p>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-card-2)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                          style={{
                            width: `${getProjectProgressPercent(project.status)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Workflow
                      </p>
                      <p className="text-xs text-[var(--text-soft)]">
                        Huidige stap: {getStatusLabel(project.status)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      {PROJECT_STATUS_STEPS.map((step, index) => {
                        const isDone = currentIndex >= index
                        const isCurrent = project.status === step.key

                        return (
                          <div key={step.key} className="relative">
                            <div
                              className={`rounded-xl border px-4 py-3 transition ${
                                isCurrent
                                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                  : isDone
                                  ? 'border-emerald-500/25 bg-emerald-500/10'
                                  : 'border-[var(--border-soft)] bg-[var(--bg-card-2)]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                    isCurrent
                                      ? 'bg-[var(--accent)] text-white'
                                      : isDone
                                      ? 'bg-emerald-500/80 text-white'
                                      : 'bg-[var(--bg-card)] text-[var(--text-soft)]'
                                  }`}
                                >
                                  {isDone ? '✓' : index + 1}
                                </div>

                                <div className="min-w-0">
                                  <p
                                    className={`text-sm font-semibold ${
                                      isCurrent || isDone
                                        ? 'text-[var(--text-main)]'
                                        : 'text-[var(--text-soft)]'
                                    }`}
                                  >
                                    {step.label}
                                  </p>

                                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                    {isCurrent
                                      ? 'Actieve fase'
                                      : isDone
                                      ? 'Voltooid'
                                      : 'Volgende stap'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid w-full grid-cols-3 gap-3 xl:w-auto">
                <div className="card-mini text-center">
                  <p className="text-xs text-[var(--text-muted)]">Uploads</p>
                  <p className="text-lg font-semibold text-[var(--text-main)]">
                    {clientUploads.length}
                  </p>
                </div>
                <div className="card-mini text-center">
                  <p className="text-xs text-[var(--text-muted)]">Oplevering</p>
                  <p className="text-lg font-semibold text-[var(--text-main)]">
                    {finalFiles.length}
                  </p>
                </div>
                <div className="card-mini text-center">
                  <p className="text-xs text-[var(--text-muted)]">Bestanden</p>
                  <p className="text-lg font-semibold text-[var(--text-main)]">
                    {filesWithUrls.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <h2 className="text-sm font-semibold text-[var(--text-main)]">
                  Projectgegevens
                </h2>
              </div>

              <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Titel</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(project.name)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Status</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {getStatusLabel(project.status)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Locatie</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(project.address)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Aangemaakt op</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {project.created_at
                      ? new Date(project.created_at).toLocaleDateString('nl-BE')
                      : '—'}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Prijs</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {project.price != null
                      ? `${project.price} ${project.currency || 'EUR'}`
                      : 'Nog niet bepaald'}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Munteenheid</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(project.currency)}
                  </p>
                </div>

                <div className="sm:col-span-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4">
                  <p className="text-xs text-[var(--text-muted)]">Beschrijving</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-main)]">
                    {display(project.description)}
                  </p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <h2 className="text-sm font-semibold text-[var(--text-main)]">
                  Locatie & kaart
                </h2>
              </div>

              <div className="grid gap-3 px-4 py-3">
                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Adres
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-main)]">
                    {display(project.address)}
                  </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
                  <div className="border-b border-[var(--border-soft)] px-4 py-3">
                    <h3 className="text-sm font-semibold text-[var(--text-main)]">
                      Kaart
                    </h3>
                  </div>

                  <div className="min-h-[300px] sm:min-h-[360px]">
                    <ProjectMap projects={[project]} />
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <h2 className="text-sm font-semibold text-[var(--text-main)]">
                  Upload bestand
                </h2>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Upload hier plannen, documenten of andere projectbestanden.
                </p>
              </div>

              <div className="px-4 py-4">
                <form action={uploadCustomerFileAction} className="space-y-4">
                  <input type="hidden" name="project_id" value={project.id} />

                  <FileUploadDropzone
                    name="file"
                    label="Bestand uploaden"
                    description="Sleep hier plannen, documenten of andere projectbestanden naartoe."
                    required
                  />

                  <FileSubmitButton
  idleText="Bestand uploaden"
  loadingText="Bestand wordt geüpload..."
  className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
/>
                </form>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <h2 className="text-sm font-semibold text-[var(--text-main)]">
                  Bestanden
                </h2>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Alleen bestanden van dit project zijn zichtbaar voor jou.
                </p>
              </div>

              {filesError ? (
                <div className="px-4 py-5 text-sm text-red-200">
                  Bestanden konden niet geladen worden.
                </div>
              ) : (
                <>
                  <FileList files={filesWithUrls} />

                  {clientUploads.length > 0 && (
                    <div className="border-t border-[var(--border-soft)] px-4 py-4">
                      <div className="grid gap-3">
                        {clientUploads.map((file: any) => (
                          <form key={file.id} action={deleteCustomerFileAction}>
                            <input
                              type="hidden"
                              name="project_id"
                              value={project.id}
                            />
                            <input type="hidden" name="file_id" value={file.id} />
                            <input
                              type="hidden"
                              name="file_path"
                              value={file.file_path}
                            />
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                className="inline-flex rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                              >
                                Verwijder {file.file_name}
                              </button>
                            </div>
                          </form>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </section>
      </div>
    </AppShell>
  )
}