import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import AppShell from '@/components/app-shell'
import ProjectMap from '@/components/projects/project-map'
import FileList from '@/components/files/file-list'
import FileUploadDropzone from '@/components/files/file-upload-dropzone'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import FileSubmitButton from '@/components/files/file-submit-button'
import { geocodeAddress } from '@/lib/geocode'
import { UserRound, Save, UploadCloud, FileText, MapPin, StickyNote, Users, Zap, History, Files, BadgeCheck, CircleDollarSign } from 'lucide-react'
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
    created?: string
    updated?: string
    uploaded?: string
    type?: string
    error?: string
    status_saved?: string
    price_saved?: string
    deleted?: string
    notes_saved?: string
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

function getTimelineBadgeClass(eventType: string) {
  switch (eventType) {
    case 'status_changed':
      return 'badge-warning'
    case 'price_changed':
      return 'badge-info'
    case 'file_uploaded':
      return 'badge-success'
    case 'file_deleted':
      return 'badge-danger'
    case 'notes_updated':
      return 'badge-neutral'
    case 'project_created':
      return 'badge-success'
    default:
      return 'badge-neutral'
  }
}

async function requireAdminWithUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return { adminSupabase: createAdminClient(), user }
}

async function addTimelineEvent(params: {
  adminSupabase: ReturnType<typeof createAdminClient>
  projectId: number
  eventType: string
  title: string
  description?: string | null
  createdBy?: string | null
}) {
  const { adminSupabase, projectId, eventType, title, description, createdBy } =
    params

  await adminSupabase.from('project_timeline').insert({
    project_id: projectId,
    event_type: eventType,
    title,
    description: description || null,
    created_by: createdBy || null,
    created_at: new Date().toISOString(),
  })
}

async function updateProjectStatusAction(formData: FormData) {
  'use server'

  const { adminSupabase, user } = await requireAdminWithUser()

  const projectId = Number(String(formData.get('project_id') || '').trim())
  const status = String(formData.get('status') || '').trim()

  if (Number.isNaN(projectId) || !status) {
    redirect('/admin?error=status_missing')
  }

  const { data: existingProject } = await adminSupabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .single()

  const { error } = await adminSupabase
    .from('projects')
    .update({ status })
    .eq('id', projectId)

  if (error) {
    console.error('updateProjectStatusAction error:', error)
    redirect(`/admin/projects/${projectId}?error=status_save_failed`)
  }

  await addTimelineEvent({
    adminSupabase,
    projectId,
    eventType: 'status_changed',
    title: 'Status gewijzigd',
    description: `Van ${getStatusLabel(existingProject?.status ?? null)} naar ${getStatusLabel(status)}.`,
    createdBy: user.id,
  })

  redirect(`/admin/projects/${projectId}?status_saved=1`)
}

async function updateProjectPriceAction(formData: FormData) {
  'use server'

  const { adminSupabase, user } = await requireAdminWithUser()

  const projectId = Number(String(formData.get('project_id') || '').trim())
  const priceRaw = String(formData.get('price') || '').trim()
  const currency = String(formData.get('currency') || 'EUR').trim()

  if (Number.isNaN(projectId)) {
    redirect('/admin')
  }

  const { data: existingProject } = await adminSupabase
    .from('projects')
    .select('price, currency')
    .eq('id', projectId)
    .single()

  const price = priceRaw === '' ? null : Number(priceRaw.replace(',', '.'))

  const { error } = await adminSupabase
    .from('projects')
    .update({
      price: price === null || Number.isNaN(price) ? null : price,
      currency: currency || 'EUR',
    })
    .eq('id', projectId)

  if (error) {
    console.error('updateProjectPriceAction error:', error)
    redirect(`/admin/projects/${projectId}?error=price_save_failed`)
  }

  await addTimelineEvent({
    adminSupabase,
    projectId,
    eventType: 'price_changed',
    title: 'Prijs aangepast',
    description: `Van ${existingProject?.price ?? '—'} ${existingProject?.currency ?? ''} naar ${price ?? '—'} ${currency}.`,
    createdBy: user.id,
  })

  redirect(`/admin/projects/${projectId}?price_saved=1`)
}

