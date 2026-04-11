import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const projectId = Number(body.projectId)
    const latitude = Number(body.latitude)
    const longitude = Number(body.longitude)

    if (!projectId || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Ongeldige data.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

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

    const { error } = await supabase
      .from('projects')
      .update({
        latitude,
        longitude,
      })
      .eq('id', projectId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update coordinates error:', error)

    return NextResponse.json(
      { error: 'Interne fout bij opslaan van coördinaten.' },
      { status: 500 }
    )
  }
}