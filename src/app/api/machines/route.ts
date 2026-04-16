import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const body = await req.json()
  const { name, machine_type, brand, model, tonnage, year, guidance_system, serial_number, connection_code, connection_password, project_id } = body

  if (!name || !brand || !model || !tonnage || !connection_code || !connection_password) {
    return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Verify project belongs to user if provided
  if (project_id) {
    const { data: project } = await adminSupabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single()
    if (!project) {
      return NextResponse.json({ error: 'Werf niet gevonden' }, { status: 400 })
    }
  }

  const { data, error } = await adminSupabase
    .from('machines')
    .insert({
      user_id: user.id,
      name,
      machine_type,
      brand,
      model,
      tonnage: parseFloat(tonnage),
      year: year ? parseInt(year) : null,
      guidance_system: guidance_system || null,
      serial_number: serial_number || null,
      connection_code,
      connection_password,
      project_id: project_id ? parseInt(project_id) : null,
    })
    .select('*, project:projects(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID ontbreekt' }, { status: 400 })

  const adminSupabase = createAdminClient()

  // Verify machine belongs to user
  const { data: machine } = await adminSupabase
    .from('machines')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!machine) return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })

  const { error } = await adminSupabase
    .from('machines')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
