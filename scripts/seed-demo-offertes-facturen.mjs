// scripts/seed-demo-offertes-facturen.mjs
// Maakt demo-offertes aan (diverse statussen) + facturen van goedgekeurde offertes
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Landmeter diensten (subset)
const diensten = [
  { beschrijving: 'Opmeting bouwperceel (< 500 m²)', eenheid: 'stuk', prijs: 450 },
  { beschrijving: 'Opmeting bouwperceel (500–1000 m²)', eenheid: 'stuk', prijs: 650 },
  { beschrijving: 'Topografische opmeting terrein (< 1 ha)', eenheid: 'stuk', prijs: 850 },
  { beschrijving: 'Minnelijke afpaling (2 partijen)', eenheid: 'stuk', prijs: 750 },
  { beschrijving: 'Gerechtelijke afpaling', eenheid: 'stuk', prijs: 1500 },
  { beschrijving: 'Plaatsing grenspaal (beton of kunststof)', eenheid: 'paal', prijs: 85 },
  { beschrijving: 'Opmaak verkavelingsplan (2 loten)', eenheid: 'stuk', prijs: 2500 },
  { beschrijving: 'Plaatsbeschrijving intrede — woning', eenheid: 'stuk', prijs: 400 },
  { beschrijving: 'Plaatsbeschrijving uittrede — woning', eenheid: 'stuk', prijs: 400 },
  { beschrijving: 'Basisakte mede-eigendom — klein gebouw (2–4 eenheden)', eenheid: 'stuk', prijs: 1800 },
  { beschrijving: 'Inplantingsplan voor bouwaanvraag', eenheid: 'stuk', prijs: 450 },
  { beschrijving: 'As-builtplan na werken', eenheid: 'stuk', prijs: 500 },
  { beschrijving: 'Uitzetting bouwlijn op terrein', eenheid: 'stuk', prijs: 350 },
  { beschrijving: 'Uitzetting funderingen', eenheid: 'stuk', prijs: 450 },
  { beschrijving: 'Controle peil na funderingswerken', eenheid: 'stuk', prijs: 250 },
  { beschrijving: 'Kadastraal uittreksel opvragen', eenheid: 'stuk', prijs: 45 },
  { beschrijving: 'Verplaatsingskosten (binnen 25 km)', eenheid: 'verplaatsing', prijs: 45 },
  { beschrijving: 'Opmeting bestaand gebouw — grondplan', eenheid: 'stuk', prijs: 550 },
  { beschrijving: 'Opmaak splitsingsplan (notarieel)', eenheid: 'stuk', prijs: 650 },
  { beschrijving: 'Hoogtemeting / nivellering', eenheid: 'stuk', prijs: 350 },
]

const onderwerpen = [
  'Opmeting nieuwbouw woning',
  'Afpaling perceel Kerkstraat',
  'Topografische opmeting bedrijfsterrein',
  'Verkavelingsplan 3 loten',
  'Plaatsbeschrijving huurwoning',
  'Basisakte appartementsgebouw',
  'Inplantingsplan renovatieproject',
  'Uitzetting funderingen nieuwbouw',
  'As-built oplevering werf',
  'Opmeting bestaand pand',
  'Splitsingsplan voor notaris',
  'Afpaling + grenspalen plaatsen',
  'Nivellering bouwgrond',
  'Controle ruwbouw + peil',
  'Kadastrale opzoeking + opmeting',
]

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

