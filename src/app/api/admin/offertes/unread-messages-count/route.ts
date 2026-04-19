import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const adminSupabase = createAdminClient()
  const { count } = await adminSupabase
    .from('offerte_messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_type', 'customer')
    .is('read_at', null)

  return NextResponse.json({ count: count ?? 0 })
}
