import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnv(fp) {
  if (!fs.existsSync(fp)) return
  for (const raw of fs.readFileSync(fp, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const sep = line.indexOf('=')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    let val = line.slice(sep + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    if (!(key in process.env)) process.env[key] = val
  }
}
loadEnv(path.join(process.cwd(), '.env.local'))

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data, error } = await sb.from('projects').select('*').limit(1)
if (error) {
  console.log('ERROR:', error.message)
} else if (data.length === 0) {
  console.log('No projects found')
} else {
  console.log('COLUMNS:', Object.keys(data[0]).join(', '))
  console.log('SAMPLE:', JSON.stringify(data[0], null, 2))
}
