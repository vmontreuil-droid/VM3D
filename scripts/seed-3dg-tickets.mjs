/**
 * Seed 10 tickets for 3DG Machine Control Systems demo customer
 * with different priorities and statuses linked to real projects.
 *
 * Run: node scripts/seed-3dg-tickets.mjs
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function loadEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // ignore
  }
}
loadEnv(path.join(process.cwd(), '.env.local'))

const USER_ID = '6a50eab0-ad68-483f-a444-dde2f252accb'
const ADMIN_ID = 'b2127625-044c-411a-9553-37b7e737b343'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('🎫 Seeding tickets for 3DG Machine Control Systems...\n')

  // 1. Get some project IDs for this user
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('id, name, address')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(10)

  if (projErr) {
    console.error('❌ Could not fetch projects:', projErr.message)
    process.exit(1)
  }

  console.log(`  📂 Found ${projects.length} projects to link tickets to\n`)

  // 2. Delete existing tickets for this customer
  const { count: deleted } = await supabase
    .from('tickets')
    .delete({ count: 'exact' })
    .eq('customer_id', USER_ID)

  if (deleted > 0) {
    console.log(`  🗑️  Deleted ${deleted} old tickets\n`)
  }

  // 3. Define 10 tickets with varied priorities, statuses and ages
  const now = new Date()
  const hoursAgo = (h) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString()
  const daysAgo = (d) => hoursAgo(d * 24)

  const tickets = [
    {
      title: 'GPS-signaal valt weg op werf Antwerpen',
      description:
        'Tijdens meting op de Meir valt het GPS-signaal regelmatig weg. Mogelijk interferentie door hoge gebouwen. Graag advies over antenne-upgrade.',
      status: 'nieuw',
      priority: 'urgent',
      project_id: projects[0]?.id ?? null,
      created_at: hoursAgo(2),
    },
    {
      title: 'Factuur #2026-018 klopt niet',
      description:
        'Het bedrag op factuur #2026-018 wijkt af van de offerte. Er staat €4.200 terwijl de offerte €3.750 vermeldt. Graag nakijken.',
      status: 'nieuw',
      priority: 'hoog',
      project_id: projects[1]?.id ?? null,
      created_at: hoursAgo(6),
    },
    {
      title: 'Toegang tot bestanden werf Gent',
      description:
        'Ik kan de DWG-bestanden van het project in Gent niet downloaden. De downloadknop geeft een foutmelding.',
      status: 'in_behandeling',
      priority: 'hoog',
      project_id: projects[2]?.id ?? null,
      created_at: daysAgo(1),
    },
    {
      title: 'Vraag over coördinatensysteem Lambert 72',
      description:
        'Voor de werf in Brugge moet ik weten of de coördinaten in Lambert 72 of WGS84 zijn. Dit is nodig voor de aansluiting met ons eigen systeem.',
      status: 'in_behandeling',
      priority: 'normaal',
      project_id: projects[3]?.id ?? null,
      created_at: daysAgo(2),
    },
    {
      title: 'Planning inmeting volgende week',
      description:
        'Kunnen we de inmeting voor het project in Leuven inplannen op dinsdag of woensdag volgende week? Graag bevestiging.',
      status: 'wacht_op_klant',
      priority: 'normaal',
      project_id: projects[4]?.id ?? null,
      created_at: daysAgo(3),
    },
    {
      title: 'Extra meetpunten nodig voor fase 2',
      description:
        'Na overleg met de aannemer blijkt dat er 15 extra meetpunten nodig zijn voor fase 2 van het project in Mechelen. Graag offerte hiervoor.',
      status: 'wacht_op_klant',
      priority: 'normaal',
      project_id: projects[5]?.id ?? null,
      created_at: daysAgo(4),
    },
    {
      title: 'Dronebeelden niet scherp genoeg',
      description:
        'De orthofoto van de werf in Hasselt is niet scherp genoeg voor detailanalyse. Kan dit opnieuw gevlogen worden bij beter weer?',
      status: 'in_behandeling',
      priority: 'hoog',
      project_id: projects[6]?.id ?? null,
      created_at: daysAgo(5),
    },
    {
      title: 'Vraag over garantievoorwaarden',
      description:
        'Wat zijn de garantievoorwaarden op de geleverde hoogtepunten? We willen dit opnemen in ons kwaliteitsplan.',
      status: 'afgerond',
      priority: 'laag',
      project_id: projects[7]?.id ?? null,
      created_at: daysAgo(10),
    },
    {
      title: 'Vertraging door weersomstandigheden',
      description:
        'Door aanhoudende regen konden de metingen in Namen niet uitgevoerd worden. Wanneer is de nieuwe planning?',
      status: 'afgerond',
      priority: 'normaal',
      project_id: projects[8]?.id ?? null,
      created_at: daysAgo(14),
    },
    {
      title: 'Aanvraag certificaat van opmeting',
      description:
        'Voor de bouwvergunning in Luik hebben we een officieel certificaat van opmeting nodig. Is dit beschikbaar?',
      status: 'gesloten',
      priority: 'laag',
      project_id: projects[9]?.id ?? null,
      created_at: daysAgo(21),
    },
  ]

  // 4. Insert tickets
  const ticketPayloads = tickets.map((t) => ({
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    customer_id: USER_ID,
    created_by: USER_ID,
    assigned_to: ADMIN_ID,
    project_id: t.project_id,
    created_at: t.created_at,
    updated_at: t.created_at,
    last_reply_at: t.created_at,
  }))

  const { data: inserted, error: ticketErr } = await supabase
    .from('tickets')
    .insert(ticketPayloads)
    .select('id, title, status, priority')

  if (ticketErr) {
    console.error('❌ Failed to insert tickets:', ticketErr.message)
    process.exit(1)
  }

  console.log(`  ✅ Inserted ${inserted.length} tickets:\n`)

  const statusEmoji = {
    nieuw: '🆕',
    in_behandeling: '🔧',
    wacht_op_klant: '⏳',
    afgerond: '✅',
    gesloten: '🔒',
  }

  const priorityEmoji = {
    laag: '🟢',
    normaal: '🟡',
    hoog: '🟠',
    urgent: '🔴',
  }

  for (const t of inserted) {
    const se = statusEmoji[t.status] || '❓'
    const pe = priorityEmoji[t.priority] || '❓'
    console.log(`     ${se} ${pe} [${t.priority.toUpperCase()}] ${t.title}`)
  }

  // Summary
  const byStatus = {}
  const byPriority = {}
  for (const t of inserted) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1
  }

  console.log('\n  📊 Per status:')
  for (const [k, v] of Object.entries(byStatus)) {
    console.log(`     ${statusEmoji[k] || '❓'} ${k}: ${v}`)
  }

  console.log('\n  📊 Per prioriteit:')
  for (const [k, v] of Object.entries(byPriority)) {
    console.log(`     ${priorityEmoji[k] || '❓'} ${k}: ${v}`)
  }

  console.log('\n🎉 Done!')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
