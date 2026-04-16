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
    const { data: notes, error } = await adminSupabase
      .from('admin_notes')
      .select('id, content, pinned, linked_customer_id, linked_project_id, created_at')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ notes: notes ?? [] })
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
      })
      .select('id, content, pinned, linked_customer_id, linked_project_id, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ note })
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
