import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import AppShell from '@/components/app-shell'
import ProjectMap from '@/components/projects/project-map'
import FileList from '@/components/files/file-list'
import FileUploadDropzone from '@/components/files/file-upload-dropzone'
import UploadTypeToggle from '@/components/files/upload-type-toggle'
import TimeTracker from '@/components/projects/time-tracker'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import FileSubmitButton from '@/components/files/file-submit-button'
import { geocodeAddress } from '@/lib/geocode'
import { ArrowLeft, UserRound, Save, UploadCloud, FileText, MapPin, StickyNote, Users, Zap, History, Files, BadgeCheck, CircleDollarSign, Receipt } from 'lucide-react'
const BUCKET_NAME = 'project-files'

const PROJECT_STATUS_STEPS = [
  { key: 'offerte_aangevraagd', label: 'Offerte aangevraagd' },
  { key: 'offerte_verstuurd', label: 'Offerte verstuurd' },
  { key: 'in_behandeling', label: 'In behandeling' },
  { key: 'facturatie', label: 'Facturatie' },
  { key: 'factuur_verstuurd', label: 'Factuur verstuurd' },
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
    case 'offerte_aangevraagd':
      return 'Offerte aangevraagd'
    case 'offerte_verstuurd':
      return 'Offerte verstuurd'
    case 'in_behandeling':
      return 'In behandeling'
    case 'facturatie':
      return 'Facturatie'
    case 'factuur_verstuurd':
      return 'Factuur verstuurd'
    case 'afgerond':
      return 'Afgerond'
    case 'ingediend':
      return 'Ingediend'
    case 'klaar_voor_betaling':
      return 'Klaar voor betaling'
    default:
      return 'Onbekend'
  }
}

