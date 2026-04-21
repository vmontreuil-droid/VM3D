// Geo-setup manifest — verwijst naar de werkelijke bestanden in
// public/geo/TOPCON/ en public/geo/UNICONTROL/. Voor LEICA zijn er
// nog geen bestanden geüpload (alle entries available:false).
//
// Wanneer je een nieuw bestand toevoegt, plak het in de juiste vendor-map
// en voeg het hier toe met available:true en een correcte path.

export type GeoFile = {
  filename: string
  path: string
  description: string
  available: boolean
}

export type VendorPack = {
  vendor: 'topcon' | 'leica' | 'unicontrol'
  vendorName: string
  files: GeoFile[]
}

export type Region = {
  code: 'be' | 'nl' | 'fr' | 'lu'
  name: string
  flag: string
  crs: string
  epsg: string
  geoid: string
  vendors: VendorPack[]
}

const FRENCH_LAMBERT_WKT = [
  ['NTF(Paris) Lambert 1.wkt', 'Lambert I — Noord-Frankrijk'],
  ['NTF(Paris) Lambert 1 (extended).wkt', 'Lambert I (extended)'],
  ['NTF(Paris) Lambert 1 (grid).wkt', 'Lambert I (grid)'],
  ['NTF(Paris) Lambert 2.wkt', 'Lambert II — Centraal Frankrijk'],
  ['NTF(Paris) Lambert 2 (extended).wkt', 'Lambert II (extended) / Lambert II étendu'],
  ['NTF(Paris) Lambert 2 (grid).wkt', 'Lambert II (grid)'],
  ['NTF(Paris) Lambert 3.wkt', 'Lambert III — Zuid-Frankrijk'],
  ['NTF(Paris) Lambert 3 (extended).wkt', 'Lambert III (extended)'],
  ['NTF(Paris) Lambert 3 (grid).wkt', 'Lambert III (grid)'],
] as const