async function saveAdminNotesAction(formData: FormData) {
  'use server'

  const { adminSupabase, user } = await requireAdminWithUser()

  const projectId = Number(String(formData.get('project_id') || '').trim())
  const adminNotes = String(formData.get('admin_notes') || '').trim()

  if (Number.isNaN(projectId)) {
    redirect('/admin')
  }

  const { error } = await adminSupabase
    .from('projects')
    .update({
      admin_notes: adminNotes || null,
    })
    .eq('id', projectId)

  if (error) {
    console.error('saveAdminNotesAction error:', error)
    redirect(`/admin/projects/${projectId}?error=notes_save_failed`)
  }

  await addTimelineEvent({
    adminSupabase,
    projectId,
    eventType: 'notes_updated',
    title: 'Admin-notities bijgewerkt',
    description: adminNotes
      ? 'Interne notities werden aangepast.'
      : 'Interne notities werden leeggemaakt.',
    createdBy: user.id,
  })

  redirect(`/admin/projects/${projectId}?notes_saved=1`)
}

async function uploadProjectFileAction(formData: FormData) {
  'use server'

  const { adminSupabase, user } = await requireAdminWithUser()

  const projectId = Number(String(formData.get('project_id') || '').trim())
  const uploadType = String(formData.get('upload_type') || '').trim()
  const fileEntry = formData.get('file')

  if (Number.isNaN(projectId)) {
    redirect('/admin')
  }

  if (uploadType !== 'client_upload' && uploadType !== 'final_file') {
    redirect(`/admin/projects/${projectId}?error=invalid_upload_type`)
  }

  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    redirect(`/admin/projects/${projectId}?error=no_file`)
  }

  const fileName = safeFileName(fileEntry.name)
  const filePath = `${projectId}/${Date.now()}-${fileName}`

  const arrayBuffer = await fileEntry.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await adminSupabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: fileEntry.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    console.error('uploadProjectFileAction storage error:', uploadError)
    redirect(`/admin/projects/${projectId}?error=upload_failed`)
  }

  const { error: dbError } = await adminSupabase.from('project_files').insert({
    project_id: projectId,
    file_name: fileName,
    file_path: filePath,
    file_type: uploadType,
  })

  if (dbError) {
    console.error('uploadProjectFileAction db error:', dbError)
    redirect(`/admin/projects/${projectId}?error=file_db_failed`)
  }

  await addTimelineEvent({
    adminSupabase,
    projectId,
    eventType: 'file_uploaded',
    title: 'Bestand geüpload',
    description: `${fileName} (${uploadType === 'client_upload' ? 'klantbestand' : 'opleverbestand'}).`,
    createdBy: user.id,
  })

  redirect(`/admin/projects/${projectId}?uploaded=1&type=${uploadType}`)
}

async function deleteProjectFileAction(formData: FormData) {
  'use server'

  const { adminSupabase, user } = await requireAdminWithUser()

  const projectId = Number(String(formData.get('project_id') || '').trim())
  const fileId = String(formData.get('file_id') || '').trim()
  const filePath = String(formData.get('file_path') || '').trim()
  const fileName = String(formData.get('file_name') || '').trim()

  if (Number.isNaN(projectId) || !fileId || !filePath) {
    redirect('/admin?error=delete_missing')
  }

  const { error: storageError } = await adminSupabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])

  if (storageError) {
    console.error('deleteProjectFileAction storage error:', storageError)
    redirect(`/admin/projects/${projectId}?error=delete_storage_failed`)
  }

  const { error: dbError } = await adminSupabase
    .from('project_files')
    .delete()
    .eq('id', fileId)

  if (dbError) {
    console.error('deleteProjectFileAction db error:', dbError)
    redirect(`/admin/projects/${projectId}?error=delete_db_failed`)
  }

  await addTimelineEvent({
    adminSupabase,
    projectId,
    eventType: 'file_deleted',
    title: 'Bestand verwijderd',
    description: fileName
      ? `${fileName} werd verwijderd.`
      : 'Een bestand werd verwijderd.',
    createdBy: user.id,
  })

  redirect(`/admin/projects/${projectId}?deleted=1`)
}

