// Script om alle projecten uit Supabase te verwijderen
import { createAdminClient } from '../src/lib/supabase/admin.js'

async function deleteAllProjects() {
  const supabase = createAdminClient()
  const { error } = await supabase.from('projects').delete().neq('id', null)
  if (error) {
    console.error('Fout bij verwijderen projecten:', error)
  } else {
    console.log('Alle projecten succesvol verwijderd!')
  }
}

deleteAllProjects()
