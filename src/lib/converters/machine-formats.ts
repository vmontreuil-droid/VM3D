// Machine control file converter
// Supports: LandXML, DXF, TN3 (Topcon), SVL/SVD (Trimble)
import Delaunator from 'delaunator'

export type Point3D = { x: number; y: number; z: number }
export type Triangle = [number, number, number] // 0-based indices into points

export interface Surface {
  name: string
  points: Point3D[]
  triangles: Triangle[]
}

export interface Polyline {
  name: string
  points: Point3D[]
  closed?: boolean
  code?: number  // optionele Pythagoras feature code (TP3)
  /** TP3 round-trip metadata: vertex range start in type=2 block */
  _tp3RangeStart?: number
  /** TP3 round-trip metadata: line object ref X (uit type=11) */
  _tp3RefX?: number
  /** TP3 round-trip metadata: line object ref Y (uit type=11) */
  _tp3RefY?: number
}

export interface MachineFile {
  name: string
  surfaces: Surface[]
  lines: Polyline[]
  /** Originele TP3 binary (alleen bij parseTP3 input). Generator kan dit
   *  gebruiken als template voor exacte round-trip preservation van metadata. */
  tp3Source?: ArrayBuffer
}

export type FileFormat = 'landxml' | 'dxf' | 'tn3' | 'ln3' | 'tp3' | 'svl' | 'svd'

// ─── Format detection ─────────────────────────────────────────────────────────

export function detectFormat(filename: string, firstBytes: Uint8Array): FileFormat {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'xml') return 'landxml'
  if (ext === 'dxf') return 'dxf'
  if (ext === 'tn3') return 'tn3'
  if (ext === 'ln3') return 'ln3'
  if (ext === 'tp3') return 'tp3'
  if (ext === 'svl') return 'svl'
  if (ext === 'svd') return 'svd'
  // Content-based detection
  const txt = new TextDecoder('ascii', { fatal: false }).decode(firstBytes.slice(0, 20))
  if (txt.includes('<?xml') || txt.includes('<LandXML')) return 'landxml'
  if (txt.startsWith('Topcon TN3')) return 'tn3'
  if (txt.startsWith('Topcon LN3')) return 'ln3'
  if (txt.startsWith('Topcon TP3')) return 'tp3'
  if (firstBytes[248] === 0x54 && firstBytes[249] === 0x52) return 'svl' // TRMINDEX
  return 'landxml'
}

// ─── LandXML parser ───────────────────────────────────────────────────────────

export function parseLandXML(text: string): MachineFile {
  const surfaces: Surface[] = []

  const surfaceMatches = [...text.matchAll(/<Surface[^>]*name="([^"]*)"[^>]*>[\s\S]*?<\/Surface>/g)]
  for (const sm of surfaceMatches) {
    const surfaceXml = sm[0]
    const name = sm[1]
    const points: Point3D[] = []

    const pntsBlock = surfaceXml.match(/<Pnts>([\s\S]*?)<\/Pnts>/)
    if (pntsBlock) {
      const ptMatches = [...pntsBlock[1].matchAll(/<P[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/P>/g)]
      for (const pm of ptMatches) {
        const vals = pm[2].trim().split(/\s+/).map(Number)
        if (vals.length >= 3) {
          // LandXML 1.2: <P>Northing Easting Elevation</P> → swap naar interne x/y
          points.push({ x: vals[1], y: vals[0], z: vals[2] })
        }
      }
    }

    const triangles: Triangle[] = []
    const facesBlock = surfaceXml.match(/<Faces>([\s\S]*?)<\/Faces>/)
    if (facesBlock) {
      const fMatches = [...facesBlock[1].matchAll(/<F[^>]*>([\s\S]*?)<\/F>/g)]
      for (const fm of fMatches) {
        const idx = fm[1].trim().split(/\s+/).map(Number)
        if (idx.length >= 3) {
          triangles.push([idx[0] - 1, idx[1] - 1, idx[2] - 1])
        }
      }
    }

    surfaces.push({ name, points, triangles })
  }

  return { name: 'LandXML', surfaces, lines: [] }
}

// ─── Delaunay triangulation ───────────────────────────────────────────────────

export function triangulate(points: Point3D[]): Triangle[] {
  if (points.length < 3) return []
  const coords = points.flatMap(p => [p.x, p.y])
  const d = new Delaunator(coords)
  const triangles: Triangle[] = []
  for (let i = 0; i < d.triangles.length; i += 3) {
    triangles.push([d.triangles[i], d.triangles[i + 1], d.triangles[i + 2]])
  }
  return triangles
}

// ─── LandXML generator ────────────────────────────────────────────────────────

export function generateLandXML(data: MachineFile): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 8)
  const ts = now.toISOString().replace('.000Z', '').replace('Z', '')

  const surfacesXml = data.surfaces.map(surf => {
    const pts = surf.points
    if (pts.length === 0) return ''

    // Triangulate if no faces present
    const tris = surf.triangles.length > 0 ? surf.triangles : triangulate(pts)

    const elevs = pts.map(p => p.z)
    const elevMax = Math.max(...elevs).toFixed(12)
    const elevMin = Math.min(...elevs).toFixed(12)

    const pnts = pts
      // LandXML 1.2 conventie: <P>Northing Easting Elevation</P>  (Y X Z, niet X Y Z)
      .map((p, i) => `          <P id="${i + 1}">${p.y.toFixed(12)} ${p.x.toFixed(12)} ${p.z.toFixed(12)}</P>`)
      .join('\n')

    const faces = tris
      .map(t => `          <F n="0 0 0">${t[0] + 1} ${t[1] + 1} ${t[2] + 1}</F>`)
      .join('\n')

    return `    <Surface name="${escapeXml(surf.name)}">
      <Definition
        elevMax="${elevMax}"
        elevMin="${elevMin}"
        surfType="TIN"
      >
        <Pnts>
${pnts}
        </Pnts>
        <Faces>
${faces}
        </Faces>
      </Definition>
    </Surface>`
  }).filter(Boolean).join('\n')

  return `<?xml version="1.0" standalone="yes"?>
<LandXML
  date="${date}"
  language="English"
  readOnly="false"
  time="${time}"
  version="1.2"
  xmlns="http://www.landxml.org/schema/LandXML-1.2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation=
    "http://www.landxml.org/schema/LandXML-1.2
http://www.landxml.org/schema/LandXML-1.2/LandXML-1.2.xsd"
>
  <Units>
    <Metric
      angularUnit="decimal degrees"
      areaUnit="squareMeter"
      diameterUnit="meter"
      directionUnit="decimal degrees"
      linearUnit="meter"
      pressureUnit="milliBars"
      temperatureUnit="celsius"
      volumeUnit="cubicMeter"
    />
  </Units>
  <Application
    manufacturer="MV3D.cloud"
    manufacturerURL="mv3d.cloud"
    name="MV3D Converter"
    timeStamp="${ts}"
    version="1.0"
  />
  <Surfaces>
${surfacesXml}
  </Surfaces>
</LandXML>`
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ─── LandXML lijnen-export (PlanFeatures, LandXML 1.2 standaard) ─────────────
//
// Pythagoras werkt foutloos met onze Surface XML, dus voor de lijnen gebruiken
// we hetzelfde LandXML formaat — `<PlanFeatures>` met `<CoordGeom><Line>`
// entries. Dit is de officiele LandXML 1.2 manier voor 3D ontwerplijnen.

export function generateLandXMLLines(data: MachineFile): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 8)
  const ts = now.toISOString().replace('.000Z', '').replace('Z', '')

  const planFeaturesXml = data.lines.map(pl => {
    if (pl.points.length < 2) return ''
    const lineEls: string[] = []
    for (let i = 0; i < pl.points.length - 1; i++) {
      const p1 = pl.points[i]
      const p2 = pl.points[i + 1]
      lineEls.push(`        <Line>
          <Start>${p1.x.toFixed(12)} ${p1.y.toFixed(12)} ${p1.z.toFixed(12)}</Start>
          <End>${p2.x.toFixed(12)} ${p2.y.toFixed(12)} ${p2.z.toFixed(12)}</End>
        </Line>`)
    }
    if (pl.closed && pl.points.length > 2) {
      const p1 = pl.points[pl.points.length - 1]
      const p2 = pl.points[0]
      lineEls.push(`        <Line>
          <Start>${p1.x.toFixed(12)} ${p1.y.toFixed(12)} ${p1.z.toFixed(12)}</Start>
          <End>${p2.x.toFixed(12)} ${p2.y.toFixed(12)} ${p2.z.toFixed(12)}</End>
        </Line>`)
    }
    return `    <PlanFeature name="${escapeXml(pl.name)}">
      <CoordGeom>
${lineEls.join('\n')}
      </CoordGeom>
    </PlanFeature>`
  }).filter(Boolean).join('\n')

  return `<?xml version="1.0" standalone="yes"?>
<LandXML
  date="${date}"
  language="English"
  readOnly="false"
  time="${time}"
  version="1.2"
  xmlns="http://www.landxml.org/schema/LandXML-1.2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation=
    "http://www.landxml.org/schema/LandXML-1.2
http://www.landxml.org/schema/LandXML-1.2/LandXML-1.2.xsd"
>
  <Units>
    <Metric
      angularUnit="decimal degrees"
      areaUnit="squareMeter"
      diameterUnit="meter"
      directionUnit="decimal degrees"
      linearUnit="meter"
      pressureUnit="milliBars"
      temperatureUnit="celsius"
      volumeUnit="cubicMeter"
    />
  </Units>
  <Application
    manufacturer="MV3D.cloud"
    manufacturerURL="mv3d.cloud"
    name="MV3D Converter"
    timeStamp="${ts}"
    version="1.0"
  />
  <PlanFeatures>
${planFeaturesXml}
  </PlanFeatures>
</LandXML>`
}

// ─── DXF generator (surfaces = 3DFACE, lines = POLYLINE) ─────────────────────

export function generateDXF(data: MachineFile, version: 'AC1015' | 'AC1024' = 'AC1015'): string {
  const out: string[] = []

  const sec = (name: string) => { out.push('  0', 'SECTION', '  2', name) }
  const end = () => { out.push('  0', 'ENDSEC') }
  const eof = () => { out.push('  0', 'EOF') }

  // HEADER
  sec('HEADER')
  out.push('  9', '$ACADVER', '  1', version)
  out.push('  9', '$INSUNITS', ' 70', '6')
  end()

  // TABLES
  sec('TABLES')
  out.push('  0', 'TABLE', '  2', 'LAYER', ' 70', String(data.surfaces.length + data.lines.length + 1))
  out.push('  0', 'LAYER', '  2', '0', ' 70', '0', ' 62', '7', '  6', 'CONTINUOUS')
  for (const surf of data.surfaces) {
    out.push('  0', 'LAYER', '  2', surf.name, ' 70', '0', ' 62', '3', '  6', 'CONTINUOUS')
  }
  for (const line of data.lines) {
    out.push('  0', 'LAYER', '  2', line.name, ' 70', '0', ' 62', '5', '  6', 'CONTINUOUS')
  }
  out.push('  0', 'ENDTAB')
  end()

  // ENTITIES
  sec('ENTITIES')

  for (const surf of data.surfaces) {
    const pts = surf.points
    for (const [a, b, c] of surf.triangles) {
      if (!pts[a] || !pts[b] || !pts[c]) continue
      out.push('  0', '3DFACE')
      out.push('  8', surf.name)
      out.push(' 10', pts[a].x.toFixed(6), ' 20', pts[a].y.toFixed(6), ' 30', pts[a].z.toFixed(6))
      out.push(' 11', pts[b].x.toFixed(6), ' 21', pts[b].y.toFixed(6), ' 31', pts[b].z.toFixed(6))
      out.push(' 12', pts[c].x.toFixed(6), ' 22', pts[c].y.toFixed(6), ' 32', pts[c].z.toFixed(6))
      out.push(' 13', pts[c].x.toFixed(6), ' 23', pts[c].y.toFixed(6), ' 33', pts[c].z.toFixed(6))
    }
    if (surf.triangles.length === 0) {
      for (const pt of pts) {
        out.push('  0', 'POINT', '  8', surf.name)
        out.push(' 10', pt.x.toFixed(6), ' 20', pt.y.toFixed(6), ' 30', pt.z.toFixed(6))
      }
    }
  }

  for (const pl of data.lines) {
    if (pl.points.length < 2) continue
    out.push('  0', 'POLYLINE', '  8', pl.name, ' 66', '1', ' 70', pl.closed ? '1' : '8')
    out.push(' 10', '0.0', ' 20', '0.0', ' 30', '0.0')
    for (const pt of pl.points) {
      out.push('  0', 'VERTEX', '  8', pl.name)
      out.push(' 10', pt.x.toFixed(6), ' 20', pt.y.toFixed(6), ' 30', pt.z.toFixed(6))
      out.push(' 70', '32')
    }
    out.push('  0', 'SEQEND')
  }

  end()
  eof()
  return out.join('\n')
}