export default async function AdminProjectDetailPage({
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

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, full_name, company_name')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const adminSupabase = createAdminClient()

  const { data: projectData, error: projectError } = await adminSupabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
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

      await adminSupabase
        .from('projects')
        .update({ latitude, longitude })
        .eq('id', projectId)
    }
  }

  let customerProfile: {
    id?: string
    full_name?: string | null
    company_name?: string | null
    email?: string | null
    phone?: string | null
    mobile?: string | null
    vat_number?: string | null
    city?: string | null
    street?: string | null
    postal_code?: string | null
    country?: string | null
  } | null = null

  if (project.user_id) {
    const { data: profileRow } = await adminSupabase
      .from('profiles')
      .select(
        'id, full_name, company_name, email, phone, mobile, vat_number, city, street, postal_code, country'
      )
      .eq('id', project.user_id)
      .single()

    customerProfile = profileRow ?? null
  }

  const { data: files } = await adminSupabase
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

  const { data: timelineItems } = await adminSupabase
    .from('project_timeline')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  const safeTimeline = timelineItems ?? []

  const customerName =
    customerProfile?.company_name ||
    customerProfile?.full_name ||
    customerProfile?.email ||
    '—'

  const customerAddress = [
    customerProfile?.street,
    [customerProfile?.postal_code, customerProfile?.city]
      .filter(Boolean)
      .join(' '),
    customerProfile?.country,
  ]
    .filter(Boolean)
    .join(', ')

  const created = resolvedSearchParams?.created === '1'
  const updated = resolvedSearchParams?.updated === '1'
  const uploaded = resolvedSearchParams?.uploaded === '1'
  const uploadType = resolvedSearchParams?.type || ''
  const statusSaved = resolvedSearchParams?.status_saved === '1'
  const priceSaved = resolvedSearchParams?.price_saved === '1'
  const deleted = resolvedSearchParams?.deleted === '1'
  const notesSaved = resolvedSearchParams?.notes_saved === '1'
  const errorCode = resolvedSearchParams?.error || ''

  const clientFiles = filesWithUrls.filter(
    (file: any) => file.file_type === 'client_upload'
  )
  const finalFiles = filesWithUrls.filter(
    (file: any) => file.file_type === 'final_file'
  )

  const currentIndex = getStatusStepIndex(project.status)
  const projectActionButtonClass =
    'group relative inline-flex h-9 items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/45 hover:bg-[var(--bg-card)]/80'

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        {(created ||
          updated ||
          uploaded ||
          statusSaved ||
          priceSaved ||
          deleted ||
          notesSaved ||
          errorCode) && (
          <section className="space-y-3">
            {created && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Project werd succesvol aangemaakt.
              </div>
            )}
            {updated && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Projectgegevens werden succesvol bijgewerkt.
              </div>
            )}
            {statusSaved && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Projectstatus werd succesvol aangepast.
              </div>
            )}
            {priceSaved && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Projectprijs werd succesvol bijgewerkt.
              </div>
            )}
            {notesSaved && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Admin-notities werden opgeslagen.
              </div>
            )}
            {uploaded && uploadType === 'client_upload' && (
              <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                Klantbestand werd succesvol geüpload.
              </div>
            )}
            {uploaded && uploadType === 'final_file' && (
              <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                Opleverbestand werd succesvol geüpload.
              </div>
            )}
            {deleted && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Bestand werd succesvol verwijderd.
              </div>
            )}
            {errorCode && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Er is een fout opgetreden.
              </div>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                {project.user_id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/customers/${project.user_id}`}
                      className={projectActionButtonClass}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                        <UserRound className="h-3 w-3" />
                      </span>
                      <span className="pr-1">Open klant</span>
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    </Link>
                    <Link
                      href={`/admin/customers/${project.user_id}/edit`}
                      className={projectActionButtonClass}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                        <UserRound className="h-3 w-3" />
                      </span>
                      <span className="pr-1">Bewerk klant</span>
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    </Link>
                  </div>
                ) : null}

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Premium werffiche
                </p>

                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                  {display(project.title)}
                </h1>

                <p className="mt-2 max-w-3xl text-sm text-[var(--text-soft)]">
                  {display(project.address)}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="badge-neutral px-3 py-1 text-xs font-semibold">
                    Klantdossier actief
                  </span>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 xl:ml-auto xl:w-[620px] xl:self-center">
                <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.02))] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Status</p>
                      <p className="mt-1 text-sm font-semibold text-amber-300">{getStatusLabel(project.status)}</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                      <BadgeCheck className="h-4.5 w-4.5 text-amber-300" />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Prijs</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--accent)]">
                        {project.price != null
                          ? `${project.price} ${project.currency || 'EUR'}`
                          : 'Nog niet bepaald'}
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                      <CircleDollarSign className="h-4.5 w-4.5 text-[var(--accent)]" />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(33,150,243,0.08),rgba(33,150,243,0.02))] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Uploads</p>
                      <p className="mt-1 text-lg font-semibold text-blue-400">{clientFiles.length}</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                      <UploadCloud className="h-4.5 w-4.5 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(156,39,176,0.08),rgba(156,39,176,0.02))] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Oplevering</p>
                      <p className="mt-1 text-lg font-semibold text-purple-400">{finalFiles.length}</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                      <FileText className="h-4.5 w-4.5 text-purple-400" />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(14,165,233,0.02))] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Bestanden</p>
                      <p className="mt-1 text-lg font-semibold text-cyan-300">{filesWithUrls.length}</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10">
                      <Files className="h-4.5 w-4.5 text-cyan-300" />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.08),rgba(76,175,80,0.02))] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Timeline</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-400">{safeTimeline.length}</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                      <History className="h-4.5 w-4.5 text-emerald-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-main)]">
                  Voortgang & workflow
                </h2>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Overzicht van de huidige fase en de afwerking van deze werf.
                </p>
              </div>
              <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                <Zap className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="px-4 py-4">
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
                  style={{ width: `${getProjectProgressPercent(project.status)}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Workflow
              </p>
              <p className="text-xs text-[var(--text-soft)]">
                Huidige stap: {getStatusLabel(project.status)}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
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
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-4">
            <section className="order-3 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      Projectgegevens
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Overzicht van status, prijs, locatie en beschrijving van deze werf.
                    </p>
                  </div>
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                    <FileText className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="grid gap-3 px-4 py-4 sm:grid-cols-2">
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Titel</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(project.title)}
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

            <section className="order-1 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      Locatie & kaart
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Controleer adresgegevens en positie van de werf op de kaart.
                    </p>
                  </div>
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                    <MapPin className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="grid gap-3 px-4 py-4">
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

            <section className="order-2 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      Interne admin-notities
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Enkel zichtbaar voor admins.
                    </p>
                  </div>
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                    <StickyNote className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="px-4 py-4">
                <form action={saveAdminNotesAction} className="space-y-3">
                  <input type="hidden" name="project_id" value={project.id} />
                  <textarea
                    name="admin_notes"
                    defaultValue={project.admin_notes || ''}
                    placeholder="Interne opmerkingen, opvolging, afspraken, aandachtspunten..."
                    className="input-dark min-h-[180px] w-full px-3 py-2.5 text-sm"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className={projectActionButtonClass}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                        <Save className="h-3 w-3" />
                      </span>
                      <span className="pr-1">Notities opslaan</span>
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-4">
            <section className="order-4 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      Klantkaart
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Contactgegevens en klantinformatie gekoppeld aan deze werf.
                    </p>
                  </div>
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                    <Users className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="grid gap-3 px-4 py-4">
                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4">
                  <p className="text-xs text-[var(--text-muted)]">Naam / firma</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {customerName}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="card-mini">
                    <p className="text-xs text-[var(--text-muted)]">E-mail</p>
                    <p className="mt-1 break-all text-sm font-semibold text-[var(--text-main)]">
                      {display(customerProfile?.email)}
                    </p>
                  </div>
                  <div className="card-mini">
                    <p className="text-xs text-[var(--text-muted)]">BTW</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                      {display(customerProfile?.vat_number)}
                    </p>
                  </div>
                  <div className="card-mini">
                    <p className="text-xs text-[var(--text-muted)]">Mobiel</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                      {display(customerProfile?.mobile || customerProfile?.phone)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4">
                  <p className="text-xs text-[var(--text-muted)]">Adres klant</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {customerAddress || '—'}
                  </p>
                </div>

                {project.user_id ? (
                  <Link
                    href={`/admin/customers/${project.user_id}`}
                    className={projectActionButtonClass}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                      <UserRound className="h-3 w-3" />
                    </span>
                    <span className="pr-1">Open volledige klantfiche</span>
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  </Link>
                ) : null}
              </div>
            </section>

            <section className="order-1 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      Snelle acties
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Pas status, prijs en bestanden aan vanuit een centraal actieblok.
                    </p>
                  </div>
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                    <Zap className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="space-y-4 px-4 py-4">
                <form
                  action={updateProjectStatusAction}
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4"
                >
                  <input type="hidden" name="project_id" value={project.id} />
                  <h3 className="text-sm font-semibold text-[var(--text-main)]">
                    Status aanpassen
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <select
                      name="status"
                      defaultValue={project.status || 'ingediend'}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                    >
                      <option value="ingediend">Ingediend</option>
                      <option value="in_behandeling">In behandeling</option>
                      <option value="klaar_voor_betaling">
                        Klaar voor betaling
                      </option>
                      <option value="afgerond">Afgerond</option>
                    </select>
                    <button
                      type="submit"
                      className={projectActionButtonClass}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                        <Save className="h-3 w-3" />
                      </span>
                      <span className="pr-1">Opslaan</span>
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    </button>
                  </div>
                </form>

                <form
                  action={updateProjectPriceAction}
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4"
                >
                  <input type="hidden" name="project_id" value={project.id} />
                  <h3 className="text-sm font-semibold text-[var(--text-main)]">
                    Prijs aanpassen
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={project.price ?? ''}
                      placeholder="Prijs"
                      className="input-dark w-full px-3 py-2.5 text-sm"
                    />
                    <input
                      name="currency"
                      type="text"
                      defaultValue={project.currency || 'EUR'}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                    />
                    <button
                      type="submit"
                      className={projectActionButtonClass}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                        <Save className="h-3 w-3" />
                      </span>
                      <span className="pr-1">Opslaan</span>
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    </button>
                  </div>
                </form>

                <form
                  action={uploadProjectFileAction}
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4"
                >
                  <input type="hidden" name="project_id" value={project.id} />
                  <input type="hidden" name="upload_type" value="client_upload" />

                  <FileUploadDropzone
                    name="file"
                    label="Klantbestand uploaden"
                    description="Sleep een klantbestand hierheen of klik om een bestand te kiezen."
                    required
                  />

                  <div className="mt-3">
                    <button
                      type="submit"
                      className={projectActionButtonClass}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                        <UploadCloud className="h-3 w-3" />
                      </span>
                      <span className="pr-1">Upload opleverbestand</span>
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    </button>
                  </div>
                </form>

                <form
                  action={uploadProjectFileAction}
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4"
                >
                  <input type="hidden" name="project_id" value={project.id} />
                  <input type="hidden" name="upload_type" value="final_file" />

                  <FileUploadDropzone
                    name="file"
                    label="Opleverbestand uploaden"
                    description="Sleep een opleverbestand hierheen of klik om een bestand te kiezen."
                    required
                  />

                  <div className="mt-3">
                    <FileSubmitButton
                      idleText="Upload opleverbestand"
                      loadingText="Opleverbestand wordt geüpload..."
                      className={projectActionButtonClass}
                    />
                  </div>
                </form>
              </div>
            </section>

            <section className="order-2 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      Project timeline
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Historiek van wijzigingen en acties.
                    </p>
                  </div>
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                    <History className="h-4 w-4" />
                  </span>
                </div>
              </div>

              {safeTimeline.length === 0 ? (
                <div className="px-4 py-5 text-sm text-[var(--text-soft)]">
                  Nog geen timeline-items gevonden.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-soft)]">
                  {safeTimeline.map((item: any) => (
                    <div key={item.id} className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[var(--text-main)]">
                              {display(item.title)}
                            </p>
                            <span
                              className={`px-2 py-1 text-[10px] font-semibold ${getTimelineBadgeClass(
                                item.event_type
                              )}`}
                            >
                              {display(item.event_type)}
                            </span>
                          </div>
                          {item.description ? (
                            <p className="mt-1 text-sm text-[var(--text-soft)]">
                              {item.description}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-[var(--text-muted)]">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleString('nl-BE')
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="order-3 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      Bestanden
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Overzicht van uploads en opleverbestanden gekoppeld aan deze werf.
                    </p>
                  </div>
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                    <Files className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <FileList files={filesWithUrls} />

              {filesWithUrls.length > 0 && (
                <div className="border-t border-[var(--border-soft)] px-4 py-4">
                  <div className="grid gap-3">
                    {filesWithUrls.map((file: any) => (
                      <form key={file.id} action={deleteProjectFileAction}>
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
                        <input
                          type="hidden"
                          name="file_name"
                          value={file.file_name}
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
            </section>
          </div>
        </section>
      </div>
    </AppShell>
  )
}