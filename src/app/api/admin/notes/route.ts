import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type NoteRow = {
  id: number
  content: string
  pinned: boolean
  linked_customer_id: string | null
  linked_project_id: number | null
  linked_machine_id: number | null
  created_at: string
}

async function enrich(notes: NoteRow[]) {
  if (!notes.length) return []
  const adminSupabase = createAdminClient()

  const customerIds = Array.from(new Set(notes.map((n) => n.linked_customer_id).filter(Boolean))) as string[]
  const projectIds = Array.from(new Set(notes.map((n) => n.linked_project_id).filter((v): v is number => v != null)))
  const machineIds = Array.from(new Set(notes.map((n) => n.linked_machine_id).filter((v): v is number => v != null)))

  const [customersRes, projectsRes, machinesRes] = await Promise.all([
    customerIds.length
      ? adminSupabase.from('profiles').select('id, company_name, full_name, email').in('id', customerIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string | null; full_name: string | null; email: string | null }[] }),
    projectIds.length
      ? adminSupabase.from('projects').select('id, name').in('id', projectIds)
      : Promise.resolve({ data: [] as { id: number; name: string | null }[] }),
    machineIds.length
      ? adminSupabase.from('machines').select('id, name, brand, model').in('id', machineIds)
      : Promise.resolve({ data: [] as { id: number; name: string | null; brand: string | null; model: string | null }[] }),
  ])

  const cMap = new Map(
    ((customersRes.data as { id: string; company_name: string | null; full_name: string | null; email: string | null }[]) ?? [])
      .map((c) => [c.id, c.company_name || c.full_name || c.email || 'â€”']),
  )
  const pMap = new Map(
    ((projectsRes.data as { id: number; name: string | null }[]) ?? []).map((p) => [p.id, p.name ?? 'â€”']),
  )
  const mMap = new Map(
    ((machinesRes.data as { id: number; name: string | null; brand: string | null; model: string | null }[]) ?? [])
      .map((m) => [m.id, `${m.brand || ''} ${m.model || ''} Â· ${m.name || ''}`.trim()]),
  )

  return notes.map((n) => {
    if (n.linked_machine_id != null) {
      return { ...n, target_kind: 'machine' as const, target_label: mMap.get(n.linked_machine_id) ?? null }
    }
    if (n.linked_project_id != null) {
      return { ...n, target_kind: 'project' as const, target_label: pMap.get(n.linked_project_id) ?? null }
    }
    if (n.linked_customer_id) {
      return { ...n, target_kind: 'customer' as const, target_label: cMap.get(n.linked_customer_id) ?? null }
    }
    return { ...n, target_kind: null, target_label: null }
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
    const { data: notes, error } = await adminSupabase
      .from('admin_notes')
      .select('id, content, pinned, linked_customer_id, linked_project_id, linked_machine_id, created_at')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ notes: await enrich((notes ?? []) as NoteRow[]) })
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
    const content = String(body.content || '').trim()
    if (!content) return NextResponse.json({ error: 'Inhoud is verplicht.' }, { status: 400 })

    const adminSupabase = createAdminClient()
    const { data: note, error } = await adminSupabase
      .from('admin_notes')
      .insert({
        created_by: user.id,
        content,
        linked_customer_id: body.linked_customer_id || null,
        linked_project_id: body.linked_project_id ? Number(body.linked_project_id) : null,
        linked_machine_id: body.linked_machine_id ? Number(body.linked_machine_id) : null,
      })
      .select('id, content, pinned, linked_customer_id, linked_project_id, linked_machine_id, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const [enriched] = await enrich([note as NoteRow])
    return NextResponse.json({ note: enriched })
  } catch {
    return NextResponse.json({ error: 'Onverwachte fout.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('id')
    if (!noteId) return NextResponse.json({ error: 'Geen id opgegeven.' }, { status: 400 })

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase.from('admin_notes').delete().eq('id', Number(noteId))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Onverwachte fout.' }, { status: 500 })
  }
}