// ─── DXF lines export (R12 / AC1009 — universeel compatibel) ─────────────────
//
// Volledige DXF met $EXTMIN/$EXTMAX (anders ziet Pythagoras niets bij Lambert
// coördinaten), LTYPE tabel met CONTINUOUS, en één LAYER per polyline zodat
// elke ontwerplijn los selecteerbaar is.

// ─── DXF AC1024 export — skeleton-based voor Pythagoras 2024 ─────────────────
//
// Pythagoras 2024 is zeer streng over DXF structuur. Een handgemaakte AC1024
// werd stilzwijgend geweigerd. We hergebruiken nu een werkend Pythagoras-export
// als template (public/converter/dxf-skeleton.txt) en injecteren onze layers
// en entiteiten op de #USER_LAYERS# / #USER_ENTITIES# markers. Zo zijn alle
// vereiste OBJECTS/LAYOUTs/handles gegarandeerd correct.

function sanitizeLayerName(name: string, fallback: string): string {
  const cleaned = name.replace(/[<>/\\:";?*|=,'`]/g, '_').trim()
  return cleaned.slice(0, 255) || fallback
}

// Synchrone fallback (zonder template) — wordt door de UI niet meer gebruikt
// maar blijft voor convert() consistent. De Pythagoras-compatibele variant is
// generateDXF2010LinesFromTemplate hieronder.
export function generateDXF2010Lines(data: MachineFile, defaultLayerName = 'LIJNEN'): string {
  // Verzamel polylines + surface edges
  type LinePL = { layer: string; pts: Point3D[]; closed: boolean }
  const polylines: LinePL[] = []
  const layers = new Map<string, number>()
  const palette = [1, 2, 3, 4, 5, 6, 30, 40, 50, 60, 70, 110, 130, 170, 200, 230]
  let colorIdx = 0
  const addLayer = (name: string) => {
    if (!layers.has(name)) layers.set(name, palette[colorIdx++ % palette.length])
  }

  // Layer = naam + (rang van pl.code) wanneer dezelfde naam meerdere codes heeft.
  // Zo blijft kleurgroepering per Pythagoras feature-code behouden.
  const codesByName = new Map<string, Set<number>>()
  for (const pl of data.lines) {
    if (pl.points.length < 2) continue
    if (pl.code === undefined) continue
    if (!codesByName.has(pl.name)) codesByName.set(pl.name, new Set())
    codesByName.get(pl.name)!.add(pl.code)
  }
  const rankByNameCode = new Map<string, number>()
  for (const [name, codes] of codesByName) {
    const sorted = [...codes].sort((a, b) => a - b)
    sorted.forEach((c, i) => rankByNameCode.set(`${name}|${c}`, i + 1))
  }
  for (let pi = 0; pi < data.lines.length; pi++) {
    const pl = data.lines[pi]
    if (pl.points.length < 2) continue
    const baseName = sanitizeLayerName(pl.name, `Lijn ${pi + 1}`)
    const codes = codesByName.get(pl.name)
    let layer: string
    if (pl.code !== undefined && codes && codes.size > 1) {
      layer = `${baseName} ${rankByNameCode.get(`${pl.name}|${pl.code}`)}`
    } else {
      layer = baseName
    }
    addLayer(layer)
    polylines.push({ layer, pts: pl.points, closed: !!pl.closed })
  }
  for (const surf of data.surfaces) {
    const pts = surf.points
    const tris = surf.triangles.length > 0 ? surf.triangles : triangulate(pts)
    const layer = sanitizeLayerName(surf.name, defaultLayerName)
    addLayer(layer)
    const edgeSet = new Set<string>()
    for (const [a, b, c] of tris) {
      edgeSet.add(`${Math.min(a,b)}-${Math.max(a,b)}`)
      edgeSet.add(`${Math.min(b,c)}-${Math.max(b,c)}`)
      edgeSet.add(`${Math.min(a,c)}-${Math.max(a,c)}`)
    }
    for (const edge of edgeSet) {
      const [i, j] = edge.split('-').map(Number)
      const p1 = pts[i], p2 = pts[j]
      if (!p1 || !p2) continue
      polylines.push({ layer, pts: [p1, p2], closed: false })
    }
  }

  // Bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (const pl of polylines) for (const p of pl.pts) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y
    if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z
  }
  if (!isFinite(minX)) { minX = minY = minZ = 0; maxX = maxY = maxZ = 0 }

  const out: string[] = []
  const w = (...lines: (string | number)[]) => { for (const l of lines) out.push(String(l)) }
  const num = (n: number) => Number.isInteger(n) ? `${n}.0` : n.toString()
  const f = (n: number) => n.toFixed(15).replace(/\.?0+$/, '') || '0.0'

  // Handle allocator voor user content (start ruim boven systeem-handles)
  let nextH = 0x100
  const layerHandles = new Map<string, string>()
  for (const name of layers.keys()) {
    layerHandles.set(name, (nextH++).toString(16).toUpperCase())
  }
  const entityHandles: { polyline: string; vertices: string[]; seqend: string }[] = []
  for (const pl of polylines) {
    const polyH = (nextH++).toString(16).toUpperCase()
    const vertH = pl.pts.map(() => (nextH++).toString(16).toUpperCase())
    const seqH  = (nextH++).toString(16).toUpperCase()
    entityHandles.push({ polyline: polyH, vertices: vertH, seqend: seqH })
  }
  const handseed = (nextH).toString(16).toUpperCase()

  // ════ HEADER ════
  w('  0','SECTION','  2','HEADER')
  w('  9','$ACADVER','  1','AC1024')
  w('  9','$ACADMAINTVER',' 70','     6')
  w('  9','$DWGCODEPAGE','  3','ANSI_1252')
  w('  9','$INSBASE',' 10','0.0',' 20','0.0',' 30','0.0')
  w('  9','$EXTMIN',' 10',f(minX),' 20',f(minY),' 30',f(minZ))
  w('  9','$EXTMAX',' 10',f(maxX),' 20',f(maxY),' 30',f(maxZ))
  w('  9','$LIMMIN',' 10',f(minX),' 20',f(minY))
  w('  9','$LIMMAX',' 10',f(maxX),' 20',f(maxY))
  w('  9','$ORTHOMODE',' 70','     0')
  w('  9','$REGENMODE',' 70','     1')
  w('  9','$FILLMODE',' 70','     1')
  w('  9','$LTSCALE',' 40','1.0')
  w('  9','$TEXTSIZE',' 40','0.2')
  w('  9','$TEXTSTYLE','  7','Standard')
  w('  9','$CLAYER','  8','0')
  w('  9','$DIMSTYLE','  2','Standard')
  w('  9','$LUNITS',' 70','     2')
  w('  9','$LUPREC',' 70','     6')
  w('  9','$AUNITS',' 70','     0')
  w('  9','$AUPREC',' 70','     0')
  w('  9','$INSUNITS',' 70','     6')
  w('  9','$PSLTSCALE',' 70','     1')
  w('  9','$TREEDEPTH',' 70','  3020')
  w('  9','$PROXYGRAPHICS',' 70','     1')
  w('  9','$MEASUREMENT',' 70','     1')
  w('  9','$CELWEIGHT',' 370','    -1')
  w('  9','$ENDCAPS',' 280','     0')
  w('  9','$JOINSTYLE',' 280','     0')
  w('  9','$LWDISPLAY',' 290','     0')
  w('  9','$PSTYLEMODE',' 290','     1')
  w('  9','$STYLESHEET','  1','')
  w('  9','$XEDIT',' 290','     1')
  w('  9','$CEPSNTYPE',' 380','     0')
  w('  9','$HANDSEED','  5',handseed)
  w('  0','ENDSEC')

  // ════ CLASSES (leeg) ════
  w('  0','SECTION','  2','CLASSES','  0','ENDSEC')

  // ════ TABLES ════
  w('  0','SECTION','  2','TABLES')

  // VPORT
  w('  0','TABLE','  2','VPORT','  5','8','330','0','100','AcDbSymbolTable',' 70','     1')
  w('  0','VPORT','  5','23','330','8','100','AcDbSymbolTableRecord','100','AcDbViewportTableRecord')
  w('  2','*Active',' 70','     0')
  w(' 10','0.0',' 20','0.0',' 11','1.0',' 21','1.0')
  w(' 12',f((minX+maxX)/2),' 22',f((minY+maxY)/2))
  w(' 13','0.0',' 23','0.0',' 14','0.5',' 24','0.5',' 15','0.5',' 25','0.5')
  w(' 16','0.0',' 26','0.0',' 36','1.0',' 17','0.0',' 27','0.0',' 37','0.0')
  w(' 40',f(Math.max(maxY-minY, maxX-minX)),' 41','1.0')
  w(' 42','50.0',' 43','0.0',' 44','0.0',' 50','0.0',' 51','0.0')
  w(' 71','     0',' 72','  1000',' 73','     1',' 74','     3',' 75','     0',' 76','     0',' 77','     0',' 78','     0')
  w(' 281','     0',' 65','     1')
  w(' 110','0.0',' 120','0.0',' 130','0.0')
  w(' 111','1.0',' 121','0.0',' 131','0.0')
  w(' 112','0.0',' 122','1.0',' 132','0.0')
  w(' 79','     0',' 146','0.0')
  w('  0','ENDTAB')

  // LTYPE
  w('  0','TABLE','  2','LTYPE','  5','5','330','0','100','AcDbSymbolTable',' 70','     3')
  w('  0','LTYPE','  5','14','330','5','100','AcDbSymbolTableRecord','100','AcDbLinetypeTableRecord')
  w('  2','ByBlock',' 70','     0','  3','',' 72','    65',' 73','     0',' 40','0.0')
  w('  0','LTYPE','  5','15','330','5','100','AcDbSymbolTableRecord','100','AcDbLinetypeTableRecord')
  w('  2','ByLayer',' 70','     0','  3','',' 72','    65',' 73','     0',' 40','0.0')
  w('  0','LTYPE','  5','16','330','5','100','AcDbSymbolTableRecord','100','AcDbLinetypeTableRecord')
  w('  2','Continuous',' 70','     0','  3','Solid line',' 72','    65',' 73','     0',' 40','0.0')
  w('  0','ENDTAB')

  // LAYER
  w('  0','TABLE','  2','LAYER','  5','2','330','0','100','AcDbSymbolTable',' 70',`     ${layers.size + 1}`)
  // Layer "0" (verplicht)
  w('  0','LAYER','  5','10','330','2','100','AcDbSymbolTableRecord','100','AcDbLayerTableRecord')
  w('  2','0',' 70','     0',' 62','     7','  6','Continuous','370','    -3','390','F')
  // User layers
  for (const [name, color] of layers) {
    w('  0','LAYER','  5',layerHandles.get(name)!,'330','2','100','AcDbSymbolTableRecord','100','AcDbLayerTableRecord')
    w('  2',name,' 70','     0',' 62',`     ${color}`,'  6','Continuous','370','     9','390','F')
  }
  w('  0','ENDTAB')

  // STYLE
  w('  0','TABLE','  2','STYLE','  5','3','330','0','100','AcDbSymbolTable',' 70','     1')
  w('  0','STYLE','  5','11','330','3','100','AcDbSymbolTableRecord','100','AcDbTextStyleTableRecord')
  w('  2','Standard',' 70','     0',' 40','0.0',' 41','1.0',' 50','0.0',' 71','     0',' 42','0.2','  3','txt','  4','')
  w('  0','ENDTAB')

  // VIEW (leeg)
  w('  0','TABLE','  2','VIEW','  5','6','330','0','100','AcDbSymbolTable',' 70','     0','  0','ENDTAB')
  // UCS (leeg)
  w('  0','TABLE','  2','UCS','  5','7','330','0','100','AcDbSymbolTable',' 70','     0','  0','ENDTAB')

  // APPID
  w('  0','TABLE','  2','APPID','  5','9','330','0','100','AcDbSymbolTable',' 70','     1')
  w('  0','APPID','  5','12','330','9','100','AcDbSymbolTableRecord','100','AcDbRegAppTableRecord')
  w('  2','ACAD',' 70','     0')
  w('  0','ENDTAB')

  // DIMSTYLE
  w('  0','TABLE','  2','DIMSTYLE','  5','A','330','0','100','AcDbSymbolTable',' 70','     1','100','AcDbDimStyleTable')
  w('  0','DIMSTYLE','105','27','330','A','100','AcDbSymbolTableRecord','100','AcDbDimStyleTableRecord')
  w('  2','Standard',' 70','     0','178','     0','340','11')
  w('  0','ENDTAB')

  // BLOCK_RECORD
  w('  0','TABLE','  2','BLOCK_RECORD','  5','1','330','0','100','AcDbSymbolTable',' 70','     2')
  w('  0','BLOCK_RECORD','  5','1F','330','1','100','AcDbSymbolTableRecord','100','AcDbBlockTableRecord')
  w('  2','*Model_Space','340','22',' 70','     0','280','     1','281','     0')
  w('  0','BLOCK_RECORD','  5','1B','330','1','100','AcDbSymbolTableRecord','100','AcDbBlockTableRecord')
  w('  2','*Paper_Space','340','1E',' 70','     0','280','     1','281','     0')
  w('  0','ENDTAB')

  w('  0','ENDSEC')

  // ════ BLOCKS ════
  w('  0','SECTION','  2','BLOCKS')
  // *Model_Space
  w('  0','BLOCK','  5','20','330','1F','100','AcDbEntity','  8','0','100','AcDbBlockBegin')
  w('  2','*Model_Space',' 70','     0',' 10','0.0',' 20','0.0',' 30','0.0','  3','*Model_Space','  1','')
  w('  0','ENDBLK','  5','21','330','1F','100','AcDbEntity','  8','0','100','AcDbBlockEnd')
  // *Paper_Space
  w('  0','BLOCK','  5','1C','330','1B','100','AcDbEntity',' 67','     1','  8','0','100','AcDbBlockBegin')
  w('  2','*Paper_Space',' 70','     0',' 10','0.0',' 20','0.0',' 30','0.0','  3','*Paper_Space','  1','')
  w('  0','ENDBLK','  5','1D','330','1B','100','AcDbEntity',' 67','     1','  8','0','100','AcDbBlockEnd')
  w('  0','ENDSEC')

  // ════ ENTITIES ════
  w('  0','SECTION','  2','ENTITIES')
  for (let i = 0; i < polylines.length; i++) {
    const pl = polylines[i]
    const eh = entityHandles[i]
    const flag = (pl.closed ? 1 : 0) | 8 // 8 = 3D polyline
    // POLYLINE header
    w('  0','POLYLINE','  5',eh.polyline,'330','1F','100','AcDbEntity','  8',pl.layer)
    w('100','AcDb3dPolyline',' 66','     1')
    w(' 10','0.0',' 20','0.0',' 30','0.0',' 70',`     ${flag}`)
    // VERTEX records
    for (let v = 0; v < pl.pts.length; v++) {
      const p = pl.pts[v]
      w('  0','VERTEX','  5',eh.vertices[v],'330',eh.polyline,'100','AcDbEntity','  8',pl.layer)
      w('100','AcDbVertex','100','AcDb3dPolylineVertex')
      w(' 10',num(p.x),' 20',num(p.y),' 30',num(p.z),' 70','    32')
    }
    // SEQEND
    w('  0','SEQEND','  5',eh.seqend,'330',eh.polyline,'100','AcDbEntity','  8',pl.layer)
  }
  w('  0','ENDSEC')

  // ════ OBJECTS ════
  w('  0','SECTION','  2','OBJECTS')
  // Root DICTIONARY
  w('  0','DICTIONARY','  5','C','330','0','100','AcDbDictionary','281','     1')
  w('  3','ACAD_GROUP','350','D')
  w('  3','ACAD_LAYOUT','350','1A')
  w('  3','ACAD_MLINESTYLE','350','17')
  w('  3','ACAD_PLOTSTYLENAME','350','E')
  // ACAD_GROUP dict
  w('  0','DICTIONARY','  5','D','330','C','100','AcDbDictionary','281','     1')
  // ACAD_LAYOUT dict
  w('  0','DICTIONARY','  5','1A','330','C','100','AcDbDictionary','281','     1')
  // ACAD_MLINESTYLE dict
  w('  0','DICTIONARY','  5','17','330','C','100','AcDbDictionary','281','     1')
  // ACAD_PLOTSTYLENAME dict (acdbplaceholder voor Normal)
  w('  0','ACDBDICTIONARYWDFLT','  5','E','330','C','100','AcDbDictionary','281','     1','  3','Normal','350','F','100','AcDbDictionaryWithDefault','340','F')
  w('  0','ACDBPLACEHOLDER','  5','F','330','E')
  w('  0','ENDSEC')

  w('  0','EOF')
  return out.join('\r\n') + '\r\n'
}

// ─── DXF parser ───────────────────────────────────────────────────────────────

// Robuuste DXF-parser: tokenizeert (group code, value) pairs en walkt entiteiten.
// Ondersteunt 3DFACE (oppervlak), LINE/LWPOLYLINE/POLYLINE+VERTEX (lijnen),
// allemaal gegroepeerd per layer.

type DxfToken = { code: number; val: string }

function tokenizeDXF(text: string): DxfToken[] {
  // DXF format: even lines = code (3-char right-justified int), odd lines = value
  const ls = text.split(/\r?\n/)
  const tokens: DxfToken[] = []
  for (let i = 0; i + 1 < ls.length; i += 2) {
    const code = parseInt(ls[i].trim(), 10)
    if (Number.isFinite(code)) tokens.push({ code, val: ls[i + 1] ?? '' })
  }
  return tokens
}

export function parseDXF(text: string): MachineFile {
  const tokens = tokenizeDXF(text)

  // Find ENTITIES section
  let entStart = -1, entEnd = -1
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].code === 0 && tokens[i].val.trim() === 'SECTION'
        && tokens[i + 1]?.code === 2 && tokens[i + 1].val.trim() === 'ENTITIES') {
      entStart = i + 2; break
    }
  }
  if (entStart < 0) return { name: 'DXF', surfaces: [], lines: [] }
  for (let i = entStart; i < tokens.length; i++) {
    if (tokens[i].code === 0 && tokens[i].val.trim() === 'ENDSEC') { entEnd = i; break }
  }
  if (entEnd < 0) entEnd = tokens.length

  // Splits in entities (elke entity start met code 0)
  type Entity = { type: string; codes: Map<number, string[]> }
  const entities: Entity[] = []
  let cur: Entity | null = null
  for (let i = entStart; i < entEnd; i++) {
    const t = tokens[i]
    if (t.code === 0) {
      if (cur) entities.push(cur)
      cur = { type: t.val.trim(), codes: new Map() }
    } else if (cur) {
      const arr = cur.codes.get(t.code) ?? []
      arr.push(t.val)
      cur.codes.set(t.code, arr)
    }
  }
  if (cur) entities.push(cur)

  // Helpers
  const getStr = (e: Entity, code: number, def = '') => e.codes.get(code)?.[0]?.trim() ?? def
  const getNum = (e: Entity, code: number, def = 0) => {
    const v = e.codes.get(code)?.[0]
    return v != null ? parseFloat(v) : def
  }
  const getNums = (e: Entity, code: number) => (e.codes.get(code) ?? []).map(parseFloat)

  // Verzamel: surfaces per layer (3DFACE), polylines per layer (LINE / LWPOLYLINE / POLYLINE+VERTEX)
  const surfacesByLayer = new Map<string, { points: Point3D[]; triangles: Triangle[] }>()
  const polylines: Polyline[] = []

  // POLYLINE+VERTEX: process group-by-group
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i]
    const layer = getStr(e, 8, '0')

    if (e.type === '3DFACE') {
      const grp = surfacesByLayer.get(layer) ?? { points: [] as Point3D[], triangles: [] as Triangle[] }
      const p1 = { x: getNum(e, 10), y: getNum(e, 20), z: getNum(e, 30) }
      const p2 = { x: getNum(e, 11), y: getNum(e, 21), z: getNum(e, 31) }
      const p3 = { x: getNum(e, 12), y: getNum(e, 22), z: getNum(e, 32) }
      const p4 = { x: getNum(e, 13), y: getNum(e, 23), z: getNum(e, 33) }
      const base = grp.points.length
      grp.points.push(p1, p2, p3)
      grp.triangles.push([base, base + 1, base + 2])
      // Als 4e punt verschilt van 3e: tweede driehoek voor quad
      if (Math.hypot(p4.x - p3.x, p4.y - p3.y, p4.z - p3.z) > 1e-9) {
        grp.points.push(p4)
        grp.triangles.push([base, base + 2, base + 3])
      }
      surfacesByLayer.set(layer, grp)

    } else if (e.type === 'LINE') {
      const p1 = { x: getNum(e, 10), y: getNum(e, 20), z: getNum(e, 30) }
      const p2 = { x: getNum(e, 11), y: getNum(e, 21), z: getNum(e, 31) }
      polylines.push({ name: layer, points: [p1, p2] })

    } else if (e.type === 'LWPOLYLINE') {
      // 2D polyline met optionele elevation (38) en optioneel constant Z. XY paren in 10/20.
      const xs = getNums(e, 10)
      const ys = getNums(e, 20)
      const elev = getNum(e, 38, 0)
      const closed = (getNum(e, 70, 0) & 1) === 1
      const pts: Point3D[] = []
      for (let k = 0; k < Math.min(xs.length, ys.length); k++) {
        pts.push({ x: xs[k], y: ys[k], z: elev })
      }
      if (pts.length >= 2) polylines.push({ name: layer, points: pts, closed })

    } else if (e.type === 'POLYLINE') {
      // Verzamel volgende VERTEX entiteiten tot SEQEND
      const closed = (getNum(e, 70, 0) & 1) === 1
      const pts: Point3D[] = []
      let j = i + 1
      while (j < entities.length && entities[j].type !== 'SEQEND') {
        if (entities[j].type === 'VERTEX') {
          const v = entities[j]
          pts.push({ x: getNum(v, 10), y: getNum(v, 20), z: getNum(v, 30) })
        }
        j++
      }
      if (pts.length >= 2) polylines.push({ name: layer, points: pts, closed })
      i = j // skip verbruikte VERTEX/SEQEND
    }
  }

  const surfaces: Surface[] = []
  for (const [name, data] of surfacesByLayer) {
    surfaces.push({ name, points: data.points, triangles: data.triangles })
  }

  return { name: 'DXF', surfaces, lines: polylines }
}

