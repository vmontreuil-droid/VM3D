// scripts/migrate-to-france.mjs
// Verplaats alle bestaande klanten (role=customer) en hun werven naar échte Franse adressen,
// goed verspreid over heel Frankrijk.
//
// Gebruik:
//   node scripts/migrate-to-france.mjs            -> dry-run (toont wat er zou veranderen)
//   node scripts/migrate-to-france.mjs --apply    -> voert wijzigingen uit

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
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
  console.error('Ontbrekende Supabase-credentials in .env.local')
  process.exit(1)
}

const apply = process.argv.includes('--apply')
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// 60 Franse klantadressen (hoofdzetels) — echte straten + postcodes + coördinaten, breed verspreid.
const customerAddresses = [
  { street: 'Rue de Rivoli',              number: '99',  postal_code: '75001', city: 'Paris',              lat: 48.8589, lng: 2.3410 },
  { street: 'Avenue de la République',    number: '12',  postal_code: '75011', city: 'Paris',              lat: 48.8641, lng: 2.3747 },
  { street: 'Rue de la République',       number: '45',  postal_code: '69002', city: 'Lyon',               lat: 45.7640, lng: 4.8357 },
  { street: 'Cours Lafayette',            number: '88',  postal_code: '69003', city: 'Lyon',               lat: 45.7608, lng: 4.8452 },
  { street: 'La Canebière',               number: '130', postal_code: '13001', city: 'Marseille',          lat: 43.2965, lng: 5.3698 },
  { street: 'Avenue du Prado',            number: '25',  postal_code: '13008', city: 'Marseille',          lat: 43.2733, lng: 5.3908 },
  { street: 'Avenue Jean Médecin',        number: '15',  postal_code: '06000', city: 'Nice',               lat: 43.7034, lng: 7.2663 },
  { street: 'Promenade des Anglais',      number: '50',  postal_code: '06000', city: 'Nice',               lat: 43.6957, lng: 7.2590 },
  { street: 'Rue Sainte-Catherine',       number: '22',  postal_code: '33000', city: 'Bordeaux',           lat: 44.8414, lng: -0.5735 },
  { street: 'Cours de l\'Intendance',     number: '60',  postal_code: '33000', city: 'Bordeaux',           lat: 44.8430, lng: -0.5793 },
  { street: 'Rue du Taur',                number: '18',  postal_code: '31000', city: 'Toulouse',           lat: 43.6050, lng: 1.4431 },
  { street: 'Allées Jean Jaurès',         number: '44',  postal_code: '31000', city: 'Toulouse',           lat: 43.6108, lng: 1.4520 },
  { street: 'Rue de Béthune',             number: '20',  postal_code: '59000', city: 'Lille',              lat: 50.6292, lng: 3.0573 },
  { street: 'Rue Faidherbe',              number: '7',   postal_code: '59000', city: 'Lille',              lat: 50.6365, lng: 3.0709 },
  { street: 'Rue du Commerce',            number: '14',  postal_code: '44000', city: 'Nantes',             lat: 47.2173, lng: -1.5536 },
  { street: 'Rue Crébillon',              number: '8',   postal_code: '44000', city: 'Nantes',             lat: 47.2140, lng: -1.5600 },
  { street: 'Rue du Jeu de Paume',        number: '30',  postal_code: '34000', city: 'Montpellier',        lat: 43.6109, lng: 3.8772 },
  { street: 'Grand\'Rue',                 number: '16',  postal_code: '67000', city: 'Strasbourg',         lat: 48.5820, lng: 7.7461 },
  { street: 'Place Kléber',               number: '2',   postal_code: '67000', city: 'Strasbourg',         lat: 48.5839, lng: 7.7455 },
  { street: 'Rue de Siam',                number: '35',  postal_code: '29200', city: 'Brest',              lat: 48.3904, lng: -4.4861 },
  { street: 'Rue Le Bastard',             number: '10',  postal_code: '35000', city: 'Rennes',             lat: 48.1118, lng: -1.6796 },
  { street: 'Rue Jean Jaurès',            number: '40',  postal_code: '38000', city: 'Grenoble',           lat: 45.1885, lng: 5.7245 },
  { street: 'Rue d\'Antibes',             number: '70',  postal_code: '06400', city: 'Cannes',             lat: 43.5528, lng: 7.0174 },
  { street: 'Rue Alsace-Lorraine',        number: '22',  postal_code: '45000', city: 'Orléans',            lat: 47.9029, lng: 1.9093 },
  { street: 'Rue Nationale',              number: '55',  postal_code: '37000', city: 'Tours',              lat: 47.3941, lng: 0.6848 },
  { street: 'Rue des Carmes',             number: '18',  postal_code: '76000', city: 'Rouen',              lat: 49.4404, lng: 1.0931 },
  { street: 'Rue Saint-Jean',             number: '33',  postal_code: '14000', city: 'Caen',               lat: 49.1829, lng: -0.3707 },
  { street: 'Rue de la Barre',            number: '9',   postal_code: '21000', city: 'Dijon',              lat: 47.3220, lng: 5.0415 },
  { street: 'Rue du Grand Pont',          number: '5',   postal_code: '86000', city: 'Poitiers',           lat: 46.5802, lng: 0.3404 },
  { street: 'Rue des Halles',             number: '24',  postal_code: '87000', city: 'Limoges',            lat: 45.8336, lng: 1.2611 },
  { street: 'Rue du Maréchal Foch',       number: '14',  postal_code: '49000', city: 'Angers',             lat: 47.4713, lng: -0.5543 },
  { street: 'Rue Franklin',               number: '27',  postal_code: '72000', city: 'Le Mans',            lat: 48.0079, lng: 0.1984 },
  { street: 'Rue Saint-Ferréol',          number: '40',  postal_code: '13001', city: 'Marseille',          lat: 43.2952, lng: 5.3793 },
  { street: 'Rue Paradis',                number: '75',  postal_code: '13006', city: 'Marseille',          lat: 43.2907, lng: 5.3765 },
  { street: 'Rue de la Liberté',          number: '17',  postal_code: '21000', city: 'Dijon',              lat: 47.3227, lng: 5.0416 },
  { street: 'Rue de la Bourse',           number: '8',   postal_code: '69002', city: 'Lyon',               lat: 45.7646, lng: 4.8345 },
  { street: 'Rue des Trois Mages',        number: '12',  postal_code: '13006', city: 'Marseille',          lat: 43.2936, lng: 5.3848 },
  { street: 'Rue Saint-Nicaise',          number: '6',   postal_code: '51100', city: 'Reims',              lat: 49.2583, lng: 4.0317 },
  { street: 'Rue Sadi-Carnot',            number: '19',  postal_code: '54000', city: 'Nancy',              lat: 48.6921, lng: 6.1844 },
  { street: 'Rue Serpenoise',             number: '28',  postal_code: '57000', city: 'Metz',               lat: 49.1165, lng: 6.1744 },
  { street: 'Rue de la Paix',             number: '11',  postal_code: '68100', city: 'Mulhouse',           lat: 47.7508, lng: 7.3359 },
  { street: 'Grande Rue',                 number: '21',  postal_code: '25000', city: 'Besançon',           lat: 47.2378, lng: 6.0241 },
  { street: 'Cours Saleya',               number: '3',   postal_code: '06300', city: 'Nice',               lat: 43.6950, lng: 7.2753 },
  { street: 'Rue Paradis',                number: '6',   postal_code: '34000', city: 'Montpellier',        lat: 43.6110, lng: 3.8780 },
  { street: 'Rue du Colonel Fabien',      number: '13',  postal_code: '33300', city: 'Bordeaux',           lat: 44.8636, lng: -0.5544 },
  { street: 'Rue Saint-Aubin',            number: '17',  postal_code: '49100', city: 'Angers',             lat: 47.4707, lng: -0.5519 },
  { street: 'Rue Carnot',                 number: '42',  postal_code: '62200', city: 'Boulogne-sur-Mer',   lat: 50.7264, lng: 1.6147 },
  { street: 'Rue Clemenceau',             number: '26',  postal_code: '64000', city: 'Pau',                lat: 43.2951, lng: -0.3707 },
  { street: 'Rue des Cordeliers',         number: '9',   postal_code: '84000', city: 'Avignon',            lat: 43.9493, lng: 4.8055 },
  { street: 'Rue Espariat',               number: '16',  postal_code: '13100', city: 'Aix-en-Provence',    lat: 43.5263, lng: 5.4454 },
  { street: 'Rue de la Paix',             number: '8',   postal_code: '42000', city: 'Saint-Étienne',      lat: 45.4397, lng: 4.3872 },
  { street: 'Rue du Port',                number: '14',  postal_code: '56100', city: 'Lorient',            lat: 47.7482, lng: -3.3702 },
  { street: 'Rue du Stand',               number: '23',  postal_code: '50100', city: 'Cherbourg-en-Cotentin', lat: 49.6337, lng: -1.6222 },
  { street: 'Rue de la Monnaie',          number: '5',   postal_code: '62100', city: 'Calais',             lat: 50.9513, lng: 1.8587 },
  { street: 'Rue de la République',       number: '32',  postal_code: '71000', city: 'Mâcon',              lat: 46.3061, lng: 4.8289 },
  { street: 'Rue Gambetta',               number: '18',  postal_code: '81000', city: 'Albi',               lat: 43.9290, lng: 2.1480 },
  { street: 'Rue de la Révolution',       number: '7',   postal_code: '40100', city: 'Dax',                lat: 43.7108, lng: -1.0522 },
  { street: 'Rue de la République',       number: '15',  postal_code: '73000', city: 'Chambéry',           lat: 45.5646, lng: 5.9178 },
  { street: 'Avenue Foch',                number: '39',  postal_code: '74000', city: 'Annecy',             lat: 45.9003, lng: 6.1278 },
  { street: 'Rue Grande',                 number: '6',   postal_code: '07000', city: 'Privas',             lat: 44.7351, lng: 4.5987 },
  { street: 'Rue Saint-Jacques',          number: '20',  postal_code: '63000', city: 'Clermont-Ferrand',   lat: 45.7772, lng: 3.0870 },
]

