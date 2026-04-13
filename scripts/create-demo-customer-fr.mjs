import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DEMO = {
  email: 'demo.client.fr.mv3d@example.test',
  password: 'DemoMv3dFr!2026',
  fullName: 'Julien Lambert',
  companyName: 'SRL Demo Projets Wallonie',
  vatNumber: 'BE0100005221',
  phone: '+32 2 588 11 22',
  mobile: '+32 471 550 33 22',
  street: 'Rue de l\'Église',
  houseNumber: '27',
  postalCode: '1300',
  city: 'Wavre',
  country: 'Belgique',
  comments: '[DEMO-CUSTOMER-FR-2026] Client fictif francophone pour validation du portail.',
}

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

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error('Supabase credentials ontbreken in .env.local')
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function isoDaysFromNow(offsetDays) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString()
}

async function findAuthUserByEmail(email) {
  let page = 1
  const normalized = email.toLowerCase()

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 500 })
    if (error) throw error

    const found = data.users.find((u) => (u.email || '').toLowerCase() === normalized)
    if (found) return found

    if (!data.users.length || data.users.length < 500) break
    page += 1
  }

  return null
}

async function ensureAuthUser() {
  const existing = await findAuthUserByEmail(DEMO.email)

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: DEMO.password,
      email_confirm: true,
      user_metadata: {
        full_name: DEMO.fullName,
        company_name: DEMO.companyName,
      },
    })
    if (error) throw error
    return existing.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO.email,
    password: DEMO.password,
    email_confirm: true,
    user_metadata: {
      full_name: DEMO.fullName,
      company_name: DEMO.companyName,
    },
  })

  if (error || !data.user) throw error || new Error('Kon FR demo user niet aanmaken')
  return data.user.id
}

async function cleanupExisting(userId) {
  const { data: existingProjects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId)
  if (projectsError) throw projectsError

  const projectIds = (existingProjects || []).map((p) => p.id)

  const { error: ticketsError } = await supabase.from('tickets').delete().eq('customer_id', userId)
  if (ticketsError) throw ticketsError

  if (projectIds.length > 0) {
    const { error: timelineError } = await supabase.from('project_timeline').delete().in('project_id', projectIds)
    if (timelineError) throw timelineError

    const { error: filesError } = await supabase.from('project_files').delete().in('project_id', projectIds)
    if (filesError) throw filesError

    const { error: deleteProjectsError } = await supabase.from('projects').delete().eq('user_id', userId)
    if (deleteProjectsError) throw deleteProjectsError
  }
}

async function upsertProfile(userId) {
  const payload = {
    id: userId,
    role: 'customer',
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
    comments: DEMO.comments,
    is_active: true,
    language: 'fr',
    payment_method: 'virement',
    currency: 'EUR',
  }

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
  if (error) throw error
}

