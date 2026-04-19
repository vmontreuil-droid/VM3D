'use client'

import { useRef, useState, useCallback } from 'react'
import AppShell from '@/components/app-shell'
import { Upload, Download, ArrowRight, FileCode2, Loader2, CheckCircle, AlertCircle, RefreshCw, Scissors } from 'lucide-react'
import {
  convert, detectFormat, parseTN3, triangulate,
  generateLandXML, generateDXF2010Lines,
  type FileFormat
} from '@/lib/converters/machine-formats'

const FORMAT_LABELS: Record<FileFormat, string> = {
  landxml: 'LandXML (.xml)',
  dxf:     'AutoCAD DXF (.dxf)',
  tn3:     'Topcon TN3 (.TN3)',
  svl:     'Trimble SVL (.svl)',
  svd:     'Trimble SVD (.svd)',
}

const FORMAT_BRANDS: Record<FileFormat, string> = {
  landxml: 'Universeel',
  dxf:     'Universeel / CAD',
  tn3:     'Topcon / Unicontrol',
  svl:     'Trimble / Leica',
  svd:     'Trimble / Leica',
}

const FORMATS: FileFormat[] = ['landxml', 'dxf', 'tn3', 'svl', 'svd']
const ACCEPT = '.xml,.dxf,.TN3,.tn3,.svl,.svd,.SVL,.SVD'
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
      setOutputFormat(fmt === 'landxml' ? 'dxf' : fmt === 'dxf' ? 'landxml' : 'landxml')
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

  // Split TN3 → XML (LandXML oppervlak) + DXF 2010 (lijnen)
  const handleSplitTN3 = useCallback(async () => {
    if (!file) return
    setStatus({ type: 'converting' })
    try {
      const arrayBuf = await file.arrayBuffer()
      const parsed = parseTN3(arrayBuf)

      // Triangulate surface if no faces came from the TN3 (fallback)
      for (const surf of parsed.surfaces) {
        if (surf.triangles.length === 0 && surf.points.length >= 3) {
          surf.triangles = triangulate(surf.points)
        }
      }

      const baseName = file.name.replace(/\.[^.]+$/, '')

      // File 1: LandXML — surface only (points + real triangles)
      const surfaceOnly = { ...parsed, lines: [] }
      const xmlStr = generateLandXML(surfaceOnly)
      downloadBlob(new Blob([xmlStr], { type: 'application/xml' }), `${baseName}_oppervlak.xml`)

      await new Promise(r => setTimeout(r, 300))

      // File 2: DXF 2010 — real breaklines from the TN3 lines section
      // If no lines were parsed, fall back to triangle edges
      const linesData = parsed.lines.length > 0
        ? { ...parsed, surfaces: [] }   // only lines → polylines in DXF
        : parsed                        // fallback: triangle edges
      const dxfStr = generateDXF2010Lines(linesData, baseName)
      downloadBlob(new Blob([dxfStr], { type: 'application/dxf' }), `${baseName}_lijnen.dxf`)

      const lineInfo = parsed.lines.length > 0
        ? `${parsed.lines.length} lijnen`
        : 'driehoekskanten (geen aparte lijnen gevonden)'
      setStatus({ type: 'done', files: [
        `${baseName}_oppervlak.xml (${parsed.surfaces[0]?.points.length ?? 0} punten, ${parsed.surfaces[0]?.triangles.length ?? 0} driehoeken)`,
        `${baseName}_lijnen.dxf (${lineInfo})`,
      ] })
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

  const isTN3 = inputFormat === 'tn3'
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
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">.xml · .dxf · .TN3 · .svl · .svd — max {MAX_MB} MB</p>
                  </div>
                </>
              )}
            </div>

            {/* TN3 split section */}
            {isTN3 && (
              <div className="overflow-hidden rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/4">
                <div className="flex items-center gap-3 border-b border-[var(--accent)]/15 px-4 py-3">
                  <Scissors className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-main)]">TN3 splitsen</p>
                    <p className="text-[11px] text-[var(--text-soft)]">
                      Exporteert 2 bestanden tegelijk: <strong>XML oppervlak</strong> voor Pythagoras + <strong>DXF 2010 lijnen</strong> voor AutoCAD
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
                      : <><Scissors className="h-4 w-4" /> Splitsen → XML + DXF 2010</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Normal conversion */}
            <div className="space-y-4">
              {!isTN3 && (
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
                    <label className={lblCls}>Naar formaat</label>
                    <select value={outputFormat} onChange={e => setOutputFormat(e.target.value as FileFormat)} className={selCls}>
                      {FORMATS.filter(f => f !== inputFormat).map(f => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {isTN3 && (
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
                    <label className={lblCls}>Naar formaat (enkelvoudig)</label>
                    <select value={outputFormat} onChange={e => setOutputFormat(e.target.value as FileFormat)} className={selCls}>
                      {FORMATS.filter(f => f !== inputFormat).map(f => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
                    </select>
                  </div>
                </div>
              )}

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
                    : <><Download className="h-4 w-4 text-[var(--accent)]" /> {isTN3 ? 'Enkelvoudig omzetten' : 'Omzetten & downloaden'}</>
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
            SVL/SVD (Trimble) zijn gesloten binaire formaten. LandXML ↔ DXF en TN3 hebben volledige ondersteuning.
            TN3 splitsen genereert driehoeken via Delaunay triangulatie op basis van de XY-coördinaten.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