// Werf-adressen: 150 echte Franse bouwlocaties/industriezones, verspreid.
// Een klant krijgt meerdere werven uit deze pool (rondom/zelfde regio + bredere spreiding).
const projectAddresses = [
  { address: 'Zone industrielle Paris Nord II, 95700 Roissy-en-France',            city: 'Roissy-en-France',    country: 'France', lat: 49.0097, lng: 2.5479 },
  { address: 'Rue du Landy, 93200 Saint-Denis',                                    city: 'Saint-Denis',         country: 'France', lat: 48.9140, lng: 2.3480 },
  { address: 'Avenue de la Marne, 92120 Montrouge',                                city: 'Montrouge',           country: 'France', lat: 48.8155, lng: 2.3183 },
  { address: 'Rue du Progrès, 93100 Montreuil',                                    city: 'Montreuil',           country: 'France', lat: 48.8614, lng: 2.4418 },
  { address: 'Boulevard Gallieni, 92130 Issy-les-Moulineaux',                      city: 'Issy-les-Moulineaux', country: 'France', lat: 48.8226, lng: 2.2725 },
  { address: 'Parc d\'activités des Bellevues, 95610 Éragny',                      city: 'Éragny',              country: 'France', lat: 49.0174, lng: 2.0928 },
  { address: 'Avenue de l\'Europe, 77600 Bussy-Saint-Georges',                     city: 'Bussy-Saint-Georges', country: 'France', lat: 48.8402, lng: 2.7063 },
  { address: 'ZAC des Portes de Sénart, 77240 Vert-Saint-Denis',                   city: 'Vert-Saint-Denis',    country: 'France', lat: 48.5712, lng: 2.5861 },
  { address: 'Rue du Bois Chaland, 91090 Lisses',                                  city: 'Lisses',              country: 'France', lat: 48.6083, lng: 2.4139 },
  { address: 'Parc d\'activités de la Clef de Saint-Pierre, 78990 Élancourt',      city: 'Élancourt',           country: 'France', lat: 48.7765, lng: 1.9599 },
  // Lyon / Rhône-Alpes
  { address: 'Parc Technologique de Lyon, 69800 Saint-Priest',                     city: 'Saint-Priest',        country: 'France', lat: 45.7070, lng: 4.9468 },
  { address: 'Zone industrielle de Vénissieux, 69200 Vénissieux',                  city: 'Vénissieux',          country: 'France', lat: 45.6978, lng: 4.8898 },
  { address: 'Quai Perrache, 69002 Lyon',                                          city: 'Lyon',                country: 'France', lat: 45.7436, lng: 4.8255 },
  { address: 'Rue de la Villette, 69003 Lyon',                                     city: 'Lyon',                country: 'France', lat: 45.7601, lng: 4.8554 },
  { address: 'Avenue Jean Jaurès, 69007 Lyon',                                     city: 'Lyon',                country: 'France', lat: 45.7422, lng: 4.8400 },
  { address: 'ZI Meyzieu Jonage, 69330 Meyzieu',                                   city: 'Meyzieu',             country: 'France', lat: 45.7686, lng: 5.0020 },
  { address: 'Parc d\'activités Champ du Pont, 38290 La Verpillière',              city: 'La Verpillière',      country: 'France', lat: 45.6434, lng: 5.1432 },
  { address: 'Zone d\'activités Technolac, 73370 Le Bourget-du-Lac',               city: 'Le Bourget-du-Lac',   country: 'France', lat: 45.6434, lng: 5.8611 },
  { address: 'Zone industrielle des Papeteries, 74960 Cran-Gevrier',               city: 'Cran-Gevrier',        country: 'France', lat: 45.9031, lng: 6.0987 },
  { address: 'Parc d\'activités Inovallée, 38330 Montbonnot-Saint-Martin',         city: 'Montbonnot',          country: 'France', lat: 45.2203, lng: 5.8115 },
  // PACA
  { address: 'Zone industrielle La Barasse, 13011 Marseille',                      city: 'Marseille',           country: 'France', lat: 43.2866, lng: 5.4558 },
  { address: 'Euroméditerranée, 13002 Marseille',                                  city: 'Marseille',           country: 'France', lat: 43.3076, lng: 5.3681 },
  { address: 'Zone Les Milles, 13290 Aix-en-Provence',                             city: 'Aix-en-Provence',     country: 'France', lat: 43.5003, lng: 5.3706 },
  { address: 'Parc d\'activités Saint-Mitre, 13400 Aubagne',                       city: 'Aubagne',             country: 'France', lat: 43.2893, lng: 5.5658 },
  { address: 'Sophia Antipolis, 06560 Valbonne',                                   city: 'Valbonne',            country: 'France', lat: 43.6206, lng: 7.0531 },
  { address: 'Zone industrielle de Carros, 06510 Carros',                          city: 'Carros',              country: 'France', lat: 43.7836, lng: 7.1869 },
  { address: 'Port de Commerce, 83000 Toulon',                                     city: 'Toulon',              country: 'France', lat: 43.1197, lng: 5.9289 },
  { address: 'Zone Agroparc, 84140 Avignon',                                       city: 'Avignon',             country: 'France', lat: 43.9158, lng: 4.8797 },
  { address: 'ZI Saint-Martin-de-Crau, 13310 Saint-Martin-de-Crau',                city: 'Saint-Martin-de-Crau',country: 'France', lat: 43.6336, lng: 4.8061 },
  // Nouvelle-Aquitaine
  { address: 'Zone industrielle de Bassens, 33530 Bassens',                        city: 'Bassens',             country: 'France', lat: 44.8908, lng: -0.5285 },
  { address: 'Parc Tertiaire Rive Droite, 33270 Floirac',                          city: 'Floirac',             country: 'France', lat: 44.8319, lng: -0.5366 },
  { address: 'Zone d\'activités Bersol, 33600 Pessac',                             city: 'Pessac',              country: 'France', lat: 44.7978, lng: -0.6761 },
  { address: 'Technopole Izarbel, 64210 Bidart',                                   city: 'Bidart',              country: 'France', lat: 43.4372, lng: -1.5939 },
  { address: 'Zone Industrielle de Lescar, 64230 Lescar',                          city: 'Lescar',              country: 'France', lat: 43.3336, lng: -0.4253 },
  { address: 'Zone de la Rotonde, 87000 Limoges',                                  city: 'Limoges',             country: 'France', lat: 45.8181, lng: 1.2489 },
  { address: 'Parc d\'activités La Prairie, 17000 La Rochelle',                    city: 'La Rochelle',         country: 'France', lat: 46.1475, lng: -1.1594 },
  { address: 'Zone industrielle des Gâtines, 86580 Biard',                         city: 'Biard',               country: 'France', lat: 46.5828, lng: 0.3061 },
  // Occitanie
  { address: 'Zone aéroportuaire Blagnac, 31700 Blagnac',                          city: 'Blagnac',             country: 'France', lat: 43.6350, lng: 1.3756 },
  { address: 'Parc d\'activités Montaudran, 31400 Toulouse',                       city: 'Toulouse',            country: 'France', lat: 43.5631, lng: 1.4867 },
  { address: 'Zone Garosud, 34070 Montpellier',                                    city: 'Montpellier',         country: 'France', lat: 43.5806, lng: 3.8594 },
  { address: 'Parc d\'activités de la Lauze, 34430 Saint-Jean-de-Védas',           city: 'Saint-Jean-de-Védas', country: 'France', lat: 43.5717, lng: 3.8247 },
  { address: 'Zone Cépière, 31300 Toulouse',                                       city: 'Toulouse',            country: 'France', lat: 43.5839, lng: 1.4039 },
  { address: 'Zone industrielle La Palus, 66000 Perpignan',                        city: 'Perpignan',           country: 'France', lat: 42.6831, lng: 2.8742 },
  { address: 'Parc d\'activités Nîmes Ouest, 30900 Nîmes',                         city: 'Nîmes',               country: 'France', lat: 43.8253, lng: 4.3153 },
  { address: 'Zone du Mas de Grille, 34430 Saint-Jean-de-Védas',                   city: 'Saint-Jean-de-Védas', country: 'France', lat: 43.5753, lng: 3.8356 },
  { address: 'Parc Technologique Via Domitia, 11100 Narbonne',                     city: 'Narbonne',            country: 'France', lat: 43.1767, lng: 3.0125 },
  // Hauts-de-France
  { address: 'Euralille, 59777 Lille',                                             city: 'Lille',               country: 'France', lat: 50.6356, lng: 3.0749 },
  { address: 'Parc de la Haute Borne, 59650 Villeneuve-d\'Ascq',                   city: 'Villeneuve-d\'Ascq',  country: 'France', lat: 50.6078, lng: 3.1406 },
  { address: 'Zone industrielle de la Pilaterie, 59290 Wasquehal',                 city: 'Wasquehal',           country: 'France', lat: 50.6636, lng: 3.1328 },
  { address: 'Zone portuaire, 59140 Dunkerque',                                    city: 'Dunkerque',           country: 'France', lat: 51.0392, lng: 2.3770 },
  { address: 'Parc d\'activités Actipôle, 62100 Calais',                           city: 'Calais',              country: 'France', lat: 50.9280, lng: 1.8831 },
  { address: 'ZI Le Poirier, 62300 Lens',                                          city: 'Lens',                country: 'France', lat: 50.4342, lng: 2.8311 },
  { address: 'Parc Scientifique de la Haute Borne, 59650 Villeneuve-d\'Ascq',      city: 'Villeneuve-d\'Ascq',  country: 'France', lat: 50.6042, lng: 3.1466 },
  // Grand Est
  { address: 'Zone Eurofret, 67100 Strasbourg',                                    city: 'Strasbourg',          country: 'France', lat: 48.5503, lng: 7.7622 },
  { address: 'Plaine des Bouchers, 67100 Strasbourg',                              city: 'Strasbourg',          country: 'France', lat: 48.5572, lng: 7.7372 },
  { address: 'Technopôle de Metz, 57070 Metz',                                     city: 'Metz',                country: 'France', lat: 49.0967, lng: 6.2225 },
  { address: 'Zone industrielle de Ladoucette, 57050 Metz',                        city: 'Metz',                country: 'France', lat: 49.1383, lng: 6.1497 },
  { address: 'Parc d\'activités de l\'Aéroport, 54500 Vandœuvre-lès-Nancy',        city: 'Vandœuvre-lès-Nancy', country: 'France', lat: 48.6583, lng: 6.1706 },
  { address: 'Zone industrielle Reims-Sud, 51100 Reims',                           city: 'Reims',               country: 'France', lat: 49.2311, lng: 4.0403 },
  { address: 'Parc Henri Farman, 51100 Reims',                                     city: 'Reims',               country: 'France', lat: 49.2106, lng: 4.0231 },
  { address: 'Zone industrielle de Chalons, 51000 Châlons-en-Champagne',           city: 'Châlons-en-Champagne',country: 'France', lat: 48.9606, lng: 4.3500 },
  // Bretagne / Pays de la Loire / Normandie / Centre
  { address: 'Parc d\'activités Atalante, 35000 Rennes',                           city: 'Rennes',              country: 'France', lat: 48.1148, lng: -1.6375 },
  { address: 'Zone industrielle Rennes Sud-Est, 35510 Cesson-Sévigné',             city: 'Cesson-Sévigné',      country: 'France', lat: 48.1250, lng: -1.6000 },
  { address: 'Port de Commerce, 29200 Brest',                                      city: 'Brest',               country: 'France', lat: 48.3828, lng: -4.4861 },
  { address: 'Technopôle Brest-Iroise, 29280 Plouzané',                            city: 'Plouzané',            country: 'France', lat: 48.3581, lng: -4.5683 },
  { address: 'Zone industrielle de Lorient, 56100 Lorient',                        city: 'Lorient',             country: 'France', lat: 47.7504, lng: -3.3663 },
  { address: 'Zone Industrielle de Nantes Est, 44470 Carquefou',                   city: 'Carquefou',           country: 'France', lat: 47.2950, lng: -1.4925 },
  { address: 'Parc du Perray, 44600 Saint-Nazaire',                                city: 'Saint-Nazaire',       country: 'France', lat: 47.2833, lng: -2.2000 },
  { address: 'Zone Angers Beaucouzé, 49070 Beaucouzé',                             city: 'Beaucouzé',           country: 'France', lat: 47.4767, lng: -0.6150 },
  { address: 'Technopôle du Mans Université, 72000 Le Mans',                       city: 'Le Mans',             country: 'France', lat: 48.0106, lng: 0.1556 },
  { address: 'Parc d\'activités de la Pyramide, 76800 Saint-Étienne-du-Rouvray',   city: 'Saint-Étienne-du-Rouvray', country: 'France', lat: 49.3758, lng: 1.0925 },
  { address: 'Zone portuaire, 76600 Le Havre',                                     city: 'Le Havre',            country: 'France', lat: 49.4806, lng: 0.1144 },
  { address: 'Zone industrielle de Mondeville, 14120 Mondeville',                  city: 'Mondeville',          country: 'France', lat: 49.1772, lng: -0.3022 },
  { address: 'Zone d\'activités Ingré, 45140 Ingré',                               city: 'Ingré',               country: 'France', lat: 47.9114, lng: 1.8272 },
  { address: 'Parc d\'activités Sologne, 41350 Vineuil',                           city: 'Vineuil',             country: 'France', lat: 47.5756, lng: 1.3656 },
  { address: 'Zone industrielle Équatop, 37100 Tours',                             city: 'Tours',               country: 'France', lat: 47.4392, lng: 0.6911 },
  { address: 'Parc d\'activités Cap Sud, 18000 Bourges',                           city: 'Bourges',             country: 'France', lat: 47.0642, lng: 2.3975 },
  // Bourgogne-Franche-Comté
  { address: 'Zone industrielle de Beaune, 21200 Beaune',                          city: 'Beaune',              country: 'France', lat: 47.0250, lng: 4.8400 },
  { address: 'Parc technologique, 21000 Dijon',                                    city: 'Dijon',               country: 'France', lat: 47.3236, lng: 5.0536 },
  { address: 'ZI Besançon Ouest, 25480 École-Valentin',                            city: 'École-Valentin',      country: 'France', lat: 47.2750, lng: 5.9972 },
  { address: 'Parc d\'activités du Gros Pierre, 39100 Dole',                       city: 'Dole',                country: 'France', lat: 47.0906, lng: 5.4908 },
  { address: 'Zone d\'activités Chalon Nord, 71100 Chalon-sur-Saône',              city: 'Chalon-sur-Saône',    country: 'France', lat: 46.7933, lng: 4.8556 },
  // Centre ville + overige
  { address: 'Rue de Rivoli, 75004 Paris',                                         city: 'Paris',               country: 'France', lat: 48.8560, lng: 2.3593 },
  { address: 'Rue de la Roquette, 75011 Paris',                                    city: 'Paris',               country: 'France', lat: 48.8581, lng: 2.3795 },
  { address: 'Avenue d\'Italie, 75013 Paris',                                      city: 'Paris',               country: 'France', lat: 48.8247, lng: 2.3581 },
  { address: 'Rue du Faubourg Saint-Antoine, 75012 Paris',                         city: 'Paris',               country: 'France', lat: 48.8511, lng: 2.3789 },
  { address: 'Rue de la Pompe, 75016 Paris',                                       city: 'Paris',               country: 'France', lat: 48.8622, lng: 2.2786 },
  { address: 'Rue des Pyrénées, 75020 Paris',                                      city: 'Paris',               country: 'France', lat: 48.8656, lng: 2.3989 },
  { address: 'Zone industrielle Nord, 71000 Mâcon',                                city: 'Mâcon',               country: 'France', lat: 46.3158, lng: 4.8281 },
  { address: 'Zone Sud, 42000 Saint-Étienne',                                      city: 'Saint-Étienne',       country: 'France', lat: 45.4208, lng: 4.3978 },
  { address: 'Zone d\'activités Gerland, 69007 Lyon',                              city: 'Lyon',                country: 'France', lat: 45.7325, lng: 4.8344 },
  { address: 'Parc Euromed, 13002 Marseille',                                      city: 'Marseille',           country: 'France', lat: 43.3100, lng: 5.3650 },
  { address: 'Zone Saint-Menet, 13011 Marseille',                                  city: 'Marseille',           country: 'France', lat: 43.2853, lng: 5.4697 },
  { address: 'Parc d\'activités Écopôle, 66350 Toulouges',                         city: 'Toulouges',           country: 'France', lat: 42.6672, lng: 2.8461 },
  { address: 'Zone Mélantois, 59113 Seclin',                                       city: 'Seclin',              country: 'France', lat: 50.5486, lng: 3.0356 },
  { address: 'ZAC du Tertre, 77500 Chelles',                                       city: 'Chelles',             country: 'France', lat: 48.8833, lng: 2.6000 },
  { address: 'Parc des Portes de Paris, 93200 Saint-Denis',                       city: 'Saint-Denis',         country: 'France', lat: 48.9211, lng: 2.3578 },
  { address: 'Zone Aéroportuaire Nice-Côte d\'Azur, 06200 Nice',                   city: 'Nice',                country: 'France', lat: 43.6619, lng: 7.2056 },
  { address: 'ZA des Peupliers, 44800 Saint-Herblain',                             city: 'Saint-Herblain',      country: 'France', lat: 47.2194, lng: -1.6406 },
  { address: 'Zone industrielle de Vitrolles, 13127 Vitrolles',                    city: 'Vitrolles',           country: 'France', lat: 43.4572, lng: 5.2483 },
  { address: 'Parc d\'activités Val de Seine, 76250 Déville-lès-Rouen',            city: 'Déville-lès-Rouen',   country: 'France', lat: 49.4619, lng: 1.0542 },
  { address: 'Zone industrielle, 85000 La Roche-sur-Yon',                          city: 'La Roche-sur-Yon',    country: 'France', lat: 46.6706, lng: -1.4261 },
  { address: 'Parc d\'activités des Fontaines, 80000 Amiens',                      city: 'Amiens',              country: 'France', lat: 49.8942, lng: 2.2958 },
  { address: 'Zone industrielle Nord, 08000 Charleville-Mézières',                 city: 'Charleville-Mézières',country: 'France', lat: 49.7781, lng: 4.7181 },
]

