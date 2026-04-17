import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 }) }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Geen toegang.' }, { status: 403 }) }
  }
  return { admin: createAdminClient() }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machineId = parseInt(id, 10)
  if (Number.isNaN(machineId)) {
    return NextResponse.json({ error: 'Ongeldig id.' }, { status: 400 })
  }
  const auth = await assertAdmin()
  if (auth.error) return auth.error
  const { data, error } = await auth.admin
    .from('machines')
    .select('*')
    .eq('id', machineId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Machine niet gevonden.' }, { status: 404 })
  return NextResponse.json({ machine: data })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machineId = parseInt(id, 10)
  if (Number.isNaN(machineId)) {
    return NextResponse.json({ error: 'Ongeldig id.' }, { status: 400 })
  }
  const auth = await assertAdmin()
  if (auth.error) return auth.error
  const admin = auth.admin

  const body = await req.json()

  const updates: Record<string, unknown> = {}

  if (typeof body.name === 'string') updates.name = body.name.trim()
  if (typeof body.machine_type === 'string') {
    const t = body.machine_type.trim()
    if (t === 'excavator' || t === 'bulldozer') updates.machine_type = t
  }
  if (typeof body.brand === 'string') updates.brand = body.brand.trim().toUpperCase()
  if (typeof body.model === 'string') updates.model = body.model.trim()
  if (body.tonnage !== undefined) {
    const n = body.tonnage === '' || body.tonnage === null ? null : Number(body.tonnage)
    if (n !== null && Number.isNaN(n)) {
      return NextResponse.json({ error: 'Ongeldige tonnage.' }, { status: 400 })
    }
    updates.tonnage = n
  }
  if (body.year !== undefined) {
    const y = body.year === '' || body.year === null ? null : parseInt(String(body.year), 10)
    if (y !== null && Number.isNaN(y)) {
      return NextResponse.json({ error: 'Ongeldig bouwjaar.' }, { status: 400 })
    }
    updates.year = y
  }
  if (body.guidance_system !== undefined) {
    const g = body.guidance_system ? String(body.guidance_system).trim().toUpperCase() : null
    updates.guidance_system = g || null
  }
  if (body.serial_number !== undefined) {
    const s = body.serial_number ? String(body.serial_number).trim() : null
    updates.serial_number = s || null
  }
  if (body.project_id !== undefined) {
    if (body.project_id === null || body.project_id === '') {
      updates.project_id = null
    } else {
      const pid = parseInt(String(body.project_id), 10)
      if (Number.isNaN(pid)) {
        return NextResponse.json({ error: 'Ongeldige werf.' }, { status: 400 })
      }
      updates.project_id = pid
    }
  }
  if (typeof body.userId === 'string' && body.userId.trim()) {
    const ownerId = body.userId.trim()
    const { data: owner } = await admin
      .from('profiles')
      .select('id')
      .eq('id', ownerId)
      .maybeSingle()
    if (!owner) {
      return NextResponse.json({ error: 'Klant niet gevonden.' }, { status: 400 })
    }
    updates.user_id = ownerId
  }

  // If project_id set, verify it belongs to the (new or existing) owner
  if (updates.project_id) {
    const ownerId =
      (updates.user_id as string | undefined) ??
      (
        await admin
          .from('machines')
          .select('user_id')
          .eq('id', machineId)
          .single()
      ).data?.user_id
    if (!ownerId) {
      return NextResponse.json({ error: 'Eigenaar niet gevonden.' }, { status: 400 })
    }
    const { data: proj } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', updates.project_id)
      .maybeSingle()
    if (!proj || proj.user_id !== ownerId) {
      return NextResponse.json(
        { error: 'Werf hoort niet bij deze klant.' },
        { status: 400 }
      )
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Geen wijzigingen.' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('machines')
    .update(updates)
    .eq('id', machineId)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ machine: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machineId = parseInt(id, 10)
  if (Number.isNaN(machineId)) {
    return NextResponse.json({ error: 'Ongeldig id.' }, { status: 400 })
  }
  const auth = await assertAdmin()
  if (auth.error) return auth.error
  const { error } = await auth.admin.from('machines').delete().eq('id', machineId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
