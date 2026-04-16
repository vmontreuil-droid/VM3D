import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    const { count, error } = await adminSupabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', user.id)
      .in('status', ['nieuw', 'in_behandeling', 'wacht_op_klant'])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ openCount: count ?? 0 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onbekende fout.' },
      { status: 500 }
    )
  }
}