// ─── TN3 parser ───────────────────────────────────────────────────────────────
//
// TN3 binary layout (all LE):
//   Offset 0:  "Topcon TN3\0" magic (11 bytes)
//   Offset 11: version/flags bytes
//   Offset 28: filename in UTF-16LE, null-terminated
//   Offset 0x62: index table — entries of [uint16 sectionType][uint32 0x16][uint32 byteOffset]
//
// Sub-sections are stored as self-describing blocks:
//   [uint16 type][uint32 0x16][uint32 blockSize(128)][uint32 stride]
//   [uint32 endByteOffset][uint32 0xFFFFFFFE] (22-byte header)
//   followed by (endByteOffset - (headerOffset+22)) / stride records
//
//  type=1, stride=24: XYZ double triples — surface TIN points (128 per block)
//  type=2, stride=36: triangle faces: 3×(uint16=1, uint16 pad, uint16 vtxIdx) +
//                     3×(uint16=2, uint16 pad/FFFE, uint16 neighborIdx)
//  type=3, stride=12: breakline edges: two endpoints (uint16=1, uint16 layerID, uint16 ptIdx)
//  type=6, stride=4:  attribute table (all 9 — layer attribution, skip)

export function parseTN3(buf: ArrayBuffer): MachineFile {
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)
  const N = buf.byteLength

  // Verify magic
  const magic = new TextDecoder().decode(bytes.slice(0, 10))
  if (!magic.startsWith('Topcon TN3')) {
    throw new Error('Geen geldig TN3-bestand')
  }

  // Read name from UTF-16LE at offset 28
  let nameEnd = 28
  for (let i = 28; i < Math.min(200, N - 2); i += 2) {
    if (view.getUint16(i, true) === 0) { nameEnd = i; break }
  }
  const name = new TextDecoder('utf-16le').decode(bytes.slice(28, nameEnd))

  // ── Scan for all sub-section headers matching signature: ──
  //   uint16 type(1-6), uint32 0x16, uint32 0x80, uint32 stride
  //   uint32 endOffset, uint32 0xFFFFFFFE/0xFFFFFFFF

  type Blk = { off: number; type: number; stride: number; dataOff: number; dataEnd: number }
  const blocks: Blk[] = []

  for (let i = 0; i < N - 22; i += 2) {
    const t = view.getUint16(i, true)
    if (t < 1 || t > 6) continue
    if (view.getUint32(i + 2, true) !== 22) continue
    const countOrRpb = view.getUint32(i + 6, true)
    const stride = view.getUint32(i + 10, true)
    if (stride !== 24 && stride !== 36 && stride !== 12 && stride !== 4) continue
    const field5 = view.getUint32(i + 14, true)
    let dataEnd: number
    if (field5 === 0xFFFFFFFE || field5 === 0xFFFFFFFF) {
      // NEW format: count at bytes +6, sentinel at +14
      if (countOrRpb === 0 || countOrRpb > 100000) continue
      dataEnd = i + 22 + countOrRpb * stride
      if (dataEnd > N) continue
    } else if (countOrRpb === 128 && field5 >= i + 22 && field5 <= N) {
      // OLD format: recPerBlk=128 at +6, endOffset at +14
      dataEnd = field5
    } else { continue }
    blocks.push({ off: i, type: t, stride, dataOff: i + 22, dataEnd })
  }

  // ── Collect all surface points from type=1 blocks ──
  const allPoints: Point3D[] = []
  for (const blk of blocks) {
    if (blk.type !== 1) continue
    const nPts = Math.floor((blk.dataEnd - blk.dataOff) / 24)
    for (let j = 0; j < nPts; j++) {
      const off = blk.dataOff + j * 24
      allPoints.push({
        x: view.getFloat64(off,      true),
        y: view.getFloat64(off +  8, true),
        z: view.getFloat64(off + 16, true),
      })
    }
  }

  // ── Collect triangles from type=2 blocks ──
  // Each 36-byte record: 6 × (uint16 flag, uint16 pad, uint16 idx)
  // Groups 0-2 (flag=1, bytes 0-5, 6-11, 12-17): vertex indices at bytes 4, 10, 16
  // Groups 3-5 (flag=2, bytes 18-23, 24-29, 30-35): neighbor indices (skip)
  const allTriangles: Triangle[] = []
  for (const blk of blocks) {
    if (blk.type !== 2) continue
    const nRec = Math.floor((blk.dataEnd - blk.dataOff) / 36)
    for (let j = 0; j < nRec; j++) {
      const off = blk.dataOff + j * 36
      const v0 = view.getUint16(off +  4, true)   // group 0 idx
      const v1 = view.getUint16(off + 10, true)   // group 1 idx
      const v2 = view.getUint16(off + 16, true)   // group 2 idx
      if (v0 < allPoints.length && v1 < allPoints.length && v2 < allPoints.length) {
        allTriangles.push([v0, v1, v2])
      }
    }
  }

  // ── Collect breaklines from type=3 blocks ──
  // Each 12-byte record: two endpoints (uint16=1, uint16 blockID, uint16 localPtIdx) × 2
  // The blockID × 128 + localPtIdx = global index into allPoints.
  // Consecutive records chain: end of record[i] == start of record[i+1].
  // Split into separate polylines wherever the chain breaks.
  const polylines: Polyline[] = []
  let currentPoly: Polyline | null = null
  let prevGlobalIdx = -1

  for (const blk of blocks) {
    if (blk.type !== 3) continue
    const nRec = Math.floor((blk.dataEnd - blk.dataOff) / 12)
    for (let j = 0; j < nRec; j++) {
      const off     = blk.dataOff + j * 12
      const aBlock  = view.getUint16(off + 2, true)
      const aLocal  = view.getUint16(off + 4, true)
      const bBlock  = view.getUint16(off + 8, true)
      const bLocal  = view.getUint16(off + 10, true)
      const aGlobal = aBlock * 128 + aLocal
      const bGlobal = bBlock * 128 + bLocal
      if (aGlobal >= allPoints.length || bGlobal >= allPoints.length) continue

      // If this edge does NOT continue from the previous one, start a new polyline
      if (aGlobal !== prevGlobalIdx) {
        if (currentPoly && currentPoly.points.length >= 2) polylines.push(currentPoly)
        currentPoly = { name: `BL${polylines.length + 1}`, points: [allPoints[aGlobal]], closed: false }
      }
      currentPoly!.points.push(allPoints[bGlobal])
      prevGlobalIdx = bGlobal
    }
  }
  if (currentPoly && currentPoly.points.length >= 2) polylines.push(currentPoly)

  return {
    name: name || 'TN3',
    surfaces: [{ name: name || 'Oppervlak', points: allPoints, triangles: allTriangles }],
    lines: polylines,
  }
}

