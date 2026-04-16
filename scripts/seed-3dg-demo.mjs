/**
 * Seed script: 3DG Machine Control Systems demo-klant
 * Maakt een volledige klant aan met 5 werven, offertes, facturen, tickets, tijdsregistraties
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

// ── Config ──────────────────────────────────────────────────
const DEMO = {
  email: 'info@3dg-machinecontrol.be',
  password: '3DG-Demo2026!',
  fullName: 'Geert Van Damme',
  companyName: '3DG Machine Control Systems',
  vatNumber: 'BE0789.456.123',
  phone: '+32 3 808 45 67',
  mobile: '+32 475 23 45 67',
  street: 'Antwerpsesteenweg',
  houseNumber: '124',
  postalCode: '2630',
  city: 'Aartselaar',
  country: 'België',
  iban: 'BE71 0961 2345 6789',
  bic: 'GKCCBEBB',
  comments: '[DEMO-3DG] Demo-klant 3DG Machine Control Systems.',
}

const ADMIN_ID = 'b2127625-044c-411a-9553-37b7e737b343'

// ── Env loading ─────────────────────────────────────────────
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const sep = line.indexOf('=')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    let value = line.slice(sep + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1)
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvFile(path.join(process.cwd(), '.env.local'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) throw new Error('Supabase credentials ontbreken in .env.local')

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function iso(offsetDays) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays); return d.toISOString()
}
function dateStr(offsetDays) { return iso(offsetDays).slice(0, 10) }

// ── Auth helpers ────────────────────────────────────────────
async function findAuthUser(email) {
  let page = 1
  const norm = email.toLowerCase()
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 500 })
    if (error) throw error
    const found = data.users.find((u) => (u.email || '').toLowerCase() === norm)
    if (found) return found
    if (!data.users.length || data.users.length < 500) break
    page++
  }
  return null
}

async function ensureAuthUser() {
  const existing = await findAuthUser(DEMO.email)
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password: DEMO.password,
      email_confirm: true,
      user_metadata: { full_name: DEMO.fullName, company_name: DEMO.companyName },
    })
    return existing.id
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO.email,
    password: DEMO.password,
    email_confirm: true,
    user_metadata: { full_name: DEMO.fullName, company_name: DEMO.companyName },
  })
  if (error || !data.user) throw error || new Error('Kon auth user niet aanmaken')
  return data.user.id
}

// ── Cleanup ─────────────────────────────────────────────────
async function cleanup(userId) {
  const { data: projects } = await supabase.from('projects').select('id').eq('user_id', userId)
  const pids = (projects || []).map((p) => p.id)

  // Delete linked data
  await supabase.from('tickets').delete().eq('customer_id', userId)
  await supabase.from('admin_notes').delete().eq('created_by', userId)
  await supabase.from('offertes').delete().eq('customer_id', userId)
  await supabase.from('facturen').delete().eq('customer_id', userId)

  if (pids.length > 0) {
    await supabase.from('time_entries').delete().in('project_id', pids)
    await supabase.from('project_timeline').delete().in('project_id', pids)
    await supabase.from('project_files').delete().in('project_id', pids)
    await supabase.from('projects').delete().eq('user_id', userId)
  }

  console.log('  ✓ Bestaande data opgeruimd')
}

// ── Profile ─────────────────────────────────────────────────
async function upsertProfile(userId) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'user',
    full_name: DEMO.fullName,
    company_name: DEMO.companyName,
    email: DEMO.email,
    vat_number: DEMO.vatNumber,
    phone: DEMO.phone,
    mobile: DEMO.mobile,
    street: DEMO.street,
    house_number: DEMO.houseNumber,
    postal_code: DEMO.postalCode,
    city: DEMO.city,
    country: DEMO.country,
    iban: DEMO.iban,
    bic: DEMO.bic,
    comments: DEMO.comments,
    is_active: true,
    language: 'nl',
    payment_method: 'overschrijving',
    currency: 'EUR',
  }, { onConflict: 'id' })
  if (error) throw error
  console.log('  ✓ Profiel aangemaakt')
}

// ── 5 werven met echte Belgische adressen ───────────────────
async function createProjects(userId) {
  const werven = [
    {
      user_id: userId,
      name: 'GPS-uitzetwerk nieuwbouw Berchem',
      address: 'Grotesteenweg 214, 2600 Berchem',
      status: 'offerte_aangevraagd',
      price: 2450,
      currency: 'EUR',
      latitude: 51.1945,
      longitude: 4.4262,
      created_at: iso(-5),
    },
    {
      user_id: userId,
      name: '3D-scan industriehal Zwijndrecht',
      address: 'Krijgsbaan 178, 2070 Zwijndrecht',
      status: 'offerte_verstuurd',
      price: 3200,
      currency: 'EUR',
      latitude: 51.2124,
      longitude: 4.3318,
      created_at: iso(-14),
    },
    {
      user_id: userId,
      name: 'Volumeberekening grondwerken Kontich',
      address: 'Mechelsesteenweg 64, 2550 Kontich',
      status: 'in_behandeling',
      price: 1850,
      currency: 'EUR',
      latitude: 51.1305,
      longitude: 4.4467,
      created_at: iso(-30),
    },
    {
      user_id: userId,
      name: 'As-built opmeting kantoorgebouw Mechelen',
      address: 'Battelsesteenweg 455, 2800 Mechelen',
      status: 'factuur_verstuurd',
      price: 4100,
      currency: 'EUR',
      latitude: 51.0259,
      longitude: 4.4776,
      created_at: iso(-60),
    },
    {
      user_id: userId,
      name: 'Topografische opmeting verkaveling Lier',
      address: 'Aarschotsesteenweg 22, 2500 Lier',
      status: 'afgerond',
      price: 5600,
      currency: 'EUR',
      latitude: 51.1310,
      longitude: 4.5701,
      created_at: iso(-90),
    },
  ]

  const { data, error } = await supabase.from('projects').insert(werven).select('id, name, status').order('id')
  if (error) throw error
  console.log(`  ✓ ${data.length} werven aangemaakt`)
  return data
}

// ── Offertes (5 stuks, diverse statussen) ───────────────────
async function createOffertes(userId, projects) {
  const offerteData = [
    {
      offerte_number: 'OFF-2026-3DG-001',
      customer_id: userId,
      project_id: projects[0].id,
      created_by: ADMIN_ID,
      status: 'verstuurd',
      subject: 'GPS-uitzetwerk nieuwbouw Berchem',
      description: 'Offerte voor machine control GPS-uitzetwerk residentieel complex Berchem.',
      valid_until: dateStr(30),
      subtotal: 2024.79,
      vat_amount: 425.21,
      total: 2450,
      payment_terms: 'Betaling binnen 30 dagen na facturatie.',
      created_at: iso(-5),
    },
    {
      offerte_number: 'OFF-2026-3DG-002',
      customer_id: userId,
      project_id: projects[1].id,
      created_by: ADMIN_ID,
      status: 'verstuurd',
      subject: '3D-laserscan industriehal Zwijndrecht',
      description: 'Offerte voor volledige 3D-scan met as-built documentatie.',
      valid_until: dateStr(21),
      subtotal: 2644.63,
      vat_amount: 555.37,
      total: 3200,
      payment_terms: 'Betaling binnen 30 dagen na facturatie.',
      created_at: iso(-12),
    },
    {
      offerte_number: 'OFF-2026-3DG-003',
      customer_id: userId,
      project_id: projects[2].id,
      created_by: ADMIN_ID,
      status: 'goedgekeurd',
      subject: 'Volumeberekening grondwerken Kontich',
      description: 'Offerte voor drone-opmetingen en volumeberekening grondverzet.',
      valid_until: dateStr(0),
      subtotal: 1528.93,
      vat_amount: 321.07,
      total: 1850,
      payment_terms: 'Betaling binnen 30 dagen na facturatie.',
      created_at: iso(-28),
    },
    {
      offerte_number: 'OFF-2026-3DG-004',
      customer_id: userId,
      project_id: projects[3].id,
      created_by: ADMIN_ID,
      status: 'goedgekeurd',
      subject: 'As-built opmeting kantoorgebouw Mechelen',
      description: 'Offerte voor as-built opmeting en BIM-modellering.',
      valid_until: dateStr(-15),
      subtotal: 3388.43,
      vat_amount: 711.57,
      total: 4100,
      payment_terms: 'Betaling binnen 14 dagen na facturatie.',
      created_at: iso(-58),
    },
    {
      offerte_number: 'OFF-2026-3DG-005',
      customer_id: userId,
      project_id: projects[4].id,
      created_by: ADMIN_ID,
      status: 'goedgekeurd',
      subject: 'Topografische opmeting verkaveling Lier',
      description: 'Offerte voor volledige topografische opmeting 12 kavels.',
      valid_until: dateStr(-45),
      subtotal: 4628.10,
      vat_amount: 971.90,
      total: 5600,
      payment_terms: 'Betaling binnen 14 dagen na facturatie.',
      created_at: iso(-88),
    },
  ]

  const { data, error } = await supabase.from('offertes').insert(offerteData).select('id, offerte_number, status, project_id')
  if (error) throw error

  // Offerte lines
  const lines = []
  for (const off of data) {
    const proj = offerteData.find((o) => o.offerte_number === off.offerte_number)
    lines.push(
      { offerte_id: off.id, position: 1, description: 'Veldwerk en opmeting', quantity: 1, unit: 'forfait', unit_price: proj.subtotal * 0.6, line_total: proj.subtotal * 0.6 },
      { offerte_id: off.id, position: 2, description: 'Verwerking en rapportage', quantity: 1, unit: 'forfait', unit_price: proj.subtotal * 0.3, line_total: proj.subtotal * 0.3 },
      { offerte_id: off.id, position: 3, description: 'Reiskosten en verplaatsing', quantity: 1, unit: 'forfait', unit_price: proj.subtotal * 0.1, line_total: proj.subtotal * 0.1 },
    )
  }
  await supabase.from('offerte_lines').insert(lines)

  console.log(`  ✓ ${data.length} offertes aangemaakt (2 verstuurd, 3 goedgekeurd)`)
  return data
}

// ── Facturen (3 stuks: 1 betaald, 1 verstuurd/openstaand, 1 vervallen) ──
async function createFacturen(userId, projects, offertes) {
  const offMap = new Map(offertes.map((o) => [o.project_id, o.id]))

  const factuurData = [
    {
      factuur_number: 'FAC-2026-3DG-001',
      offerte_id: offMap.get(projects[4].id) || null,
      customer_id: userId,
      project_id: projects[4].id,
      created_by: ADMIN_ID,
      status: 'betaald',
      subject: 'Topografische opmeting verkaveling Lier',
      due_date: dateStr(-30),
      subtotal: 4628.10,
      vat_amount: 971.90,
      total: 5600,
      payment_terms: 'Betaling binnen 14 dagen na facturatie.',
      paid_at: iso(-35),
      created_at: iso(-75),
    },
    {
      factuur_number: 'FAC-2026-3DG-002',
      offerte_id: offMap.get(projects[3].id) || null,
      customer_id: userId,
      project_id: projects[3].id,
      created_by: ADMIN_ID,
      status: 'verstuurd',
      subject: 'As-built opmeting kantoorgebouw Mechelen',
      due_date: dateStr(7),
      subtotal: 3388.43,
      vat_amount: 711.57,
      total: 4100,
      payment_terms: 'Betaling binnen 14 dagen na facturatie.',
      created_at: iso(-14),
    },
    {
      factuur_number: 'FAC-2026-3DG-003',
      offerte_id: offMap.get(projects[2].id) || null,
      customer_id: userId,
      project_id: projects[2].id,
      created_by: ADMIN_ID,
      status: 'vervallen',
      subject: 'Volumeberekening grondwerken Kontich',
      due_date: dateStr(-5),
      subtotal: 1528.93,
      vat_amount: 321.07,
      total: 1850,
      payment_terms: 'Betaling binnen 30 dagen na facturatie.',
      created_at: iso(-40),
    },
  ]

  const { data, error } = await supabase.from('facturen').insert(factuurData).select('id, factuur_number, status, project_id')
  if (error) throw error

  // Factuur lines
  const lines = []
  for (const fac of data) {
    const src = factuurData.find((f) => f.factuur_number === fac.factuur_number)
    lines.push(
      { factuur_id: fac.id, position: 1, description: 'Veldwerk en opmeting', quantity: 1, unit: 'forfait', unit_price: src.subtotal * 0.6, line_total: src.subtotal * 0.6 },
      { factuur_id: fac.id, position: 2, description: 'Verwerking en rapportage', quantity: 1, unit: 'forfait', unit_price: src.subtotal * 0.3, line_total: src.subtotal * 0.3 },
      { factuur_id: fac.id, position: 3, description: 'Reiskosten en verplaatsing', quantity: 1, unit: 'forfait', unit_price: src.subtotal * 0.1, line_total: src.subtotal * 0.1 },
    )
  }
  await supabase.from('factuur_lines').insert(lines)

  console.log(`  ✓ ${data.length} facturen aangemaakt (1 betaald, 1 openstaand, 1 vervallen)`)
  return data
}

// ── Tickets ─────────────────────────────────────────────────
async function createTickets(userId, projects) {
  const tickets = [
    {
      title: 'Vraag over GPS-configuratie Berchem',
      description: 'Welk GPS-systeem wordt er ingezet op de werf in Berchem? Graag de specificaties.',
      status: 'nieuw',
      priority: 'normaal',
      customer_id: userId,
      project_id: projects[0].id,
      created_by: userId,
      assigned_to: ADMIN_ID,
    },
    {
      title: 'Leveringstrijd 3D-scan Zwijndrecht',
      description: 'Wanneer worden de 3D-scanresultaten opgeleverd? Klant heeft deadline op 25/04.',
      status: 'in_behandeling',
      priority: 'hoog',
      customer_id: userId,
      project_id: projects[1].id,
      created_by: userId,
      assigned_to: ADMIN_ID,
    },
    {
      title: 'Factuur Kontich nog niet ontvangen',
      description: 'De factuur voor de volumeberekening Kontich staat als vervallen maar ik heb die nooit ontvangen.',
      status: 'nieuw',
      priority: 'hoog',
      customer_id: userId,
      project_id: projects[2].id,
      created_by: userId,
      assigned_to: ADMIN_ID,
    },
  ]

  const { data, error } = await supabase.from('tickets').insert(tickets).select('id, title, status')
  if (error) throw error
  console.log(`  ✓ ${data.length} tickets aangemaakt`)
  return data
}

// ── Tijdsregistraties ───────────────────────────────────────
async function createTimeEntries(projects) {
  const entries = [
    // Kontich - in_behandeling (veldwerk + verwerking)
    { project_id: projects[2].id, created_by: ADMIN_ID, description: 'Drone-vlucht en grondmarkeringen', started_at: iso(-25), ended_at: iso(-25 + 0.17), duration_seconds: 4 * 3600 + 15 * 60, billable: true },
    { project_id: projects[2].id, created_by: ADMIN_ID, description: 'Volumeberekening verwerking', started_at: iso(-22), ended_at: iso(-22 + 0.13), duration_seconds: 3 * 3600 + 10 * 60, billable: true },
    { project_id: projects[2].id, created_by: ADMIN_ID, description: 'Rapportage en kwaliteitscontrole', started_at: iso(-20), ended_at: iso(-20 + 0.08), duration_seconds: 2 * 3600, billable: true },
    // Mechelen - factuur_verstuurd
    { project_id: projects[3].id, created_by: ADMIN_ID, description: 'Terreinopmeting as-built', started_at: iso(-50), ended_at: iso(-50 + 0.33), duration_seconds: 8 * 3600, billable: true },
    { project_id: projects[3].id, created_by: ADMIN_ID, description: 'BIM-modellering kantoorgebouw', started_at: iso(-46), ended_at: iso(-46 + 0.25), duration_seconds: 6 * 3600, billable: true },
    { project_id: projects[3].id, created_by: ADMIN_ID, description: 'Controle en oplevering BIM', started_at: iso(-42), ended_at: iso(-42 + 0.08), duration_seconds: 2 * 3600, billable: true },
    // Lier - afgerond
    { project_id: projects[4].id, created_by: ADMIN_ID, description: 'Terreinverkenning en GPS-setup', started_at: iso(-85), ended_at: iso(-85 + 0.13), duration_seconds: 3 * 3600, billable: true },
    { project_id: projects[4].id, created_by: ADMIN_ID, description: 'Volledige topografische opmeting 12 kavels', started_at: iso(-82), ended_at: iso(-82 + 0.42), duration_seconds: 10 * 3600, billable: true },
    { project_id: projects[4].id, created_by: ADMIN_ID, description: 'Data-verwerking en planopmaak', started_at: iso(-78), ended_at: iso(-78 + 0.33), duration_seconds: 8 * 3600, billable: true },
    { project_id: projects[4].id, created_by: ADMIN_ID, description: 'Rioleringsplan en detailuitwerking', started_at: iso(-74), ended_at: iso(-74 + 0.21), duration_seconds: 5 * 3600, billable: true },
    // Running timer op Kontich (geen ended_at)
    { project_id: projects[2].id, created_by: ADMIN_ID, description: 'Aanvullende terreincontrole Kontich', started_at: new Date(Date.now() - 45 * 60000).toISOString(), ended_at: null, duration_seconds: null, billable: true },
  ]

  const { data, error } = await supabase.from('time_entries').insert(entries).select('id')
  if (error) throw error
  console.log(`  ✓ ${data.length} tijdsregistraties aangemaakt (1 lopend)`)
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log('🔧 3DG Machine Control Systems — Demo seed')
  console.log('')

  const userId = await ensureAuthUser()
  console.log(`  ✓ Auth user: ${userId}`)

  await upsertProfile(userId)
  await cleanup(userId)

  const projects = await createProjects(userId)
  const offertes = await createOffertes(userId, projects)
  const facturen = await createFacturen(userId, projects, offertes)
  const tickets = await createTickets(userId, projects)
  await createTimeEntries(projects)

  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log('  DEMO KLANT AANGEMAAKT')
  console.log('═══════════════════════════════════════════')
  console.log(`  E-mail:     ${DEMO.email}`)
  console.log(`  Wachtwoord: ${DEMO.password}`)
  console.log(`  Bedrijf:    ${DEMO.companyName}`)
  console.log(`  User ID:    ${userId}`)
  console.log('')
  console.log('  Werven:')
  for (const p of projects) console.log(`    • #${p.id} ${p.name} (${p.status})`)
  console.log('')
  console.log('  Offertes:')
  for (const o of offertes) console.log(`    • ${o.offerte_number} (${o.status})`)
  console.log('')
  console.log('  Facturen:')
  for (const f of facturen) console.log(`    • ${f.factuur_number} (${f.status})`)
  console.log('')
  console.log('  Tickets:')
  for (const t of tickets) console.log(`    • #${t.id} ${t.title} (${t.status})`)
  console.log('')
  console.log('  Inloggen: http://localhost:3000/login')
  console.log('═══════════════════════════════════════════')
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
