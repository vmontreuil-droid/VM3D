import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DEMO = {
  email: 'demo.klant.mv3d@example.test',
  password: 'DemoMv3d!2026',
  fullName: 'Thomas Vermeulen',
  companyName: 'BV Demo Construct Van Hoof',
  vatNumber: 'BE0100004110',
  phone: '+32 9 298 11 22',
  mobile: '+32 470 670 40 40',
  street: 'Kerkstraat',
  houseNumber: '14',
  postalCode: '9000',
  city: 'Gent',
  country: 'België',
  comments: '[DEMO-CUSTOMER-2026] Fictieve demo-klant voor portaalvalidatie.',
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error('Supabase credentials ontbreken in .env.local')
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
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

async function ensureDemoAuthUser() {
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

  if (error || !data.user) throw error || new Error('Kon demo auth user niet aanmaken')

  return data.user.id
}

async function cleanupExistingDemoData(userId) {
  const { data: existingProjects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId)

  if (projectsError) throw projectsError

  const projectIds = (existingProjects || []).map((p) => p.id)

  const { error: ticketsError } = await supabase
    .from('tickets')
    .delete()
    .eq('customer_id', userId)

  if (ticketsError) throw ticketsError

  if (projectIds.length > 0) {
    const { error: timelineError } = await supabase
      .from('project_timeline')
      .delete()
      .in('project_id', projectIds)
    if (timelineError) throw timelineError

    const { error: filesError } = await supabase
      .from('project_files')
      .delete()
      .in('project_id', projectIds)
    if (filesError) throw filesError

    const { error: deleteProjectsError } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', userId)
    if (deleteProjectsError) throw deleteProjectsError
  }
}

async function upsertDemoProfile(userId) {
  const profilePayload = {
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
    language: 'nl',
    payment_method: 'overschrijving',
    currency: 'EUR',
  }

  const { error } = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' })
  if (error) throw error
}

async function createDemoProjects(userId) {
  const projects = [
    {
      user_id: userId,
      title: 'BE Testwerf 030-1 · Volumeonderzoek',
      description: '[DEMO-CUSTOMER-2026] Fictieve werf voor validatie in Mechelen.',
      address: 'Kapellestraat 41, 2800 Mechelen',
      status: 'in_behandeling',
      price: 1865,
      currency: 'EUR',
      latitude: 51.025876,
      longitude: 4.477536,
      admin_notes: 'Demo-notitie: klant wacht op volumevalidatie.',
      paid: false,
      created_at: isoDaysFromNow(-60),
      submitted_at: isoDaysFromNow(-60),
      in_progress_at: isoDaysFromNow(-58),
    },
    {
      user_id: userId,
      title: 'BE Testwerf 030-2 · 3D-scan magazijn',
      description: '[DEMO-CUSTOMER-2026] Fictieve werf voor validatie in Antwerpen.',
      address: 'Noorderlaan 125, 2030 Antwerpen',
      status: 'klaar_voor_betaling',
      price: 2490,
      currency: 'EUR',
      latitude: 51.260197,
      longitude: 4.400212,
      admin_notes: 'Demo-notitie: klaar voor facturatie en oplevering.',
      paid: false,
      created_at: isoDaysFromNow(-72),
      submitted_at: isoDaysFromNow(-72),
      in_progress_at: isoDaysFromNow(-68),
      ready_for_payment_at: isoDaysFromNow(-30),
    },
    {
      user_id: userId,
      title: 'BE Testwerf 030-3 · As-built kantoor',
      description: '[DEMO-CUSTOMER-2026] Fictieve werf voor validatie in Gent.',
      address: 'Veldstraat 88, 9000 Gent',
      status: 'afgerond',
      price: 1580,
      currency: 'EUR',
      latitude: 51.05356,
      longitude: 3.72124,
      admin_notes: 'Demo-notitie: opgeleverd en intern afgerond.',
      paid: true,
      created_at: isoDaysFromNow(-90),
      submitted_at: isoDaysFromNow(-90),
      in_progress_at: isoDaysFromNow(-86),
      ready_for_payment_at: isoDaysFromNow(-40),
      completed_at: isoDaysFromNow(-20),
    },
  ]

  const { data, error } = await supabase
    .from('projects')
    .insert(projects)
    .select('id, title, status')
    .order('id', { ascending: true })

  if (error || !data) throw error || new Error('Kon demo projecten niet aanmaken')

  return data
}

async function createDemoTickets(userId, projects) {
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)

  const assignedAdminId = adminProfiles?.[0]?.id || null

  const tickets = [
    {
      title: 'Vraag over opleverbestand project 030-2',
      description: 'Klant vraagt wanneer het finale pakket beschikbaar is.',
      status: 'nieuw',
      priority: 'normaal',
      customer_id: userId,
      project_id: projects[1]?.id ?? null,
      created_by: userId,
      assigned_to: assignedAdminId,
      due_date: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
      last_reply_at: isoDaysFromNow(-1),
    },
    {
      title: 'Adrescheck voor project 030-1',
      description: 'Klant bevestigt dat het huisnummer aangepast moet worden.',
      status: 'in_behandeling',
      priority: 'hoog',
      customer_id: userId,
      project_id: projects[0]?.id ?? null,
      created_by: userId,
      assigned_to: assignedAdminId,
      due_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      last_reply_at: isoDaysFromNow(-2),
    },
    {
      title: 'Aanvullende vraag facturatie project 030-3',
      description: 'Klant vraagt kopie van factuur en opleveringsdatum.',
      status: 'wacht_op_klant',
      priority: 'laag',
      customer_id: userId,
      project_id: projects[2]?.id ?? null,
      created_by: userId,
      assigned_to: assignedAdminId,
      due_date: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10),
      last_reply_at: isoDaysFromNow(-3),
    },
  ]

  const { data: ticketRows, error: ticketError } = await supabase
    .from('tickets')
    .insert(tickets)
    .select('id, title, status')
    .order('id', { ascending: true })

  if (ticketError || !ticketRows) throw ticketError || new Error('Kon demo tickets niet aanmaken')

  const messages = []
  for (const ticket of ticketRows) {
    messages.push({
      ticket_id: ticket.id,
      author_id: userId,
      message: `Demo-bericht van klant voor ticket #${ticket.id}.`,
      is_internal: false,
    })

    if (assignedAdminId) {
      messages.push({
        ticket_id: ticket.id,
        author_id: assignedAdminId,
        message: `Demo-opvolging door admin voor ticket #${ticket.id}.`,
        is_internal: true,
      })
    }
  }

  if (messages.length > 0) {
    const { error: msgError } = await supabase.from('ticket_messages').insert(messages)
    if (msgError) throw msgError
  }

  return ticketRows
}

async function main() {
  const userId = await ensureDemoAuthUser()

  await upsertDemoProfile(userId)
  await cleanupExistingDemoData(userId)

  const projects = await createDemoProjects(userId)
  const tickets = await createDemoTickets(userId, projects)

  console.log('--- DEMO KLANT AANGEMAAKT ---')
  console.log(`E-mail: ${DEMO.email}`)
  console.log(`Wachtwoord: ${DEMO.password}`)
  console.log(`User ID: ${userId}`)
  console.log(`Projecten: ${projects.length}`)
  for (const project of projects) {
    console.log(`  - #${project.id} ${project.title} (${project.status})`)
  }
  console.log(`Tickets: ${tickets.length}`)
  for (const ticket of tickets) {
    console.log(`  - #${ticket.id} ${ticket.title} (${ticket.status})`)
  }
  console.log('Inloggen via: /login')
  console.log('Klantroutes: /dashboard, /dashboard/tickets, /dashboard/klantfiche')
}

main().catch((error) => {
  console.error('Demo seed failed:', error)
  process.exit(1)
})
