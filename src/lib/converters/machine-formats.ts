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
}

export interface MachineFile {
  name: string
  surfaces: Surface[]
  lines: Polyline[]
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
          points.push({ x: vals[0], y: vals[1], z: vals[2] })
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
      .map((p, i) => `          <P id="${i + 1}">${p.x.toFixed(12)} ${p.y.toFixed(12)} ${p.z.toFixed(12)}</P>`)
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

function sanitizeLayerName(name: string, fallback: string): string {
  // DXF R12 layer names: max 31 chars, no <>/\\":;?*|=' or control chars
  const cleaned = name.replace(/[<>/\\":;?*|='\x00-\x1f]/g, '_').trim()
  return (cleaned.slice(0, 31) || fallback).toUpperCase()
}

export function generateDXF2010Lines(data: MachineFile, defaultLayerName = 'LIJNEN'): string {
  const out: string[] = []
  const sec = (name: string) => { out.push('  0', 'SECTION', '  2', name) }
  const end = () => { out.push('  0', 'ENDSEC') }

  // Collect all line segments (per polyline + triangle edges from any surface)
  type Seg = { layer: string; p1: Point3D; p2: Point3D }
  const segments: Seg[] = []
  const layers = new Map<string, number>() // name → ACI color
  const layerColors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 30, 40, 50, 60, 70, 110, 130, 170, 200, 230]
  let colorIdx = 0
  const addLayer = (name: string) => {
    if (!layers.has(name)) layers.set(name, layerColors[colorIdx++ % layerColors.length])
  }

  for (let pi = 0; pi < data.lines.length; pi++) {
    const pl = data.lines[pi]
    if (pl.points.length < 2) continue
    const layer = sanitizeLayerName(pl.name, `LIJN_${pi + 1}`)
    addLayer(layer)
    for (let i = 0; i < pl.points.length - 1; i++) {
      segments.push({ layer, p1: pl.points[i], p2: pl.points[i + 1] })
    }
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
      segments.push({ layer, p1, p2 })
    }
  }

  // Compute bounding box for $EXTMIN/$EXTMAX
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (const s of segments) {
    for (const p of [s.p1, s.p2]) {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y
      if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z
    }
  }
  if (!isFinite(minX)) { minX = minY = minZ = 0; maxX = maxY = maxZ = 0 }

  // ── HEADER ──
  sec('HEADER')
  out.push('  9', '$ACADVER',  '  1', 'AC1009') // R12 — meest compatibel
  out.push('  9', '$INSBASE',  ' 10', '0.0', ' 20', '0.0', ' 30', '0.0')
  out.push('  9', '$EXTMIN',   ' 10', minX.toFixed(6), ' 20', minY.toFixed(6), ' 30', minZ.toFixed(6))
  out.push('  9', '$EXTMAX',   ' 10', maxX.toFixed(6), ' 20', maxY.toFixed(6), ' 30', maxZ.toFixed(6))
  out.push('  9', '$LIMMIN',   ' 10', minX.toFixed(6), ' 20', minY.toFixed(6))
  out.push('  9', '$LIMMAX',   ' 10', maxX.toFixed(6), ' 20', maxY.toFixed(6))
  out.push('  9', '$INSUNITS', ' 70', '6') // 6 = meters
  out.push('  9', '$LUNITS',   ' 70', '2') // decimal
  out.push('  9', '$LUPREC',   ' 70', '6')
  end()

  // ── TABLES (LTYPE + LAYER) ──
  sec('TABLES')

  // LTYPE table — CONTINUOUS is verplicht voor de LAYERs die ernaar verwijzen
  out.push('  0', 'TABLE', '  2', 'LTYPE', ' 70', '1')
  out.push('  0', 'LTYPE', '  2', 'CONTINUOUS', ' 70', '0', '  3', 'Solid line', ' 72', '65', ' 73', '0', ' 40', '0.0')
  out.push('  0', 'ENDTAB')

  // LAYER table — één entry per lijn
  out.push('  0', 'TABLE', '  2', 'LAYER', ' 70', String(layers.size + 1))
  out.push('  0', 'LAYER', '  2', '0', ' 70', '0', ' 62', '7', '  6', 'CONTINUOUS')
  for (const [name, color] of layers) {
    out.push('  0', 'LAYER', '  2', name, ' 70', '0', ' 62', String(color), '  6', 'CONTINUOUS')
  }
  out.push('  0', 'ENDTAB')

  end()

  // ── ENTITIES ──
  sec('ENTITIES')
  for (const s of segments) {
    out.push('  0', 'LINE', '  8', s.layer, ' 62', '256') // color BYLAYER
    out.push(' 10', s.p1.x.toFixed(6), ' 20', s.p1.y.toFixed(6), ' 30', s.p1.z.toFixed(6))
    out.push(' 11', s.p2.x.toFixed(6), ' 21', s.p2.y.toFixed(6), ' 31', s.p2.z.toFixed(6))
  }
  end()

  out.push('  0', 'EOF')
  return out.join('\n')
}

// ─── DXF parser ───────────────────────────────────────────────────────────────

export function parseDXF(text: string): MachineFile {
  const surfaces: Surface[] = []
  const lines: Polyline[] = []

  // Parse 3DFACE entities grouped by layer
  const facesByLayer: Record<string, { points: Point3D[]; triangles: Triangle[] }> = {}
  const entSection = text.match(/ENTITIES[\s\S]*?(?=ENDSEC)/)
  if (!entSection) return { name: 'DXF', surfaces, lines }

  const entities = entSection[0].split(/(?=\s+0\s*\n\s*3DFACE|\s+0\s*\n\s*POINT|\s+0\s*\n\s*POLYLINE|\s+0\s*\n\s*LINE)/)
  for (const ent of entities) {
    const layerM = ent.match(/\s+8\s*\n\s*(.+)/)
    const layer = layerM ? layerM[1].trim() : '0'

    if (ent.includes('3DFACE')) {
      if (!facesByLayer[layer]) facesByLayer[layer] = { points: [], triangles: [] }
      const grp = facesByLayer[layer]
      const coords: number[] = []
      const codes: Record<number, number> = {}
      for (const [c, v] of [...ent.matchAll(/\s+(\d+)\s*\n\s*([\d\-.e+]+)/g)].map(m => [+m[1], +m[2]] as [number, number])) {
        codes[c] = v
      }
      const pts3d: Point3D[] = [
        { x: codes[10] ?? 0, y: codes[20] ?? 0, z: codes[30] ?? 0 },
        { x: codes[11] ?? 0, y: codes[21] ?? 0, z: codes[31] ?? 0 },
        { x: codes[12] ?? 0, y: codes[22] ?? 0, z: codes[32] ?? 0 },
      ]
      const base = grp.points.length
      grp.points.push(...pts3d)
      grp.triangles.push([base, base + 1, base + 2])
    }
  }

  for (const [name, data] of Object.entries(facesByLayer)) {
    surfaces.push({ name, points: data.points, triangles: data.triangles })
  }

  return { name: 'DXF', surfaces, lines }
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
  type Range = { start: number; count: number }
  const allRanges: Range[] = []
  for (const blk of blocks) {
    if (blk.type !== 12 || blk.stride !== 32) continue
    for (let j = 0; j < blk.count; j++) {
      const o = blk.dataOff + j * 32
      allRanges.push({
        start: view.getUint16(o + 4,  true),
        count: view.getUint32(o + 12, true),
      })
    }
  }

  // Build line polylines (skip normalization range with start=0)
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
    if (i < lineObjects.length) {
      lines.push({ name: lineObj.name, points: pts })
    } else if (lines.length > 0) {
      lines[lines.length - 1].points.push(...pts)
    }
  }

  // type=17: surface metadata
  let surfaceName = 'Oppervlak'
  let surfaceRefX = 0
  let surfaceRefY = 0
  for (const blk of blocks) {
    if (blk.type !== 17 || blk.stride < 200 || blk.count < 1) continue
    const recOff = blk.dataOff
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

  // Surface vertices = raw verts not used by any line range, minus first 4 (normalization)
  const usedIdx = new Set<number>()
  for (let i = 0; i < 4; i++) usedIdx.add(i)
  for (const r of allRanges) {
    if (r.start < 4 || r.count > 100000) continue
    for (let j = 0; j < r.count; j++) usedIdx.add(r.start + j)
  }
  const surfaceVerts: Point3D[] = []
  for (let i = 0; i < rawVerts.length; i++) {
    if (usedIdx.has(i)) continue
    const v = rawVerts[i]
    surfaceVerts.push({ x: surfaceRefX + v.x, y: surfaceRefY + v.y, z: v.z })
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
  }
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
