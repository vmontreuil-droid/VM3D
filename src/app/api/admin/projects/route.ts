export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Supabase admin configuratie ontbreekt.' }, { status: 500 })
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { count, error } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ count })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Onbekende serverfout.' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/geocode'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

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

    const userId = String(body.userId || '').trim()
    const title = String(body.title || '').trim()
    const description = String(body.description || '').trim()
    const address = String(body.address || '').trim()
    const currency = String(body.currency || 'EUR').trim()
    const status = String(body.status || 'ingediend').trim()
    const price =
      body.price === '' || body.price === null || body.price === undefined
        ? null
        : Number(body.price)

    if (!userId) {
      return NextResponse.json(
        { error: 'Geen klant geselecteerd.' },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Projecttitel is verplicht.' },
        { status: 400 }
      )
    }

    const { latitude, longitude } = address
      ? await geocodeAddress(address)
      : { latitude: null, longitude: null }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert([
        {
          user_id: userId,
          title,
          description: description || null,
          address: address || null,
          price,
          currency,
          status,
          latitude,
          longitude,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('API /api/admin/projects insert fout:', error)
      return NextResponse.json(
        { error: error.message || 'Kon project niet aanmaken.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      project: data,
    })
  } catch (error) {
    console.error('API /api/admin/projects algemene fout:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Onbekende fout.',
      },
      { status: 500 }
    )
  }
}