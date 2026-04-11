import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BATCH_TAG = 'BE-TEST-2026'
const CUSTOMER_COUNT = 100
const PROJECTS_PER_CUSTOMER = 3
const DEFAULT_PASSWORD = 'Vm3dTest!2026'
const dryRun = process.argv.includes('--dry-run')

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

function createRng(seed) {
  let value = seed >>> 0
  return () => {
    value += 0x6D2B79F5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = createRng(20260411)

function pick(list, indexOffset = 0) {
  return list[Math.floor(rng() * list.length + indexOffset) % list.length]
}

function pad(value, size = 3) {
  return String(value).padStart(size, '0')
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function offsetCoordinate(base, spread = 0.045) {
  return Number((base + (rng() - 0.5) * spread).toFixed(6))
}

function makeVatNumber(index) {
  const body = String(100000000 + index * 137).padStart(9, '0').slice(0, 9)
  return `BE0${body}`
}

function makeEnterpriseNumber(index) {
  return String(100000000 + index * 137).padStart(10, '0').slice(0, 10)
}

function makePhone(areaCode, seed) {
  const block1 = String(200 + (seed % 700)).padStart(3, '0')
  const block2 = String(10 + ((seed * 17) % 90)).padStart(2, '0')
  const block3 = String(10 + ((seed * 29) % 90)).padStart(2, '0')
  return `+32 ${areaCode} ${block1} ${block2} ${block3}`
}

function makeMobile(seed) {
  const prefix = ['470', '471', '472', '473', '474', '475', '476', '477', '478', '479'][seed % 10]
  const block1 = String(100 + ((seed * 19) % 900)).padStart(3, '0')
  const block2 = String(10 + ((seed * 31) % 90)).padStart(2, '0')
  const block3 = String(10 + ((seed * 43) % 90)).padStart(2, '0')
  return `+32 ${prefix} ${block1} ${block2} ${block3}`
}

function isoDate(daysAgo) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

const cities = [
  { name: 'Antwerpen', postalCode: '2000', latitude: 51.219448, longitude: 4.402464, language: 'nl', areaCode: '3' },
  { name: 'Gent', postalCode: '9000', latitude: 51.054342, longitude: 3.717424, language: 'nl', areaCode: '9' },
  { name: 'Brugge', postalCode: '8000', latitude: 51.209348, longitude: 3.224699, language: 'nl', areaCode: '50' },
  { name: 'Leuven', postalCode: '3000', latitude: 50.879843, longitude: 4.700518, language: 'nl', areaCode: '16' },
  { name: 'Mechelen', postalCode: '2800', latitude: 51.025876, longitude: 4.477536, language: 'nl', areaCode: '15' },
  { name: 'Hasselt', postalCode: '3500', latitude: 50.93069, longitude: 5.33248, language: 'nl', areaCode: '11' },
  { name: 'Kortrijk', postalCode: '8500', latitude: 50.827095, longitude: 3.26487, language: 'nl', areaCode: '56' },
  { name: 'Aalst', postalCode: '9300', latitude: 50.93604, longitude: 4.0355, language: 'nl', areaCode: '53' },
  { name: 'Roeselare', postalCode: '8800', latitude: 50.94954, longitude: 3.12978, language: 'nl', areaCode: '51' },
  { name: 'Sint-Niklaas', postalCode: '9100', latitude: 51.16509, longitude: 4.1437, language: 'nl', areaCode: '3' },
  { name: 'Oostende', postalCode: '8400', latitude: 51.2302, longitude: 2.9158, language: 'nl', areaCode: '59' },
  { name: 'Turnhout', postalCode: '2300', latitude: 51.32254, longitude: 4.94471, language: 'nl', areaCode: '14' },
  { name: 'Genk', postalCode: '3600', latitude: 50.96626, longitude: 5.50218, language: 'nl', areaCode: '89' },
  { name: 'Brussel', postalCode: '1000', latitude: 50.85034, longitude: 4.35171, language: 'fr', areaCode: '2' },
  { name: 'Waterloo', postalCode: '1410', latitude: 50.71469, longitude: 4.3991, language: 'fr', areaCode: '2' },
  { name: 'Luik', postalCode: '4000', latitude: 50.63256, longitude: 5.57967, language: 'fr', areaCode: '4' },
  { name: 'Namen', postalCode: '5000', latitude: 50.46739, longitude: 4.87198, language: 'fr', areaCode: '81' },
  { name: 'Charleroi', postalCode: '6000', latitude: 50.41081, longitude: 4.44464, language: 'fr', areaCode: '71' },
  { name: 'Bergen', postalCode: '7000', latitude: 50.45424, longitude: 3.95229, language: 'fr', areaCode: '65' },
  { name: 'Doornik', postalCode: '7500', latitude: 50.60565, longitude: 3.387, language: 'fr', areaCode: '69' },
  { name: 'Aarlen', postalCode: '6700', latitude: 49.68333, longitude: 5.81667, language: 'fr', areaCode: '63' },
  { name: 'Waver', postalCode: '1300', latitude: 50.71667, longitude: 4.61667, language: 'fr', areaCode: '10' },
  { name: 'La Louvière', postalCode: '7100', latitude: 50.47932, longitude: 4.1872, language: 'fr', areaCode: '64' },
  { name: 'Verviers', postalCode: '4800', latitude: 50.58907, longitude: 5.86241, language: 'fr', areaCode: '87' },
  { name: 'Dinant', postalCode: '5500', latitude: 50.26057, longitude: 4.91156, language: 'fr', areaCode: '82' },
  { name: 'Moeskroen', postalCode: '7700', latitude: 50.74497, longitude: 3.20639, language: 'fr', areaCode: '56' },
  { name: 'Eupen', postalCode: '4700', latitude: 50.62937, longitude: 6.03156, language: 'de', areaCode: '87' },
  { name: 'Ieper', postalCode: '8900', latitude: 50.85114, longitude: 2.8915, language: 'nl', areaCode: '57' },
]

const firstNames = [
  'Emma', 'Noah', 'Lotte', 'Lucas', 'Julie', 'Milan', 'Sophie', 'Arthur', 'Elise', 'Louis',
  'Marie', 'Victor', 'Fien', 'Jules', 'Nina', 'Matteo', 'Zoë', 'Elias', 'Louise', 'Oscar',
  'Camille', 'Adam', 'Sarah', 'Bastien', 'Anouk', 'Julien', 'Hanne', 'Nathan', 'Laura', 'Florian'
]

const lastNames = [
  'Janssens', 'Peeters', 'Maes', 'Jacobs', 'Dubois', 'Martin', 'Lambert', 'Claes', 'Mertens', 'Willems',
  'Van den Broeck', 'Vermeulen', 'Dumont', 'Lefebvre', 'Wouters', 'De Smet', 'Renard', 'Goossens', 'Hubert', 'Poncelet',
  'De Vos', 'Aerts', 'Vandamme', 'Carlier', 'Moreau', 'Dierckx', 'Legrand', 'Van Hoof', 'Meunier', 'Thiry'
]

const companyNounsNl = ['Atelier', 'Bouwteam', 'Studiebureau', 'Projectgroep', 'Ontwerpstudio', 'Construct', 'Vastgoed', 'Interieur']
const companyNounsFr = ['Atelier', 'Bureau', 'Concept', 'Construction', 'Immobilier', 'Ingénierie', 'Design', 'Projets']
const streetNames = [
  'Stationsstraat', 'Kerkstraat', 'Nieuwstraat', 'Schoolstraat', 'Molenstraat', 'Markt', 'Meir', 'Lange Steenstraat',
  'Veldstraat', 'Dorpstraat', 'Kapellestraat', 'Bosstraat', 'Brusselsesteenweg', 'Industrieweg', 'Leuvensesteenweg', 'Hoogstraat'
]
const projectKinds = ['3D-scan magazijn', 'As-built kantoor', 'Residentiële opmeting', 'Werfcontrole', 'Gevelinmeting', 'Volumeonderzoek']

function makeCustomer(index) {
  const homeCity = cities[index % cities.length]
  const firstName = firstNames[index % firstNames.length]
  const lastName = lastNames[(index * 3) % lastNames.length]
  const companyNouns = homeCity.language === 'fr' ? companyNounsFr : companyNounsNl
  const companyPrefix = homeCity.language === 'fr' ? 'SRL' : 'BV'
  const companyName = `${companyPrefix} ${companyNouns[index % companyNouns.length]} ${lastName}`
  const street = streetNames[(index * 5) % streetNames.length]
  const houseNumber = String(4 + (index % 92))
  const bus = index % 4 === 0 ? String(1 + (index % 6)) : ''
  const email = `belgium.test.${pad(index + 1)}@example.test`
  const language = homeCity.language === 'de' ? 'de' : homeCity.language === 'fr' ? 'fr' : 'nl'

  return {
    idHint: `customer-${pad(index + 1)}`,
    full_name: `${firstName} ${lastName}`,
    company_name: companyName,
    email,
    vat_number: makeVatNumber(index + 1),
    enterprise_number: makeEnterpriseNumber(index + 1),
    reference: `${BATCH_TAG}-KL-${pad(index + 1)}`,
    salutation: index % 2 === 0 ? 'Dhr.' : 'Mevr.',
    director_first_name: firstName,
    director_last_name: lastName,
    rpr: homeCity.name,
    invoice_email: `factuur+${pad(index + 1)}@example.test`,
    website: `https://${slugify(companyName)}.example.test`,
    phone: makePhone(homeCity.areaCode, index + 1),
    mobile: makeMobile(index + 1),
    fax: index % 3 === 0 ? makePhone(homeCity.areaCode, index + 101) : null,
    language,
    payment_term_days: [14, 30, 30, 45][index % 4],
    quote_validity_days: [15, 30, 30, 60][index % 4],
    payment_method: 'overschrijving',
    currency: 'EUR',
    vat_rate: '21',
    invoice_send_method: 'email',
    send_xml: index % 5 === 0,
    xml_format: index % 5 === 0 ? 'ubl' : null,
    send_pdf: true,
    auto_reminders: index % 3 !== 0,
    role: 'customer',
    is_active: true,
    street,
    house_number: houseNumber,
    bus: bus || null,
    postal_code: homeCity.postalCode,
    city: homeCity.name,
    country: 'België',
    comments: `Fictieve testklant voor overzichtstesten (${BATCH_TAG}).`,
    latitude: offsetCoordinate(homeCity.latitude),
    longitude: offsetCoordinate(homeCity.longitude),
  }
}

function makeProjectsForCustomer(customer, customerIndex, userId) {
  return Array.from({ length: PROJECTS_PER_CUSTOMER }, (_, projectIndex) => {
    const projectCity = cities[(customerIndex + projectIndex * 7 + 3) % cities.length]
    const projectStreet = streetNames[(customerIndex * 2 + projectIndex * 3) % streetNames.length]
    const createdDaysAgo = customerIndex * 2 + projectIndex * 11 + 3
    const created_at = isoDate(createdDaysAgo)
    const status = ['ingediend', 'in_behandeling', 'klaar_voor_betaling', 'afgerond'][(customerIndex + projectIndex) % 4]
    const submitted_at = created_at
    const in_progress_at = ['in_behandeling', 'klaar_voor_betaling', 'afgerond'].includes(status)
      ? isoDate(Math.max(1, createdDaysAgo - 2))
      : null
    const ready_for_payment_at = ['klaar_voor_betaling', 'afgerond'].includes(status)
      ? isoDate(Math.max(1, createdDaysAgo - 1))
      : null
    const completed_at = status === 'afgerond' ? isoDate(Math.max(0, createdDaysAgo - 0)) : null
    const paid = status === 'afgerond' ? customerIndex % 2 === 0 : false
    const title = `BE Testwerf ${pad(customerIndex + 1)}-${projectIndex + 1} · ${projectKinds[(customerIndex + projectIndex) % projectKinds.length]}`
    const price = 850 + customerIndex * 35 + projectIndex * 180

    return {
      user_id: userId,
      title,
      description: `[${BATCH_TAG}] Fictieve werf voor testdoeleinden in ${projectCity.name}.`,
      address: `${projectStreet} ${12 + ((customerIndex + projectIndex) % 80)}, ${projectCity.postalCode} ${projectCity.name}`,
      status,
      price,
      currency: 'EUR',
      latitude: offsetCoordinate(projectCity.latitude),
      longitude: offsetCoordinate(projectCity.longitude),
      admin_notes: `Automatisch geïmporteerde testwerf (${BATCH_TAG}).`,
      paid,
      created_at,
      submitted_at,
      in_progress_at,
      ready_for_payment_at,
      completed_at,
    }
  })
}

async function listAllAuthUsers() {
  const map = new Map()
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 500 })
    if (error) throw error

    for (const user of data.users) {
      if (user.email) {
        map.set(user.email.toLowerCase(), user)
      }
    }

    if (!data.users.length || data.users.length < 500) {
      break
    }

    page += 1
  }

  return map
}

