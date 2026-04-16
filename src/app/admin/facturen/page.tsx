import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import FacturenPageClient from './facturen-page-client'

export default async function AdminFacturenPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()

  const { data: facturen } = await adminSupabase
    .from('facturen')
    .select('id, factuur_number, subject, status, total, customer_id, created_at, due_date')
    .order('created_at', { ascending: false })

  const safeFacturen = facturen ?? []

  // Haal klantnamen op
  const customerIds = [...new Set(safeFacturen.map((f: any) => f.customer_id).filter(Boolean))]
  let customerMap = new Map<string, string>()

  if (customerIds.length > 0) {
    const { data: customers } = await adminSupabase
      .from('profiles')
      .select('id, company_name, full_name, email')
      .in('id', customerIds)

    if (customers) {
      customerMap = new Map(
        customers.map((c: any) => [
          c.id,
          c.company_name || c.full_name || c.email || 'Onbekend',
        ])
      )
    }
  }

  const facturenWithNames = safeFacturen.map((f: any) => ({
    id: f.id,
    factuur_number: f.factuur_number,
    subject: f.subject,
    status: f.status,
    total: f.total,
    customer_name: customerMap.get(f.customer_id) || null,
    created_at: f.created_at,
    due_date: f.due_date,
  }))

  return <FacturenPageClient facturen={facturenWithNames} />
}
