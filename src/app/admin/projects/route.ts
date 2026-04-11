import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

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
      return NextResponse.json(
        { error: 'Niet ingelogd.' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Geen toegang.' },
        { status: 403 }
      )
    }

    const body = await req.json()

    const {
      userId,
      title,
      description,
      address,
      price,
      currency,
      status,
    } = body

    if (!userId || !title?.trim()) {
      return NextResponse.json(
        { error: 'Klant en projecttitel zijn verplicht.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert([
        {
          user_id: userId,
          title: title.trim(),
          description: description?.trim() || null,
          address: address?.trim() || null,
          price: price !== '' && price !== null ? Number(price) : null,
          currency: currency || 'EUR',
          status: status || 'ingediend',
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, project: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Onbekende fout.' },
      { status: 500 }
    )
  }
}