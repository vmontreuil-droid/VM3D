// scripts/seed-machines.mjs
// Seeds 5 machines per werf for the 3DG demo customer
// Mix of real excavator/bulldozer models across brands
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'

// Load env from .env.local
try {
  const envContent = readFileSync('.env.local', 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx > 0) {
      const key = trimmed.substring(0, idx).trim()
      const val = trimmed.substring(idx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  }
} catch { config() }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const USER_3DG = '6a50eab0-ad68-483f-a444-dde2f252accb'

// Real machine models database
const EXCAVATORS = [
  // CAT
  { brand: 'CAT', model: '305.5 CR', tonnage: 5.4, name: 'CAT 305.5 CR' },
  { brand: 'CAT', model: '308 CR', tonnage: 8.2, name: 'CAT 308 CR' },
  { brand: 'CAT', model: '313 GC', tonnage: 13.5, name: 'CAT 313 GC' },
  { brand: 'CAT', model: '320 GC', tonnage: 22, name: 'CAT 320 GC' },
  { brand: 'CAT', model: '323', tonnage: 23.5, name: 'CAT 323' },
  { brand: 'CAT', model: '330 GC', tonnage: 30.2, name: 'CAT 330 GC' },
  { brand: 'CAT', model: '336', tonnage: 36.4, name: 'CAT 336' },
  { brand: 'CAT', model: '340', tonnage: 40, name: 'CAT 340' },
  { brand: 'CAT', model: '352', tonnage: 52, name: 'CAT 352' },
  { brand: 'CAT', model: '395', tonnage: 95, name: 'CAT 395' },
  // KOMATSU
  { brand: 'KOMATSU', model: 'PC55MR-5', tonnage: 5.3, name: 'Komatsu PC55MR-5' },
  { brand: 'KOMATSU', model: 'PC88MR-11', tonnage: 8.5, name: 'Komatsu PC88MR-11' },
  { brand: 'KOMATSU', model: 'PC138US-11', tonnage: 14.1, name: 'Komatsu PC138US-11' },
  { brand: 'KOMATSU', model: 'PC210LC-11', tonnage: 21.7, name: 'Komatsu PC210LC-11' },
  { brand: 'KOMATSU', model: 'PC228USLC-11', tonnage: 23.2, name: 'Komatsu PC228USLC-11' },
  { brand: 'KOMATSU', model: 'PC290LC-11', tonnage: 29.6, name: 'Komatsu PC290LC-11' },
  { brand: 'KOMATSU', model: 'PC360LC-11', tonnage: 36.7, name: 'Komatsu PC360LC-11' },
  { brand: 'KOMATSU', model: 'PC490LC-11', tonnage: 49.1, name: 'Komatsu PC490LC-11' },
  { brand: 'KOMATSU', model: 'PC800LC-8', tonnage: 80, name: 'Komatsu PC800LC-8' },
  // HITACHI
  { brand: 'HITACHI', model: 'ZX55U-6', tonnage: 5.3, name: 'Hitachi ZX55U-6' },
  { brand: 'HITACHI', model: 'ZX85USB-6', tonnage: 8.7, name: 'Hitachi ZX85USB-6' },
  { brand: 'HITACHI', model: 'ZX135US-7', tonnage: 13.9, name: 'Hitachi ZX135US-7' },
  { brand: 'HITACHI', model: 'ZX210LC-7', tonnage: 21.1, name: 'Hitachi ZX210LC-7' },
  { brand: 'HITACHI', model: 'ZX250LC-7', tonnage: 25.1, name: 'Hitachi ZX250LC-7' },
  { brand: 'HITACHI', model: 'ZX300LC-7', tonnage: 30.5, name: 'Hitachi ZX300LC-7' },
  { brand: 'HITACHI', model: 'ZX350LC-7', tonnage: 35.7, name: 'Hitachi ZX350LC-7' },
  { brand: 'HITACHI', model: 'ZX490LCH-7', tonnage: 49.5, name: 'Hitachi ZX490LCH-7' },
  // DEVELON (ex-DOOSAN)
  { brand: 'DEVELON', model: 'DX55R-7', tonnage: 5.5, name: 'Develon DX55R-7' },
  { brand: 'DEVELON', model: 'DX85R-7', tonnage: 8.8, name: 'Develon DX85R-7' },
  { brand: 'DEVELON', model: 'DX140LCR-7', tonnage: 14.5, name: 'Develon DX140LCR-7' },
  { brand: 'DEVELON', model: 'DX225LC-7', tonnage: 22.8, name: 'Develon DX225LC-7' },
  { brand: 'DEVELON', model: 'DX300LC-7', tonnage: 30.3, name: 'Develon DX300LC-7' },
  { brand: 'DEVELON', model: 'DX380LC-7', tonnage: 38, name: 'Develon DX380LC-7' },
  { brand: 'DEVELON', model: 'DX530LC-7', tonnage: 52, name: 'Develon DX530LC-7' },
  // VOLVO
  { brand: 'VOLVO', model: 'ECR58', tonnage: 5.8, name: 'Volvo ECR58' },
  { brand: 'VOLVO', model: 'ECR88 Plus', tonnage: 8.8, name: 'Volvo ECR88 Plus' },
  { brand: 'VOLVO', model: 'EC140E', tonnage: 14.6, name: 'Volvo EC140E' },
  { brand: 'VOLVO', model: 'EC220E', tonnage: 22, name: 'Volvo EC220E' },
  { brand: 'VOLVO', model: 'EC300E', tonnage: 30.2, name: 'Volvo EC300E' },
  { brand: 'VOLVO', model: 'EC380E', tonnage: 38, name: 'Volvo EC380E' },
  { brand: 'VOLVO', model: 'EC480E', tonnage: 48, name: 'Volvo EC480E' },
  { brand: 'VOLVO', model: 'EC750E', tonnage: 75, name: 'Volvo EC750E' },
  // LIEBHERR
  { brand: 'LIEBHERR', model: 'A910 Compact', tonnage: 11.5, name: 'Liebherr A910 Compact' },
  { brand: 'LIEBHERR', model: 'R920 Compact', tonnage: 21, name: 'Liebherr R920 Compact' },
  { brand: 'LIEBHERR', model: 'R924', tonnage: 24, name: 'Liebherr R924' },
  { brand: 'LIEBHERR', model: 'R930', tonnage: 30, name: 'Liebherr R930' },
  { brand: 'LIEBHERR', model: 'R938', tonnage: 38, name: 'Liebherr R938' },
  { brand: 'LIEBHERR', model: 'R945', tonnage: 45, name: 'Liebherr R945' },
  { brand: 'LIEBHERR', model: 'R960', tonnage: 60, name: 'Liebherr R960' },
  { brand: 'LIEBHERR', model: 'R976', tonnage: 90, name: 'Liebherr R976' },
  // HYUNDAI
  { brand: 'HYUNDAI', model: 'HX55ACR', tonnage: 5.7, name: 'Hyundai HX55ACR' },
  { brand: 'HYUNDAI', model: 'HX85ACR', tonnage: 8.7, name: 'Hyundai HX85ACR' },
  { brand: 'HYUNDAI', model: 'HX145ALCR', tonnage: 14.5, name: 'Hyundai HX145ALCR' },
  { brand: 'HYUNDAI', model: 'HX220AL', tonnage: 22, name: 'Hyundai HX220AL' },
  { brand: 'HYUNDAI', model: 'HX300AL', tonnage: 30, name: 'Hyundai HX300AL' },
  { brand: 'HYUNDAI', model: 'HX480AL', tonnage: 48, name: 'Hyundai HX480AL' },
  // KOBELCO
  { brand: 'KOBELCO', model: 'SK55SRX-7', tonnage: 5.2, name: 'Kobelco SK55SRX-7' },
  { brand: 'KOBELCO', model: 'SK85MSR-7', tonnage: 8.9, name: 'Kobelco SK85MSR-7' },
  { brand: 'KOBELCO', model: 'SK140SRLC-7', tonnage: 14.9, name: 'Kobelco SK140SRLC-7' },
  { brand: 'KOBELCO', model: 'SK210LC-11', tonnage: 22.5, name: 'Kobelco SK210LC-11' },
  { brand: 'KOBELCO', model: 'SK300LC-11', tonnage: 30, name: 'Kobelco SK300LC-11' },
  { brand: 'KOBELCO', model: 'SK500LC-11', tonnage: 51, name: 'Kobelco SK500LC-11' },
  // JCB
  { brand: 'JCB', model: '48Z-2', tonnage: 5, name: 'JCB 48Z-2' },
  { brand: 'JCB', model: '86C-2', tonnage: 8.6, name: 'JCB 86C-2' },
  { brand: 'JCB', model: '131X', tonnage: 13.5, name: 'JCB 131X' },
  { brand: 'JCB', model: '220X', tonnage: 22, name: 'JCB 220X' },
  { brand: 'JCB', model: '370X', tonnage: 37, name: 'JCB 370X' },
  // CASE
  { brand: 'CASE', model: 'CX57C', tonnage: 5.7, name: 'Case CX57C' },
  { brand: 'CASE', model: 'CX80C', tonnage: 8.5, name: 'Case CX80C' },
  { brand: 'CASE', model: 'CX130D', tonnage: 13.5, name: 'Case CX130D' },
  { brand: 'CASE', model: 'CX210D', tonnage: 21.5, name: 'Case CX210D' },
  { brand: 'CASE', model: 'CX300D', tonnage: 30, name: 'Case CX300D' },
  { brand: 'CASE', model: 'CX490D', tonnage: 49, name: 'Case CX490D' },
  // TAKEUCHI
  { brand: 'TAKEUCHI', model: 'TB250-2', tonnage: 5, name: 'Takeuchi TB250-2' },
  { brand: 'TAKEUCHI', model: 'TB290-2', tonnage: 9, name: 'Takeuchi TB290-2' },
  { brand: 'TAKEUCHI', model: 'TB2150R', tonnage: 15, name: 'Takeuchi TB2150R' },
  // KUBOTA
  { brand: 'KUBOTA', model: 'KX057-5', tonnage: 5.5, name: 'Kubota KX057-5' },
  { brand: 'KUBOTA', model: 'KX080-4a', tonnage: 8.5, name: 'Kubota KX080-4a' },
  // SANY
  { brand: 'SANY', model: 'SY55U', tonnage: 5.5, name: 'SANY SY55U' },
  { brand: 'SANY', model: 'SY135C', tonnage: 13.8, name: 'SANY SY135C' },
  { brand: 'SANY', model: 'SY215C', tonnage: 21.5, name: 'SANY SY215C' },
  { brand: 'SANY', model: 'SY365H', tonnage: 36.5, name: 'SANY SY365H' },
  { brand: 'SANY', model: 'SY500H', tonnage: 50, name: 'SANY SY500H' },
  // ZOOMLION
  { brand: 'ZOOMLION', model: 'ZE55E-10', tonnage: 5.5, name: 'Zoomlion ZE55E-10' },
  { brand: 'ZOOMLION', model: 'ZE135E-10', tonnage: 13.5, name: 'Zoomlion ZE135E-10' },
  { brand: 'ZOOMLION', model: 'ZE215E-10', tonnage: 21.5, name: 'Zoomlion ZE215E-10' },
  { brand: 'ZOOMLION', model: 'ZE360E-10', tonnage: 36, name: 'Zoomlion ZE360E-10' },
]

const BULLDOZERS = [
  // CAT
  { brand: 'CAT', model: 'D3', tonnage: 8.2, name: 'CAT D3' },
  { brand: 'CAT', model: 'D4', tonnage: 10.1, name: 'CAT D4' },
  { brand: 'CAT', model: 'D5', tonnage: 15.9, name: 'CAT D5' },
  { brand: 'CAT', model: 'D6', tonnage: 20.8, name: 'CAT D6' },
  { brand: 'CAT', model: 'D6 XE', tonnage: 22.6, name: 'CAT D6 XE' },
  { brand: 'CAT', model: 'D7', tonnage: 28.4, name: 'CAT D7' },
  { brand: 'CAT', model: 'D8T', tonnage: 38.7, name: 'CAT D8T' },
  { brand: 'CAT', model: 'D9', tonnage: 49, name: 'CAT D9' },
  { brand: 'CAT', model: 'D10', tonnage: 66.8, name: 'CAT D10' },
  { brand: 'CAT', model: 'D11', tonnage: 104.4, name: 'CAT D11' },
  // KOMATSU
  { brand: 'KOMATSU', model: 'D37PXi-24', tonnage: 9.3, name: 'Komatsu D37PXi-24' },
  { brand: 'KOMATSU', model: 'D51PXi-24', tonnage: 13.8, name: 'Komatsu D51PXi-24' },
  { brand: 'KOMATSU', model: 'D61PXi-24', tonnage: 17.5, name: 'Komatsu D61PXi-24' },
  { brand: 'KOMATSU', model: 'D65PXi-18', tonnage: 21.5, name: 'Komatsu D65PXi-18' },
  { brand: 'KOMATSU', model: 'D85PX-18', tonnage: 27.5, name: 'Komatsu D85PX-18' },
  { brand: 'KOMATSU', model: 'D155AXi-8', tonnage: 40, name: 'Komatsu D155AXi-8' },
  { brand: 'KOMATSU', model: 'D275AX-5', tonnage: 53, name: 'Komatsu D275AX-5' },
  { brand: 'KOMATSU', model: 'D375A-8', tonnage: 68, name: 'Komatsu D375A-8' },
  // LIEBHERR
  { brand: 'LIEBHERR', model: 'PR716', tonnage: 17, name: 'Liebherr PR716' },
  { brand: 'LIEBHERR', model: 'PR726', tonnage: 22, name: 'Liebherr PR726' },
  { brand: 'LIEBHERR', model: 'PR736', tonnage: 28, name: 'Liebherr PR736' },
  { brand: 'LIEBHERR', model: 'PR746', tonnage: 37, name: 'Liebherr PR746' },
  { brand: 'LIEBHERR', model: 'PR766', tonnage: 52, name: 'Liebherr PR766' },
  // VOLVO
  { brand: 'VOLVO', model: 'SD75B', tonnage: 7.2, name: 'Volvo SD75B' },
  // JCB
  { brand: 'JCB', model: 'JS131 LC', tonnage: 13.5, name: 'JCB JS131 LC' },
  // CASE
  { brand: 'CASE', model: '1650M', tonnage: 19, name: 'Case 1650M' },
  { brand: 'CASE', model: '2050M', tonnage: 23, name: 'Case 2050M' },
  // DEVELON
  { brand: 'DEVELON', model: 'DD100-7', tonnage: 11.3, name: 'Develon DD100-7' },
]

const GUIDANCE_SYSTEMS = ['UNICONTROL', 'TRIMBLE', 'TOPCON', 'LEICA', 'CHCNAV']

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function randomPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let pw = ''
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  return pw
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function pickYear() { return 2019 + Math.floor(Math.random() * 8) } // 2019-2026

async function main() {
  // Get all projects for 3DG user
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', USER_3DG)
    .order('created_at', { ascending: true })

  if (projErr || !projects?.length) {
    console.error('Geen werven gevonden voor 3DG user:', projErr)
    process.exit(1)
  }

  console.log(`Gevonden: ${projects.length} werven`)

  // Delete existing machines for this user
  const { error: delErr } = await supabase
    .from('machines')
    .delete()
    .eq('user_id', USER_3DG)

  if (delErr) {
    console.error('Fout bij verwijderen bestaande machines:', delErr)
    process.exit(1)
  }

  const machines = []
  const usedCodes = new Set()

  for (const project of projects) {
    // 5 machines per werf: 3-4 excavators + 1-2 bulldozers
    const numExcavators = 3 + Math.floor(Math.random() * 2) // 3 or 4
    const numBulldozers = 5 - numExcavators                  // 1 or 2

    for (let i = 0; i < numExcavators; i++) {
      const tmpl = pick(EXCAVATORS)
      let code
      do { code = randomCode() } while (usedCodes.has(code))
      usedCodes.add(code)

      machines.push({
        project_id: project.id,
        user_id: USER_3DG,
        name: tmpl.name,
        machine_type: 'excavator',
        brand: tmpl.brand,
        model: tmpl.model,
        tonnage: tmpl.tonnage,
        year: pickYear(),
        guidance_system: pick(GUIDANCE_SYSTEMS),
        serial_number: `${tmpl.brand.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        connection_code: code,
        connection_password: randomPassword(),
        connection_host: `192.168.${1 + Math.floor(Math.random() * 10)}.${10 + Math.floor(Math.random() * 240)}`,
        connection_port: '5900',
        is_online: Math.random() > 0.6, // 40% online
      })
    }

    for (let i = 0; i < numBulldozers; i++) {
      const tmpl = pick(BULLDOZERS)
      let code
      do { code = randomCode() } while (usedCodes.has(code))
      usedCodes.add(code)

      machines.push({
        project_id: project.id,
        user_id: USER_3DG,
        name: tmpl.name,
        machine_type: 'bulldozer',
        brand: tmpl.brand,
        model: tmpl.model,
        tonnage: tmpl.tonnage,
        year: pickYear(),
        guidance_system: pick(GUIDANCE_SYSTEMS),
        serial_number: `${tmpl.brand.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        connection_code: code,
        connection_password: randomPassword(),
        connection_host: `192.168.${1 + Math.floor(Math.random() * 10)}.${10 + Math.floor(Math.random() * 240)}`,
        connection_port: '5900',
        is_online: Math.random() > 0.7, // 30% online
      })
    }
  }

  console.log(`Invoegen: ${machines.length} machines voor ${projects.length} werven`)

  // Insert in batches
  const BATCH = 50
  let total = 0
  for (let i = 0; i < machines.length; i += BATCH) {
    const batch = machines.slice(i, i + BATCH)
    const { error: insertErr } = await supabase.from('machines').insert(batch)
    if (insertErr) {
      console.error(`Fout bij batch ${i}:`, insertErr)
      process.exit(1)
    }
    total += batch.length
    console.log(`  ${total}/${machines.length} ingevoegd`)
  }

  console.log(`\n✅ ${machines.length} machines aangemaakt!`)
  console.log(`   ${machines.filter(m => m.machine_type === 'excavator').length} kranen`)
  console.log(`   ${machines.filter(m => m.machine_type === 'bulldozer').length} bulldozers`)
  console.log(`   ${machines.filter(m => m.is_online).length} online`)

  // Show brand distribution
  const brandCounts = {}
  for (const m of machines) {
    brandCounts[m.brand] = (brandCounts[m.brand] || 0) + 1
  }
  console.log('\n📊 Merkverdeling:')
  for (const [brand, count] of Object.entries(brandCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${brand}: ${count}`)
  }
}

main().catch(console.error)
