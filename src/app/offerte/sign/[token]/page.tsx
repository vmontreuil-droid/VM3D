import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import SignClient from './sign-client'

export default async function SignOffertePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const adminSupabase = createAdminClient()

  const { data: offerte } = await adminSupabase
    .from('offertes')
    .select('*')
    .eq('signature_token', token)
    .single()

  if (!offerte) notFound()

  const { data: lines } = await adminSupabase
    .from('offerte_lines')
    .select('*')
    .eq('offerte_id', offerte.id)
    .order('position')

  let customer = null
  if (offerte.customer_id) {
    const { data } = await adminSupabase
      .from('profiles')
      .select('company_name, full_name, email, phone, vat_number, street, house_number, bus, postal_code, city, country')
      .eq('id', offerte.customer_id)
      .single()
    customer = data
  }

  const { data: company } = await adminSupabase
    .from('profiles')
    .select('company_name, full_name, email, vat_number')
    .eq('id', offerte.created_by)
    .single()

  return (
    <SignClient
      offerte={offerte}
      lines={lines || []}
      customer={customer}
      company={company}
      token={token}
      alreadySigned={!!offerte.signed_at}
      signerNameDefault={offerte.signer_name}
      signedAt={offerte.signed_at}
    />
  )
}
