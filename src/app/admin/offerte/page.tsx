import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import OffertesPageClient from './offertes-page-client'

export default async function AdminOffertePage() {
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

  const { data: offertes } = await adminSupabase
    .from('offertes')
    .select('id, offerte_number, subject, status, total, customer_id, created_at, valid_until')
    .order('created_at', { ascending: false })

  // Klant namen ophalen
  const customerIds = [...new Set((offertes || []).map((o: any) => o.customer_id).filter(Boolean))]
  let customerMap: Record<string, string> = {}
  if (customerIds.length > 0) {
    const { data: customers } = await adminSupabase
      .from('profiles')
      .select('id, company_name, full_name')
      .in('id', customerIds)
    if (customers) {
      customerMap = Object.fromEntries(
        customers.map((c: any) => [c.id, c.company_name || c.full_name || 'Onbekend'])
      )
    }
  }

  const offertesWithCustomer = (offertes || []).map((o: any) => ({
    ...o,
    customer_name: customerMap[o.customer_id] || null,
  }))

  return <OffertesPageClient offertes={offertesWithCustomer} />
}
