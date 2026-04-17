import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function randomCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return out
}

function randomPassword(length = 16) {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return out
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
    }

    const body = await req.json()

    const ownerUserId = String(body.userId || '').trim()
    const name = String(body.name || '').trim()
    const machineType = String(body.machine_type || 'excavator').trim()
    const brand = String(body.brand || '').trim()
    const model = String(body.model || '').trim()
    const tonnageRaw = body.tonnage
    const yearRaw = body.year
    const guidanceSystem = String(body.guidance_system || '').trim()
    const serialNumber = String(body.serial_number || '').trim()
    const projectIdRaw = body.project_id
    let connectionCode = String(body.connection_code || '').trim().toUpperCase()
    let connectionPassword = String(body.connection_password || '')

    if (!ownerUserId) {
      return NextResponse.json(
        { error: 'Selecteer eerst een klant.' },
        { status: 400 }
      )
    }
    if (!name) {
      return NextResponse.json(
        { error: 'Naam is verplicht.' },
        { status: 400 }
      )
    }
    if (!brand) {
      return NextResponse.json(
        { error: 'Merk is verplicht.' },
        { status: 400 }
      )
    }
    if (!model) {
      return NextResponse.json(
        { error: 'Model is verplicht.' },
        { status: 400 }
      )
    }
    const tonnage =
      tonnageRaw === '' || tonnageRaw === null || tonnageRaw === undefined
        ? null
        : Number(tonnageRaw)
    if (tonnage === null || Number.isNaN(tonnage)) {
      return NextResponse.json(
        { error: 'Tonnage is verplicht.' },
        { status: 400 }
      )
    }

    const year =
      yearRaw === '' || yearRaw === null || yearRaw === undefined
        ? null
        : parseInt(String(yearRaw), 10)

    const adminSupabase = createAdminClient()

    // Verify customer exists and is a client
    const { data: ownerProfile, error: ownerError } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('id', ownerUserId)
      .single()
    if (ownerError || !ownerProfile) {
      return NextResponse.json(
        { error: 'Klant niet gevonden.' },
        { status: 400 }
      )
    }

    // Optional project must belong to that customer
    let projectId: number | null = null
    if (projectIdRaw) {
      projectId = parseInt(String(projectIdRaw), 10)
      if (Number.isNaN(projectId)) projectId = null
      if (projectId !== null) {
        const { data: proj } = await adminSupabase
          .from('projects')
          .select('id, user_id')
          .eq('id', projectId)
          .single()
        if (!proj || proj.user_id !== ownerUserId) {
          return NextResponse.json(
            { error: 'Werf hoort niet bij deze klant.' },
            { status: 400 }
          )
        }
      }
    }

    if (!connectionCode) connectionCode = randomCode(8)
    if (!connectionPassword) connectionPassword = randomPassword(16)

    // Ensure connection_code is unique (retry up to 5 times if collision)
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existing } = await adminSupabase
        .from('machines')
        .select('id')
        .eq('connection_code', connectionCode)
        .maybeSingle()
      if (!existing) break
      connectionCode = randomCode(8)
    }

    const { data, error } = await adminSupabase
      .from('machines')
      .insert({
        user_id: ownerUserId,
        project_id: projectId,
        name,
        machine_type: machineType,
        brand: brand.toUpperCase(),
        model,
        tonnage,
        year,
        guidance_system: guidanceSystem ? guidanceSystem.toUpperCase() : null,
        serial_number: serialNumber || null,
        connection_code: connectionCode,
        connection_password: connectionPassword,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ machine: data })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Onbekende serverfout.',
      },
      { status: 500 }
    )
  }
}
