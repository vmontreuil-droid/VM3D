import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import FromOfferteClient from './from-offerte-client'

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}u ${m.toString().padStart(2, '0')}m`
}

async function createFactuurFromOfferte(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()
  const offerteId = formData.get('offerte_id') as string
  const dueDateRaw = formData.get('due_date') as string
  const notes = formData.get('notes') as string
  const timeEntryIds = formData.getAll('time_entry_ids').map(Number).filter(Boolean)
  const noteIds = formData.getAll('note_ids').map(Number).filter(Boolean)
  const hourlyRate = Number(formData.get('hourly_rate')) || 0

  const { data: offerte } = await adminSupabase
    .from('offertes')
    .select('*')
    .eq('id', Number(offerteId))
    .single()
  if (!offerte) redirect('/admin/offerte?error=not_found')

  const { data: offerteLines } = await adminSupabase
    .from('offerte_lines')
    .select('*')
    .eq('offerte_id', offerte.id)
    .order('position')

  // Fetch selected time entries
  let timeEntries: any[] = []
  if (timeEntryIds.length > 0) {
    const { data } = await adminSupabase
      .from('time_entries')
      .select('*')
      .in('id', timeEntryIds)
    timeEntries = data || []
  }

  // Fetch selected notes
  let noteTexts: string[] = []
  if (noteIds.length > 0) {
    const { data } = await adminSupabase
      .from('admin_notes')
      .select('content')
      .in('id', noteIds)
    noteTexts = (data || []).map((n: any) => n.content).filter(Boolean)
  }

  // Recalculate totals incl. time entries
  const vatRate = parseFloat((offerte.vat_rate || '21%').replace('%', '')) / 100
  let timeSub = 0
  for (const entry of timeEntries) {
    timeSub += ((entry.duration_seconds || 0) / 3600) * hourlyRate
  }
  const newSub = Number(offerte.subtotal) + timeSub
  const newVat = Number(offerte.vat_amount) + timeSub * vatRate
  const newTotal = newSub + newVat

  // Combine notes
  const parts = [notes || offerte.notes || '', ...noteTexts].filter(Boolean)
  const allNotes = parts.join('\n\n') || null

  // Generate factuur number
  const year = new Date().getFullYear()
  const { count } = await adminSupabase
    .from('facturen')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)
  const factuurNumber = `FAC-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  // Create factuur
  const { data: factuur, error: factuurError } = await adminSupabase
    .from('facturen')
    .insert({
      factuur_number: factuurNumber,
      offerte_id: offerte.id,
      customer_id: offerte.customer_id,
      project_id: offerte.project_id,
      created_by: user.id,
      status: 'concept',
      subject: offerte.subject,
      description: offerte.description,
      due_date: dueDateRaw || null,
      currency: offerte.currency,
      vat_rate: offerte.vat_rate,
      payment_terms: offerte.payment_terms,
      notes: allNotes,
      subtotal: newSub,
      vat_amount: newVat,
      total: newTotal,
    })
    .select('id')
    .single()

  if (factuurError || !factuur) {
    console.error('createFactuur error:', factuurError)
    redirect(`/admin/facturen/from-offerte/${offerteId}?error=save`)
  }

  // Copy offerte lines
  const safeLines = offerteLines || []
  const lineInserts: any[] = safeLines.map((line: any) => ({
    factuur_id: factuur.id,
    position: line.position,
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    unit_price: line.unit_price,
    vat_rate: line.vat_rate,
    line_total: line.line_total,
  }))

  // Add time entry lines after offerte lines
  const maxPos = safeLines.reduce((max: number, l: any) => Math.max(max, l.position || 0), 0)
  timeEntries.forEach((entry, i) => {
    const hours = Math.round((entry.duration_seconds || 0) / 3600 * 100) / 100
    const lineTotal = Math.round(hours * hourlyRate * 100) / 100
    lineInserts.push({
      factuur_id: factuur.id,
      position: maxPos + i + 1,
      description: `Tijdsregistratie: ${entry.description || 'Uitgevoerd werk'} (${fmtDuration(entry.duration_seconds || 0)})`,
      quantity: hours,
      unit: 'uur',
      unit_price: hourlyRate,
      vat_rate: offerte.vat_rate,
      line_total: lineTotal,
    })
  })

  if (lineInserts.length > 0) {
    await adminSupabase.from('factuur_lines').insert(lineInserts)
  }

  if (offerte.project_id) {
    await adminSupabase
      .from('projects')
      .update({ status: 'facturatie' })
      .eq('id', offerte.project_id)
  }

  redirect(`/admin/facturen?created=${factuur.id}`)
}

type Props = {
  params?: Promise<{ offerteId: string }>
  searchParams?: Promise<{ error?: string }>
}

export default async function FactuurFromOffertePage({ params, searchParams }: Props) {
  const resolvedParams = params ? await params : { offerteId: '' }
  const resolvedSearchParams = searchParams ? await searchParams : {}

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()

  const { data: offerte } = await adminSupabase
    .from('offertes')
    .select('*')
    .eq('id', Number(resolvedParams.offerteId))
    .single()
  if (!offerte) redirect('/admin/offerte')

  let customerName = 'Onbekende klant'
  if (offerte.customer_id) {
    const { data: customer } = await adminSupabase
      .from('profiles')
      .select('company_name, full_name, email')
      .eq('id', offerte.customer_id)
      .single()
    if (customer) {
      customerName = customer.company_name || customer.full_name || customer.email || 'Onbekend'
    }
  }

  const { data: lines } = await adminSupabase
    .from('offerte_lines')
    .select('*')
    .eq('offerte_id', offerte.id)
    .order('position')

  // Billable completed time entries for this project
  let timeEntries: any[] = []
  if (offerte.project_id) {
    const { data } = await adminSupabase
      .from('time_entries')
      .select('id, description, started_at, duration_seconds')
      .eq('project_id', offerte.project_id)
      .eq('billable', true)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: true })
    timeEntries = data || []
  }

  // Admin notes linked to this project
  let adminNotes: any[] = []
  if (offerte.project_id) {
    const { data } = await adminSupabase
      .from('admin_notes')
      .select('id, content, created_at')
      .eq('linked_project_id', offerte.project_id)
      .order('created_at', { ascending: false })
    adminNotes = data || []
  }

  const defaultDueDate = new Date()
  defaultDueDate.setDate(defaultDueDate.getDate() + 30)
  const dueDateStr = defaultDueDate.toISOString().split('T')[0]

  return (
    <FromOfferteClient
      offerte={offerte}
      lines={lines || []}
      timeEntries={timeEntries}
      adminNotes={adminNotes}
      customerName={customerName}
      error={resolvedSearchParams.error}
      onSubmit={createFactuurFromOfferte}
      defaultDueDate={dueDateStr}
    />
  )
}