async function createProjects(userId) {
  const projects = [
    {
      user_id: userId,
      title: 'FR Chantier 201-1 · Relevé 3D entrepôt',
      description: '[DEMO-CUSTOMER-FR-2026] Chantier fictif à Bruxelles.',
      address: 'Rue de la Loi 155, 1040 Bruxelles',
      status: 'in_behandeling',
      price: 2140,
      currency: 'EUR',
      latitude: 50.84431,
      longitude: 4.37955,
      admin_notes: 'Démonstration FR: chantier en cours.',
      paid: false,
      created_at: isoDaysFromNow(-50),
      submitted_at: isoDaysFromNow(-50),
      in_progress_at: isoDaysFromNow(-47),
    },
    {
      user_id: userId,
      title: 'FR Chantier 201-2 · As-built bureaux',
      description: '[DEMO-CUSTOMER-FR-2026] Chantier fictif à Namur.',
      address: 'Rue de Fer 30, 5000 Namur',
      status: 'klaar_voor_betaling',
      price: 1725,
      currency: 'EUR',
      latitude: 50.4669,
      longitude: 4.86746,
      admin_notes: 'Démonstration FR: prêt pour facturation.',
      paid: false,
      created_at: isoDaysFromNow(-68),
      submitted_at: isoDaysFromNow(-68),
      in_progress_at: isoDaysFromNow(-62),
      ready_for_payment_at: isoDaysFromNow(-22),
    },
    {
      user_id: userId,
      title: 'FR Chantier 201-3 · Contrôle de chantier',
      description: '[DEMO-CUSTOMER-FR-2026] Chantier fictif à Liège.',
      address: 'Boulevard d\'Avroy 90, 4000 Liège',
      status: 'afgerond',
      price: 1980,
      currency: 'EUR',
      latitude: 50.63645,
      longitude: 5.5677,
      admin_notes: 'Démonstration FR: livré et clôturé.',
      paid: true,
      created_at: isoDaysFromNow(-88),
      submitted_at: isoDaysFromNow(-88),
      in_progress_at: isoDaysFromNow(-84),
      ready_for_payment_at: isoDaysFromNow(-35),
      completed_at: isoDaysFromNow(-14),
    },
  ]

  const { data, error } = await supabase
    .from('projects')
    .insert(projects)
    .select('id, title, status')
    .order('id', { ascending: true })

  if (error || !data) throw error || new Error('Kon FR demo projecten niet aanmaken')
  return data
}

async function createTickets(userId, projects) {
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1)
  const assignedAdminId = admins?.[0]?.id || null

  const tickets = [
    {
      title: 'Question sur les fichiers finaux chantier 201-2',
      description: 'Le client demande la date de livraison finale.',
      status: 'nieuw',
      priority: 'normaal',
      customer_id: userId,
      project_id: projects[1]?.id ?? null,
      created_by: userId,
      assigned_to: assignedAdminId,
      due_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      last_reply_at: isoDaysFromNow(-1),
    },
    {
      title: 'Correction d\'adresse chantier 201-1',
      description: 'Numéro de boîte à corriger avant export final.',
      status: 'in_behandeling',
      priority: 'hoog',
      customer_id: userId,
      project_id: projects[0]?.id ?? null,
      created_by: userId,
      assigned_to: assignedAdminId,
      due_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      last_reply_at: isoDaysFromNow(-2),
    },
  ]

  const { data: rows, error } = await supabase
    .from('tickets')
    .insert(tickets)
    .select('id, title, status')
    .order('id', { ascending: true })

  if (error || !rows) throw error || new Error('Kon FR demo tickets niet aanmaken')

  const messages = []
  for (const ticket of rows) {
    messages.push({ ticket_id: ticket.id, author_id: userId, message: `Message client FR pour ticket #${ticket.id}.`, is_internal: false })
    if (assignedAdminId) {
      messages.push({ ticket_id: ticket.id, author_id: assignedAdminId, message: `Suivi admin pour ticket #${ticket.id}.`, is_internal: true })
    }
  }

  if (messages.length > 0) {
    const { error: msgErr } = await supabase.from('ticket_messages').insert(messages)
    if (msgErr) throw msgErr
  }

  return rows
}

async function main() {
  const userId = await ensureAuthUser()
  await upsertProfile(userId)
  await cleanupExisting(userId)

  const projects = await createProjects(userId)
  const tickets = await createTickets(userId, projects)

  console.log('--- DEMO CLIENT FR CREE ---')
  console.log(`E-mail: ${DEMO.email}`)
  console.log(`Mot de passe: ${DEMO.password}`)
  console.log(`User ID: ${userId}`)
  console.log(`Projets: ${projects.length}`)
  for (const p of projects) {
    console.log(`  - #${p.id} ${p.title} (${p.status})`)
  }
  console.log(`Tickets: ${tickets.length}`)
  for (const t of tickets) {
    console.log(`  - #${t.id} ${t.title} (${t.status})`)
  }
}

main().catch((error) => {
  console.error('Demo FR seed failed:', error)
  process.exit(1)
})
