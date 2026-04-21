'use client'

import { useRef, useState, useCallback } from 'react'
import AppShell from '@/components/app-shell'
import Link from 'next/link'
import { useT } from '@/i18n/context'
import {
  Upload, Download, ArrowRight, ArrowLeft, Loader2,
  CheckCircle, AlertCircle, RefreshCw, Scissors, Repeat, FileType2, HardDrive,
} from 'lucide-react'
import {
  parseTP3, parseLandXML, parseDXF, triangulate,
  generateLandXML, generateDXF2010LinesPythagoras, generateTP3FromTemplate,
  type Polyline,
} from '@/lib/converters/machine-formats'

const MAX_MB = 50

// Brand logo met tekst-fallback als image niet aanwezig
function BrandLogo({ name }: { name: 'topcon' | 'leica' }) {
  const [ok, setOk] = useState(true)
  if (ok) {
    return (
      <img
        src={`/logos/${name}.png`}
        alt={name === 'topcon' ? 'Topcon' : 'Leica Geosystems'}
        onError={() => setOk(false)}
        className="h-8 w-auto object-contain"
      />
    )
  }
  if (name === 'topcon') {
    return <span className="inline-flex items-center rounded-md bg-blue-600/90 px-2 py-1 text-[11px] font-bold text-white">TOPCON</span>
  }
  return <span className="inline-flex items-center rounded-md bg-red-600/90 px-2 py-1 text-[11px] font-bold text-white">LEICA</span>
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

type Status =
  | { type: 'idle' }
  | { type: 'converting' }
  | { type: 'done'; files: string[] }
  | { type: 'error'; message: string }

// ─── Topcon → Leica card ──────────────────────────────────────────────────
function TopconToLeicaCard() {
  const { t } = useT()
  const tt = t.adminConverter
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    if (f.size > MAX_MB * 1024 * 1024) {
      setStatus({ type: 'error', message: tt.errFileTooBig.replace('{mb}', String(MAX_MB)) })
      return
    }
    if (!/\.tp3$/i.test(f.name)) {
      setStatus({ type: 'error', message: tt.errExpectTP3 })
      return
    }
    setFile(f)
    setStatus({ type: 'idle' })
  }, [tt])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleConvert = useCallback(async () => {
    if (!file) return
    setStatus({ type: 'converting' })
    try {
      const ab = await file.arrayBuffer()
      const parsed = parseTP3(ab)
      const baseName = file.name.replace(/\.[^.]+$/, '')

      // Surface XML
      const surfaceOnly = { ...parsed, lines: [] as Polyline[] }
      for (const surf of surfaceOnly.surfaces) {
        if (surf.triangles.length === 0 && surf.points.length >= 3) surf.triangles = triangulate(surf.points)
      }
      const xmlSurface = generateLandXML(surfaceOnly)
      downloadBlob(new Blob([xmlSurface], { type: 'application/xml' }), `${baseName}_oppervlak.xml`)

      const downloadedFiles: string[] = [
        `${baseName}_oppervlak.xml (${parsed.surfaces[0]?.points.length ?? 0} pnt, ${parsed.surfaces[0]?.triangles.length ?? 0} drhk)`,
      ]

      // Lines DXF (only if any)
      if (parsed.lines.length > 0) {
        await new Promise(r => setTimeout(r, 300))
        const linesOnly = { ...parsed, surfaces: [] }
        const dxfLines = await generateDXF2010LinesPythagoras(linesOnly, baseName)
        downloadBlob(new Blob([dxfLines], { type: 'application/dxf' }), `${baseName}_lijnen.dxf`)
        const lnPts = parsed.lines.reduce((s, l) => s + l.points.length, 0)
        downloadedFiles.push(`${baseName}_lijnen.dxf (${parsed.lines.length} lijnen, ${lnPts} pnt)`)
      }

      setStatus({ type: 'done', files: downloadedFiles })
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : tt.errUnknown })
    }
  }, [file, tt])

  const reset = () => {
    setFile(null); setStatus({ type: 'idle' })
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-blue-500/25 bg-[var(--bg-card)] shadow-sm">
      <div className="flex h-[72px] items-center gap-4 border-b border-blue-500/15 bg-gradient-to-br from-blue-500/8 to-transparent px-5">
        <div className="flex h-12 items-center gap-2">
          <BrandLogo name="topcon" />
          <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
          <BrandLogo name="leica" />
        </div>
        <div className="ml-2">
          <p className="text-sm font-semibold text-[var(--text-main)]">{tt.cardTopconLeicaTitle}</p>
          <p className="text-[11px] text-[var(--text-soft)]">{tt.cardTopconLeicaSubtitle}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center transition ${
            dragging ? 'border-blue-500 bg-blue-500/6'
              : file ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-[var(--border-soft)] hover:border-blue-500/30 hover:bg-blue-500/4'
          }`}
        >
          <input ref={inputRef} type="file" accept=".TP3,.tp3" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          {file ? (
            <>
              <CheckCircle className="h-7 w-7 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">{file.name}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            </>
          ) : (
            <>
              <Upload className={`h-7 w-7 ${dragging ? 'text-blue-400' : 'text-[var(--text-muted)]'}`} />
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">{tt.dropTP3}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{tt.maxSize.replace('{mb}', String(MAX_MB))}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 rounded-xl border border-blue-500/15 bg-blue-500/4 px-4 py-3">
          <p className="text-[11px] leading-relaxed text-[var(--text-soft)]">
            <span className="font-semibold text-blue-300">{tt.howItWorks} </span>
            {tt.howItWorksTopconLeica}
          </p>
        </div>

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
              <p className="text-sm font-semibold text-emerald-300">{tt.statusDone}</p>
            </div>
            {status.files.map(f => <p key={f} className="mt-1 text-[11px] text-[var(--text-soft)]">↓ {f}</p>)}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleConvert}
            disabled={!file || status.type === 'converting'}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 py-2.5 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/18 disabled:pointer-events-none disabled:opacity-50"
          >
            {status.type === 'converting'
              ? <><Loader2 className="h-4 w-4 animate-spin" /> {tt.btnBusy}</>
              : <><Scissors className="h-4 w-4" /> {tt.btnConvert}</>}
          </button>
          {(file || status.type !== 'idle') && (
            <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5 text-sm text-[var(--text-soft)] hover:text-[var(--text-main)] transition">
              <RefreshCw className="h-3.5 w-3.5" /> {tt.btnNew}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Leica → Topcon card ──────────────────────────────────────────────────
function LeicaToTopconCard() {
  const { t } = useT()
  const tt = t.adminConverter
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [dxfFile, setDxfFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const xmlInputRef = useRef<HTMLInputElement>(null)
  const dxfInputRef = useRef<HTMLInputElement>(null)

  const handleConvert = useCallback(async () => {
    if (!xmlFile && !dxfFile) {
      setStatus({ type: 'error', message: tt.errUploadOne })
      return
    }
    setStatus({ type: 'converting' })
    try {
      // Parse inputs
      let surfaces: Awaited<ReturnType<typeof parseLandXML>>['surfaces'] = []
      let lines: Polyline[] = []
      if (xmlFile) {
        const xmlText = await xmlFile.text()
        const parsed = parseLandXML(xmlText)
        surfaces = parsed.surfaces
      }
      if (dxfFile) {
        const dxfText = await dxfFile.text()
        const parsed = parseDXF(dxfText)
        if (surfaces.length === 0) surfaces = parsed.surfaces
        lines = parsed.lines
      }

      const surfPts = surfaces.reduce((s, sf) => s + sf.points.length, 0)

      // Load template (project 006 — kleinste werkende Topcon TP3)
      const tplRes = await fetch('/converter/tp3-template-small.tp3')
      if (!tplRes.ok) throw new Error(tt.errTemplateMissing)
      const tplAb = await tplRes.arrayBuffer()
      const tplParsed = parseTP3(tplAb)

      // Map customer lines to template metadata
      const linesWithMeta = lines.map((l, i) => {
        const tpl = tplParsed.lines[i] ?? tplParsed.lines[tplParsed.lines.length - 1]
        return { ...l, _tp3RangeStart: tpl?._tp3RangeStart, _tp3RefX: tpl?._tp3RefX, _tp3RefY: tpl?._tp3RefY }
      })

      const baseName = (xmlFile?.name ?? dxfFile?.name ?? 'output').replace(/\.[^.]+$/, '').replace(/[_-]?(oppervlak|lijnen)/i, '')
      const out = generateTP3FromTemplate({ name: baseName, surfaces, lines: linesWithMeta, tp3Source: tplAb })
      downloadBlob(new Blob([out], { type: 'application/octet-stream' }), `${baseName}.TP3`)
      setStatus({ type: 'done', files: [`${baseName}.TP3 (${surfPts} oppervlakte-pnt, ${lines.length} lijnen)`] })
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : tt.errUnknown })
    }
  }, [xmlFile, dxfFile, tt])

  const reset = () => {
    setXmlFile(null); setDxfFile(null); setStatus({ type: 'idle' })
    if (xmlInputRef.current) xmlInputRef.current.value = ''
    if (dxfInputRef.current) dxfInputRef.current.value = ''
  }

  const FilePicker = ({ label, accept, file, set, inputRef }: {
    label: string; accept: string; file: File | null;
    set: (f: File | null) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) => (
    <div
      onClick={() => inputRef.current?.click()}
      className={`flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 text-center transition ${
        file ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-[var(--border-soft)] hover:border-red-500/30 hover:bg-red-500/4'
      }`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) set(f) }} />
      {file ? (
        <>
          <CheckCircle className="h-7 w-7 text-emerald-400" />
          <p className="text-xs font-semibold text-[var(--text-main)] truncate max-w-full">{file.name}</p>
        </>
      ) : (
        <>
          <Upload className="h-7 w-7 text-[var(--text-muted)]" />
          <p className="text-sm font-semibold text-[var(--text-soft)]">{label}</p>
        </>
      )}
    </div>
  )

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-red-500/25 bg-[var(--bg-card)] shadow-sm">
      <div className="flex h-[72px] items-center gap-4 border-b border-red-500/15 bg-gradient-to-br from-red-500/8 to-transparent px-5">
        <div className="flex h-12 items-center gap-2">
          <BrandLogo name="leica" />
          <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
          <BrandLogo name="topcon" />
        </div>
        <div className="ml-2">
          <p className="text-sm font-semibold text-[var(--text-main)]">{tt.cardLeicaTopconTitle}</p>
          <p className="text-[11px] text-[var(--text-soft)]">{tt.cardLeicaTopconSubtitle}</p>
        </div>
        <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">{tt.beta}</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <FilePicker label={tt.dropXML} accept=".xml,.XML" file={xmlFile} set={setXmlFile} inputRef={xmlInputRef} />
          <FilePicker label={tt.dropDXF} accept=".dxf,.DXF" file={dxfFile} set={setDxfFile} inputRef={dxfInputRef} />
        </div>

        <div className="flex-1 rounded-xl border border-red-500/15 bg-red-500/4 px-4 py-3">
          <p className="text-[11px] leading-relaxed text-[var(--text-soft)]">
            <span className="font-semibold text-red-300">{tt.howItWorks} </span>
            {tt.howItWorksLeicaTopcon}
          </p>
        </div>

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
              <p className="text-sm font-semibold text-emerald-300">{tt.statusDoneTP3}</p>
            </div>
            {status.files.map(f => <p key={f} className="mt-1 text-[11px] text-[var(--text-soft)]">↓ {f}</p>)}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleConvert}
            disabled={(!xmlFile && !dxfFile) || status.type === 'converting'}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/18 disabled:pointer-events-none disabled:opacity-50"
          >
            {status.type === 'converting'
              ? <><Loader2 className="h-4 w-4 animate-spin" /> {tt.btnBusy}</>
              : <><Download className="h-4 w-4" /> {tt.btnGenerate}</>}
          </button>
          {(xmlFile || dxfFile || status.type !== 'idle') && (
            <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5 text-sm text-[var(--text-soft)] hover:text-[var(--text-main)] transition">
              <RefreshCw className="h-3.5 w-3.5" /> {tt.btnNew}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function ConverterPage() {
  const { t } = useT()
  const tt = t.adminConverter
  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <Link
                  href="/admin/tools"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:text-[var(--accent)]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {tt.tools}
                </Link>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  {tt.adminPortal}
                </p>
                <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  {tt.title}
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-[var(--text-soft)]">
                  {tt.description}
                </p>
              </div>

              <div className="w-full xl:ml-auto xl:max-w-[820px]">
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(14,165,233,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiTopconToLeica}</p>
                        <p className="mt-1 text-lg font-semibold text-sky-400">{tt.stable}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10">
                        <CheckCircle className="h-4.5 w-4.5 text-sky-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiLeicaToTopcon}</p>
                        <p className="mt-1 text-lg font-semibold text-amber-400">{tt.beta}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                        <Repeat className="h-4.5 w-4.5 text-amber-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(168,85,247,0.08),rgba(168,85,247,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiFormats}</p>
                        <p className="mt-1 text-lg font-semibold text-violet-400">3</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/10">
                        <FileType2 className="h-4.5 w-4.5 text-violet-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiMaxFile}</p>
                        <p className="mt-1 text-lg font-semibold text-emerald-400">{MAX_MB} MB</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10">
                        <HardDrive className="h-4.5 w-4.5 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5">
            <div className="grid gap-5 md:grid-cols-2">
              <TopconToLeicaCard />
              <LeicaToTopconCard />
            </div>

            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3">
              <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text-soft)]">{tt.formatsInfoTitle} </span>
                {tt.formatsInfo}
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
