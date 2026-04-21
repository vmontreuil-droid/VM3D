// Geo-setup manifest — bewaar de werkelijke geoide- en CRS-bestanden onder
// public/geo/<region>/<vendor>/<filename>. Zet `available: true` zodra het
// bestand werkelijk in de map staat. De UI gebruikt deze flag om te
// beslissen of de download-knop actief of disabled wordt.

export type GeoFile = {
  filename: string
  description: string
  bytes?: number
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

export const REGIONS: Region[] = [
  {
    code: 'be',
    name: 'België',
    flag: '🇧🇪',
    crs: 'Lambert 2008',
    epsg: 'EPSG:3812',
    geoid: 'hBG18',
    vendors: [
      {
        vendor: 'topcon',
        vendorName: 'Topcon',
        files: [
          { filename: 'lambert2008.gc3', description: 'Coördinatensysteem Lambert 2008', available: false },
          { filename: 'hbg18.ggf', description: 'Belgische geoide hBG18', available: false },
        ],
      },
      {
        vendor: 'leica',
        vendorName: 'Leica',
        files: [
          { filename: 'lambert2008.csv', description: 'CRS-definitie Lambert 2008', available: false },
          { filename: 'hbg18.gem', description: 'Belgische geoide hBG18', available: false },
        ],
      },
      {
        vendor: 'unicontrol',
        vendorName: 'Unicontrol',
        files: [
          { filename: 'be-lambert2008-hbg18.json', description: 'Lambert 2008 + hBG18 bundel', available: false },
        ],
      },
    ],
  },
  {
    code: 'nl',
    name: 'Nederland',
    flag: '🇳🇱',
    crs: 'RD New',
    epsg: 'EPSG:28992',
    geoid: 'NLGEO2018',
    vendors: [
      {
        vendor: 'topcon',
        vendorName: 'Topcon',
        files: [
          { filename: 'rdnew.gc3', description: 'Coördinatensysteem RD New', available: false },
          { filename: 'nlgeo2018.ggf', description: 'Nederlandse geoide NLGEO2018', available: false },
        ],
      },
      {
        vendor: 'leica',
        vendorName: 'Leica',
        files: [
          { filename: 'rdnew.csv', description: 'CRS-definitie RD New', available: false },
          { filename: 'nlgeo2018.gem', description: 'Nederlandse geoide NLGEO2018', available: false },
        ],
      },
      {
        vendor: 'unicontrol',
        vendorName: 'Unicontrol',
        files: [
          { filename: 'nl-rdnew-nlgeo2018.json', description: 'RD New + NLGEO2018 bundel', available: false },
        ],
      },
    ],
  },
  {
    code: 'fr',
    name: 'Frankrijk',
    flag: '🇫🇷',
    crs: 'Lambert-93',
    epsg: 'EPSG:2154',
    geoid: 'RAF20',
    vendors: [
      {
        vendor: 'topcon',
        vendorName: 'Topcon',
        files: [
          { filename: 'lambert93.gc3', description: 'Coördinatensysteem Lambert-93', available: false },
          { filename: 'raf20.ggf', description: 'Franse geoide RAF20', available: false },
        ],
      },
      {
        vendor: 'leica',
        vendorName: 'Leica',
        files: [
          { filename: 'lambert93.csv', description: 'CRS-definitie Lambert-93', available: false },
          { filename: 'raf20.gem', description: 'Franse geoide RAF20', available: false },
        ],
      },
      {
        vendor: 'unicontrol',
        vendorName: 'Unicontrol',
        files: [
          { filename: 'fr-lambert93-raf20.json', description: 'Lambert-93 + RAF20 bundel', available: false },
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
          { filename: 'luref.gc3', description: 'Coördinatensysteem LUREF', available: false },
          { filename: 'luref-grid.ggf', description: 'Luxemburgse geoide-grid', available: false },
        ],
      },
      {
        vendor: 'leica',
        vendorName: 'Leica',
        files: [
          { filename: 'luref.csv', description: 'CRS-definitie LUREF', available: false },
          { filename: 'luref-grid.gem', description: 'Luxemburgse geoide-grid', available: false },
        ],
      },
      {
        vendor: 'unicontrol',
        vendorName: 'Unicontrol',
        files: [
          { filename: 'lu-luref-grid.json', description: 'LUREF + grid bundel', available: false },
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