function getStatusClass(status: string | null) {
  switch (status) {
    case 'offerte_aangevraagd':
    case 'ingediend':
      return 'badge-info'
    case 'offerte_verstuurd':
      return 'badge-warning'
    case 'in_behandeling':
      return 'badge-warning'
    case 'facturatie':
    case 'klaar_voor_betaling':
      return 'badge-warning'
    case 'factuur_verstuurd':
      return 'badge-info'
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
      return 10
    case 1:
      return 25
    case 2:
      return 50
    case 3:
      return 70
    case 4:
      return 85
    case 5:
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

async function startTimeEntryAction(projectId: number, description: string) {
  'use server'

  const { adminSupabase, user } = await requireAdminWithUser()

  await adminSupabase
    .from('time_entries')
    .insert({
      project_id: projectId,
      created_by: user.id,
      description,
      started_at: new Date().toISOString(),
    })

  redirect(`/admin/projects/${projectId}`)
}

async function stopTimeEntryAction(projectId: number, entryId: number) {
  'use server'

  const { adminSupabase } = await requireAdminWithUser()

  const { data: entry } = await adminSupabase
    .from('time_entries')
    .select('started_at')
    .eq('id', entryId)
    .single()

  if (!entry) return redirect(`/admin/projects/${projectId}`)

  const durationSeconds = Math.floor(
    (Date.now() - new Date(entry.started_at).getTime()) / 1000
  )

  await adminSupabase
    .from('time_entries')
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq('id', entryId)

  redirect(`/admin/projects/${projectId}`)
}

async function deleteTimeEntryAction(projectId: number, entryId: number) {
  'use server'

  const { adminSupabase } = await requireAdminWithUser()

  await adminSupabase
    .from('time_entries')
    .delete()
    .eq('id', entryId)

  redirect(`/admin/projects/${projectId}`)
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

async function startFacturatieAction(formData: FormData) {
  'use server'

  const { adminSupabase, user } = await requireAdminWithUser()

  const projectId = Number(String(formData.get('project_id') || '').trim())
  if (Number.isNaN(projectId)) redirect('/admin')

  // Find linked offerte
  const { data: offerte } = await adminSupabase
    .from('offertes')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!offerte) {
    redirect(`/admin/projects/${projectId}?error=no_offerte`)
  }

  // Check if factuur already exists for this offerte
  const { data: existingFactuur } = await adminSupabase
    .from('facturen')
    .select('id')
    .eq('offerte_id', offerte.id)
    .limit(1)
    .maybeSingle()

  if (existingFactuur) {
    // Factuur already exists, just update project status
    await adminSupabase
      .from('projects')
      .update({ status: 'facturatie' })
      .eq('id', projectId)

    redirect(`/admin/projects/${projectId}?status_saved=1`)
  }

  // Get offerte lines
  const { data: lines } = await adminSupabase
    .from('offerte_lines')
    .select('*')
    .eq('offerte_id', offerte.id)
    .order('position')

  // Generate factuur number
  const year = new Date().getFullYear()
  const { count } = await adminSupabase
    .from('facturen')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)

  const factuurNumber = `FAC-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  // Default due date: 30 days
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  // Create factuur
  const { data: factuur, error: factuurError } = await adminSupabase
    .from('facturen')
    .insert({
      factuur_number: factuurNumber,
      offerte_id: offerte.id,
      customer_id: offerte.customer_id,
      project_id: projectId,
      created_by: user.id,
      status: 'concept',
      subject: offerte.subject,
      description: offerte.description,
      due_date: dueDate.toISOString().split('T')[0],
      currency: offerte.currency,
      vat_rate: offerte.vat_rate,
      payment_terms: offerte.payment_terms,
      notes: offerte.notes,
      subtotal: offerte.subtotal,
      vat_amount: offerte.vat_amount,
      total: offerte.total,
    })
    .select('id')
    .single()

  if (factuurError || !factuur) {
    console.error('startFacturatieAction factuur error:', factuurError)
    redirect(`/admin/projects/${projectId}?error=factuur_create`)
  }

  // Copy lines
  if (lines && lines.length > 0) {
    await adminSupabase.from('factuur_lines').insert(
      lines.map((line: any) => ({
        factuur_id: factuur.id,
        position: line.position,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unit_price: line.unit_price,
        vat_rate: line.vat_rate,
        line_total: line.line_total,
      }))
    )
  }

  // Update project status
  await adminSupabase
    .from('projects')
    .update({ status: 'facturatie' })
    .eq('id', projectId)

  await addTimelineEvent({
    adminSupabase,
    projectId,
    eventType: 'status_changed',
    title: 'Facturatie gestart',
    description: `Factuur ${factuurNumber} werd automatisch aangemaakt.`,
    createdBy: user.id,
  })

  redirect(`/admin/projects/${projectId}?status_saved=1`)
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

  const { data: timeEntries } = await adminSupabase
    .from('time_entries')
    .select('id, description, started_at, ended_at, duration_seconds, billable')
    .eq('project_id', projectId)
    .order('started_at', { ascending: false })

  const safeTimeEntries = timeEntries ?? []

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
      <div className="space-y-2">
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
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:text-[var(--accent)]"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Dashboard
                  </Link>
                  {project.user_id && (
                    <Link
                      href={`/admin/customers/${project.user_id}/edit`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:text-[var(--accent)]"
                    >
                      <UserRound className="h-3 w-3" />
                      Klantfiche
                    </Link>
                  )}
                </div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Werffiche
                </p>

                <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  {display(project.name)}
                </h1>

                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  {display(project.address)}
                </p>
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

          {/* Compact progress bar */}
          <div className="border-b border-[var(--border-soft)] px-4 py-2 sm:px-5">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  <span>Voortgang</span>
                  <span>{getProjectProgressPercent(project.status)}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--bg-card-2)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${getProjectProgressPercent(project.status)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-1">
              {PROJECT_STATUS_STEPS.map((step, index) => {
                const isDone = currentIndex >= index
                const isCurrent = project.status === step.key
                return (
                  <div
                    key={step.key}
                    className={`flex-1 rounded-md px-2 py-1 text-center text-[10px] font-semibold ${
                      isCurrent
                        ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                        : isDone
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-[var(--bg-card-2)] text-[var(--text-muted)]'
                    }`}
                  >
                    {step.label}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-2 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-2">
            <section className="order-1 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[var(--text-main)]">
                    Locatie & kaart
                  </h2>
                  <MapPin className="h-4 w-4 text-[var(--accent)]" />
                </div>
              </div>

              <div className="px-4 py-2">
                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Adres</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-main)]">
                    {display(project.address)}
                  </p>
                </div>

                <div className="mt-2 overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
                  <div className="min-h-[180px] sm:min-h-[220px]">
                    <ProjectMap projects={[project]} />
                  </div>
                </div>
              </div>
            </section>

            <section className="order-2 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[var(--text-main)]">
                    Interne notities
                  </h2>
                  <StickyNote className="h-4 w-4 text-[var(--accent)]" />
                </div>
              </div>

              <div className="px-4 py-2">
                <form action={saveAdminNotesAction} className="space-y-2">
                  <input type="hidden" name="project_id" value={project.id} />
                  <textarea
                    name="admin_notes"
                    defaultValue={project.admin_notes || ''}
                    placeholder="Interne opmerkingen, opvolging, afspraken..."
                    className="input-dark min-h-[80px] w-full px-3 py-2 text-sm"
                  />
                  <div className="flex justify-end">
                    <button type="submit" className={projectActionButtonClass}>
                      <Save className="h-3 w-3 text-[var(--accent)]" />
                      <span className="pr-1">Opslaan</span>
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <section className="order-3 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[var(--text-main)]">
                    Projectgegevens
                  </h2>
                  <FileText className="h-4 w-4 text-[var(--accent)]" />
                </div>
              </div>

              <div className="grid gap-2 px-4 py-2 sm:grid-cols-2">
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Titel</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">{display(project.name)}</p>
                </div>
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Status</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">{getStatusLabel(project.status)}</p>
                </div>
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Aangemaakt</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {project.created_at ? new Date(project.created_at).toLocaleDateString('nl-BE') : '—'}
                  </p>
                </div>
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Prijs</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {project.price != null ? `${project.price} ${project.currency || 'EUR'}` : 'Nog niet bepaald'}
                  </p>
                </div>
                <div className="card-mini sm:col-span-2">
                  <p className="text-xs text-[var(--text-muted)]">Beschrijving</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-main)]">{display(project.description)}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-2">
            <section className="order-1 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[var(--text-main)]">
                    Snelle acties
                  </h2>
                  <Zap className="h-4 w-4 text-[var(--accent)]" />
                </div>
              </div>

              <div className="space-y-2 px-4 py-2">
                <form
                  action={updateProjectStatusAction}
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3"
                >
                  <input type="hidden" name="project_id" value={project.id} />
                  <h3 className="text-xs font-semibold text-[var(--text-main)]">Status aanpassen</h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <select
                      name="status"
                      defaultValue={project.status || 'offerte_aangevraagd'}
                      className="input-dark w-full px-3 py-2 text-sm"
                    >
                      <option value="offerte_aangevraagd">Offerte aangevraagd</option>
                      <option value="offerte_verstuurd">Offerte verstuurd</option>
                      <option value="in_behandeling">In behandeling</option>
                      <option value="facturatie">Facturatie</option>
                      <option value="factuur_verstuurd">Factuur verstuurd</option>
                      <option value="afgerond">Afgerond</option>
                    </select>
                    <button type="submit" className={projectActionButtonClass}>
                      <Save className="h-3 w-3 text-[var(--accent)]" />
                      <span className="pr-1">Opslaan</span>
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    </button>
                  </div>
                </form>

                <TimeTracker
                  projectId={project.id}
                  entries={safeTimeEntries}
                  onStart={startTimeEntryAction.bind(null, project.id)}
                  onStop={stopTimeEntryAction.bind(null, project.id)}
                  onDelete={deleteTimeEntryAction.bind(null, project.id)}
                />

                {project.status === 'in_behandeling' && (
                  <form
                    action={startFacturatieAction}
                    className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3"
                  >
                    <input type="hidden" name="project_id" value={project.id} />
                    <h3 className="text-xs font-semibold text-[var(--text-main)]">Facturatie starten</h3>
                    <p className="mt-1 text-[11px] text-[var(--text-soft)]">
                      Maakt automatisch een factuur aan op basis van de gekoppelde offerte.
                    </p>
                    <div className="mt-2">
                      <button type="submit" className={projectActionButtonClass}>
                        <Receipt className="h-3 w-3 text-purple-400" />
                        <span className="pr-1">Factuur opmaken</span>
                        <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-purple-400/80" />
                      </button>
                    </div>
                  </form>
                )}

                <form
                  action={uploadProjectFileAction}
                >
                  <input type="hidden" name="project_id" value={project.id} />
                  <UploadTypeToggle>
                    <FileUploadDropzone
                      name="file"
                      label="Bestand uploaden"
                      description="Sleep een bestand hierheen of klik om te kiezen."
                      required
                    />
                    <div className="mt-2">
                      <button type="submit" className={projectActionButtonClass}>
                        <UploadCloud className="h-3 w-3 text-[var(--accent)]" />
                        <span className="pr-1">Uploaden</span>
                        <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                      </button>
                    </div>
                  </UploadTypeToggle>
                </form>
              </div>
            </section>

            <section className="order-2 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[var(--text-main)]">
                    Timeline
                  </h2>
                  <History className="h-4 w-4 text-[var(--accent)]" />
                </div>
              </div>

              {safeTimeline.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[var(--text-soft)]">
                  Nog geen timeline-items.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-soft)]">
                  {safeTimeline.map((item: any) => (
                    <div key={item.id} className="px-4 py-2.5">
                      <div className="flex items-start gap-2">
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-[var(--accent)]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[var(--text-main)]">
                              {display(item.title)}
                            </p>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold ${getTimelineBadgeClass(item.event_type)}`}>
                              {display(item.event_type)}
                            </span>
                          </div>
                          {item.description && (
                            <p className="mt-0.5 text-xs text-[var(--text-soft)]">{item.description}</p>
                          )}
                          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                            {item.created_at ? new Date(item.created_at).toLocaleString('nl-BE') : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="order-3 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[var(--text-main)]">
                    Bestanden
                  </h2>
                  <Files className="h-4 w-4 text-[var(--accent)]" />
                </div>
              </div>

              <FileList files={filesWithUrls} />

              {filesWithUrls.length > 0 && (
                <div className="border-t border-[var(--border-soft)] px-4 py-2">
                  <div className="grid gap-2">
                    {filesWithUrls.map((file: any) => (
                      <form key={file.id} action={deleteProjectFileAction}>
                        <input type="hidden" name="project_id" value={project.id} />
                        <input type="hidden" name="file_id" value={file.id} />
                        <input type="hidden" name="file_path" value={file.file_path} />
                        <input type="hidden" name="file_name" value={file.file_name} />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="inline-flex rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-200 transition hover:bg-red-500/20"
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

            <section className="order-4 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="border-b border-[var(--border-soft)] px-4 py-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[var(--text-main)]">
                    Klantkaart
                  </h2>
                  <Users className="h-4 w-4 text-[var(--accent)]" />
                </div>
              </div>

              <div className="grid gap-2 px-4 py-2">
                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                  <p className="text-xs text-[var(--text-muted)]">Naam / firma</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">{customerName}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="card-mini">
                    <p className="text-xs text-[var(--text-muted)]">E-mail</p>
                    <p className="mt-0.5 break-all text-sm font-semibold text-[var(--text-main)]">{display(customerProfile?.email)}</p>
                  </div>
                  <div className="card-mini">
                    <p className="text-xs text-[var(--text-muted)]">BTW</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">{display(customerProfile?.vat_number)}</p>
                  </div>
                  <div className="card-mini">
                    <p className="text-xs text-[var(--text-muted)]">Mobiel</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">{display(customerProfile?.mobile || customerProfile?.phone)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                  <p className="text-xs text-[var(--text-muted)]">Adres klant</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">{customerAddress || '—'}</p>
                </div>

                {project.user_id && (
                  <Link
                    href={`/admin/customers/${project.user_id}/edit`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] transition hover:text-[var(--accent)]/80"
                  >
                    <UserRound className="h-3 w-3" />
                    Open volledige klantfiche
                  </Link>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </AppShell>
  )
}