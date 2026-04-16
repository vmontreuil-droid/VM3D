// scripts/seed-demo-customers.mjs
// Seed script voor Supabase: 50 klanten met 5 werven elk, open data, echte adressen, btw, logo


import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import 'dotenv/config';
import { randomUUID } from 'crypto';

// Helper to create a user in Supabase Auth
async function createAuthUser(supabase, email, password) {
  // Use the admin API to create a user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (error) {
    console.error('Auth user fout', error);
    return null;
  }
  return data.user;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Open data adressen voor klanten en werven (BE/NL/LU/FR)
const openDataAddresses = [
  { street: 'Nieuwstraat', number: '1', zip: '1000', city: 'Brussel', country: 'BE', lat: 50.8503, lng: 4.3517, vat: 'BE0428759497' },
  { street: 'Meir', number: '50', zip: '2000', city: 'Antwerpen', country: 'BE', lat: 51.2194, lng: 4.4025, vat: 'BE0403440990' },
  { street: 'Veldstraat', number: '23', zip: '9000', city: 'Gent', country: 'BE', lat: 51.0543, lng: 3.7174, vat: 'BE0412029490' },
  { street: 'Boulevard de la Sauvenière', number: '100', zip: '4000', city: 'Luik', country: 'BE', lat: 50.6326, lng: 5.5797, vat: 'BE0407726077' },
  { street: 'Steenstraat', number: '12', zip: '8000', city: 'Brugge', country: 'BE', lat: 51.2093, lng: 3.2247, vat: 'BE0403184916' },
  // Nederland
  { street: 'Damrak', number: '1', zip: '1012', city: 'Amsterdam', country: 'NL', lat: 52.3728, lng: 4.8936, vat: 'NL001234567B01' },
  { street: 'Coolsingel', number: '105', zip: '3011', city: 'Rotterdam', country: 'NL', lat: 51.9225, lng: 4.4792, vat: 'NL004495445B01' },
  { street: 'Oudegracht', number: '167', zip: '3511', city: 'Utrecht', country: 'NL', lat: 52.0907, lng: 5.1214, vat: 'NL003456789B01' },
  { street: 'Stationsweg', number: '20', zip: '5611', city: 'Eindhoven', country: 'NL', lat: 51.4416, lng: 5.4697, vat: 'NL002345678B01' },
  { street: 'Grote Staat', number: '5', zip: '6211', city: 'Maastricht', country: 'NL', lat: 50.8514, lng: 5.6900, vat: 'NL009876543B01' },
  // Luxemburg
  { street: 'Avenue de la Gare', number: '10', zip: 'L-1111', city: 'Luxembourg', country: 'LU', lat: 49.6116, lng: 6.1319, vat: 'LU26375245' },
  { street: 'Rue de l’Alzette', number: '50', zip: 'L-4001', city: 'Esch-sur-Alzette', country: 'LU', lat: 49.4958, lng: 5.9806, vat: 'LU20165786' },
  { street: 'Avenue Charlotte', number: '2', zip: 'L-4501', city: 'Differdange', country: 'LU', lat: 49.5242, lng: 5.8914, vat: 'LU28060791' },
  // Frankrijk
  { street: 'Rue de Rivoli', number: '99', zip: '75001', city: 'Paris', country: 'FR', lat: 48.8566, lng: 2.3522, vat: 'FR40303265045' },
  { street: 'Rue de la République', number: '10', zip: '69001', city: 'Lyon', country: 'FR', lat: 45.7640, lng: 4.8357, vat: 'FR23334175221' },
  { street: 'La Canebière', number: '130', zip: '13001', city: 'Marseille', country: 'FR', lat: 43.2965, lng: 5.3698, vat: 'FR40303265045' },
  { street: 'Rue de Béthune', number: '20', zip: '59000', city: 'Lille', country: 'FR', lat: 50.6292, lng: 3.0573, vat: 'FR23334175221' },
  { street: 'Avenue Jean Médecin', number: '15', zip: '06000', city: 'Nice', country: 'FR', lat: 43.7102, lng: 7.2620, vat: 'FR40303265045' },
];

// Genereer 50 klanten met unieke adressen uit open data
const companies = [];
for (let i = 0; i < 50; ++i) {
  const addr = openDataAddresses[i % openDataAddresses.length];
  companies.push({
    name: `Demo Company ${i+1}`,
    address: `${addr.street} ${addr.number}, ${addr.zip} ${addr.city}, ${addr.country === 'BE' ? 'België' : addr.country === 'NL' ? 'Nederland' : addr.country === 'LU' ? 'Luxemburg' : 'Frankrijk'}`,
    vat: addr.vat,
    country: addr.country,
    logo: `https://api.dicebear.com/7.x/identicon/svg?seed=demo${i+1}`,
    city: addr.city,
    zip: addr.zip,
    street: addr.street,
    number: addr.number,
    lat: addr.lat,
    lng: addr.lng,
  });
}