// Deterministische verdeling: kleine jitter op coördinaten zodat pins niet exact samenvallen.
function jitter(value, delta = 0.0025) {
  return value + (Math.random() - 0.5) * delta * 2
}

async function main() {
  console.log(apply ? '\n▶  APPLY mode — wijzigingen worden opgeslagen.' : '\n🧪 DRY-RUN — geen wijzigingen. Gebruik --apply om te schrijven.')
  console.log(`📍 Adres-pools: ${customerAddresses.length} klantadressen · ${projectAddresses.length} werfadressen\n`)

  // 1) Alle klanten ophalen
  const { data: customers, error: custErr } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, email, city, country, role')
    .in('role', ['client', 'customer'])
    .order('created_at', { ascending: true })

  if (custErr) {
    console.error('Fout bij ophalen klanten:', custErr)
    process.exit(1)
  }

  if (!customers || customers.length === 0) {
    console.log('Geen klanten gevonden. Niets te doen.')
    return
  }

  console.log(`👥 ${customers.length} klanten gevonden.`)

  // 2) Alle werven ophalen
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('id, user_id, name, address, city, country, latitude, longitude')

  if (projErr) {
    console.error('Fout bij ophalen werven:', projErr)
    process.exit(1)
  }

  console.log(`🏗  ${projects?.length ?? 0} werven gevonden.\n`)

  // 3) Verdeel klanten evenredig over customerAddresses (modulo)
  let customerUpdates = 0
  for (let i = 0; i < customers.length; i++) {
    const c = customers[i]
    const addr = customerAddresses[i % customerAddresses.length]

    const payload = {
      street: addr.street,
      house_number: addr.number,
      postal_code: addr.postal_code,
      city: addr.city,
      country: 'France',
      latitude: jitter(addr.lat, 0.002),
      longitude: jitter(addr.lng, 0.002),
    }

    if (!apply) {
      if (i < 5 || i >= customers.length - 2) {
        console.log(`  [klant ${i + 1}/${customers.length}] ${c.company_name || c.full_name || c.email} → ${addr.street} ${addr.number}, ${addr.postal_code} ${addr.city}`)
      } else if (i === 5) {
        console.log('  …')
      }
      customerUpdates++
      continue
    }

    const { error } = await supabase.from('profiles').update(payload).eq('id', c.id)
    if (error) {
      console.error(`  ✗ klant ${c.id}:`, error.message)
    } else {
      customerUpdates++
      if (customerUpdates % 10 === 0) console.log(`  ✓ ${customerUpdates}/${customers.length} klanten bijgewerkt`)
    }
  }

  console.log(`\n👥 Klanten: ${customerUpdates}${apply ? ' bijgewerkt' : ' zouden bijgewerkt worden'}.\n`)

  // 4) Projecten: verdeel over projectAddresses, verschoven startpositie per klant zodat
  //    werven van één klant niet altijd bij dezelfde werf starten en er regionale spreiding is.
  let projectUpdates = 0
  const projectsByCustomer = new Map()
  for (const p of projects ?? []) {
    if (!p.user_id) continue
    if (!projectsByCustomer.has(p.user_id)) projectsByCustomer.set(p.user_id, [])
    projectsByCustomer.get(p.user_id).push(p)
  }

  let customerIdx = 0
  for (const [userId, userProjects] of projectsByCustomer) {
    const offset = (customerIdx * 7) % projectAddresses.length // spreiding
    for (let j = 0; j < userProjects.length; j++) {
      const p = userProjects[j]
      const addr = projectAddresses[(offset + j * 3) % projectAddresses.length]

      const payload = {
        address: addr.address,
        city: addr.city,
        country: addr.country,
        latitude: jitter(addr.lat, 0.003),
        longitude: jitter(addr.lng, 0.003),
      }

      if (!apply) {
        if (projectUpdates < 6) {
          console.log(`  [werf ${projectUpdates + 1}] "${p.name}" → ${addr.address}`)
        } else if (projectUpdates === 6) {
          console.log('  …')
        }
        projectUpdates++
        continue
      }

      const { error } = await supabase.from('projects').update(payload).eq('id', p.id)
      if (error) {
        console.error(`  ✗ werf ${p.id}:`, error.message)
      } else {
        projectUpdates++
        if (projectUpdates % 25 === 0) console.log(`  ✓ ${projectUpdates} werven bijgewerkt`)
      }
    }
    customerIdx++
  }

  console.log(`\n🏗  Werven: ${projectUpdates}${apply ? ' bijgewerkt' : ' zouden bijgewerkt worden'}.`)
  console.log(apply ? '\n✅ Klaar.\n' : '\n👉 Voer opnieuw uit met --apply om écht te wijzigen.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