function samePoint(a: Point3D, b: Point3D): boolean {
  return Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001 && Math.abs(a.z - b.z) < 0.001
}

// ─── LN3 parser ───────────────────────────────────────────────────────────────
//
// LN3 binary layout (all LE):
//   Offset 0: "Topcon LN3\0" magic
//   Offset 28: filename in UTF-16LE, null-terminated
//
// 18-byte block headers:
//   uint16 type | uint16 hdrSz=18 | uint16 rpb | uint16 count | uint16 stride
//   uint32 sentinel1=0xFFFFFFFE | uint32 sentinel2=0xFFFFFFFE
//
//  type=1, stride=12:  relative vertices — float32 dX, dY, dZ
//  type=5, stride=154: line objects — UTF-16LE name at rec+2, refX float64 at rec+138, refY float64 at rec+146
//  type=6, stride=21:  vertex ranges — start=uint16 at rec+4, count=uint16 at rec+12, flag=uint8 at rec+14 (1=real)

export function parseLN3(buf: ArrayBuffer): MachineFile {
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)
  const N = buf.byteLength

  const magic = new TextDecoder().decode(bytes.slice(0, 10))
  if (!magic.startsWith('Topcon LN3')) {
    throw new Error('Geen geldig LN3-bestand')
  }

  // Read name from UTF-16LE at offset 28
  let nameEnd = 28
  for (let i = 28; i < Math.min(200, N - 2); i += 2) {
    if (view.getUint16(i, true) === 0) { nameEnd = i; break }
  }
  const name = new TextDecoder('utf-16le').decode(bytes.slice(28, nameEnd))

  type Blk = { off: number; type: number; stride: number; count: number; dataOff: number }
  const blocks: Blk[] = []

  for (let i = 0; i < N - 18; i += 2) {
    const t = view.getUint16(i, true)
    if (t < 1 || t > 20) continue
    if (view.getUint16(i + 2, true) !== 18) continue
    const count  = view.getUint16(i + 6, true)
    const stride = view.getUint16(i + 8, true)
    if (stride === 0 || stride > 2000) continue
    if (view.getUint32(i + 10, true) !== 0xFFFFFFFE) continue
    const dataEnd = i + 18 + count * stride
    if (dataEnd > N) continue
    blocks.push({ off: i, type: t, stride, count, dataOff: i + 18 })
  }

  // All relative vertices from type=1, stride=12 blocks (dX, dY, dZ as float32)
  const allVerts: { dx: number; dy: number; dz: number }[] = []
  for (const blk of blocks) {
    if (blk.type !== 1 || blk.stride !== 12) continue
    for (let j = 0; j < blk.count; j++) {
      const off = blk.dataOff + j * 12
      allVerts.push({
        dx: view.getFloat32(off,     true),
        dy: view.getFloat32(off + 4, true),
        dz: view.getFloat32(off + 8, true),
      })
    }
  }

  // Line objects: any block with stride >= 100 (type=5, stride=154 typically)
  const lineObjects: { name: string; refX: number; refY: number }[] = []
  for (const blk of blocks) {
    if (blk.stride < 100) continue
    for (let j = 0; j < blk.count; j++) {
      const recOff = blk.dataOff + j * blk.stride
      let nEnd = recOff + blk.stride
      for (let k = recOff + 2; k < recOff + blk.stride - 1 && k + 1 < N; k += 2) {
        if (view.getUint16(k, true) === 0) { nEnd = k; break }
      }
      const lineName = new TextDecoder('utf-16le').decode(bytes.slice(recOff + 2, nEnd))
      const refX = view.getFloat64(recOff + 138, true)
      const refY = view.getFloat64(recOff + 146, true)
      lineObjects.push({ name: lineName || `Lijn ${lineObjects.length + 1}`, refX, refY })
    }
  }

  // Vertex ranges: stride=21, flag=1 means real range
  const realRanges: { start: number; count: number }[] = []
  for (const blk of blocks) {
    if (blk.stride !== 21) continue
    for (let j = 0; j < blk.count; j++) {
      const recOff = blk.dataOff + j * 21
      if (recOff + 15 > N) continue
      const flag = view.getUint8(recOff + 14)
      if (flag !== 1) continue
      const start = view.getUint16(recOff + 4, true)
      const cnt   = view.getUint16(recOff + 12, true)
      realRanges.push({ start, count: cnt })
    }
  }

  // Build polylines: range[i] → lineObjects[i], extras appended to last
  const polylines: Polyline[] = []
  for (let i = 0; i < realRanges.length; i++) {
    const range = realRanges[i]
    const lineObj = i < lineObjects.length
      ? lineObjects[i]
      : lineObjects.length > 0 ? lineObjects[lineObjects.length - 1] : null
    if (!lineObj) continue
    const pts: Point3D[] = []
    for (let j = 0; j < range.count; j++) {
      const idx = range.start + j
      if (idx >= allVerts.length) break
      const v = allVerts[idx]
      pts.push({ x: lineObj.refX + v.dx, y: lineObj.refY + v.dy, z: v.dz })
    }
    if (pts.length < 2) continue
    if (i < lineObjects.length) {
      polylines.push({ name: lineObj.name, points: pts })
    } else if (polylines.length > 0) {
      polylines[polylines.length - 1].points.push(...pts)
    }
  }

  return { name: name || 'LN3', surfaces: [], lines: polylines }
}

// ─── TN3 generator ────────────────────────────────────────────────────────────

export function generateTN3(data: MachineFile): ArrayBuffer {
  const allPoints: Point3D[] = data.surfaces.flatMap(s => s.points)
  const count = allPoints.length

  const name = data.name || 'MV3D'
  const nameUtf16 = new TextEncoder().encode(name) // approximate
  const nameBytes = encodeUtf16LE(name)

  // Header: magic(11) + flags(2) + timestamp(4) + version(8) + namelen(2) + name(n×2) + null(2)
  const headerSize = 11 + 2 + 4 + 8 + 2 + nameBytes.byteLength + 2
  // Pad header to multiple of 8
  const headerPadded = Math.ceil(headerSize / 8) * 8 + 32 // some extra header bytes
  const dataSize = count * 24
  const total = headerPadded + dataSize

  const buf = new ArrayBuffer(total)
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)

  // Magic
  const magic = 'Topcon TN3\0'
  for (let i = 0; i < magic.length; i++) bytes[i] = magic.charCodeAt(i)

  // Flags / version (from sample analysis)
  bytes[11] = 0xff
  bytes[12] = 0x20

  // Write name in UTF-16LE at offset 28 (matching sample structure)
  const nameArr = new Uint8Array(nameBytes)
  for (let i = 0; i < nameArr.length; i++) bytes[28 + i] = nameArr[i]

  // Write XYZ data starting at headerPadded
  for (let i = 0; i < count; i++) {
    const off = headerPadded + i * 24
    view.setFloat64(off, allPoints[i].x, true)
    view.setFloat64(off + 8, allPoints[i].y, true)
    view.setFloat64(off + 16, allPoints[i].z, true)
  }

  return buf
}

function encodeUtf16LE(s: string): ArrayBuffer {
  const buf = new ArrayBuffer(s.length * 2)
  const view = new DataView(buf)
  for (let i = 0; i < s.length; i++) view.setUint16(i * 2, s.charCodeAt(i), true)
  return buf
}

// ─── TP3 parser (combined: surface + lines) ──────────────────────────────────
//
// TP3 binary layout:
//   Offset 0:  "Topcon TP3\0" magic
//   Offset 28: project name UTF-16LE
//   18-byte block headers (uint16 type, uint16 hdrSz=18, uint16 rpb, uint16 count,
//                          uint16 stride, uint32 sentinel=0xFFFFFFFE, uint32 sentinel)
//
//  type=2  stride=24  : raw vertices (X, Y, Z float64) — RELATIVE to per-object refX/refY
//                       (first 4 records are normalization vectors, skip)
//  type=11 stride=340 : object metadata (name UTF-16LE @+2, refX float64 @+138, refY @+146)
//                       Surface objects have refX=refY=0; line objects have real refs
//  type=12 stride=32  : vertex range mapping (start uint16 @+4, count uint32 @+12)
//                       Records map to line objects in order; extras append to last line
//                       The first range (start=0, count=4) is the normalization
//  type=14 stride=24  : surface triangles (uint32×6: 3 vertex indices + 3 neighbors)
//                       Indices are LOCAL to the surface vertex array
//  type=17 stride=332 : surface metadata (name UTF-16LE @+30, refX @+160, refY @+168)