function randomCoords(country) {
  // Willekeurige coördinaten binnen BE/NL/LU/FR
  const bounds = {
    BE: { lat: [49.5, 51.5], lng: [2.5, 6.4] },
    NL: { lat: [50.7, 53.6], lng: [3.2, 7.2] },
    LU: { lat: [49.4, 50.2], lng: [5.7, 6.5] },
    FR: { lat: [42.3, 51.1], lng: [-5.1, 8.2] },
  };
  const b = bounds[country] || bounds['BE'];
  const lat = b.lat[0] + Math.random() * (b.lat[1] - b.lat[0]);
  const lng = b.lng[0] + Math.random() * (b.lng[1] - b.lng[0]);
  return [lat, lng];
}

async function main() {

  // 1. Verwijder bestaande demo-users uit Supabase Auth
  const { data: users } = await supabase.auth.admin.listUsers();
  if (users && users.users) {
    for (const user of users.users) {
      if (user.email && user.email.endsWith('@demo.be')) {
        await supabase.auth.admin.deleteUser(user.id);
        console.log('Verwijderde auth user:', user.email);
      }
    }
  }

  // 2. Overschrijf bestaande demo-klanten en werven
  await supabase.from('profiles').delete().ilike('email', '%@demo.be');
  await supabase.from('projects').delete().ilike('name', 'Werf demo%');

  for (let i = 0; i < companies.length; ++i) {
    const c = companies[i];
    const email = `klant${i+1}@demo.be`;
    const phone = `+32 4${Math.floor(10000000 + Math.random()*89999999)}`;
    const password = 'Demo1234!'; // Simple password for all demo users

    // 1. Create user in Supabase Auth
    const user = await createAuthUser(supabase, email, password);
    if (!user) { console.error('Kon geen auth user maken voor', email); continue; }

    // 2. Controleer adres via VIES (BTW lookup)
    let klantAdres = c.address;
    let klantCity = c.address.split(',')[1]?.trim() || '';
    let klantLat = c.lat;
    let klantLng = c.lng;
    try {
      const viesRes = await fetch(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${c.vat.substring(0,2)}/vat/${c.vat.substring(2)}`);
      if (viesRes.ok) {
        const viesData = await viesRes.json();
        if (viesData && viesData.address) {
          klantAdres = viesData.address;
          // Probeer stad te extraheren uit adres
          const cityMatch = klantAdres.match(/\d{4,5} ([^,]+)/);
          if (cityMatch) klantCity = cityMatch[1];
        }
      }
    } catch (e) { /* VIES lookup mag falen */ }

    // 3. Geocode adres indien nodig
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(klantAdres)}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData[0]) {
          klantLat = parseFloat(geoData[0].lat);
          klantLng = parseFloat(geoData[0].lon);
        }
      }
    } catch (e) { /* Geocoding mag falen */ }

    const { data: klant, error } = await supabase.from('profiles').insert([{
      id: user.id,
      email,
      full_name: c.name,
      company_name: c.name,
      vat_number: c.vat,
      address: klantAdres,
      city: klantCity,
      latitude: klantLat,
      longitude: klantLng,
      phone,
      logo_url: c.logo,
      role: 'client',
      created_at: new Date().toISOString(),
    }]).select().single();
    if (error) { console.error('Klant fout', error); continue; }

    // 3. Voeg 5 werven toe met uniek open data adres
    for (let j = 0; j < 5; ++j) {
      // Pak een uniek adres uit openDataAddresses, verschuif index zodat elke klant andere werven krijgt
      const addrIdx = (i * 5 + j + 10) % openDataAddresses.length;
      const addr = openDataAddresses[addrIdx];
      const address = `${addr.street} ${addr.number}, ${addr.zip} ${addr.city}, ${addr.country === 'BE' ? 'België' : addr.country === 'NL' ? 'Nederland' : addr.country === 'LU' ? 'Luxemburg' : 'Frankrijk'}`;
      const { error: projectError } = await supabase.from('projects').insert([
        {
          name: `Werf demo ${i+1}-${j+1}`,
          user_id: klant.id,
          address,
          city: addr.city,
          country: addr.country,
          latitude: addr.lat,
          longitude: addr.lng,
          created_at: new Date().toISOString(),
        }
      ]);
      if (projectError) {
        console.error(`Project insert fout voor klant ${klant.id} (${email}):`, projectError);
      }
    }
    console.log(`Klant ${c.name} + 5 werven toegevoegd.`);
  }
  console.log('Klaar!');
}

main();
