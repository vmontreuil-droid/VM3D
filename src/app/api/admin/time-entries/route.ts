import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
      .select('id, project_id, description, started_at, ended_at, duration_seconds, billable, projects(name, address, profiles(company_name, full_name))')
      .order('started_at', { ascending: false })
      .limit(15)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entries: entries ?? [] })
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
      const projectId = Number(body.project_id)
      const description = String(body.description || '').trim()
      if (!projectId || !description) {
        return NextResponse.json({ error: 'Project en beschrijving zijn verplicht.' }, { status: 400 })
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

      const { error } = await adminSupabase.from('time_entries').insert({
        project_id: projectId,
        created_by: user.id,
        description,
        started_at: new Date().toISOString(),
      })
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