export function parseTP3(buf: ArrayBuffer): MachineFile {
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)
  const N = buf.byteLength

  const magic = new TextDecoder().decode(bytes.slice(0, 10))
  if (!magic.startsWith('Topcon TP3')) {
    throw new Error('Geen geldig TP3-bestand')
  }

  // Project name
  let nameEnd = 28
  for (let i = 28; i < Math.min(200, N - 2); i += 2) {
    if (view.getUint16(i, true) === 0) { nameEnd = i; break }
  }
  const projectName = new TextDecoder('utf-16le').decode(bytes.slice(28, nameEnd))

  // Scan 18-byte block headers
  type Blk = { off: number; type: number; stride: number; count: number; dataOff: number }
  const blocks: Blk[] = []
  for (let i = 0; i < N - 18; i += 2) {
    const t = view.getUint16(i, true)
    if (t < 1 || t > 30) continue
    if (view.getUint16(i + 2, true) !== 18) continue
    const count  = view.getUint16(i + 6, true)
    const stride = view.getUint16(i + 8, true)
    if (stride === 0 || stride > 2000) continue
    if (view.getUint32(i + 10, true) !== 0xFFFFFFFE) continue
    const dataEnd = i + 18 + count * stride
    if (dataEnd > N) continue
    blocks.push({ off: i, type: t, stride, count, dataOff: i + 18 })
  }

  // type=2: raw RELATIVE vertices
  type RawVtx = { x: number; y: number; z: number }
  const rawVerts: RawVtx[] = []
  for (const blk of blocks) {
    if (blk.type !== 2 || blk.stride !== 24) continue
    for (let j = 0; j < blk.count; j++) {
      const o = blk.dataOff + j * 24
      rawVerts.push({
        x: view.getFloat64(o,     true),
        y: view.getFloat64(o + 8, true),
        z: view.getFloat64(o + 16, true),
      })
    }
  }

  // type=11: line objects (filter to those with non-zero refX)
  type LineObj = { name: string; refX: number; refY: number }
  const lineObjects: LineObj[] = []
  for (const blk of blocks) {
    if (blk.type !== 11 || blk.stride < 300) continue
    for (let j = 0; j < blk.count; j++) {
      const recOff = blk.dataOff + j * blk.stride
      const refX = view.getFloat64(recOff + 138, true)
      if (Math.abs(refX) < 1) continue
      const refY = view.getFloat64(recOff + 146, true)
      let nEnd = recOff + blk.stride
      for (let k = recOff + 2; k < recOff + blk.stride - 1 && k + 1 < N; k += 2) {
        if (view.getUint16(k, true) === 0) { nEnd = k; break }
      }
      const lineName = new TextDecoder('utf-16le').decode(bytes.slice(recOff + 2, nEnd))
      lineObjects.push({ name: lineName || `Lijn ${lineObjects.length + 1}`, refX, refY })
    }
  }

  // type=12: vertex range mapping
  // Range bevat ook een feature-code (uint16 op offset +22) die Pythagoras
  // gebruikt voor layer/kleur-groepering. Polylines met dezelfde code horen
  // bij dezelfde feature-categorie en moeten dezelfde kleur krijgen.
  type Range = { start: number; count: number; code: number }
  const allRanges: Range[] = []
  for (const blk of blocks) {
    if (blk.type !== 12 || blk.stride !== 32) continue
    for (let j = 0; j < blk.count; j++) {
      const o = blk.dataOff + j * 32
      allRanges.push({
        start: view.getUint16(o + 4,  true),
        count: view.getUint32(o + 12, true),
        code:  view.getUint16(o + 22, true),
      })
    }
  }

  // Build line polylines: ELKE vertex-range = aparte polyline. Voorkomt dat
  // losse 2-punts segmenten samenklitten tot één spaghetti-polyline. Polyline
  // naam blijft origineel (uit type=11), code wordt apart bewaard zodat zowel
  // round-trip naar TP3 (1 line object per naam) als DXF export (1 layer per
  // code) blijft werken.
  const lineRanges = allRanges.filter(r => r.start >= 4 && r.count > 0 && r.count < 100000)

  const lines: Polyline[] = []
  for (let i = 0; i < lineRanges.length; i++) {
    const r = lineRanges[i]
    const lineObj = i < lineObjects.length
      ? lineObjects[i]
      : lineObjects.length > 0 ? lineObjects[lineObjects.length - 1] : null
    if (!lineObj) continue
    const pts: Point3D[] = []
    for (let j = 0; j < r.count; j++) {
      const v = rawVerts[r.start + j]
      if (!v) break
      pts.push({ x: lineObj.refX + v.x, y: lineObj.refY + v.y, z: v.z })
    }
    if (pts.length < 2) continue
    lines.push({
      name: lineObj.name,
      points: pts,
      code: r.code,
      _tp3RangeStart: r.start,
      _tp3RefX: lineObj.refX,
      _tp3RefY: lineObj.refY,
    })
  }

  // type=17: surface metadata (authoritative voor surface positie/grootte)
  let surfaceName = 'Oppervlak'
  let surfaceRefX = 0
  let surfaceRefY = 0
  let surfaceVertStart = -1
  let surfaceVertCount = -1
  for (const blk of blocks) {
    if (blk.type !== 17 || blk.stride < 200 || blk.count < 1) continue
    const recOff = blk.dataOff
    surfaceVertStart = view.getUint16(recOff + 4, true)
    surfaceVertCount = view.getUint16(recOff + 18, true)
    surfaceRefX = view.getFloat64(recOff + 160, true)
    surfaceRefY = view.getFloat64(recOff + 168, true)
    let nEnd = recOff + blk.stride
    for (let k = recOff + 30; k < recOff + blk.stride - 1 && k + 1 < N; k += 2) {
      if (view.getUint16(k, true) === 0) { nEnd = k; break }
    }
    const sn = new TextDecoder('utf-16le').decode(bytes.slice(recOff + 30, nEnd))
    if (sn) surfaceName = sn
    break
  }

  // Surface vertices: gebruik AUTHORITATIVE info uit type=17 (start + count) als
  // beschikbaar, anders fallback "alle indices niet gebruikt door line ranges".
  const surfaceVerts: Point3D[] = []
  if (surfaceVertStart >= 0 && surfaceVertCount > 0) {
    for (let i = 0; i < surfaceVertCount; i++) {
      const idx = surfaceVertStart + i
      if (idx >= rawVerts.length) break
      const v = rawVerts[idx]
      surfaceVerts.push({ x: surfaceRefX + v.x, y: surfaceRefY + v.y, z: v.z })
    }
  } else {
    const usedIdx = new Set<number>()
    for (let i = 0; i < 4; i++) usedIdx.add(i)
    for (const r of allRanges) {
      if (r.start < 4 || r.count > 100000) continue
      for (let j = 0; j < r.count; j++) usedIdx.add(r.start + j)
    }
    for (let i = 0; i < rawVerts.length; i++) {
      if (usedIdx.has(i)) continue
      const v = rawVerts[i]
      surfaceVerts.push({ x: surfaceRefX + v.x, y: surfaceRefY + v.y, z: v.z })
    }
  }

  // type=14: triangles (local indices into surface vertex array)
  const triangles: Triangle[] = []
  for (const blk of blocks) {
    if (blk.type !== 14 || blk.stride !== 24) continue
    for (let j = 0; j < blk.count; j++) {
      const o = blk.dataOff + j * 24
      const a = view.getUint32(o,     true)
      const b = view.getUint32(o + 4, true)
      const c = view.getUint32(o + 8, true)
      if (a < surfaceVerts.length && b < surfaceVerts.length && c < surfaceVerts.length) {
        triangles.push([a, b, c])
      }
    }
  }

  return {
    name: projectName || 'TP3',
    surfaces: surfaceVerts.length > 0 ? [{ name: surfaceName, points: surfaceVerts, triangles }] : [],
    lines,
    tp3Source: buf, // bewaar originele bytes voor template-based round-trip
  }
}

// ─── TP3 generator ───────────────────────────────────────────────────────────
//
// Schrijft een Topcon TP3 binary file vanaf een MachineFile (oppervlak + lijnen).
// Gebruikt een 1822-byte binary template (public/converter/tp3-header.bin) voor
// de file-header met cleared project naam (offset 28) en index tabel (offset
// 200). De generator vult deze in en schrijft daarna de blocks:
//   type=2 stride=24  : raw vertices RELATIVE to per-line refX/refY (4 norm + N data)
//   type=11 stride=340: line objects (name, refX, refY)
//   type=13 stride=4  : per-vertex attributes (zeros)
//   type=12 stride=32 : vertex range mapping (start, count, code)
//   type=14 stride=24 : surface triangles (uint32 indices)
//   type=17 stride=332: surface metadata (name, refX, refY)

const tp3Cache: { [key: string]: ArrayBuffer } = {}

async function loadTp3Asset(name: string): Promise<ArrayBuffer> {
  if (tp3Cache[name]) return tp3Cache[name]
  const res = await fetch(`/converter/${name}`)
  if (!res.ok) throw new Error(`TP3 asset ${name} kon niet geladen worden`)
  tp3Cache[name] = await res.arrayBuffer()
  return tp3Cache[name]
}

function writeUtf16LE(view: DataView, offset: number, str: string, maxBytes: number): number {
  const maxChars = Math.floor(maxBytes / 2)
  const chars = Math.min(str.length, maxChars - 1) // reserve 2 bytes voor null-terminator
  for (let i = 0; i < chars; i++) {
    view.setUint16(offset + i * 2, str.charCodeAt(i), true)
  }
  view.setUint16(offset + chars * 2, 0, true) // null terminator
  return chars * 2 + 2
}

