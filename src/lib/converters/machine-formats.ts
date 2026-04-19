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

export type FileFormat = 'landxml' | 'dxf' | 'tn3' | 'svl' | 'svd'

// ─── Format detection ─────────────────────────────────────────────────────────

export function detectFormat(filename: string, firstBytes: Uint8Array): FileFormat {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'xml') return 'landxml'
  if (ext === 'dxf') return 'dxf'
  if (ext === 'tn3') return 'tn3'
  if (ext === 'svl') return 'svl'
  if (ext === 'svd') return 'svd'
  // Content-based detection
  const txt = new TextDecoder('ascii', { fatal: false }).decode(firstBytes.slice(0, 20))
  if (txt.includes('<?xml') || txt.includes('<LandXML')) return 'landxml'
  if (txt.startsWith('Topcon TN3')) return 'tn3'
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

// ─── DXF generator ────────────────────────────────────────────────────────────

export function generateDXF(data: MachineFile): string {
  const lines: string[] = []

  const sec = (name: string) => { lines.push('  0', 'SECTION', '  2', name) }
  const end = () => { lines.push('  0', 'ENDSEC') }
  const eof = () => { lines.push('  0', 'EOF') }

  // HEADER
  sec('HEADER')
  lines.push('  9', '$ACADVER', '  1', 'AC1015')
  lines.push('  9', '$INSUNITS', ' 70', '6')
  end()

  // TABLES
  sec('TABLES')
  lines.push('  0', 'TABLE', '  2', 'LAYER', ' 70', String(data.surfaces.length + data.lines.length + 1))
  lines.push('  0', 'LAYER', '  2', '0', ' 70', '0', ' 62', '7', '  6', 'CONTINUOUS')
  for (const surf of data.surfaces) {
    lines.push('  0', 'LAYER', '  2', surf.name, ' 70', '0', ' 62', '3', '  6', 'CONTINUOUS')
  }
  for (const line of data.lines) {
    lines.push('  0', 'LAYER', '  2', line.name, ' 70', '0', ' 62', '5', '  6', 'CONTINUOUS')
  }
  lines.push('  0', 'ENDTAB')
  end()

  // ENTITIES
  sec('ENTITIES')

  for (const surf of data.surfaces) {
    const pts = surf.points
    for (const [a, b, c] of surf.triangles) {
      if (!pts[a] || !pts[b] || !pts[c]) continue
      lines.push('  0', '3DFACE')
      lines.push('  8', surf.name)
      lines.push(' 10', pts[a].x.toFixed(6), ' 20', pts[a].y.toFixed(6), ' 30', pts[a].z.toFixed(6))
      lines.push(' 11', pts[b].x.toFixed(6), ' 21', pts[b].y.toFixed(6), ' 31', pts[b].z.toFixed(6))
      lines.push(' 12', pts[c].x.toFixed(6), ' 22', pts[c].y.toFixed(6), ' 32', pts[c].z.toFixed(6))
      lines.push(' 13', pts[c].x.toFixed(6), ' 23', pts[c].y.toFixed(6), ' 33', pts[c].z.toFixed(6))
    }
    // If no triangles, write points as POINTs
    if (surf.triangles.length === 0) {
      for (const pt of pts) {
        lines.push('  0', 'POINT')
        lines.push('  8', surf.name)
        lines.push(' 10', pt.x.toFixed(6), ' 20', pt.y.toFixed(6), ' 30', pt.z.toFixed(6))
      }
    }
  }

  for (const pl of data.lines) {
    if (pl.points.length < 2) continue
    lines.push('  0', 'POLYLINE')
    lines.push('  8', pl.name)
    lines.push(' 66', '1')
    lines.push(' 70', pl.closed ? '1' : '8')
    lines.push(' 10', '0.0', ' 20', '0.0', ' 30', '0.0')
    for (const pt of pl.points) {
      lines.push('  0', 'VERTEX')
      lines.push('  8', pl.name)
      lines.push(' 10', pt.x.toFixed(6), ' 20', pt.y.toFixed(6), ' 30', pt.z.toFixed(6))
      lines.push(' 70', '32')
    }
    lines.push('  0', 'SEQEND')
  }

  end()
  eof()
  return lines.join('\n')
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

export function parseTN3(buf: ArrayBuffer): MachineFile {
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)

  // Verify magic
  const magic = new TextDecoder().decode(bytes.slice(0, 10))
  if (!magic.startsWith('Topcon TN3')) {
    throw new Error('Geen geldig TN3-bestand')
  }

  // Read name from UTF-16LE (starts after magic+null at offset 11)
  let nameEnd = 28 // after version bytes
  for (let i = 28; i < Math.min(200, buf.byteLength - 2); i += 2) {
    if (view.getUint16(i, true) === 0) { nameEnd = i; break }
  }
  const nameBytes = bytes.slice(28, nameEnd)
  const name = new TextDecoder('utf-16le').decode(nameBytes)

  // Scan for XYZ coordinate triplets (doubles, stride 24)
  // Detect coordinate range from first valid triplet
  const points: Point3D[] = []
  let firstX: number | null = null

  for (let i = 0; i < buf.byteLength - 24; i += 8) {
    const x = view.getFloat64(i, true)
    const y = view.getFloat64(i + 8, true)
    const z = view.getFloat64(i + 16, true)

    if (
      isFinite(x) && isFinite(y) && isFinite(z) &&
      x > 10000 && x < 1000000 &&
      y > 10000 && y < 1000000 &&
      z > -100 && z < 10000
    ) {
      if (firstX === null) firstX = x
      // Stay within 500% of first X to avoid false positives
      if (Math.abs(x - firstX) / Math.abs(firstX) < 5) {
        points.push({ x, y, z })
        i += 16 // already consumed 3 doubles (16 more bytes after current i+=8)
      }
    }
  }

  return {
    name: name || 'TN3',
    surfaces: [{ name: name || 'TN3 Points', points, triangles: [] }],
    lines: [],
  }
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
