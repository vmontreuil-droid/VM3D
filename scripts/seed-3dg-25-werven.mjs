/**
 * Seed 25 werven voor 3DG Machine Control Systems
 * Verspreid over heel België met echte adressen en coördinaten
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const USER_ID = '6a50eab0-ad68-483f-a444-dde2f252accb'
const ADMIN_ID = 'b2127625-044c-411a-9553-37b7e737b343'

// ── Env ─────────────────────────────────────────────────────
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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function iso(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString() }

// ── 25 werven: echte Belgische adressen verspreid over het land ──
const STATUSES = [
  'offerte_aangevraagd',
  'offerte_verstuurd',
  'in_behandeling',
  'facturatie',
  'factuur_verstuurd',
  'afgerond',
]

const werven = [
  // ─── ANTWERPEN PROVINCIE ───
  { name: 'GPS-uitzetwerk nieuwbouw Berchem',           address: 'Grotesteenweg 214, 2600 Berchem',                  lat: 51.1945, lng: 4.4262, price: 2450,  status: 'offerte_aangevraagd', days: -5 },
  { name: '3D-scan industriehal Zwijndrecht',            address: 'Krijgsbaan 178, 2070 Zwijndrecht',                lat: 51.2124, lng: 4.3318, price: 3200,  status: 'offerte_verstuurd',   days: -14 },
  { name: 'Volumeberekening grondwerken Kontich',        address: 'Mechelsesteenweg 64, 2550 Kontich',               lat: 51.1305, lng: 4.4467, price: 1850,  status: 'in_behandeling',      days: -30 },
  { name: 'As-built opmeting kantoorgebouw Mechelen',    address: 'Battelsesteenweg 455, 2800 Mechelen',             lat: 51.0259, lng: 4.4776, price: 4100,  status: 'factuur_verstuurd',   days: -60 },
  { name: 'Topografische opmeting verkaveling Lier',     address: 'Aarschotsesteenweg 22, 2500 Lier',                lat: 51.1310, lng: 4.5701, price: 5600,  status: 'afgerond',            days: -90 },

  // ─── OOST-VLAANDEREN ───
  { name: 'Rioleringsplan woonwijk Gent',                address: 'Coupure Links 55, 9000 Gent',                     lat: 51.0543, lng: 3.7174, price: 3800,  status: 'in_behandeling',      days: -18 },
  { name: 'Terreinopmeting bedrijventerrein Aalst',      address: 'Parklaan 22, 9300 Aalst',                         lat: 50.9380, lng: 4.0400, price: 2900,  status: 'offerte_verstuurd',   days: -10 },
  { name: 'Drone-opmeting bouwterrein Dendermonde',      address: 'Brusselsestraat 30, 9200 Dendermonde',            lat: 51.0283, lng: 4.1012, price: 2100,  status: 'offerte_aangevraagd', days: -3 },

  // ─── WEST-VLAANDEREN ───
  { name: 'Machine control wegenis Brugge',              address: 'Torhoutse Steenweg 128, 8200 Brugge',             lat: 51.1929, lng: 3.2178, price: 4500,  status: 'facturatie',          days: -42 },
  { name: 'As-built scan appartementsblok Oostende',     address: 'Torhoutsesteenweg 305, 8400 Oostende',            lat: 51.2103, lng: 2.9035, price: 3600,  status: 'factuur_verstuurd',   days: -55 },
  { name: 'Grondverzet berekening Kortrijk',             address: 'Doorniksesteenweg 216, 8500 Kortrijk',            lat: 50.8270, lng: 3.2680, price: 1750,  status: 'afgerond',            days: -80 },

  // ─── VLAAMS-BRABANT ───
  { name: 'BIM-opmeting universiteitsgebouw Leuven',     address: 'Naamsestraat 69, 3000 Leuven',                    lat: 50.8755, lng: 4.7005, price: 6200,  status: 'in_behandeling',      days: -22 },
  { name: 'GPS-uitzetting riolering Tienen',             address: 'Leuvensestraat 83, 3300 Tienen',                  lat: 50.8066, lng: 4.9384, price: 2300,  status: 'offerte_verstuurd',   days: -8 },

  // ─── LIMBURG ───
  { name: 'Topografische opmeting KMO-zone Hasselt',     address: 'Genkersteenweg 210, 3500 Hasselt',                lat: 50.9412, lng: 5.3530, price: 3400,  status: 'facturatie',          days: -38 },
  { name: '3D-laserscan kerk Tongeren',                  address: 'Grote Markt 8, 3700 Tongeren',                    lat: 50.7808, lng: 5.4646, price: 5100,  status: 'afgerond',            days: -95 },
  { name: 'Drone survey industriezone Genk',             address: 'Europalaan 52, 3600 Genk',                        lat: 50.9654, lng: 5.5004, price: 2750,  status: 'offerte_aangevraagd', days: -2 },

  // ─── BRUSSEL ───
  { name: 'Façade-scan kantoorgebouw Brussel',           address: 'Wetstraat 155, 1040 Brussel',                     lat: 50.8432, lng: 4.3826, price: 7500,  status: 'in_behandeling',      days: -15 },
  { name: 'As-built opmeting metrostation Schaarbeek',   address: 'Place Eugène Verboekhoven 1, 1030 Schaarbeek',    lat: 50.8625, lng: 4.3753, price: 4800,  status: 'offerte_verstuurd',   days: -7 },

  // ─── WAALS-BRABANT ───
  { name: 'Verkaveling opmeting Waver',                  address: 'Chaussée de Namur 47, 1300 Wavre',                lat: 50.7167, lng: 4.6121, price: 3100,  status: 'factuur_verstuurd',   days: -48 },

  // ─── HENEGOUWEN ───
  { name: 'Volumeberekening steengroeve Doornik',        address: 'Rue de Marvis 12, 7500 Tournai',                  lat: 50.6076, lng: 3.3886, price: 4200,  status: 'afgerond',            days: -100 },
  { name: 'GPS-uitzetwerk snelwegbrug Mons',             address: 'Boulevard Charles Quint 15, 7000 Mons',           lat: 50.4542, lng: 3.9518, price: 8900,  status: 'in_behandeling',      days: -25 },

  // ─── NAMEN ───
  { name: 'Terreinopmeting woonproject Namen',           address: 'Avenue de la Gare 28, 5000 Namur',                lat: 50.4667, lng: 4.8667, price: 3300,  status: 'facturatie',          days: -35 },

  // ─── LUIK ───
  { name: 'As-built scan spoorbrug Luik',                address: 'Quai de la Boverie 1, 4020 Liège',                lat: 50.6326, lng: 5.5797, price: 5800,  status: 'factuur_verstuurd',   days: -65 },
  { name: 'Drone-opmeting grindgroeve Visé',             address: 'Rue de Lixhe 35, 4600 Visé',                      lat: 50.7390, lng: 5.6943, price: 2600,  status: 'offerte_aangevraagd', days: -4 },

  // ─── LUXEMBURG ───
  { name: 'Topografische opmeting bosgebied Aarlen',     address: 'Rue de Diekirch 14, 6700 Arlon',                  lat: 49.6833, lng: 5.8167, price: 4400,  status: 'afgerond',            days: -110 },
]

async function main() {
  console.log('🔧 3DG — 25 werven seeden over heel België\n')

  // Verwijder bestaande werven + gekoppelde data
  const { data: existing } = await supabase.from('projects').select('id').eq('user_id', USER_ID)
  const pids = (existing || []).map(p => p.id)

  if (pids.length > 0) {
    // Verwijder gerelateerde data eerst
    await supabase.from('time_entries').delete().in('project_id', pids)
    await supabase.from('project_timeline').delete().in('project_id', pids)
    await supabase.from('project_files').delete().in('project_id', pids)

    // Offertes/facturen zijn op customer_id, maar ook project_id — haal offerte/factuur ids op
    const { data: offs } = await supabase.from('offertes').select('id').in('project_id', pids)
    if (offs?.length) {
      await supabase.from('offerte_lines').delete().in('offerte_id', offs.map(o => o.id))
      await supabase.from('offertes').delete().in('id', offs.map(o => o.id))
    }
    const { data: facs } = await supabase.from('facturen').select('id').in('project_id', pids)
    if (facs?.length) {
      await supabase.from('factuur_lines').delete().in('factuur_id', facs.map(f => f.id))
      await supabase.from('facturen').delete().in('id', facs.map(f => f.id))
    }

    await supabase.from('tickets').delete().in('project_id', pids)
    await supabase.from('projects').delete().eq('user_id', USER_ID)
    console.log(`  ✓ ${pids.length} bestaande werven + data verwijderd`)
  }

  // Insert de 25 nieuwe werven
  const rows = werven.map(w => ({
    user_id: USER_ID,
    name: w.name,
    address: w.address,
    latitude: w.lat,
    longitude: w.lng,
    price: w.price,
    currency: 'EUR',
    status: w.status,
    created_at: iso(w.days),
  }))

  const { data, error } = await supabase.from('projects').insert(rows).select('id, name, status, address')
  if (error) throw error

  console.log(`  ✓ ${data.length} werven aangemaakt:\n`)

  // Groepeer per status
  const grouped = {}
  for (const p of data) {
    if (!grouped[p.status]) grouped[p.status] = []
    grouped[p.status].push(p)
  }
  for (const s of STATUSES) {
    if (!grouped[s]) continue
    console.log(`  [${s}]`)
    for (const p of grouped[s]) {
      console.log(`    • #${p.id} ${p.name}`)
      console.log(`      ${p.address}`)
    }
    console.log()
  }

  // Toon samenvatting per status
  console.log('  Samenvatting:')
  for (const s of STATUSES) {
    console.log(`    ${s}: ${(grouped[s] || []).length}`)
  }
  console.log(`    TOTAAL: ${data.length}`)
}

main().catch(err => { console.error('FOUT:', err); process.exit(1) })