export async function generateTP3(data: MachineFile, projectName?: string): Promise<ArrayBuffer> {
  const [headerTpl, type12Tpl, type17Tpl, t11Line] = await Promise.all([
    loadTp3Asset('tp3-header.bin'),
    loadTp3Asset('tp3-type12.bin'),
    loadTp3Asset('tp3-type17.bin'),
    loadTp3Asset('tp3-type11-line.bin'),
  ])
  const t11Templates = [t11Line, t11Line, t11Line, t11Line] // gebruik echte line-template overal
  const HEADER_SIZE = 1822

  // ── Bereken referentiepunt voor RELATIVE vertices ──
  // Gebruik centroid van alle vertices als globale ref. Lijnen krijgen elk
  // een eigen ref (centroid van die lijn) zodat dx/dy klein blijven.
  const allLineNames = new Set(data.lines.map(l => l.name))
  type LineRef = { name: string; refX: number; refY: number; pointStart: number; pointCount: number; code: number }
  const lineRefs: LineRef[] = []

  // ── Bouw rawVertices (relative) ──
  // Eerste 4 vertices: in TEST CONVERT zijn het 4 unit-vectoren op 90° intervallen
  // (mag ~0.45m, z=0), in xxx zijn het surface-corners met elevatie. Functie
  // nog niet vol decoded. Match TEST CONVERT exact (juiste decimalen 0.1785).
  type RawV = { x: number; y: number; z: number }
  const rawVerts: RawV[] = [
    { x: -0.418,  y:  0.1785, z: 0 },
    { x:  0.1785, y:  0.418,  z: 0 },
    { x:  0.418,  y: -0.1785, z: 0 },
    { x: -0.1785, y: -0.418,  z: 0 },
  ]

  // Per-line refs (type=17 refX volgt triangulatie; type=11 line refs sturen
  // de bounding-box rendering). Elke layer krijgt eigen ref = centroid van
  // zijn eerste polyline. Surface ref = centroid van surface punten.
  const surface = data.surfaces[0] ?? { name: 'Oppervlak', points: [], triangles: [] }

  const linesByName = new Map<string, Polyline[]>()
  for (const pl of data.lines) {
    if (pl.points.length < 2) continue
    const arr = linesByName.get(pl.name) ?? []
    arr.push(pl)
    linesByName.set(pl.name, arr)
  }

  type LineObject = { name: string; refX: number; refY: number }
  const lineObjects: LineObject[] = []
  type VertexRange = { start: number; count: number; code: number }
  // Topcon-conventie: 2 norm ranges (count=2 elk) ipv 1 range count=4
  const vertexRanges: VertexRange[] = [
    { start: 0, count: 2, code: 32 },
    { start: 2, count: 2, code: 32 },
  ]

  // 1 line object per unieke naam. Topcon vereist DISTINCTE codes per layer
  // (gebleken: zelfde codes voor alle ranges veroorzaakt offset). Daarom
  // sequentiele codes per layer (1, 2, 3, ...). DXF generator gebruikt
  // pl.code voor kleurgroepering binnen layer.
  let layerCode = 1
  for (const [name, pls] of linesByName) {
    const refPt = pls[0].points[0]
    const refX = refPt.x
    const refY = refPt.y
    lineObjects.push({ name, refX, refY })
    for (const pl of pls) {
      const startIdx = rawVerts.length
      for (const p of pl.points) {
        rawVerts.push({ x: p.x - refX, y: p.y - refY, z: p.z })
      }
      vertexRanges.push({
        start: startIdx,
        count: pl.points.length,
        code: layerCode,
      })
    }
    layerCode++
  }

  // Surface ref = ref van EERSTE line object (in TEST CONVERT was dit zo).
  // Topcon lijkt surface ref te koppelen aan een line ref voor consistentie.
  // Fallback: centroid van surface punten als geen lijnen.
  const surfaceVertStart = rawVerts.length
  let surfaceRefX = 0, surfaceRefY = 0
  if (lineObjects.length > 0) {
    surfaceRefX = lineObjects[0].refX
    surfaceRefY = lineObjects[0].refY
  } else if (surface.points.length > 0) {
    let sx = 0, sy = 0
    for (const p of surface.points) { sx += p.x; sy += p.y }
    surfaceRefX = sx / surface.points.length
    surfaceRefY = sy / surface.points.length
  }
  for (const p of surface.points) {
    rawVerts.push({ x: p.x - surfaceRefX, y: p.y - surfaceRefY, z: p.z })
  }

  // ── Bouw blocks (per type) ──
  // recPerBlk waarde verschilt per block type (constant uit echte TP3s):
  const RPB_BY_TYPE: Record<number, number> = {
    2: 1024, 11: 128, 12: 1024, 13: 128, 14: 1024, 17: 32,
  }
  function makeBlockHeader(type: number, count: number, stride: number): ArrayBuffer {
    const buf = new ArrayBuffer(18)
    const dv = new DataView(buf)
    dv.setUint16(0, type, true)
    dv.setUint16(2, 18, true)
    dv.setUint16(4, RPB_BY_TYPE[type] ?? 1024, true)
    dv.setUint16(6, count, true)
    dv.setUint16(8, stride, true)
    dv.setUint32(10, 0xFFFFFFFE, true)
    dv.setUint32(14, 0xFFFFFFFE, true)
    return buf
  }

  // type=2 (vertices, RELATIVE)
  const block2Data = new ArrayBuffer(rawVerts.length * 24)
  const dv2 = new DataView(block2Data)
  for (let i = 0; i < rawVerts.length; i++) {
    dv2.setFloat64(i * 24,      rawVerts[i].x, true)
    dv2.setFloat64(i * 24 + 8,  rawVerts[i].y, true)
    dv2.setFloat64(i * 24 + 16, rawVerts[i].z, true)
  }
  const block2 = concatBuffers(makeBlockHeader(2, rawVerts.length, 24), block2Data)

  // type=11: alleen LINE OBJECT records (Topcon-conventie zoals xxx en project 6).
  // Geen placeholder, geen aparte surface entry — surface zit in type=17.
  const numLineRecs = lineObjects.length
  const block11Data = new ArrayBuffer(numLineRecs * 340)
  const u11 = new Uint8Array(block11Data)
  const dv11 = new DataView(block11Data)
  for (let i = 0; i < numLineRecs; i++) {
    const tpl = t11Templates[Math.min(i + 2, 3)] // begin met "lijn" templates (rec[2] of rec[3])
    u11.set(new Uint8Array(tpl), i * 340)
    const off = i * 340
    dv11.setUint16(off, i, true)
    const lo = lineObjects[i]
    writeUtf16LE(dv11, off + 2, lo.name, 100)
    dv11.setFloat64(off + 138, lo.refX, true)
    dv11.setFloat64(off + 146, lo.refY, true)
  }
  const block11 = concatBuffers(makeBlockHeader(11, numLineRecs, 340), block11Data)

  // type=13 (per-vertex attributes, all zeros). MAX = 128 (recPerBlk)!
  // Topcon alloceert vaste 128-record buffer; hoger geeft ACCESS_VIOLATION crash.
  // Werkende voorbeelden: TEST CONVERT 64, xxx 84, project 6 124. Altijd ≤ 128.
  const t13Count = Math.min(surfaceVertStart, 128)
  const block13Data = new ArrayBuffer(t13Count * 4)
  const block13 = concatBuffers(makeBlockHeader(13, t13Count, 4), block13Data)

  // type=12 (vertex ranges) — start vanaf template per record (preserveert
  // timestamp). Patch start (+4 én duplicate +10), count (+12), code (+22).
  const block12Data = new ArrayBuffer(vertexRanges.length * 32)
  const u12 = new Uint8Array(block12Data)
  const dv12 = new DataView(block12Data)
  for (let i = 0; i < vertexRanges.length; i++) {
    u12.set(new Uint8Array(type12Tpl), i * 32)
    const o = i * 32
    const r = vertexRanges[i]
    dv12.setUint16(o + 4,  r.start, true)
    dv12.setUint16(o + 10, r.start, true) // duplicate van start
    dv12.setUint32(o + 12, r.count, true)
    dv12.setUint16(o + 22, r.code,  true)
  }
  const block12 = concatBuffers(makeBlockHeader(12, vertexRanges.length, 32), block12Data)

  // type=14 (surface triangles, 6 × uint32: 3 vertex indices LOCAL to surface
  // + 3 NEIGHBOR triangle indices). Topcon vereist valide neighbor-info om de
  // mesh te renderen (anders 0 sommets ondanks juiste structuur).
  // Neighbor[k] = triangle index die de edge (vertex[k], vertex[k+1]) deelt.
  const tris = surface.triangles
  // Bouw edge → triangle index map (key = "min-max")
  const edgeMap = new Map<string, number[]>()
  for (let i = 0; i < tris.length; i++) {
    const [a, b, c] = tris[i]
    for (const [u, v] of [[a, b], [b, c], [c, a]]) {
      const key = u < v ? `${u}-${v}` : `${v}-${u}`
      const arr = edgeMap.get(key) ?? []
      arr.push(i)
      edgeMap.set(key, arr)
    }
  }
  const block14Data = new ArrayBuffer(tris.length * 24)
  const dv14 = new DataView(block14Data)
  for (let i = 0; i < tris.length; i++) {
    const o = i * 24
    const [a, b, c] = tris[i]
    dv14.setUint32(o,      a, true)
    dv14.setUint32(o + 4,  b, true)
    dv14.setUint32(o + 8,  c, true)
    // Neighbors per edge (zelfde volgorde): (a,b), (b,c), (c,a)
    for (let k = 0; k < 3; k++) {
      const [u, v] = k === 0 ? [a, b] : k === 1 ? [b, c] : [c, a]
      const key = u < v ? `${u}-${v}` : `${v}-${u}`
      const ts = edgeMap.get(key) ?? []
      const neighbor = ts.find(t => t !== i)
      dv14.setUint32(o + 12 + k * 4, neighbor !== undefined ? neighbor : 0xFFFFFFFF, true)
    }
  }
  const block14 = concatBuffers(makeBlockHeader(14, tris.length, 24), block14Data)

  // type=17 (surface metadata, 1 record). Start van TEST CONVERT template
  // (alle constanten + onbekende metadata blijven), patch alleen variabele velden:
  //   +4  uint16 = surface vertex START in type=2
  //   +18 uint16 = vertex count
  //   +22 uint16 = triangle count
  //   +30 UTF-16LE = surface name
  //   +160 float64 = surface refX
  //   +168 float64 = surface refY
  const block17Data = new ArrayBuffer(332)
  new Uint8Array(block17Data).set(new Uint8Array(type17Tpl)) // copy template
  const dv17 = new DataView(block17Data)
  dv17.setUint16(4,  surfaceVertStart, true)
  dv17.setUint16(18, surface.points.length,    true)
  dv17.setUint16(22, surface.triangles.length, true)
  writeUtf16LE(dv17, 30, surface.name, 100)
  dv17.setFloat64(160, surfaceRefX, true)
  dv17.setFloat64(168, surfaceRefY, true)
  const block17 = concatBuffers(makeBlockHeader(17, 1, 332), block17Data)

  // ── Compute final offsets ──
  let off = HEADER_SIZE
  const blocks = [
    { type: 2,  buf: block2,  off: 0 },
    { type: 11, buf: block11, off: 0 },
    { type: 13, buf: block13, off: 0 },
    { type: 12, buf: block12, off: 0 },
    { type: 14, buf: block14, off: 0 },
    { type: 17, buf: block17, off: 0 },
  ]
  for (const b of blocks) {
    b.off = off
    off += b.buf.byteLength
  }
  const totalSize = off

  // ── Build final buffer ──
  const out = new ArrayBuffer(totalSize)
  new Uint8Array(out).set(new Uint8Array(headerTpl)) // copy template header
  const dvOut = new DataView(out)

  // Patch project name at offset 28. Topcon VEREIST '!' prefix in project namen
  // (alle echte TP3s starten met '!'). Zonder dit weigert 3D Office te renderen.
  let pname = projectName ?? data.name ?? 'MV3D'
  if (!pname.startsWith('!')) pname = '!' + pname
  writeUtf16LE(dvOut, 28, pname, 48)

  // Patch first-block hint at offset 192-199 (uint16 first_type=2 @+194, uint32 hdrSz=18 @+196)
  dvOut.setUint16(192, 30, true)
  dvOut.setUint16(194, blocks[0].type, true)
  dvOut.setUint32(196, 18, true)

  // Patch index table at offset 200 (10 bytes per entry)
  for (let i = 0; i < blocks.length; i++) {
    const o = 200 + i * 10
    dvOut.setUint32(o,     blocks[i].off, true)
    const nextType = i + 1 < blocks.length ? blocks[i + 1].type : 0
    dvOut.setUint16(o + 4, nextType, true)
    dvOut.setUint32(o + 6, nextType !== 0 ? 18 : 0, true)
  }

  // Write blocks
  const u8 = new Uint8Array(out)
  for (const b of blocks) {
    u8.set(new Uint8Array(b.buf), b.off)
  }

  return out
}

function concatBuffers(...bufs: ArrayBuffer[]): ArrayBuffer {
  const total = bufs.reduce((s, b) => s + b.byteLength, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const b of bufs) {
    out.set(new Uint8Array(b), off)
    off += b.byteLength
  }
  return out.buffer
}

// ─── TP3 generator via TEMPLATE (round-trip optimaal) ───────────────────────
//
// Voor round-trip cases: gebruik de originele TP3 als binary template en
// PATCH ALLEEN de wijzigingen. Geen blokken herbouwen, geen counts wijzigen,
// geen unbekende metadata corrumperen. Werkt alleen wanneer:
//   - data.tp3Source aanwezig (= origineel TP3 bytes)
//   - shape ongewijzigd (zelfde aantal lijn-verts, surface-verts, triangles)
// Anders: throw en val terug op generateTP3 (from-scratch generator).

