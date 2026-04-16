
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL of Service Role Key ontbreekt!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function deleteAllProjects() {
  const { error } = await supabase.from('projects').delete().neq('id', null)
  if (error) {
    console.error('Fout bij verwijderen projecten:', error)
  } else {
    console.log('Alle projecten succesvol verwijderd!')
  }
}

deleteAllProjects()
