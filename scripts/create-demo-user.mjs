// scripts/create-demo-user.mjs
// Script om een demogebruiker aan te maken in Supabase
// Gebruik: node scripts/create-demo-user.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || '<JOUW_SUPABASE_URL>'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '<JOUW_SERVICE_ROLE_KEY>'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const email = 'demo@mv3d.be'
const password = 'Demo1234!'

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Demo Gebruiker',
      company_name: 'Demo Company',
      vat_number: 'BE0123456789',
      city: 'Demo City',
    },
  })
  if (error) {
    console.error('Fout bij aanmaken:', error)
    process.exit(1)
  }
  console.log('Demogebruiker aangemaakt:', data.user.email)
}

main()
