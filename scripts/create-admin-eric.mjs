// One-off: maak admin-account voor Eric Soulard.
// Gebruik: node --env-file=.env.local scripts/create-admin-eric.mjs
//   (of: node --env-file=.env scripts/create-admin-eric.mjs)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const email = 'eric.soulard@ats-topographie.fr'
const password = 'Picon2000&@&'
const fullName = 'Eric Soulard'
const companyName = 'ATS Topographie'

async function main() {
  // 1. Bestaat de gebruiker al?
  const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const found = existing?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

  let userId
  if (found) {
    console.log('Auth user bestaat al:', found.id, '— wachtwoord wordt overschreven en email bevestigd.')
    const { error: updErr } = await supabase.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, company_name: companyName },
    })
    if (updErr) {
      console.error('Update mislukt:', updErr.message)
      process.exit(1)
    }
    userId = found.id
  } else {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, company_name: companyName },
    })
    if (createErr) {
      console.error('Creatie mislukt:', createErr.message)
      process.exit(1)
    }
    console.log('Auth user aangemaakt:', created.user.id)
    userId = created.user.id
  }

  // 2. Profile met role=admin upserten
  const { error: profErr } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      role: 'admin',
      full_name: fullName,
      company_name: companyName,
    })
  if (profErr) {
    console.error('Profile upsert mislukt:', profErr.message)
    process.exit(1)
  }

  console.log('✓ Admin klaar:', email, '(role=admin, email_confirmed=true)')
  console.log('  → kan direct inloggen op /login')
}

main()
