'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, MessageCircle, PenLine, RotateCcw, Send } from 'lucide-react'

type Props = {
  offerte: any
  lines: any[]
  customer: any
  company: any
  token: string
  alreadySigned: boolean
  signerNameDefault?: string | null
  signedAt?: string | null
}

function fmt(n: number) {
  const [i, d] = n.toFixed(2).split('.')
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d}`
}
function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-BE')
}

export default function SignClient({ offerte, lines, customer, company, token, alreadySigned, signerNameDefault, signedAt }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tab, setTab]           = useState<'sign' | 'ask'>('sign')
  const [drawing, setDrawing]   = useState(false)
  const [hasSig, setHasSig]     = useState(false)
  const [name, setName]         = useState('')
  const [agreed, setAgreed]     = useState(false)
  const [status, setStatus]     = useState<'idle'|'submitting'|'done'|'error'>(alreadySigned ? 'done' : 'idle')
  const [question, setQuestion] = useState('')
  const [askName, setAskName]   = useState('')
  const [askStatus, setAskStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')

  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const cv   = canvasRef.current!
    const rect = cv.getBoundingClientRect()
    const sx   = cv.width  / rect.width
    const sy   = cv.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy }
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    const p = getPos(e)
    ctx.moveTo(p.x, p.y)
    setDrawing(true)
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!drawing) return
    e.preventDefault()
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.strokeStyle = '#0f172a'
    const p = getPos(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    setHasSig(true)
  }

  function stopDraw() { setDrawing(false) }

  function clear() {
    const cv = canvasRef.current!
    cv.getContext('2d')!.clearRect(0, 0, cv.width, cv.height)
    setHasSig(false)
    setDrawing(false)
  }

  async function handleSubmit() {
    if (!hasSig || !name.trim() || !agreed) return
    setStatus('submitting')
    const signatureData = canvasRef.current!.toDataURL('image/png')
    try {
      const res = await fetch('/api/offerte/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signatureData, signerName: name.trim() }),
      })
      if (res.ok) {
        setStatus('done')
      } else {
        const data = await res.json()
        if (data?.error === 'already_signed') setStatus('done')
        else setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  async function handleAsk() {
    if (!question.trim()) return
    setAskStatus('sending')
    try {
      const res = await fetch('/api/offerte/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senderName: askName.trim() || null, message: question.trim() }),
      })
      if (res.ok) {
        setAskStatus('sent')
        setQuestion('')
      } else {
        setAskStatus('error')
      }
    } catch {
      setAskStatus('error')
    }
  }

  // ── Success screen ──────────────────────────────────────────
  if (status === 'done') {
    return (
      <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#f7941d]/20 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Offerte ondertekend</h1>
          <p className="mt-2 text-sm text-slate-500">
            Bedankt{alreadySigned && signerNameDefault ? `, ${signerNameDefault}` : name ? `, ${name}` : ''}. Uw handtekening voor offerte{' '}
            <strong>{offerte.offerte_number}</strong> is ontvangen.
          </p>
          {(signedAt || !alreadySigned) && (
            <p className="mt-1 text-xs text-slate-400">
              Ondertekend op {fmtDate(signedAt || new Date().toISOString())}
            </p>
          )}
          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-left text-sm">
            <p className="font-semibold text-slate-700">{offerte.subject || 'Offerte'}</p>
            <p className="mt-1 text-xs text-slate-500">Totaal: <strong className="text-[#f7941d]">€ {fmt(Number(offerte.total) || 0)}</strong></p>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            U ontvangt een bevestiging van {company?.email || 'facturatie@mv3d.be'}.
          </p>
        </div>
      </div>
    )
  }

  const companyName = company?.company_name || 'MV3D.CLOUD'

  return (
    <div className="min-h-screen bg-[#fffaf5]">
      {/* Header */}
      <div className="border-b border-[#f7941d]/20 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-base font-bold text-[#f7941d]">MV3D<span className="text-slate-800">.CLOUD</span></span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Ter goedkeuring
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 p-4 pb-16">
        {/* Offerte header */}
        <div className="overflow-hidden rounded-2xl border border-[#f7941d]/20 bg-white shadow-sm">
          <div className="border-b border-[#f7941d]/15 bg-[#fff9f0] px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#f7941d]">Offerte ter goedkeuring</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">{offerte.offerte_number}</h1>
            {offerte.subject && <p className="mt-0.5 text-sm text-slate-500">{offerte.subject}</p>}
          </div>
          <div className="grid gap-3 px-5 py-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Van</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">{companyName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Aan</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {customer?.company_name || customer?.full_name || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Geldig tot</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">{fmtDate(offerte.valid_until)}</p>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 text-left">Omschrijving</th>
                  <th className="px-3 py-3 text-right">Aantal</th>
                  <th className="px-3 py-3 text-right">Prijs</th>
                  <th className="px-4 py-3 text-right">Totaal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((l: any) => (
                  <tr key={l.id}>
                    <td className="px-4 py-2.5 text-slate-800">{l.description}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">{l.quantity} {l.unit}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">€ {fmt(Number(l.unit_price))}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">€ {fmt(Number(l.line_total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-4 py-3">
            <div className="ml-auto max-w-xs space-y-1">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotaal</span><span>€ {fmt(Number(offerte.subtotal) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>BTW</span><span>€ {fmt(Number(offerte.vat_amount) || 0)}</span>
              </div>
              <div className="flex justify-between rounded-full border border-[#f7941d]/40 bg-[#fff9f0] px-4 py-2 text-sm font-bold text-[#f7941d]">
                <span>Totaal</span><span>€ {fmt(Number(offerte.total) || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 rounded-2xl border border-[#f7941d]/20 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setTab('sign')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
              tab === 'sign'
                ? 'bg-[#f7941d] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <PenLine className="h-4 w-4" />
            Ondertekenen
          </button>
          <button
            type="button"
            onClick={() => setTab('ask')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
              tab === 'ask'
                ? 'bg-[#f7941d] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Vraag stellen
          </button>
        </div>

        {/* Sign tab */}
        {tab === 'sign' && (
          <div className="overflow-hidden rounded-2xl border border-[#f7941d]/20 bg-white shadow-sm">
            <div className="border-b border-[#f7941d]/15 bg-[#fff9f0] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-[#f7941d]" />
                <h2 className="text-sm font-semibold text-slate-800">Ondertekening</h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Door te ondertekenen gaat u akkoord met bovenstaande offerte.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Uw naam
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Voornaam Achternaam"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#f7941d] focus:ring-2 focus:ring-[#f7941d]/15"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Handtekening
                  </label>
                  {hasSig && (
                    <button
                      type="button"
                      onClick={clear}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#f7941d]"
                    >
                      <RotateCcw className="h-3 w-3" /> Wis
                    </button>
                  )}
                </div>
                <canvas
                  ref={canvasRef}
                  width={680}
                  height={180}
                  className={`w-full touch-none rounded-xl border-2 bg-white transition ${
                    drawing ? 'border-[#f7941d]' : hasSig ? 'border-[#f7941d]/40' : 'border-dashed border-slate-300'
                  }`}
                  style={{ cursor: 'crosshair' }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
                {!hasSig && (
                  <p className="mt-1 text-center text-xs text-slate-400">Teken hier uw handtekening</p>
                )}
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-[#f7941d]"
                />
                <span className="text-xs text-slate-500">
                  Ik ga akkoord met de offerte van <strong>{companyName}</strong> voor een totaal bedrag
                  van <strong>€ {fmt(Number(offerte.total) || 0)}</strong> en bevestig dat ik bevoegd ben
                  om deze te ondertekenen.
                </span>
              </label>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!hasSig || !name.trim() || !agreed || status === 'submitting'}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f7941d] py-3 text-sm font-bold text-white transition hover:bg-[#e07810] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {status === 'submitting' ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Bezig met ondertekenen…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Offerte goedkeuren &amp; ondertekenen
                  </>
                )}
              </button>

              {status === 'error' && (
                <p className="text-center text-xs text-red-500">
                  Er ging iets mis. Probeer opnieuw of contacteer {company?.email || 'facturatie@mv3d.be'}.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Ask tab */}
        {tab === 'ask' && (
          <div className="overflow-hidden rounded-2xl border border-[#f7941d]/20 bg-white shadow-sm">
            <div className="border-b border-[#f7941d]/15 bg-[#fff9f0] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#f7941d]" />
                <h2 className="text-sm font-semibold text-slate-800">Vraag stellen</h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Heeft u een vraag over deze offerte? Wij antwoorden zo snel mogelijk.
              </p>
            </div>

            {askStatus === 'sent' ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Vraag verstuurd!</p>
                <p className="mt-1 text-xs text-slate-500">
                  We hebben uw vraag ontvangen en antwoorden zo snel mogelijk.
                </p>
                <button
                  type="button"
                  onClick={() => { setAskStatus('idle'); setQuestion('') }}
                  className="mt-4 text-xs text-[#f7941d] hover:underline"
                >
                  Nog een vraag stellen
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Uw naam <span className="text-[#f7941d]">*</span>
                  </label>
                  <input
                    type="text"
                    value={askName}
                    onChange={e => setAskName(e.target.value)}
                    placeholder="Voornaam Achternaam"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#f7941d] focus:ring-2 focus:ring-[#f7941d]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Uw vraag
                  </label>
                  <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    rows={4}
                    placeholder="Stel hier uw vraag over de offerte…"
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#f7941d] focus:ring-2 focus:ring-[#f7941d]/15"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAsk}
                  disabled={!question.trim() || !askName.trim() || askStatus === 'sending'}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f7941d] py-3 text-sm font-bold text-white transition hover:bg-[#e07810] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {askStatus === 'sending' ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Versturen…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Vraag versturen
                    </>
                  )}
                </button>
                {askStatus === 'error' && (
                  <p className="text-center text-xs text-red-500">
                    Er ging iets mis. Probeer opnieuw of contacteer {company?.email || 'facturatie@mv3d.be'}.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-[10px] text-slate-400">
          MV3D.CLOUD · facturatie@mv3d.be · BTW: BE0672960066
        </p>
      </div>
    </div>
  )
}