export const REGIONS: Region[] = [
  {
    code: 'be',
    name: 'België',
    flag: '🇧🇪',
    crs: 'Lambert 72 / Lambert 2008',
    epsg: 'EPSG:31370 / EPSG:3812',
    geoid: 'hBG18',
    vendors: [
      {
        vendor: 'topcon',
        vendorName: 'Topcon',
        files: [
          { filename: 'BELGIUM.xml', path: '/geo/TOPCON/BELGIUM.xml', description: 'Belgisch coördinatensysteem (XML-definitie)', available: true },
          { filename: 'BELGIUM_dll.xml', path: '/geo/TOPCON/BELGIUM_dll.xml', description: 'Belgisch CRS — datum link library variant', available: true },
          { filename: 'LB72.prj', path: '/geo/TOPCON/LB72.prj', description: 'Lambert 72 projectiebestand', available: true },
          { filename: 'LB72.txt', path: '/geo/TOPCON/LB72.txt', description: 'Lambert 72 — toelichting / parameters', available: true },
        ],
      },
      {
        vendor: 'unicontrol',
        vendorName: 'Unicontrol',
        files: [
          { filename: 'UTM31N (ETRS89).wkt', path: '/geo/UNICONTROL/UTM31N (ETRS89).wkt', description: 'UTM zone 31N (ETRS89) — bruikbaar voor België', available: true },
        ],
      },
      {
        vendor: 'leica',
        vendorName: 'Leica',
        files: [
          { filename: 'lambert72.csv', path: '/geo/LEICA/lambert72.csv', description: 'Lambert 72 (Leica iCON CSV-formaat)', available: false },
          { filename: 'hbg18.gem', path: '/geo/LEICA/hbg18.gem', description: 'Belgische geoide hBG18 (Leica .gem)', available: false },
        ],
      },
    ],
  },
  {
    code: 'nl',
    name: 'Nederland',
    flag: '🇳🇱',
    crs: 'RD New / Amersfoort',
    epsg: 'EPSG:28992',
    geoid: 'NLGEO2018 / RDNAP2018',
    vendors: [
      {
        vendor: 'topcon',
        vendorName: 'Topcon',
        files: [
          { filename: 'NETHERLANDS.xml', path: '/geo/TOPCON/NETHERLANDS.xml', description: 'Nederlandse CRS-definitie (XML)', available: true },
          { filename: 'NETHERLANDS_dll.xml', path: '/geo/TOPCON/NETHERLANDS_dll.xml', description: 'Nederlandse CRS — datum link library variant', available: true },
          { filename: 'RDNAP2018.dff', path: '/geo/TOPCON/RDNAP2018.dff', description: 'NAP geoide-grid 2018 (RDNAP2018)', available: true },
          { filename: 'rdtrans.prj', path: '/geo/TOPCON/rdtrans.prj', description: 'RD-transformatie projectiebestand', available: true },
          { filename: 'rdtrans2004.prj', path: '/geo/TOPCON/rdtrans2004.prj', description: 'RDTrans 2004 — verfijnde versie', available: true },
          { filename: 'rdtrans2008.prj', path: '/geo/TOPCON/rdtrans2008.prj', description: 'RDTrans 2008 — meest gebruikte versie', available: true },
        ],
      },
      {
        vendor: 'unicontrol',
        vendorName: 'Unicontrol',
        files: [
          { filename: 'UTM31N (ETRS89).wkt', path: '/geo/UNICONTROL/UTM31N (ETRS89).wkt', description: 'UTM zone 31N (ETRS89) — bruikbaar voor Nederland', available: true },
        ],
      },
      {
        vendor: 'leica',
        vendorName: 'Leica',
        files: [
          { filename: 'rdnew.csv', path: '/geo/LEICA/rdnew.csv', description: 'RD New (Leica iCON CSV)', available: false },
          { filename: 'nlgeo2018.gem', path: '/geo/LEICA/nlgeo2018.gem', description: 'NLGEO2018 geoide (Leica .gem)', available: false },
        ],
      },
    ],
  },
  {
    code: 'fr',
    name: 'Frankrijk',
    flag: '🇫🇷',
    crs: 'Lambert-93 / NTF Lambert I-IV',
    epsg: 'EPSG:2154',
    geoid: 'RAF20 / RAF09',
    vendors: [
      {
        vendor: 'topcon',
        vendorName: 'Topcon',
        files: [
          { filename: 'France.xml', path: '/geo/TOPCON/France.xml', description: 'Frans CRS — Lambert-93 + zones (XML)', available: true },
          { filename: 'NTFgrille.dff', path: '/geo/TOPCON/NTFgrille.dff', description: 'NTF↔RGF93 transformatiegrid', available: true },
        ],
      },
      {
        vendor: 'unicontrol',
        vendorName: 'Unicontrol',
        files: [
          ...FRENCH_LAMBERT_WKT.map(([fn, desc]) => ({
            filename: fn,
            path: `/geo/UNICONTROL/${fn}`,
            description: desc,
            available: true,
          })),
          { filename: 'UTM30N (ETRS89).wkt', path: '/geo/UNICONTROL/UTM30N (ETRS89).wkt', description: 'UTM zone 30N (ETRS89)', available: true },
          { filename: 'UTM31N (ETRS89).wkt', path: '/geo/UNICONTROL/UTM31N (ETRS89).wkt', description: 'UTM zone 31N (ETRS89)', available: true },
          { filename: 'RAF09.bin', path: '/geo/UNICONTROL/RAF09.bin', description: 'RAF09 geoide-grid', available: true },
          { filename: 'raf20.bin', path: '/geo/UNICONTROL/raf20.bin', description: 'RAF20 geoide-grid (meest recente IGN)', available: true },
          { filename: 'ntf_r93.gsb', path: '/geo/UNICONTROL/ntf_r93.gsb', description: 'NTF↔RGF93 NTv2-grid', available: true },
        ],
      },
      {
        vendor: 'leica',
        vendorName: 'Leica',
        files: [
          { filename: 'lambert93.csv', path: '/geo/LEICA/lambert93.csv', description: 'Lambert-93 (Leica iCON CSV)', available: false },
          { filename: 'raf20.gem', path: '/geo/LEICA/raf20.gem', description: 'RAF20 geoide (Leica .gem)', available: false },
        ],
      },
    ],
  },
  {
    code: 'lu',
    name: 'Luxembourg',
    flag: '🇱🇺',
    crs: 'LUREF',
    epsg: 'EPSG:2169',
    geoid: 'LUREF-Grid',
    vendors: [
      {
        vendor: 'topcon',
        vendorName: 'Topcon',
        files: [
          { filename: 'Luxembourg.xml', path: '/geo/TOPCON/Luxembourg.xml', description: 'LUREF coördinatensysteem (XML)', available: true },
          { filename: 'UKLU.prj', path: '/geo/TOPCON/UKLU.prj', description: 'LUREF projectiebestand', available: true },
          { filename: 'UKO_LU_dll.xml', path: '/geo/TOPCON/UKO_LU_dll.xml', description: 'LUREF DLL — voorwaartse transformatie', available: true },
          { filename: 'UKO_LU_inverse.xml', path: '/geo/TOPCON/UKO_LU_inverse.xml', description: 'LUREF DLL — inverse transformatie', available: true },
        ],
      },
      {
        vendor: 'unicontrol',
        vendorName: 'Unicontrol',
        files: [
          { filename: 'UTM31N (ETRS89).wkt', path: '/geo/UNICONTROL/UTM31N (ETRS89).wkt', description: 'UTM zone 31N (ETRS89) — bruikbaar voor Luxembourg', available: true },
        ],
      },
      {
        vendor: 'leica',
        vendorName: 'Leica',
        files: [
          { filename: 'luref.csv', path: '/geo/LEICA/luref.csv', description: 'LUREF (Leica iCON CSV)', available: false },
          { filename: 'luref-grid.gem', path: '/geo/LEICA/luref-grid.gem', description: 'LUREF geoide-grid (Leica .gem)', available: false },
        ],
      },
    ],
  },
]

export function totalPackages(): number {
  return REGIONS.reduce((s, r) => s + r.vendors.length, 0)
}

export function totalAvailable(): number {
  return REGIONS.reduce(
    (s, r) => s + r.vendors.reduce((vs, v) => vs + v.files.filter(f => f.available).length, 0),
    0,
  )
}

export function findRegion(code: string): Region | undefined {
  return REGIONS.find(r => r.code === code)
}