async function main() {
  const customers = Array.from({ length: CUSTOMER_COUNT }, (_, index) => makeCustomer(index))
  const emails = customers.map((customer) => customer.email)

  const authUsersByEmail = await listAllAuthUsers()
  const { data: existingProfiles, error: profileLookupError } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', emails)

  if (profileLookupError) {
    throw profileLookupError
  }

  const profileByEmail = new Map((existingProfiles ?? []).map((profile) => [profile.email?.toLowerCase(), profile]))

  let createdAuthUsers = 0
  let reusedAuthUsers = 0
  const preparedProfiles = []

  for (const customer of customers) {
    const existingProfile = profileByEmail.get(customer.email.toLowerCase())
    let userId = existingProfile?.id ?? null

    if (!userId) {
      const existingAuthUser = authUsersByEmail.get(customer.email.toLowerCase())
      if (existingAuthUser?.id) {
        userId = existingAuthUser.id
        reusedAuthUsers += 1
      } else if (!dryRun) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: customer.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: customer.full_name,
            company_name: customer.company_name,
            source: BATCH_TAG,
          },
        })

        if (error || !data.user) {
          throw error ?? new Error(`Klant kon niet worden aangemaakt: ${customer.email}`)
        }

        userId = data.user.id
        createdAuthUsers += 1
      } else {
        userId = `dry-run-${customer.idHint}`
        createdAuthUsers += 1
      }
    }

    const { idHint: _idHint, ...profilePayload } = customer

    preparedProfiles.push({
      id: userId,
      ...profilePayload,
    })
  }

  if (!dryRun) {
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(preparedProfiles, { onConflict: 'id' })

    if (upsertError) {
      throw upsertError
    }
  }

  const { data: existingProjects, error: existingProjectsError } = await supabase
    .from('projects')
    .select('user_id, title')
    .ilike('description', `%${BATCH_TAG}%`)

  if (existingProjectsError) {
    throw existingProjectsError
  }

  const existingProjectKeys = new Set(
    (existingProjects ?? []).map((project) => `${project.user_id}::${project.title}`)
  )

  const projectsToInsert = []
  for (let customerIndex = 0; customerIndex < preparedProfiles.length; customerIndex += 1) {
    const profile = preparedProfiles[customerIndex]
    const projectRows = makeProjectsForCustomer(profile, customerIndex, profile.id)

    for (const project of projectRows) {
      const key = `${project.user_id}::${project.title}`
      if (!existingProjectKeys.has(key)) {
        projectsToInsert.push(project)
      }
    }
  }

  let insertedProjects = 0
  if (!dryRun && projectsToInsert.length > 0) {
    for (let start = 0; start < projectsToInsert.length; start += 50) {
      const batch = projectsToInsert.slice(start, start + 50)
      const { error } = await supabase.from('projects').insert(batch)
      if (error) {
        throw error
      }
      insertedProjects += batch.length
    }
  } else {
    insertedProjects = projectsToInsert.length
  }

  console.log('--- Belgium test data import summary ---')
  console.log(`Mode: ${dryRun ? 'dry-run' : 'live import'}`)
  console.log(`Batch tag: ${BATCH_TAG}`)
  console.log(`Customers prepared: ${preparedProfiles.length}`)
  console.log(`Auth users created: ${createdAuthUsers}`)
  console.log(`Auth users reused: ${reusedAuthUsers}`)
  console.log(`Projects queued: ${projectsToInsert.length}`)
  console.log(`Projects inserted: ${insertedProjects}`)
  console.log(`Default password for test logins: ${DEFAULT_PASSWORD}`)
  console.log('Sample customers:')
  for (const sample of preparedProfiles.slice(0, 5)) {
    console.log(`- ${sample.company_name} | ${sample.email} | ${sample.city}`)
  }
}

main().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
