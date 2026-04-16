import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminMachinesClient from './admin-machines-client'

export default async function AdminMachinesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch all machines with project and customer info
  const { data: machines } = await adminSupabase
    .from('machines')
    .select('*, project:projects(name, user_id), owner:profiles!machines_user_id_fkey(company_name, full_name)')
    .order('created_at', { ascending: false })

  return (
    <AppShell isAdmin>
      <AdminMachinesClient machines={machines || []} />
    </AppShell>
  )
}
