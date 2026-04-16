// scripts/seed-demo-tickets.mjs
// Maakt 45 tickets aan, verdeeld over bestaande klanten, met verschillende statussen
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const statuses = [
  'nieuw', // aanvraag
  'in_behandeling', // tussenstap
  'wacht_op_klant', // wacht op klant
  'afgerond', // afgewerkt
  'gesloten', // gesloten
]

const subjects = [
  'Vraag over factuur',
  'Probleem met werf',
  'Technische vraag',
  'Afspraak maken',
  'Document ontbreekt',
  'Vraag over abonnement',
  'Ander probleem',
]

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  // Haal alle klanten op
  const { data: klanten, error } = await supabase.from('profiles').select('id,full_name,company_name').eq('role', 'client')
  if (error || !klanten || klanten.length === 0) {
    console.error('Geen klanten gevonden:', error)
    process.exit(1)
  }

  // Haal alle projecten op
  const { data: projecten } = await supabase.from('projects').select('id,user_id')

  for (let i = 0; i < 45; ++i) {
    const klant = randomItem(klanten)
    // Koppel ticket aan een random project van deze klant (indien mogelijk)
    const klantProjecten = projecten.filter(p => p.user_id === klant.id)
    const project = klantProjecten.length > 0 ? randomItem(klantProjecten) : null
    // Verdeel de statussen
    let status = 'nieuw';
    if (i < 10) status = 'nieuw';
    else if (i < 20) status = 'in_behandeling';
    else if (i < 30) status = 'wacht_op_klant';
    else if (i < 40) status = 'afgerond';
    else status = 'gesloten';
    const onderwerp = randomItem(subjects)
    const beschrijving = `Demo ticket #${i+1} voor ${klant.company_name || klant.full_name}`
    const insert = {
      customer_id: klant.id,
      project_id: project ? project.id : null,
      status,
      title: onderwerp, // verplicht veld
      subject: onderwerp,
      description: beschrijving,
      created_at: new Date(Date.now() - Math.random()*1000*60*60*24*30).toISOString(),
    }
    const { error: ticketError } = await supabase.from('tickets').insert([insert])
    if (ticketError) {
      console.error('Ticket fout:', ticketError)
    }
  }
  console.log('Demo tickets aangemaakt!')
}

main()
