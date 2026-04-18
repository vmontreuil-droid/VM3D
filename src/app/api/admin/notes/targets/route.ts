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

    const [customersRes, projectsRes, machinesRes] = await Promise.all([
      adminSupabase
        .from('profiles')
        .select('id, company_name, full_name, email, role')
        .neq('role', 'admin')
        .order('company_name', { ascending: true, nullsFirst: false })
        .limit(500),
      adminSupabase
        .from('projects')
        .select('id, name')
        .order('name', { ascending: true })
        .limit(500),
      adminSupabase
        .from('machines')
        .select('id, name, brand, model')
        .order('name', { ascending: true })
        .limit(500),
    ])

    const customers = (customersRes.data ?? []).map((c: any) => ({
      id: c.id,
      label: c.company_name || c.full_name || c.email || '—',
    }))
    const projects = (projectsRes.data ?? []).map((p: any) => ({
      id: p.id,
      label: p.name,
    }))
    const machines = (machinesRes.data ?? []).map((m: any) => ({
      id: m.id,
      label: `${m.brand || ''} ${m.model || ''} · ${m.name || ''}`.trim(),
    }))

    return NextResponse.json({ customers, projects, machines })
  } catch {
    return NextResponse.json({ error: 'Onverwachte fout.' }, { status: 500 })
  }
}
