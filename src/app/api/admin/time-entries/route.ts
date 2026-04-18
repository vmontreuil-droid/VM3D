import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type EntryRow = {
  id: number
  project_id: number | null
  linked_customer_id: string | null
  linked_machine_id: number | null
  description: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  billable: boolean
}

async function enrich(entries: EntryRow[]) {
  if (!entries.length) return []
  const adminSupabase = createAdminClient()

  const customerIds = Array.from(new Set(entries.map((e) => e.linked_customer_id).filter(Boolean))) as string[]
  const projectIds = Array.from(new Set(entries.map((e) => e.project_id).filter((v): v is number => v != null)))
  const machineIds = Array.from(new Set(entries.map((e) => e.linked_machine_id).filter((v): v is number => v != null)))

  const [customersRes, projectsRes, machinesRes] = await Promise.all([
    customerIds.length
      ? adminSupabase.from('profiles').select('id, company_name, full_name, email').in('id', customerIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string | null; full_name: string | null; email: string | null }[] }),
    projectIds.length
      ? adminSupabase.from('projects').select('id, name, user_id').in('id', projectIds)
      : Promise.resolve({ data: [] as { id: number; name: string | null; user_id: string | null }[] }),
    machineIds.length
      ? adminSupabase.from('machines').select('id, name, brand, model').in('id', machineIds)
      : Promise.resolve({ data: [] as { id: number; name: string | null; brand: string | null; model: string | null }[] }),
  ])

  const projectCustomerIds = Array.from(
    new Set(((projectsRes.data as { user_id: string | null }[]) ?? []).map((p) => p.user_id).filter(Boolean)),
  ) as string[]

  const projectCustomersRes = projectCustomerIds.length
    ? await adminSupabase.from('profiles').select('id, company_name, full_name').in('id', projectCustomerIds)
    : { data: [] as { id: string; company_name: string | null; full_name: string | null }[] }

  const cMap = new Map(
    ((customersRes.data as { id: string; company_name: string | null; full_name: string | null; email: string | null }[]) ?? [])
      .map((c) => [c.id, c.company_name || c.full_name || c.email || 'â€”']),
  )
  const pcMap = new Map(
    ((projectCustomersRes.data as { id: string; company_name: string | null; full_name: string | null }[]) ?? [])
      .map((c) => [c.id, c.company_name || c.full_name || '']),
  )
  const pMap = new Map(
    ((projectsRes.data as { id: number; name: string | null; user_id: string | null }[]) ?? []).map((p) => {
      const customer = p.user_id ? pcMap.get(p.user_id) || '' : ''
      const label = customer && p.name ? `${customer} â€” ${p.name}` : (p.name || customer || 'â€”')
      return [p.id, label]
    }),
  )
  const mMap = new Map(
    ((machinesRes.data as { id: number; name: string | null; brand: string | null; model: string | null }[]) ?? [])
      .map((m) => [m.id, `${m.brand || ''} ${m.model || ''} Â· ${m.name || ''}`.trim()]),
  )

  return entries.map((e) => {
    if (e.linked_machine_id != null) {
      return { ...e, target_kind: 'machine' as const, target_label: mMap.get(e.linked_machine_id) ?? null }
    }
    if (e.project_id != null) {
      return { ...e, target_kind: 'project' as const, target_label: pMap.get(e.project_id) ?? null }
    }
    if (e.linked_customer_id) {
      return { ...e, target_kind: 'customer' as const, target_label: cMap.get(e.linked_customer_id) ?? null }
    }
    return { ...e, target_kind: null, target_label: null }
  })
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })

    const adminSupabase = createAdminClient()
    const { data: entries, error } = await adminSupabase
      .from('time_entries')
      .select('id, project_id, linked_customer_id, linked_machine_id, description, started_at, ended_at, duration_seconds, billable')
      .order('started_at', { ascending: false })
      .limit(15)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entries: await enrich((entries ?? []) as EntryRow[]) })
  } catch {
    return NextResponse.json({ error: 'Onverwachte fout.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })

    const body = await request.json()
    const action = String(body.action || '')

    const adminSupabase = createAdminClient()

    if (action === 'start') {
      const description = String(body.description || '').trim()
      if (!description) {
        return NextResponse.json({ error: 'Beschrijving is verplicht.' }, { status: 400 })
      }

      const kind = String(body.target_kind || '')
      const targetId = body.target_id

      const insertPayload: Record<string, unknown> = {
        created_by: user.id,
        description,
        started_at: new Date().toISOString(),
        project_id: null,
        linked_customer_id: null,
        linked_machine_id: null,
      }

      if (kind === 'project' && targetId) insertPayload.project_id = Number(targetId)
      else if (kind === 'customer' && targetId) insertPayload.linked_customer_id = String(targetId)
      else if (kind === 'machine' && targetId) insertPayload.linked_machine_id = Number(targetId)
      else {
        return NextResponse.json({ error: 'Kies een klant, werf of machine.' }, { status: 400 })
      }

      // Stop any running entries first
      const { data: running } = await adminSupabase
        .from('time_entries')
        .select('id, started_at')
        .is('ended_at', null)
        .eq('created_by', user.id)

      for (const entry of running ?? []) {
        const dur = Math.floor((Date.now() - new Date(entry.started_at).getTime()) / 1000)
        await adminSupabase.from('time_entries').update({
          ended_at: new Date().toISOString(),
          duration_seconds: dur,
        }).eq('id', entry.id)
      }

      const { error } = await adminSupabase.from('time_entries').insert(insertPayload)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (action === 'stop') {
      const entryId = Number(body.entry_id)
      if (!entryId) return NextResponse.json({ error: 'Geen entry_id.' }, { status: 400 })

      const { data: entry } = await adminSupabase
        .from('time_entries')
        .select('started_at')
        .eq('id', entryId)
        .single()

      if (!entry) return NextResponse.json({ error: 'Entry niet gevonden.' }, { status: 404 })

      const dur = Math.floor((Date.now() - new Date(entry.started_at).getTime()) / 1000)
      const { error } = await adminSupabase.from('time_entries').update({
        ended_at: new Date().toISOString(),
        duration_seconds: dur,
      }).eq('id', entryId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (action === 'delete') {
      const entryId = Number(body.entry_id)
      if (!entryId) return NextResponse.json({ error: 'Geen entry_id.' }, { status: 400 })
      const { error } = await adminSupabase.from('time_entries').delete().eq('id', entryId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Ongeldige actie.' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Onverwachte fout.' }, { status: 500 })
  }
}
