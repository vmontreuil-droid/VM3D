// Voorgedefinieerde diensten van een landmeter met standaardprijzen
// Gebruikt als sjabloon bij het aanmaken van offertes

export type LandmeterDienst = {
  categorie: string
  beschrijving: string
  eenheid: string
  prijs: number
}

export const landmeterDiensten: LandmeterDienst[] = [
  // ── Opmetingen ──────────────────────────────────────────
  { categorie: 'Opmetingen', beschrijving: 'Opmeting bouwperceel (< 500 m²)', eenheid: 'stuk', prijs: 450 },
  { categorie: 'Opmetingen', beschrijving: 'Opmeting bouwperceel (500–1000 m²)', eenheid: 'stuk', prijs: 650 },
  { categorie: 'Opmetingen', beschrijving: 'Opmeting bouwperceel (> 1000 m²)', eenheid: 'stuk', prijs: 950 },
  { categorie: 'Opmetingen', beschrijving: 'Opmeting bestaand gebouw — grondplan', eenheid: 'stuk', prijs: 550 },
  { categorie: 'Opmetingen', beschrijving: 'Opmeting bestaand gebouw — alle verdiepingen', eenheid: 'stuk', prijs: 1200 },
  { categorie: 'Opmetingen', beschrijving: 'Topografische opmeting terrein (< 1 ha)', eenheid: 'stuk', prijs: 850 },
  { categorie: 'Opmetingen', beschrijving: 'Topografische opmeting terrein (1–5 ha)', eenheid: 'stuk', prijs: 1800 },
  { categorie: 'Opmetingen', beschrijving: 'Hoogtemeting / nivellering', eenheid: 'stuk', prijs: 350 },
  { categorie: 'Opmetingen', beschrijving: 'GPS-inmeting referentiepunten', eenheid: 'stuk', prijs: 275 },
  { categorie: 'Opmetingen', beschrijving: 'Opmeting gevel — 2D opstand', eenheid: 'stuk', prijs: 380 },

  // ── Afpaling & grensbepaling ────────────────────────────
  { categorie: 'Afpaling', beschrijving: 'Gerechtelijke afpaling', eenheid: 'stuk', prijs: 1500 },
  { categorie: 'Afpaling', beschrijving: 'Minnelijke afpaling (2 partijen)', eenheid: 'stuk', prijs: 750 },
  { categorie: 'Afpaling', beschrijving: 'Minnelijke afpaling — extra partij', eenheid: 'partij', prijs: 200 },
  { categorie: 'Afpaling', beschrijving: 'Herafpaling / herstel grenspalen', eenheid: 'stuk', prijs: 450 },
  { categorie: 'Afpaling', beschrijving: 'Plaatsing grenspaal (beton of kunststof)', eenheid: 'paal', prijs: 85 },
  { categorie: 'Afpaling', beschrijving: 'Opzoeken kadastrale grenzen + terreinbezoek', eenheid: 'stuk', prijs: 350 },

  // ── Verkavelingsplannen ─────────────────────────────────
  { categorie: 'Verkaveling', beschrijving: 'Opmaak verkavelingsplan (2 loten)', eenheid: 'stuk', prijs: 2500 },
  { categorie: 'Verkaveling', beschrijving: 'Opmaak verkavelingsplan (3–5 loten)', eenheid: 'stuk', prijs: 3500 },
  { categorie: 'Verkaveling', beschrijving: 'Opmaak verkavelingsplan (6–10 loten)', eenheid: 'stuk', prijs: 5500 },
  { categorie: 'Verkaveling', beschrijving: 'Bijstelling verkavelingsplan (na opmerkingen)', eenheid: 'stuk', prijs: 650 },
  { categorie: 'Verkaveling', beschrijving: 'Lotenmeting na verkaveling', eenheid: 'lot', prijs: 250 },
  { categorie: 'Verkaveling', beschrijving: 'Aanvraag verkavelingsvergunning (administratief)', eenheid: 'stuk', prijs: 1200 },

  // ── Plaatsbeschrijvingen ────────────────────────────────
  { categorie: 'Plaatsbeschrijving', beschrijving: 'Plaatsbeschrijving intrede — appartementsgebouw', eenheid: 'stuk', prijs: 550 },
  { categorie: 'Plaatsbeschrijving', beschrijving: 'Plaatsbeschrijving uittrede — appartementsgebouw', eenheid: 'stuk', prijs: 550 },
  { categorie: 'Plaatsbeschrijving', beschrijving: 'Plaatsbeschrijving intrede — woning', eenheid: 'stuk', prijs: 400 },
  { categorie: 'Plaatsbeschrijving', beschrijving: 'Plaatsbeschrijving uittrede — woning', eenheid: 'stuk', prijs: 400 },
  { categorie: 'Plaatsbeschrijving', beschrijving: 'Plaatsbeschrijving intrede — commercieel pand', eenheid: 'stuk', prijs: 750 },
  { categorie: 'Plaatsbeschrijving', beschrijving: 'Plaatsbeschrijving omgeving openbaar domein', eenheid: 'stuk', prijs: 600 },
  { categorie: 'Plaatsbeschrijving', beschrijving: 'Fotoverslag bij plaatsbeschrijving', eenheid: 'stuk', prijs: 150 },

  // ── Mede-eigendom & appartementsrecht ───────────────────
  { categorie: 'Mede-eigendom', beschrijving: 'Basisakte mede-eigendom — klein gebouw (2–4 eenheden)', eenheid: 'stuk', prijs: 1800 },
  { categorie: 'Mede-eigendom', beschrijving: 'Basisakte mede-eigendom — middelgroot (5–10 eenheden)', eenheid: 'stuk', prijs: 3200 },
  { categorie: 'Mede-eigendom', beschrijving: 'Basisakte mede-eigendom — groot (> 10 eenheden)', eenheid: 'stuk', prijs: 5000 },
  { categorie: 'Mede-eigendom', beschrijving: 'Wijziging basisakte (splitsing/samenvoeging)', eenheid: 'stuk', prijs: 1200 },
  { categorie: 'Mede-eigendom', beschrijving: 'Berekening quotiteiten (aandelen)', eenheid: 'stuk', prijs: 850 },
  { categorie: 'Mede-eigendom', beschrijving: 'Opmaak verdeelplan per verdieping', eenheid: 'verdieping', prijs: 350 },

  // ── Plannen & dossiers ──────────────────────────────────
  { categorie: 'Plannen', beschrijving: 'Inplantingsplan voor bouwaanvraag', eenheid: 'stuk', prijs: 450 },
  { categorie: 'Plannen', beschrijving: 'Opmaak rooilijnplan', eenheid: 'stuk', prijs: 350 },
  { categorie: 'Plannen', beschrijving: 'Opmaak perceelsplan (kadastraal uittreksel + opmeting)', eenheid: 'stuk', prijs: 300 },
  { categorie: 'Plannen', beschrijving: 'As-builtplan na werken', eenheid: 'stuk', prijs: 500 },
  { categorie: 'Plannen', beschrijving: 'Opmaak splitsingsplan (notarieel)', eenheid: 'stuk', prijs: 650 },
  { categorie: 'Plannen', beschrijving: 'Digitalisering bestaand papieren plan', eenheid: 'stuk', prijs: 180 },
  { categorie: 'Plannen', beschrijving: 'Opmaak situeringsplan nutsleidingen', eenheid: 'stuk', prijs: 420 },

  // ── Uitzettingen & bouwbegeleiding ─────────────────────
  { categorie: 'Uitzetting', beschrijving: 'Uitzetting bouwlijn op terrein', eenheid: 'stuk', prijs: 350 },
  { categorie: 'Uitzetting', beschrijving: 'Uitzetting funderingen', eenheid: 'stuk', prijs: 450 },
  { categorie: 'Uitzetting', beschrijving: 'Uitzetting riolering / nutsleidingen', eenheid: 'stuk', prijs: 380 },
  { categorie: 'Uitzetting', beschrijving: 'Uitzetting wegenis', eenheid: 'lopende meter', prijs: 4.5 },
  { categorie: 'Uitzetting', beschrijving: 'Controle peil na funderingswerken', eenheid: 'stuk', prijs: 250 },
  { categorie: 'Uitzetting', beschrijving: 'Controle verticaliteit na ruwbouw', eenheid: 'stuk', prijs: 275 },

  // ── Administratieve diensten ────────────────────────────
  { categorie: 'Administratief', beschrijving: 'Kadastraal uittreksel opvragen', eenheid: 'stuk', prijs: 45 },
  { categorie: 'Administratief', beschrijving: 'Opzoeken eigendomstitels kadaster', eenheid: 'stuk', prijs: 85 },
  { categorie: 'Administratief', beschrijving: 'Stedenbouwkundig uittreksel opvragen', eenheid: 'stuk', prijs: 55 },
  { categorie: 'Administratief', beschrijving: 'Bodemattest (OVAM) aanvragen', eenheid: 'stuk', prijs: 65 },
  { categorie: 'Administratief', beschrijving: 'Overleg met notaris of architect', eenheid: 'uur', prijs: 95 },
  { categorie: 'Administratief', beschrijving: 'Verplaatsingskosten (binnen 25 km)', eenheid: 'verplaatsing', prijs: 45 },
  { categorie: 'Administratief', beschrijving: 'Verplaatsingskosten (25–50 km)', eenheid: 'verplaatsing', prijs: 75 },
  { categorie: 'Administratief', beschrijving: 'Spoedtarief (levering binnen 48u)', eenheid: 'stuk', prijs: 250 },
]

export const dienstCategorieen = [
  'Opmetingen',
  'Afpaling',
  'Verkaveling',
  'Plaatsbeschrijving',
  'Mede-eigendom',
  'Plannen',
  'Uitzetting',
  'Administratief',
] as const