async function main() {
  console.log('🔍 Klanten ophalen...')
  const { data: customers, error: custErr } = await supabase
    .from('profiles')
    .select('id, company_name, full_name, email')
    .neq('role', 'admin')
    .limit(20)

  if (custErr || !customers?.length) {
    console.error('Geen klanten gevonden:', custErr)
    process.exit(1)
  }

  // Admin user ophalen
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)

  const adminId = admins?.[0]?.id
  if (!adminId) {
    console.error('Geen admin gevonden')
    process.exit(1)
  }

  // Projecten ophalen (optioneel linken)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, user_id')
    .limit(50)

  const safeProjects = projects ?? []

  const year = new Date().getFullYear()
  const statuses = ['concept', 'verstuurd', 'wacht_op_klant', 'goedgekeurd', 'afgekeurd', 'verlopen']
  const statusWeights = [2, 3, 2, 5, 2, 1] // meer goedgekeurd
  const vatRates = ['21%', '6%', '21%', '21%', '12%'] // voornamelijk 21%

  function weightedStatus() {
    const total = statusWeights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    for (let i = 0; i < statuses.length; i++) {
      r -= statusWeights[i]
      if (r <= 0) return statuses[i]
    }
    return 'concept'
  }

  console.log('📝 Offertes aanmaken...')
  const createdOffertes = []

  for (let i = 0; i < 15; i++) {
    const customer = pickRandom(customers)
    const status = weightedStatus()
    const subject = pickRandom(onderwerpen)
    const vatRate = pickRandom(vatRates)
    const vatPct = parseFloat(vatRate) / 100

    // Kies 1-4 diensten voor deze offerte
    const numLines = randomInt(1, 4)
    const selectedDiensten = []
    const usedIndexes = new Set()
    for (let j = 0; j < numLines; j++) {
      let idx
      do { idx = randomInt(0, diensten.length - 1) } while (usedIndexes.has(idx))
      usedIndexes.add(idx)
      selectedDiensten.push(diensten[idx])
    }

    const lines = selectedDiensten.map((d, idx) => {
      const qty = d.eenheid === 'paal' || d.eenheid === 'verplaatsing' ? randomInt(1, 6) : 1
      const lineSubtotal = qty * d.prijs
      const lineVat = Math.round(lineSubtotal * vatPct * 100) / 100
      return {
        position: idx,
        description: d.beschrijving,
        quantity: qty,
        unit: d.eenheid,
        unit_price: d.prijs,
        vat_rate: vatRate,
        line_total: lineSubtotal + lineVat,
        _subtotal: lineSubtotal,
        _vat: lineVat,
      }
    })

    const subtotal = lines.reduce((s, l) => s + l._subtotal, 0)
    const vatAmount = lines.reduce((s, l) => s + l._vat, 0)
    const total = subtotal + vatAmount

    const offerteNumber = `OFF-${year}-${String(i + 1).padStart(4, '0')}`
    const createdDaysAgo = randomInt(2, 60)

    // Koppel optioneel aan project van dezelfde klant
    const customerProjects = safeProjects.filter((p) => p.user_id === customer.id)
    const projectId = customerProjects.length > 0 ? pickRandom(customerProjects).id : null

    const { data: offerte, error: offErr } = await supabase
      .from('offertes')
      .insert({
        offerte_number: offerteNumber,
        customer_id: customer.id,
        project_id: projectId,
        created_by: adminId,
        status,
        subject,
        description: `Demo offerte voor ${customer.company_name || customer.full_name || 'klant'}`,
        valid_until: daysFromNow(30),
        currency: 'EUR',
        vat_rate: vatRate,
        payment_terms: '30 dagen na factuurdatum',
        subtotal,
        vat_amount: vatAmount,
        total,
        created_at: daysAgo(createdDaysAgo),
      })
      .select('id, offerte_number, status, customer_id, project_id, subject, total, subtotal, vat_amount, vat_rate, currency, payment_terms, notes, description')
      .single()

    if (offErr) {
      console.error(`❌ Offerte ${i + 1} mislukt:`, offErr.message)
      continue
    }

    // Regels invoegen
    const lineInserts = lines.map((l) => ({
      offerte_id: offerte.id,
      position: l.position,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unit_price: l.unit_price,
      vat_rate: l.vat_rate,
      line_total: l.line_total,
    }))

    await supabase.from('offerte_lines').insert(lineInserts)

    createdOffertes.push(offerte)
    const label = customer.company_name || customer.full_name || customer.email
    console.log(`  ✅ ${offerteNumber} — ${status} — ${label} — €${total.toFixed(2)}`)
  }

  // Facturen maken van goedgekeurde offertes
  const goedgekeurde = createdOffertes.filter((o) => o.status === 'goedgekeurd')
  console.log(`\n🧾 ${goedgekeurde.length} goedgekeurde offertes → facturen aanmaken...`)

  const factuurStatuses = ['concept', 'verstuurd', 'betaald', 'betaald', 'verstuurd']

  for (let i = 0; i < goedgekeurde.length; i++) {
    const offerte = goedgekeurde[i]
    const factuurNumber = `FAC-${year}-${String(i + 1).padStart(4, '0')}`
    const fStatus = pickRandom(factuurStatuses)

    // Regels ophalen
    const { data: offerteLines } = await supabase
      .from('offerte_lines')
      .select('*')
      .eq('offerte_id', offerte.id)
      .order('position')

    const { data: factuur, error: facErr } = await supabase
      .from('facturen')
      .insert({
        factuur_number: factuurNumber,
        offerte_id: offerte.id,
        customer_id: offerte.customer_id,
        project_id: offerte.project_id,
        created_by: adminId,
        status: fStatus,
        subject: offerte.subject,
        description: offerte.description,
        due_date: daysFromNow(randomInt(14, 60)),
        currency: offerte.currency,
        vat_rate: offerte.vat_rate,
        payment_terms: offerte.payment_terms,
        notes: offerte.notes,
        subtotal: offerte.subtotal,
        vat_amount: offerte.vat_amount,
        total: offerte.total,
        paid_at: fStatus === 'betaald' ? daysAgo(randomInt(1, 15)) : null,
      })
      .select('id')
      .single()

    if (facErr) {
      console.error(`❌ Factuur ${factuurNumber} mislukt:`, facErr.message)
      continue
    }

    // Regels kopiëren
    if (offerteLines?.length) {
      const lineInserts = offerteLines.map((l) => ({
        factuur_id: factuur.id,
        position: l.position,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unit_price: l.unit_price,
        vat_rate: l.vat_rate,
        line_total: l.line_total,
      }))

      await supabase.from('factuur_lines').insert(lineInserts)
    }

    console.log(`  ✅ ${factuurNumber} — ${fStatus} — €${Number(offerte.total).toFixed(2)}`)
  }

  console.log('\n🎉 Klaar! Offertes en facturen zijn aangemaakt.')
}

main().catch(console.error)
