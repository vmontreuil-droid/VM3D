'use client'

import { useRef, useState, useCallback } from 'react'
import AppShell from '@/components/app-shell'
import { Upload, Download, ArrowRight, FileCode2, Loader2, CheckCircle, AlertCircle, RefreshCw, Scissors } from 'lucide-react'
import {
  convert, detectFormat, parseTN3, parseLN3, parseTP3, triangulate,
  generateLandXML, generateLandXMLLines, generateDXF2010LinesPythagoras,
  type FileFormat
} from '@/lib/converters/machine-formats'

const FORMAT_LABELS: Record<FileFormat, string> = {
  landxml: 'LandXML (.xml)',
  dxf:     'AutoCAD DXF (.dxf)',
  tn3:     'Topcon TN3 (.TN3)',
  ln3:     'Topcon LN3 (.LN3)',
  tp3:     'Topcon TP3 (.TP3)',
  svl:     'Trimble SVL (.svl)',
  svd:     'Trimble SVD (.svd)',
}

const FORMAT_BRANDS: Record<FileFormat, string> = {
  landxml: 'Universeel',
  dxf:     'Universeel / CAD',
  tn3:     'Topcon / Unicontrol',
  ln3:     'Topcon / Unicontrol',
  tp3:     'Topcon / Unicontrol',
  svl:     'Trimble / Leica',
  svd:     'Trimble / Leica',
}

const FORMATS: FileFormat[] = ['landxml', 'dxf', 'tn3', 'ln3', 'tp3', 'svl', 'svd']
const ACCEPT = '.xml,.dxf,.TN3,.tn3,.LN3,.ln3,.TP3,.tp3,.svl,.svd,.SVL,.SVD'
const MAX_MB = 30