export function generateTP3FromTemplate(data: MachineFile): ArrayBuffer {
  if (!data.tp3Source) throw new Error('Geen tp3Source aanwezig — gebruik generateTP3 ipv template')
  const out = new Uint8Array(data.tp3Source.byteLength)
  out.set(new Uint8Array(data.tp3Source))
  const dv = new DataView(out.buffer)

  // Vind blokken
  const blocks: { type: number; off: number; count: number; stride: number }[] = []
  for (let i = 16; i < out.length - 18; i += 2) {
    if (dv.getUint16(i + 2, true) !== 18) continue
    if (dv.getUint32(i + 10, true) !== 0xFFFFFFFE) continue
    const t = dv.getUint16(i, true)
    if (t < 1 || t > 30) continue
    const stride = dv.getUint16(i + 8, true)
    if (stride === 0 || stride > 2000) continue
    const count = dv.getUint16(i + 6, true)
    if (i + 18 + count * stride > out.length) continue
    blocks.push({ type: t, off: i, count, stride })
  }

  // Surface ref + line refs uit template (NIET wijzigen)
  let surfaceRefX = 0, surfaceRefY = 0, surfaceVertStart = 0, surfaceVertCount = 0
  for (const b of blocks) {
    if (b.type !== 17) continue
    const r = b.off + 18
    surfaceVertStart = dv.getUint16(r + 4, true)
    surfaceVertCount = dv.getUint16(r + 18, true)
    surfaceRefX = dv.getFloat64(r + 160, true)
    surfaceRefY = dv.getFloat64(r + 168, true)
    break
  }

  // Per-line refs uit type=11
  type LineRef = { name: string; refX: number; refY: number; recOff: number }
  const lineRefs: LineRef[] = []
  for (const b of blocks) {
    if (b.type !== 11) continue
    for (let j = 0; j < b.count; j++) {
      const o = b.off + 18 + j * b.stride
      const refX = dv.getFloat64(o + 138, true)
      if (Math.abs(refX) < 1) continue // skip placeholder/surface
      lineRefs.push({
        name: '',
        refX,
        refY: dv.getFloat64(o + 146, true),
        recOff: o,
      })
    }
    break
  }

  // type=12 ranges (uit template) — preserved as-is
  type Range = { start: number; count: number }
  const ranges: Range[] = []
  for (const b of blocks) {
    if (b.type !== 12) continue
    for (let j = 0; j < b.count; j++) {
      const o = b.off + 18 + j * 32
      const start = dv.getUint16(o + 4, true)
      const cnt = dv.getUint32(o + 12, true)
      if (start >= 4 && cnt > 0 && cnt < 100000) ranges.push({ start, count: cnt })
    }
    break
  }

  // PATCH 1: surface vertices in type=2. Skip bytes-overwrite als geen echte wijziging.
  const surface = data.surfaces[0]
  if (surface && surface.points.length > 0 && surfaceVertCount > 0) {
    const t2Block = blocks.find(b => b.type === 2 && b.stride === 24)
    if (t2Block) {
      const t2 = t2Block.off + 18
      const t2MaxIdx = t2Block.count - 1
      const n = Math.min(surface.points.length, surfaceVertCount)
      for (let i = 0; i < n; i++) {
        const idx = surfaceVertStart + i
        if (idx > t2MaxIdx) break
        const p = surface.points[i]
        const o = t2 + idx * 24
        const oldDx = dv.getFloat64(o, true)
        const oldDy = dv.getFloat64(o + 8, true)
        const oldZ  = dv.getFloat64(o + 16, true)
        const reconstructed = { x: surfaceRefX + oldDx, y: surfaceRefY + oldDy, z: oldZ }
        if (reconstructed.x === p.x && reconstructed.y === p.y && reconstructed.z === p.z) continue
        dv.setFloat64(o,      p.x - surfaceRefX, true)
        dv.setFloat64(o + 8,  p.y - surfaceRefY, true)
        dv.setFloat64(o + 16, p.z, true)
      }
    }
  }

  // PATCH 2: line vertices in type=2. Gebruik per-polyline metadata
  // (_tp3RangeStart, _tp3RefX/Y) die parser opslaat zodat patch EXACT match maakt
  // met origineel — geen volgorde/grouping problemen meer.
  if (data.lines.length > 0) {
    const t2Block = blocks.find(b => b.type === 2 && b.stride === 24)
    if (t2Block) {
      const t2 = t2Block.off + 18
      const t2MaxIdx = t2Block.count - 1
      // Sorteer polylines op _tp3RangeStart om in juiste volgorde te patchen
      const linesWithMeta = data.lines.filter(pl => pl.points.length >= 2 && pl._tp3RangeStart !== undefined)
      // Eerst: gebruik metadata-pad voor polylines met round-trip info.
      // Alleen overschrijven als waarde ECHT verschilt van origineel (voorkomt
      // float64 precision noise van round-trip arithmetic).
      for (const pl of linesWithMeta) {
        const refX = pl._tp3RefX ?? 0
        const refY = pl._tp3RefY ?? 0
        const start = pl._tp3RangeStart!
        for (let j = 0; j < pl.points.length; j++) {
          const idx = start + j
          if (idx > t2MaxIdx) break
          const p = pl.points[j]
          const o = t2 + idx * 24
          const oldDx = dv.getFloat64(o, true)
          const oldDy = dv.getFloat64(o + 8, true)
          const oldZ  = dv.getFloat64(o + 16, true)
          // Wat parser uit originele bytes zou hebben gehaald
          const reconstructed = { x: refX + oldDx, y: refY + oldDy, z: oldZ }
          if (reconstructed.x === p.x && reconstructed.y === p.y && reconstructed.z === p.z) continue
          dv.setFloat64(o,      p.x - refX, true)
          dv.setFloat64(o + 8,  p.y - refY, true)
          dv.setFloat64(o + 16, p.z, true)
        }
      }
      // Fallback voor polylines zonder metadata (DXF→TP3 zonder TP3 source):
      // gebruik oude logica met layer grouping en lineRefs in volgorde
      const linesWithoutMeta = data.lines.filter(pl => pl.points.length >= 2 && pl._tp3RangeStart === undefined)
      if (linesWithoutMeta.length > 0 && lineRefs.length > 0) {
        const lineRanges = ranges
        const usedRanges = new Set<number>()
        for (const pl of linesWithMeta) {
          for (let i = 0; i < lineRanges.length; i++) {
            if (lineRanges[i].start === pl._tp3RangeStart) usedRanges.add(i)
          }
        }
        const byName = new Map<string, Polyline[]>()
        for (const pl of linesWithoutMeta) {
          const arr = byName.get(pl.name) ?? []
          arr.push(pl)
          byName.set(pl.name, arr)
        }
        let layerIdx = 0
        let rangeIdx = 0
        for (const layer of byName.values()) {
          const ref = lineRefs[layerIdx] ?? lineRefs[lineRefs.length - 1]
          for (const pl of layer) {
            while (rangeIdx < lineRanges.length && usedRanges.has(rangeIdx)) rangeIdx++
            if (rangeIdx >= lineRanges.length) break
            const r = lineRanges[rangeIdx]
            for (let j = 0; j < Math.min(r.count, pl.points.length); j++) {
              const idx = r.start + j
              if (idx > t2MaxIdx) break
              const p = pl.points[j]
              const o = t2 + idx * 24
              dv.setFloat64(o,      p.x - ref.refX, true)
              dv.setFloat64(o + 8,  p.y - ref.refY, true)
              dv.setFloat64(o + 16, p.z, true)
            }
            rangeIdx++
          }
          layerIdx++
        }
      }
    }
  }

  // PATCH 3: project name in header. Topcon vereist '!' prefix.
  let pname = data.name || 'MV3D'
  if (!pname.startsWith('!')) pname = '!' + pname
  for (let i = 28; i < 76; i++) out[i] = 0
  for (let i = 0; i < Math.min(pname.length, 23); i++) {
    dv.setUint16(28 + i * 2, pname.charCodeAt(i), true)
  }

  return out.buffer
}

// ─── SVL parser ───────────────────────────────────────────────────────────────

export function parseSVL(buf: ArrayBuffer): MachineFile {
  const bytes = new Uint8Array(buf)
  const view = new DataView(buf)
  const lines: Polyline[] = []

  // Find TRMLINES markers
  const marker = [0x54, 0x52, 0x4d, 0x4c, 0x49, 0x4e, 0x45, 0x53] // "TRMLINES"
  let lineIdx = 0

  for (let i = 0; i < bytes.length - 100; i++) {
    if (!matchBytes(bytes, i, marker)) continue

    // After marker: 1 byte type + variable header
    // Based on analysis: points start around offset +17 or +20 within chunk
    // Points are stored as int32 mm XY pairs (Belgian Lambert)
    const chunkStart = i + 8

    // Try to read a count field at different offsets
    for (let hdrOff = 14; hdrOff <= 20; hdrOff += 2) {
      const count = view.getInt16(chunkStart + hdrOff, true)
      if (count > 0 && count < 5000) {
        const dataOff = chunkStart + hdrOff + 2
        const pts: Point3D[] = []

        for (let j = 0; j < count && dataOff + j * 8 + 8 <= bytes.length; j++) {
          const xMm = view.getInt32(dataOff + j * 8, true)
          const yMm = view.getInt32(dataOff + j * 8 + 4, true)
          if (xMm > 1000000 && xMm < 500000000 && yMm > 1000000 && yMm < 500000000) {
            pts.push({ x: xMm / 1000, y: yMm / 1000, z: 0 })
          }
        }

        if (pts.length >= 2) {
          lines.push({ name: `Lijn ${++lineIdx}`, points: pts })
          break
        }
      }
    }
  }

  return { name: 'SVL', surfaces: [], lines }
}

// ─── SVD parser ───────────────────────────────────────────────────────────────

export function parseSVD(buf: ArrayBuffer): MachineFile {
  const bytes = new Uint8Array(buf)
  const view = new DataView(buf)
  const surfaces: Surface[] = []

  // Find TRMSRFCE markers
  const marker = [0x54, 0x52, 0x4d, 0x53, 0x52, 0x46, 0x43, 0x45] // "TRMSRFCE"
  let surfIdx = 0

  for (let i = 0; i < bytes.length - 200; i++) {
    if (!matchBytes(bytes, i, marker)) continue

    const chunkStart = i + 8
    const pts: Point3D[] = []

    // Scan this chunk for valid coordinate triplets (int32 pairs for XY)
    // Each surface chunk contains a header then XYZ data
    // Based on analysis, scan for int32 XY pairs in Belgian Lambert mm range
    const chunkEnd = Math.min(i + 65536, bytes.length - 12)
    for (let j = chunkStart + 40; j < chunkEnd - 12; j += 4) {
      const x = view.getInt32(j, true)
      const y = view.getInt32(j + 4, true)
      const z = view.getInt32(j + 8, true)
      if (
        x > 10000000 && x < 500000000 &&
        y > 10000000 && y < 500000000 &&
        z > -100000 && z < 5000000
      ) {
        pts.push({ x: x / 1000, y: y / 1000, z: z / 1000 })
        j += 8 // skip next 2 ints
      }
    }

    if (pts.length >= 3) {
      surfaces.push({ name: `Oppervlak ${++surfIdx}`, points: pts, triangles: [] })
    }
  }

  return { name: 'SVD', surfaces, lines: [] }
}

// ─── SVL/SVD generator ────────────────────────────────────────────────────────

export function generateSVL(data: MachineFile): ArrayBuffer {
  const allLines = [
    ...data.lines,
    ...data.surfaces.flatMap(s => s.triangles.map((t, i): Polyline => ({
      name: `${s.name}_t${i}`,
      points: t.map(idx => s.points[idx]),
      closed: true,
    }))),
  ]

  const chunks: ArrayBuffer[] = []
  const enc = new TextEncoder()

  // Producer header in UTF-16LE
  const producer = 'Producer: MV3D.cloud converter'
  const producerBuf = encodeUtf16LE(producer)
  const producerArr = new Uint8Array(producerBuf)

  // Count byte for header length (1 byte) + length (2 bytes LE) + utf16 string
  const headerBuf = new ArrayBuffer(2 + producerArr.byteLength)
  const headerView = new DataView(headerBuf)
  headerView.setUint16(0, producerArr.byteLength + 2, true)
  const headerArr = new Uint8Array(headerBuf)
  for (let i = 0; i < producerArr.byteLength; i++) headerArr[i + 2] = producerArr[i]
  chunks.push(headerBuf)

  // TRMINDEX (minimal)
  chunks.push(makeTRMChunk('TRMINDEX', allLines.length, []))

  for (const line of allLines) {
    if (line.points.length < 2) continue
    const pts = line.points.map(p => ({ x: Math.round(p.x * 1000), y: Math.round(p.y * 1000), z: Math.round(p.z * 1000) }))
    chunks.push(makeTRMLINES(pts))
  }

  return concatArrayBuffers(chunks)
}

export function generateSVD(data: MachineFile): ArrayBuffer {
  const chunks: ArrayBuffer[] = []

  // Minimal producer header
  const producer = 'Producer: MV3D.cloud converter'
  const producerBuf = encodeUtf16LE(producer)
  const headerBuf = new ArrayBuffer(2 + producerBuf.byteLength)
  const headerView = new DataView(headerBuf)
  headerView.setUint16(0, producerBuf.byteLength + 2, true)
  const headerArr = new Uint8Array(headerBuf)
  new Uint8Array(producerBuf).forEach((b, i) => { headerArr[i + 2] = b })
  chunks.push(headerBuf)

  chunks.push(makeTRMChunk('TRMINDEX', data.surfaces.length, []))

  for (const surf of data.surfaces) {
    const pts = surf.points.map(p => ({ x: Math.round(p.x * 1000), y: Math.round(p.y * 1000), z: Math.round(p.z * 1000) }))
    chunks.push(makeTRMSRFCE(surf.name, pts, surf.triangles))
  }

  return concatArrayBuffers(chunks)
}

function makeTRMChunk(type: string, count: number, data: Uint8Array[]): ArrayBuffer {
  const marker = new TextEncoder().encode(type.padEnd(8, '\0').slice(0, 8))
  const header = new ArrayBuffer(12)
  const hv = new DataView(header)
  hv.setUint8(0, 1)  // version
  hv.setInt32(4, count, true)
  return concatArrayBuffers([marker.buffer, header])
}

function makeTRMLINES(pts: { x: number; y: number; z: number }[]): ArrayBuffer {
  const markerBuf = new TextEncoder().encode('TRMLINES').buffer
  const count = pts.length
  const dataBuf = new ArrayBuffer(4 + count * 12)
  const dv = new DataView(dataBuf)
  dv.setInt32(0, count, true)
  for (let i = 0; i < count; i++) {
    dv.setInt32(4 + i * 12, pts[i].x, true)
    dv.setInt32(8 + i * 12, pts[i].y, true)
    dv.setInt32(12 + i * 12, pts[i].z, true)
  }
  return concatArrayBuffers([markerBuf, dataBuf])
}

