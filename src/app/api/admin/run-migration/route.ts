import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminSupabase = createAdminClient()

  // Create offertes table
  const { error: e1 } = await adminSupabase.rpc('exec_sql' as any, {
    sql: `
      create table if not exists public.offertes (
        id bigint generated always as identity primary key,
        offerte_number text not null,
        customer_id uuid references public.profiles(id) on delete set null,
        project_id bigint references public.projects(id) on delete set null,
        created_by uuid references public.profiles(id) on delete set null,
        status text not null default 'concept' check (status in ('concept', 'verstuurd', 'wacht_op_klant', 'goedgekeurd', 'afgekeurd', 'verlopen')),
        subject text, description text, valid_until date,
        currency text not null default 'EUR', vat_rate text default '21%',
        payment_terms text, notes text,
        subtotal numeric not null default 0, vat_amount numeric not null default 0, total numeric not null default 0,
        created_at timestamptz not null default now(), updated_at timestamptz not null default now()
      );
    `
  })

  return NextResponse.json({ 
    message: 'Attempted migration',
    offertesError: e1?.message || null,
    note: 'If errors say function does not exist, run the SQL manually in Supabase SQL Editor'
  })
}