type Status =
  | { type: 'idle' }
  | { type: 'ready'; name: string; format: FileFormat }
  | { type: 'converting' }
  | { type: 'done'; files: string[] }
  | { type: 'error'; message: string }

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export default function ConverterPage() {
  const [file, setFile] = useState<File | null>(null)
  const [inputFormat, setInputFormat] = useState<FileFormat>('landxml')
  const [outputFormat, setOutputFormat] = useState<FileFormat>('dxf')
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    if (f.size > MAX_MB * 1024 * 1024) {
      setStatus({ type: 'error', message: `Bestand te groot (max ${MAX_MB} MB)` })
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const bytes = new Uint8Array(e.target!.result as ArrayBuffer)
      const fmt = detectFormat(f.name, bytes)
      setInputFormat(fmt)
      setOutputFormat(
        fmt === 'landxml' ? 'dxf' :
        fmt === 'dxf'     ? 'landxml' :
        fmt === 'ln3'     ? 'dxf' :
        fmt === 'tp3'     ? 'landxml' :
        'landxml'
      )
      setStatus({ type: 'ready', name: f.name, format: fmt })
    }
    reader.readAsArrayBuffer(f.slice(0, 512))
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }, [handleFile])

  // Split TN3 → XML oppervlak + (optioneel) XML lijnen
  const handleSplitTN3 = useCallback(async () => {
    if (!file) return
    setStatus({ type: 'converting' })
    try {
      const arrayBuf = await file.arrayBuffer()
      const parsed = parseTN3(arrayBuf)

      for (const surf of parsed.surfaces) {
        if (surf.triangles.length === 0 && surf.points.length >= 3) {
          surf.triangles = triangulate(surf.points)
        }
      }

      const baseName = file.name.replace(/\.[^.]+$/, '')
      const downloadedFiles: string[] = []

      // File 1: LandXML oppervlak
      const surfaceOnly = { ...parsed, lines: [] }
      const xmlSurface = generateLandXML(surfaceOnly)
      downloadBlob(new Blob([xmlSurface], { type: 'application/xml' }), `${baseName}_oppervlak.xml`)
      downloadedFiles.push(`${baseName}_oppervlak.xml (${parsed.surfaces[0]?.points.length ?? 0} punten, ${parsed.surfaces[0]?.triangles.length ?? 0} driehoeken)`)

      // File 2: DXF lijnen — alleen als er echte breaklines zijn
      if (parsed.lines.length > 0) {
        await new Promise(r => setTimeout(r, 300))
        const linesOnly = { ...parsed, surfaces: [] }
        const dxfLines = await generateDXF2010LinesPythagoras(linesOnly, baseName)
        downloadBlob(new Blob([dxfLines], { type: 'application/dxf' }), `${baseName}_lijnen.dxf`)
        const lnPts = parsed.lines.reduce((s, l) => s + l.points.length, 0)
        downloadedFiles.push(`${baseName}_lijnen.dxf (${parsed.lines.length} lijnen, ${lnPts} punten)`)
      }

      setStatus({ type: 'done', files: downloadedFiles })
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Onbekende fout' })
    }
  }, [file])

  // Normal single-file conversion
  const handleConvert = useCallback(async () => {
    if (!file) return
    if (inputFormat === outputFormat) {
      setStatus({ type: 'error', message: 'Invoer- en uitvoerformaat zijn hetzelfde.' })
      return
    }
    setStatus({ type: 'converting' })
    try {
      const arrayBuf = await file.arrayBuffer()
      const isText = inputFormat === 'landxml' || inputFormat === 'dxf'
      const input = isText ? new TextDecoder().decode(arrayBuf) : arrayBuf
      const result = convert(input, inputFormat, outputFormat, file.name)
      const baseName = file.name.replace(/\.[^.]+$/, '')
      const outName = `${baseName}_converted.${result.extension}`
      const blob = result.data instanceof ArrayBuffer
        ? new Blob([result.data], { type: result.mimeType })
        : new Blob([result.data as string], { type: result.mimeType })
      downloadBlob(blob, outName)
      setStatus({ type: 'done', files: [outName] })
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Onbekende fout' })
    }
  }, [file, inputFormat, outputFormat])

  const reset = () => {
    setFile(null)
    setStatus({ type: 'idle' })
    if (inputRef.current) inputRef.current.value = ''
  }

  // LN3 → DXF lijnen
  const handleConvertLN3 = useCallback(async () => {
    if (!file) return
    setStatus({ type: 'converting' })
    try {
      const arrayBuf = await file.arrayBuffer()
      const parsed = parseLN3(arrayBuf)
      const baseName = file.name.replace(/\.[^.]+$/, '')
      const dxfStr = await generateDXF2010LinesPythagoras(parsed, baseName)
      downloadBlob(new Blob([dxfStr], { type: 'application/dxf' }), `${baseName}_lijnen.dxf`)
      setStatus({ type: 'done', files: [
        `${baseName}_lijnen.dxf (${parsed.lines.length} lijnen, ${parsed.lines.reduce((s, l) => s + l.points.length, 0)} punten)`,
      ] })
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Onbekende fout' })
    }
  }, [file])

  // TP3 splitsen → XML oppervlak + DXF lijnen — klanten editen in Pythagoras
  const handleSplitTP3 = useCallback(async () => {
    if (!file) return
    setStatus({ type: 'converting' })
    try {
      const arrayBuf = await file.arrayBuffer()
      const parsed = parseTP3(arrayBuf)

      for (const surf of parsed.surfaces) {
        if (surf.triangles.length === 0 && surf.points.length >= 3) {
          surf.triangles = triangulate(surf.points)
        }
      }

      const baseName = file.name.replace(/\.[^.]+$/, '')

      // File 1: LandXML — oppervlakte (Surface met Pnts + Faces)
      const surfaceOnly = { ...parsed, lines: [] }
      const xmlSurface = generateLandXML(surfaceOnly)
      downloadBlob(new Blob([xmlSurface], { type: 'application/xml' }), `${baseName}_oppervlak.xml`)

      await new Promise(r => setTimeout(r, 300))

      // File 2: DXF — lijnen (LINE entiteiten, Pythagoras-compatible template)
      const linesOnly = { ...parsed, surfaces: [] }
      const dxfLines = await generateDXF2010LinesPythagoras(linesOnly, baseName)
      downloadBlob(new Blob([dxfLines], { type: 'application/dxf' }), `${baseName}_lijnen.dxf`)

      const ptCount = parsed.surfaces[0]?.points.length ?? 0
      const triCount = parsed.surfaces[0]?.triangles.length ?? 0
      const lnPts = parsed.lines.reduce((s, l) => s + l.points.length, 0)
      setStatus({ type: 'done', files: [
        `${baseName}_oppervlak.xml (${ptCount} punten, ${triCount} driehoeken)`,
        `${baseName}_lijnen.dxf (${parsed.lines.length} lijnen, ${lnPts} punten)`,
      ] })
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Onbekende fout' })
    }
  }, [file])

  const isTN3 = inputFormat === 'tn3'
  const isLN3 = inputFormat === 'ln3'
  const isTP3 = inputFormat === 'tp3'
  const selCls = 'w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent)]/50 appearance-none'
  const lblCls = 'block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-soft)] mb-1.5'

  return (
    <AppShell isAdmin>
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Header */}
        <div className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3">
          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
          <span className="flex items-start gap-2.5 pr-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <FileCode2 className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">Bestandsconverter</span>
              <span className="block text-[11px] leading-4 text-[var(--text-soft)]">Machinebesturingsbestanden — max {MAX_MB} MB</span>
            </span>
          </span>
        </div>

        {/* Supported formats */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
          <div className="border-b border-[var(--border-soft)] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-soft)]">Ondersteunde formaten</p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[var(--border-soft)] sm:grid-cols-5">
            {FORMATS.map(fmt => (
              <div key={fmt} className="bg-[var(--bg-card)] px-3 py-3">
                <p className="text-xs font-semibold text-[var(--text-main)]">{FORMAT_LABELS[fmt]}</p>
                <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{FORMAT_BRANDS[fmt]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Converter card */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
          <div className="border-b border-[var(--border-soft)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">Bestand omzetten</h2>
          </div>

          <div className="space-y-5 p-5">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                dragging
                  ? 'border-[var(--accent)] bg-[var(--accent)]/6'
                  : status.type === 'ready' || status.type === 'done'
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-[var(--border-soft)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/4'
              }`}
            >
              <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onPick} />
              {status.type === 'ready' || status.type === 'done' ? (
                <>
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-main)]">{file?.name}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                      Herkend als <span className="text-[var(--accent)]">{FORMAT_LABELS[inputFormat]}</span>
                      {' · '}{file ? (file.size / 1024).toFixed(0) : 0} KB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className={`h-8 w-8 ${dragging ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-main)]">Sleep bestand hier of klik om te kiezen</p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">.xml · .dxf · .TN3 · .LN3 · .TP3 · .svl · .svd — max {MAX_MB} MB</p>
                  </div>
                </>
              )}
            </div>

            {/* TP3 split section — combined surface + lines */}
            {isTP3 && (
              <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/4">
                <div className="flex items-center gap-3 border-b border-emerald-500/15 px-4 py-3">
                  <Scissors className="h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-main)]">TP3 splitsen (gecombineerd project)</p>
                    <p className="text-[11px] text-[var(--text-soft)]">
                      Exporteert <strong>XML oppervlak</strong> (Pythagoras-compatible Surface) + <strong>DXF lijnen</strong> (editeerbaar in Pythagoras / AutoCAD)
                    </p>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <button
                    onClick={handleSplitTP3}
                    disabled={!file || status.type === 'converting'}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/18 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {status.type === 'converting'
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Bezig…</>
                      : <><Scissors className="h-4 w-4" /> Splitsen → XML + DXF</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* LN3 section */}
            {isLN3 && (
              <div className="overflow-hidden rounded-xl border border-blue-500/20 bg-blue-500/4">
                <div className="flex items-center gap-3 border-b border-blue-500/15 px-4 py-3">
                  <Download className="h-4 w-4 shrink-0 text-blue-400" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-main)]">LN3 naar DXF</p>
                    <p className="text-[11px] text-[var(--text-soft)]">
                      Exporteert alle ontwerplijnen als <strong>DXF LINE entiteiten</strong> (editeerbaar in Pythagoras)
                    </p>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <button
                    onClick={handleConvertLN3}
                    disabled={!file || status.type === 'converting'}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-blue-500/40 bg-blue-500/10 py-2.5 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/18 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {status.type === 'converting'
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Bezig…</>
                      : <><Download className="h-4 w-4" /> Exporteren → DXF</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* TN3 split section */}
            {isTN3 && (
              <div className="overflow-hidden rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/4">
                <div className="flex items-center gap-3 border-b border-[var(--accent)]/15 px-4 py-3">
                  <Scissors className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-main)]">TN3 splitsen</p>
                    <p className="text-[11px] text-[var(--text-soft)]">
                      Exporteert <strong>XML oppervlak</strong> (Pythagoras-compatible Surface) + <strong>DXF lijnen</strong> (editeerbaar in Pythagoras / AutoCAD)
                    </p>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <button
                    onClick={handleSplitTN3}
                    disabled={!file || status.type === 'converting'}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 py-2.5 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/18 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {status.type === 'converting'
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Bezig…</>
                      : <><Scissors className="h-4 w-4" /> Splitsen → XML + DXF</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Normal conversion */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
                <div>
                  <label className={lblCls}>Van formaat</label>
                  <select value={inputFormat} onChange={e => setInputFormat(e.target.value as FileFormat)} className={selCls}>
                    {FORMATS.map(f => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-3">
                  <ArrowRight className="h-5 w-5 text-[var(--text-muted)]" />
                </div>
                <div>
                  <label className={lblCls}>{(isTN3 || isLN3 || isTP3) ? 'Naar formaat (enkelvoudig)' : 'Naar formaat'}</label>
                  <select value={outputFormat} onChange={e => setOutputFormat(e.target.value as FileFormat)} className={selCls}>
                    {FORMATS.filter(f => f !== inputFormat).map(f => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
                  </select>
                </div>
              </div>

              {/* Status */}
              {status.type === 'error' && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-sm text-red-300">{status.message}</p>
                </div>
              )}
              {status.type === 'done' && (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-300">Download gestart!</p>
                  </div>
                  {status.files.map(f => (
                    <p key={f} className="mt-1 text-[11px] text-[var(--text-soft)]">↓ {f}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleConvert}
                  disabled={!file || status.type === 'converting' || inputFormat === outputFormat}
                  className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] py-2.5 text-sm font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80 disabled:pointer-events-none disabled:opacity-50"
                >
                  {status.type === 'converting'
                    ? <><Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" /> Bezig…</>
                    : <><Download className="h-4 w-4 text-[var(--accent)]" /> {(isTN3 || isLN3 || isTP3) ? 'Enkelvoudig omzetten' : 'Omzetten & downloaden'}</>
                  }
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                </button>
                {(file || status.type !== 'idle') && (
                  <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5 text-sm text-[var(--text-soft)] hover:text-[var(--text-main)] transition">
                    <RefreshCw className="h-3.5 w-3.5" /> Nieuw
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]/50 px-4 py-3">
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            <span className="font-semibold text-[var(--text-soft)]">Let op: </span>
            SVL/SVD (Trimble) zijn gesloten binaire formaten. LandXML ↔ DXF, TN3, LN3 en TP3 hebben volledige ondersteuning.
            TP3 splitst direct in XML oppervlak (voor Pythagoras) en DXF lijnen (editeerbaar in Pythagoras / AutoCAD).
          </p>
        </div>
      </div>
    </AppShell>
  )
}
