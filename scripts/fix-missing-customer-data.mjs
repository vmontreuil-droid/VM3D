import { createAdminClient } from '@/lib/supabase/admin'

async function fixMissingCustomerData() {
  const supabase = createAdminClient()

  // Zoek klanten met ontbrekende bedrijfsnaam of btw-nummer
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, email, vat_number')
    .or('company_name.is.null,company_name.eq."",vat_number.is.null,vat_number.eq.""')
    .limit(20)

  if (error) {
    console.error('Fout bij ophalen profielen:', error)
    return
  }

  for (const profile of profiles ?? []) {
    // Probeer bedrijfsnaam op te halen via VAT lookup als vat_number bestaat
    if (profile.vat_number) {
      try {
        const response = await fetch('https://your-domain/api/vat-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vatNumber: profile.vat_number }),
        })
        const data = await response.json()
        if (data.valid && data.companyName) {
          await supabase
            .from('profiles')
            .update({ company_name: data.companyName })
            .eq('id', profile.id)
          console.log(`Bedrijfsnaam aangevuld voor ${profile.email}`)
        }
      } catch (e) {
        console.error('VAT lookup error:', e)
      }
    }
  }
}

fixMissingCustomerData()
