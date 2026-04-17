import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')?.trim()
    if (!userId) {
      return NextResponse.json({ projects: [] })
    }

    const adminSupabase = createAdminClient()
    const { data: projects, error } = await adminSupabase
      .from('projects')
      .select('id, name, address')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ projects: projects || [] })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Onbekende serverfout.',
      },
      { status: 500 }
    )
  }
}