function makeTRMSRFCE(name: string, pts: { x: number; y: number; z: number }[], triangles: Triangle[]): ArrayBuffer {
  const markerBuf = new TextEncoder().encode('TRMSRFCE').buffer
  const count = pts.length
  const triCount = triangles.length
  const dataBuf = new ArrayBuffer(8 + count * 12 + triCount * 12)
  const dv = new DataView(dataBuf)
  dv.setInt32(0, count, true)
  dv.setInt32(4, triCount, true)
  for (let i = 0; i < count; i++) {
    dv.setInt32(8 + i * 12, pts[i].x, true)
    dv.setInt32(12 + i * 12, pts[i].y, true)
    dv.setInt32(16 + i * 12, pts[i].z, true)
  }
  const triOff = 8 + count * 12
  for (let i = 0; i < triCount; i++) {
    dv.setInt32(triOff + i * 12, triangles[i][0], true)
    dv.setInt32(triOff + i * 12 + 4, triangles[i][1], true)
    dv.setInt32(triOff + i * 12 + 8, triangles[i][2], true)
  }
  return concatArrayBuffers([markerBuf, dataBuf])
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function matchBytes(buf: Uint8Array, offset: number, pattern: number[]): boolean {
  if (offset + pattern.length > buf.length) return false
  for (let i = 0; i < pattern.length; i++) {
    if (buf[offset + i] !== pattern[i]) return false
  }
  return true
}

function concatArrayBuffers(bufs: ArrayBuffer[]): ArrayBuffer {
  const total = bufs.reduce((s, b) => s + b.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const buf of bufs) {
    out.set(new Uint8Array(buf), offset)
    offset += buf.byteLength
  }
  return out.buffer
}

// ─── Main convert function ─────────────────────────────────────────────────────

export function convert(
  input: ArrayBuffer | string,
  inputFormat: FileFormat,
  outputFormat: FileFormat,
  filename: string,
): { data: ArrayBuffer | string; mimeType: string; extension: string } {
  // Parse
  let parsed: MachineFile
  if (inputFormat === 'landxml') {
    parsed = parseLandXML(typeof input === 'string' ? input : new TextDecoder().decode(input as ArrayBuffer))
  } else if (inputFormat === 'dxf') {
    parsed = parseDXF(typeof input === 'string' ? input : new TextDecoder().decode(input as ArrayBuffer))
  } else if (inputFormat === 'tn3') {
    parsed = parseTN3(typeof input === 'string' ? new TextEncoder().encode(input).buffer : input as ArrayBuffer)
  } else if (inputFormat === 'svl') {
    parsed = parseSVL(typeof input === 'string' ? new TextEncoder().encode(input).buffer : input as ArrayBuffer)
  } else if (inputFormat === 'svd') {
    parsed = parseSVD(typeof input === 'string' ? new TextEncoder().encode(input).buffer : input as ArrayBuffer)
  } else if (inputFormat === 'ln3') {
    parsed = parseLN3(typeof input === 'string' ? new TextEncoder().encode(input).buffer : input as ArrayBuffer)
  } else if (inputFormat === 'tp3') {
    parsed = parseTP3(typeof input === 'string' ? new TextEncoder().encode(input).buffer : input as ArrayBuffer)
  } else {
    throw new Error(`Onbekend invoerformaat: ${inputFormat}`)
  }

  parsed.name = filename.replace(/\.[^.]+$/, '')

  // Generate
  if (outputFormat === 'landxml') {
    return { data: generateLandXML(parsed), mimeType: 'application/xml', extension: 'xml' }
  } else if (outputFormat === 'dxf') {
    return { data: generateDXF(parsed), mimeType: 'application/dxf', extension: 'dxf' }
  } else if (outputFormat === 'tn3') {
    return { data: generateTN3(parsed), mimeType: 'application/octet-stream', extension: 'TN3' }
  } else if (outputFormat === 'svl') {
    return { data: generateSVL(parsed), mimeType: 'application/octet-stream', extension: 'svl' }
  } else if (outputFormat === 'svd') {
    return { data: generateSVD(parsed), mimeType: 'application/octet-stream', extension: 'svd' }
  } else {
    throw new Error(`Onbekend uitvoerformaat: ${outputFormat}`)
  }
}

// ─── DXF AC1024 export via Pythagoras-skeleton template ──────────────────────
//
// Laadt een echt door Pythagoras geëxporteerd DXF bestand (zonder eigen layers
// en zonder eigen entiteiten) als template, en injecteert onze layers + onze
// 3D-polylines op de #USER_LAYERS# / #USER_ENTITIES# markers. De rest van de
// structuur (HEADER, CLASSES, alle TABLES, BLOCKS, OBJECTS, LAYOUTs) blijft
// onaangeroerd zodat Pythagoras het bestand altijd accepteert.

let dxfSkeletonCache: string | null = null

async function loadDxfSkeleton(): Promise<string> {
  if (dxfSkeletonCache) return dxfSkeletonCache
  const res = await fetch('/converter/dxf-skeleton.txt')
  if (!res.ok) throw new Error('DXF skeleton kon niet geladen worden')
  dxfSkeletonCache = await res.text()
  return dxfSkeletonCache
}

export async function generateDXF2010LinesPythagoras(
  data: MachineFile,
  defaultLayerName = 'LIJNEN',
): Promise<string> {
  const skel = await loadDxfSkeleton()

  // Verzamel polylines + surface edges
  type LinePL = { layer: string; pts: Point3D[]; closed: boolean }
  const polylines: LinePL[] = []
  const layers = new Map<string, number>()
  const palette = [1, 2, 3, 4, 5, 6, 30, 40, 50, 60, 70, 110, 130, 170, 200, 230]
  let colorIdx = 0
  const addLayer = (name: string) => {
    if (!layers.has(name)) layers.set(name, palette[colorIdx++ % palette.length])
  }

  // Layer = naam + (rang van pl.code) wanneer dezelfde naam meerdere codes heeft.
  // Zo blijft kleurgroepering per Pythagoras feature-code behouden.
  const codesByName = new Map<string, Set<number>>()
  for (const pl of data.lines) {
    if (pl.points.length < 2) continue
    if (pl.code === undefined) continue
    if (!codesByName.has(pl.name)) codesByName.set(pl.name, new Set())
    codesByName.get(pl.name)!.add(pl.code)
  }
  const rankByNameCode = new Map<string, number>()
  for (const [name, codes] of codesByName) {
    const sorted = [...codes].sort((a, b) => a - b)
    sorted.forEach((c, i) => rankByNameCode.set(`${name}|${c}`, i + 1))
  }
  for (let pi = 0; pi < data.lines.length; pi++) {
    const pl = data.lines[pi]
    if (pl.points.length < 2) continue
    const baseName = sanitizeLayerName(pl.name, `Lijn ${pi + 1}`)
    const codes = codesByName.get(pl.name)
    let layer: string
    if (pl.code !== undefined && codes && codes.size > 1) {
      layer = `${baseName} ${rankByNameCode.get(`${pl.name}|${pl.code}`)}`
    } else {
      layer = baseName
    }
    addLayer(layer)
    polylines.push({ layer, pts: pl.points, closed: !!pl.closed })
  }
  for (const surf of data.surfaces) {
    const pts = surf.points
    const tris = surf.triangles.length > 0 ? surf.triangles : triangulate(pts)
    const layer = sanitizeLayerName(surf.name, defaultLayerName)
    addLayer(layer)
    const edgeSet = new Set<string>()
    for (const [a, b, c] of tris) {
      edgeSet.add(`${Math.min(a,b)}-${Math.max(a,b)}`)
      edgeSet.add(`${Math.min(b,c)}-${Math.max(b,c)}`)
      edgeSet.add(`${Math.min(a,c)}-${Math.max(a,c)}`)
    }
    for (const edge of edgeSet) {
      const [i, j] = edge.split('-').map(Number)
      const p1 = pts[i], p2 = pts[j]
      if (!p1 || !p2) continue
      polylines.push({ layer, pts: [p1, p2], closed: false })
    }
  }

  // Bounding box voor $EXTMIN/$EXTMAX update
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (const pl of polylines) for (const p of pl.pts) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y
    if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z
  }
  if (!isFinite(minX)) { minX = minY = minZ = 0; maxX = maxY = maxZ = 0 }

  // Handle allocator — gebruik hex starting bij 0x10000 om buiten Pythagoras' range te blijven
  let nextH = 0x10000
  const nh = () => (nextH++).toString(16).toUpperCase()

  // ── Layer entries (volgen na layer "0" in LAYER table) ──
  // Match Pythagoras-export structuur exact: 347 = 46 = material reference
  const layerLines: string[] = []
  const layerHandles = new Map<string, string>()
  for (const [name, color] of layers) {
    const h = nh()
    layerHandles.set(name, h)
    layerLines.push(
      '  0', 'LAYER',
      '  5', h,
      '330', '2',
      '100', 'AcDbSymbolTableRecord',
      '100', 'AcDbLayerTableRecord',
      '  2', name,
      ' 70', '     0',
      ' 62', `     ${color}`,
      '  6', 'Continuous',
      '370', '     9',
      '390', 'F',
      '347', '46',
    )
  }

  // ── Entity entries — LINE per segment (Pythagoras-conventie voor breaklines) ──
  // Conservatieve IQR-filter: alleen segmenten verwijderen die statistisch
  // extreme outliers zijn (> Q3 + 3×IQR EN > 2m absoluut). Dit vangt de
  // spookstreep uit TP3 zonder legitieme lange lijn-segmenten te raken.
  const entityLines: string[] = []
  const fmt = (n: number) => Number.isInteger(n) ? `${n}.0` : n.toString()
  const emitLine = (layer: string, p1: Point3D, p2: Point3D) => {
    entityLines.push(
      '  0', 'LINE',
      '  5', nh(),
      '330', '1F',
      '100', 'AcDbEntity',
      '  8', layer,
      '100', 'AcDbLine',
      ' 10', fmt(p1.x), ' 20', fmt(p1.y), ' 30', fmt(p1.z),
      ' 11', fmt(p2.x), ' 21', fmt(p2.y), ' 31', fmt(p2.z),
    )
  }
  for (const pl of polylines) {
    const dists: number[] = []
    for (let i = 0; i < pl.pts.length - 1; i++) {
      const a = pl.pts[i], b = pl.pts[i + 1]
      dists.push(Math.hypot(a.x - b.x, a.y - b.y))
    }
    // IQR-drempel — alleen gebruiken bij voldoende segmenten (>= 6)
    let maxAllowed = Infinity
    if (dists.length >= 6) {
      const sorted = [...dists].sort((a, b) => a - b)
      const q1 = sorted[Math.floor(sorted.length * 0.25)]
      const q3 = sorted[Math.floor(sorted.length * 0.75)]
      const iqr = q3 - q1
      maxAllowed = Math.max(q3 + 3 * iqr, 2.0) // Minstens 2m, anders IQR-drempel
    }

    for (let i = 0; i < pl.pts.length - 1; i++) {
      if (dists[i] > maxAllowed) continue // spookstreep-segment
      emitLine(pl.layer, pl.pts[i], pl.pts[i + 1])
    }

    // Sluit polyline indien closed en afstand redelijk
    if (pl.closed && pl.pts.length > 2) {
      const p1 = pl.pts[pl.pts.length - 1]
      const p2 = pl.pts[0]
      const closingDist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
      if (closingDist <= maxAllowed) emitLine(pl.layer, p1, p2)
    }
  }

  // ── Inject in template ──
  let dxf = skel
    .replace('##USER_LAYERS##', layerLines.join('\n'))
    .replace('##USER_ENTITIES##', entityLines.join('\n'))

  // Update LAYER table count: was "     6" (1 layer "0" + 5 user layers)
  // → wordt "     {1 + layers.size}"
  dxf = dxf.replace(
    /(TABLE\n  2\nLAYER\n  5\n2\n330\n0\n100\nAcDbSymbolTable\n 70\n)\s*\d+/,
    `$1${String(1 + layers.size).padStart(6)}`
  )

  // Update $HANDSEED — moet > grootste gebruikte handle zijn, anders zien
  // sommige parsers (Pythagoras) onze entiteiten als "ongeldig toegekend"
  const handSeed = nextH.toString(16).toUpperCase()
  dxf = dxf.replace(/(\$HANDSEED\n  5\n)[0-9A-Fa-f]+/, `$1${handSeed}`)

  // Update $EXTMIN / $EXTMAX / $LIMMIN / $LIMMAX in HEADER
  const f = (n: number) => n.toFixed(15).replace(/\.?0+$/, '') || '0.0'
  dxf = dxf
    .replace(/(\$EXTMIN\n 10\n)[^\n]+\n( 20\n)[^\n]+\n( 30\n)[^\n]+/, `$1${f(minX)}\n$2${f(minY)}\n$3${f(minZ)}`)
    .replace(/(\$EXTMAX\n 10\n)[^\n]+\n( 20\n)[^\n]+\n( 30\n)[^\n]+/, `$1${f(maxX)}\n$2${f(maxY)}\n$3${f(maxZ)}`)
    .replace(/(\$LIMMIN\n 10\n)[^\n]+\n( 20\n)[^\n]+/, `$1${f(minX)}\n$2${f(minY)}`)
    .replace(/(\$LIMMAX\n 10\n)[^\n]+\n( 20\n)[^\n]+/, `$1${f(maxX)}\n$2${f(maxY)}`)

  // Output met CRLF (DXF Windows conventie)
  return dxf.replace(/\r?\n/g, '\r\n')
}
