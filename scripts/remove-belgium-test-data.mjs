import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BATCH_TAG = 'BE-TEST-2026'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase credentials ontbreken in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function main() {
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, company_name')
    .ilike('comments', `%${BATCH_TAG}%`)

  if (profileError) {
    throw profileError
  }

  const userIds = (profiles ?? []).map((profile) => profile.id)
  if (userIds.length === 0) {
    console.log(`Geen testdata gevonden voor ${BATCH_TAG}.`)
    return
  }

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .in('user_id', userIds)

  if (projectsError) {
    throw projectsError
  }

  const projectIds = (projects ?? []).map((project) => project.id)

  if (projectIds.length > 0) {
    const { error: timelineError } = await supabase
      .from('project_timeline')
      .delete()
      .in('project_id', projectIds)

    if (timelineError) {
      throw timelineError
    }

    const { error: filesError } = await supabase
      .from('project_files')
      .delete()
      .in('project_id', projectIds)

    if (filesError) {
      throw filesError
    }

    const { error: projectDeleteError } = await supabase
      .from('projects')
      .delete()
      .in('id', projectIds)

    if (projectDeleteError) {
      throw projectDeleteError
    }
  }

  const { error: profileDeleteError } = await supabase
    .from('profiles')
    .delete()
    .in('id', userIds)

  if (profileDeleteError) {
    throw profileDeleteError
  }

  for (const userId of userIds) {
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      console.warn(`Auth user kon niet verwijderd worden: ${userId}`, error.message)
    }
  }

  console.log(`Verwijderd: ${userIds.length} testklanten en ${projectIds.length} testprojecten (${BATCH_TAG}).`)
}

main().catch((error) => {
  console.error('Cleanup failed:', error)
  process.exit(1)
})
