'use client'

import jsPDF from 'jspdf'
import type { DocumentData, DocumentLine } from './document-types'
import { generateOGM } from './ogm'

// ── Page geometry ──────────────────────────────────────────────────────────────
const ML = 15        // margin left
const MR = 195       // margin right
const CW = MR - ML   // content width = 180 mm
const PW = 210       // page width A4

// ── Brand palette ──────────────────────────────────────────────────────────────
type RGB = [number, number, number]
const P = {
  headerBg:   [13, 18, 33]   as RGB,   // deep navy header
  accent:     [247, 148, 29] as RGB,   // MV3D orange #f7941d
  tableHdr:   [20, 28, 50]   as RGB,   // table header dark
  accentPale: [255, 248, 235] as RGB,  // very light orange tint
  rowOdd:     [248, 250, 252] as RGB,
  rowEven:    [255, 255, 255] as RGB,
  border:     [218, 228, 242] as RGB,
  textDark:   [15, 23, 42]   as RGB,
  textSoft:   [80, 100, 130]  as RGB,
  textMuted:  [150, 165, 190] as RGB,
  headerText: [200, 215, 235] as RGB,
  white:      [255, 255, 255] as RGB,
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  const [int, dec] = n.toFixed(2).split('.')
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-BE')
}

function fill(pdf: jsPDF, c: RGB) { pdf.setFillColor(c[0], c[1], c[2]) }
function ink(pdf: jsPDF, c: RGB)  { pdf.setTextColor(c[0], c[1], c[2]) }
function rule(pdf: jsPDF, c: RGB) { pdf.setDrawColor(c[0], c[1], c[2]) }

function addressLines(c: {
  company_name?: string | null; full_name?: string | null
  street?: string | null; house_number?: string | null; bus?: string | null
  postal_code?: string | null; city?: string | null; country?: string | null
  vat_number?: string | null
}): string[] {
  const lines: string[] = []
  if (c.company_name) lines.push(c.company_name)
  if (c.full_name && c.full_name !== c.company_name) lines.push(c.full_name)
  const street = [c.street, c.house_number, c.bus ? `bus ${c.bus}` : ''].filter(Boolean).join(' ')
  if (street) lines.push(street)
  const city = [c.postal_code, c.city].filter(Boolean).join(' ')
  if (city) lines.push(city)
  if (c.country && c.country.toUpperCase() !== 'BE') lines.push(c.country)
  if (c.vat_number) lines.push(`BTW: ${c.vat_number}`)
  return lines
}

async function loadLogo(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const isSvg = blob.type.includes('svg') || url.toLowerCase().endsWith('.svg')

    const rawUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })

    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const w = img.naturalWidth  || 200
        const h = img.naturalHeight || 80
        if (isSvg) {
          const scale = 4
          const cv = document.createElement('canvas')
          cv.width  = w * scale
          cv.height = h * scale
          const ctx = cv.getContext('2d')
          if (ctx) {
            ctx.scale(scale, scale)
            ctx.drawImage(img, 0, 0)
            resolve({ data: cv.toDataURL('image/png'), w, h })
          } else {
            resolve({ data: rawUrl, w, h })
          }
        } else {
          resolve({ data: rawUrl, w, h })
        }
      }
      img.onerror = () => resolve(null)
      img.src = rawUrl
    })
  } catch {
    return null
  }
}

// ── Main generator ─────────────────────────────────────────────────────────────
export async function generatePDF(doc: DocumentData): Promise<jsPDF> {
  const pdf   = new jsPDF({ unit: 'mm', format: 'a4' })
  const isFac = doc.type === 'factuur'
  const label = isFac ? 'FACTUUR' : 'OFFERTE'

  // Load logo (prefer company logo_url, fall back to MV3D asset)
  const logoSrc = doc.company.logo_url || '/mv3d-logo.svg'
  const logo    = await loadLogo(logoSrc)

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const STRIPE = 2.5   // accent stripe height
  const HDR_H  = 42    // dark header height

  // Orange accent stripe at very top
  fill(pdf, P.accent)
  pdf.rect(0, 0, PW, STRIPE, 'F')

  // Dark navy header body
  fill(pdf, P.headerBg)
  pdf.rect(0, STRIPE, PW, HDR_H, 'F')

  // Logo (left, vertically centered in header)
  let logoEndX = ML
  const LOGO_MAX_H = 20
  const LOGO_MAX_W = 48
  if (logo) {
    try {
      const asp = logo.w / logo.h
      let lw = LOGO_MAX_H * asp, lh = LOGO_MAX_H
      if (lw > LOGO_MAX_W) { lw = LOGO_MAX_W; lh = LOGO_MAX_W / asp }
      const ly = STRIPE + (HDR_H - lh) / 2
      pdf.addImage(logo.data, 'PNG', ML, ly, lw, lh)
      logoEndX = ML + lw + 5
    } catch { /* skip on error */ }
  }

  // Company name
  ink(pdf, P.white)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.text(doc.company.company_name || 'MV3D.CLOUD', logoEndX, STRIPE + 10)

  // Company address details
  ink(pdf, P.headerText)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  let cy = STRIPE + 15.5
  const compLines = addressLines(doc.company)
  compLines.forEach(l => { pdf.text(l, logoEndX, cy); cy += 3.6 })
  if (doc.company.email) { pdf.text(doc.company.email, logoEndX, cy); cy += 3.6 }
  if (doc.company.phone) { pdf.text(doc.company.phone, logoEndX, cy); cy += 3.6 }

  // Document type label (right, accent orange)
  ink(pdf, P.accent)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(28)
  pdf.text(label, MR, STRIPE + 16, { align: 'right' })

  // Document number (white)
  ink(pdf, P.white)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text(doc.number, MR, STRIPE + 24, { align: 'right' })

  // Dates (soft header text)
  ink(pdf, P.headerText)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  let ry = STRIPE + 29.5
  pdf.text(`Datum: ${fmtDate(doc.created_at)}`, MR, ry, { align: 'right' })
  ry += 4.5
  if (isFac && doc.due_date) {
    pdf.text(`Vervaldatum: ${fmtDate(doc.due_date)}`, MR, ry, { align: 'right' })
  } else if (!isFac && doc.valid_until) {
    pdf.text(`Geldig tot: ${fmtDate(doc.valid_until)}`, MR, ry, { align: 'right' })
  }

  // ── BODY ────────────────────────────────────────────────────────────────────
  let y = STRIPE + HDR_H + 8  // ≈ 52.5

  // ── CLIENT BOX ──────────────────────────────────────────────────────────────
  const custLines = addressLines(doc.customer)
  if (doc.customer.email) custLines.push(doc.customer.email)
  if (doc.customer.phone) custLines.push(doc.customer.phone)

  const BOX_PAD = 4
  const BOX_LH  = 4.0
  const BOX_HDR = 7
  const BOX_W   = 83
  const clientH = BOX_PAD + BOX_HDR + custLines.length * BOX_LH + BOX_PAD + 1

  fill(pdf, [251, 252, 255] as RGB)
  rule(pdf, P.border)
  pdf.setLineWidth(0.25)
  pdf.rect(ML, y, BOX_W, clientH, 'FD')

  // Orange left accent bar
  fill(pdf, P.accent)
  pdf.rect(ML, y, 3, clientH, 'F')

  ink(pdf, P.accent)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6.5)
  pdf.text('GEFACTUREERD AAN', ML + 6, y + BOX_PAD + 2)

  let by = y + BOX_PAD + BOX_HDR
  if (custLines[0]) {
    ink(pdf, P.textDark)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9.5)
    pdf.text(custLines[0], ML + 6, by)
    by += BOX_LH + 1
  }
  ink(pdf, P.textSoft)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  custLines.slice(1).forEach(l => { pdf.text(l, ML + 6, by); by += BOX_LH })

  // ── SUBJECT / DESCRIPTION (right column) ─────────────────────────────────
  const subX = ML + BOX_W + 8
  const subW = CW - BOX_W - 8
  let subBottom = y

  if (doc.subject) {
    ink(pdf, P.textDark)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    const subLines = pdf.splitTextToSize(doc.subject, subW)
    pdf.text(subLines, subX, y + 6)
    subBottom = y + 6 + subLines.length * 5.5

    if (doc.description) {
      ink(pdf, P.textSoft)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8.5)
      const descLines = pdf.splitTextToSize(doc.description, subW)
      pdf.text(descLines, subX, subBottom + 2)
      subBottom += 2 + descLines.length * 4.2
    }
  } else if (doc.description) {
    ink(pdf, P.textSoft)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const descLines = pdf.splitTextToSize(doc.description, subW)
    pdf.text(descLines, subX, y + 6)
    subBottom = y + 6 + descLines.length * 4.5
  }

  y = Math.max(y + clientH, subBottom) + 9

  // ── ORANGE DIVIDER ────────────────────────────────────────────────────────
  fill(pdf, P.accent)
  pdf.rect(ML, y, CW, 0.6, 'F')
  y += 7

  // ── LINE ITEMS TABLE ─────────────────────────────────────────────────────────
  const C_NUM   = ML + 2
  const C_DESC  = ML + 11
  const C_QTY   = 112
  const C_UNIT  = 116
  const C_PRICE = 157
  const C_VAT   = 174
  const C_TOTAL = MR
  const ROW_H   = 6.5

  function drawTableHeader(sy: number): number {
    fill(pdf, P.tableHdr)
    pdf.rect(ML, sy, CW, ROW_H, 'F')
    ink(pdf, P.white)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6.8)
    const ty = sy + 4.3
    pdf.text('#',             C_NUM,   ty)
    pdf.text('OMSCHRIJVING',  C_DESC,  ty)
    pdf.text('AANTAL',        C_QTY,   ty, { align: 'right' })
    pdf.text('EENH.',         C_UNIT,  ty)
    pdf.text('EENHEIDSPRIJS', C_PRICE, ty, { align: 'right' })
    pdf.text('BTW',           C_VAT,   ty, { align: 'right' })
    pdf.text('TOTAAL',        C_TOTAL, ty, { align: 'right' })
    return sy + ROW_H
  }

  y = drawTableHeader(y)

  doc.lines.forEach((line: DocumentLine, i: number) => {
    const wrapped = pdf.splitTextToSize(line.description, C_QTY - C_DESC - 4)
    const dynH = Math.max(ROW_H, wrapped.length * 4.2 + 3)

    if (y + dynH > 265) {
      pdf.addPage()
      y = 15
      y = drawTableHeader(y)
    }

    fill(pdf, i % 2 === 0 ? P.rowOdd : P.rowEven)
    pdf.rect(ML, y, CW, dynH, 'F')

    const ty = y + 4.2
    ink(pdf, P.textMuted)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7.5)
    pdf.text(String(i + 1), C_NUM, ty)

    ink(pdf, P.textDark)
    pdf.setFontSize(8.5)
    pdf.text(wrapped, C_DESC, ty)

    ink(pdf, P.textSoft)
    pdf.setFontSize(8)
    pdf.text(String(line.quantity),          C_QTY,   ty, { align: 'right' })
    pdf.text(line.unit || 'stuk',            C_UNIT,  ty)
    pdf.text(`€ ${fmt(line.unit_price)}`,    C_PRICE, ty, { align: 'right' })
    pdf.text(line.vat_rate || '21%',         C_VAT,   ty, { align: 'right' })

    ink(pdf, P.textDark)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`€ ${fmt(line.line_total)}`,    C_TOTAL, ty, { align: 'right' })
    pdf.setFont('helvetica', 'normal')

    y += dynH
  })

  // Table bottom rule
  rule(pdf, P.border)
  pdf.setLineWidth(0.3)
  pdf.line(ML, y, MR, y)
  y += 8

  // ── TOTALS ───────────────────────────────────────────────────────────────────
  const TOT_X = 128
  const TOT_W = MR - TOT_X

  ink(pdf, P.textSoft)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.text('Subtotaal excl. BTW', TOT_X, y)
  ink(pdf, P.textDark)
  pdf.text(`€ ${fmt(doc.subtotal)}`, MR, y, { align: 'right' })
  y += 5.5

  ink(pdf, P.textSoft)
  pdf.text('BTW', TOT_X, y)
  ink(pdf, P.textDark)
  pdf.text(`€ ${fmt(doc.vat_amount)}`, MR, y, { align: 'right' })
  y += 5

  rule(pdf, P.border)
  pdf.setLineWidth(0.2)
  pdf.line(TOT_X, y, MR, y)
  y += 3

  // Total box with orange accent background
  const TOT_H = 10
  fill(pdf, P.accent)
  pdf.roundedRect(TOT_X, y, TOT_W, TOT_H, 2, 2, 'F')
  ink(pdf, P.white)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.text('TOTAAL (incl. BTW)', TOT_X + 4, y + 6.3)
  pdf.setFontSize(12)
  pdf.text(`€ ${fmt(doc.total)}`, MR - 3, y + 6.8, { align: 'right' })
  y += TOT_H + 10

  // ── NOTES / PAYMENT TERMS ────────────────────────────────────────────────────
  if (doc.payment_terms) {
    ink(pdf, P.textMuted)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(7.5)
    pdf.text(`Betalingsvoorwaarden: ${doc.payment_terms}`, ML, y)
    y += 5.5
  }
  if (doc.notes) {
    ink(pdf, P.textMuted)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.text('Opmerkingen', ML, y)
    y += 4
    ink(pdf, P.textSoft)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    const noteLines = pdf.splitTextToSize(doc.notes, CW)
    pdf.text(noteLines, ML, y)
    y += noteLines.length * 3.8 + 5
  }

  // ── PAYMENT INFO BOX (factuur only) ──────────────────────────────────────────
  if (isFac && (doc.company.iban || doc.due_date)) {
    y += 2
    const ogm = doc.id ? generateOGM(doc.id) : null

    type PayRow = { label: string; value: string; big?: boolean }
    const rows: PayRow[] = []
    if (doc.company.iban) {
      rows.push({ label: 'IBAN', value: doc.company.iban })
      if (doc.company.bic) rows.push({ label: 'BIC', value: doc.company.bic })
    }
    rows.push({ label: 'Gestructureerde mededeling', value: ogm ?? doc.number, big: !!ogm })
    if (doc.due_date) rows.push({ label: 'Te betalen voor', value: fmtDate(doc.due_date) })

    const PAY_PAD   = 5
    const PAY_HDR_H = 8
    const PAY_ROW_H = 5.5
    const extraH    = rows.filter(r => r.big).length * 4
    const payH      = PAY_PAD + PAY_HDR_H + rows.length * PAY_ROW_H + extraH + PAY_PAD

    fill(pdf, P.accentPale)
    rule(pdf, [240, 210, 170] as RGB)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(ML, y, CW, payH, 2.5, 2.5, 'FD')

    // Orange left accent bar
    fill(pdf, P.accent)
    pdf.rect(ML, y, 4, payH, 'F')

    ink(pdf, P.accent)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text('BETAALINSTRUCTIES', ML + 9, y + PAY_PAD + 2.5)

    rule(pdf, [240, 210, 170] as RGB)
    pdf.setLineWidth(0.2)
    pdf.line(ML + 9, y + PAY_PAD + 4.5, MR - 4, y + PAY_PAD + 4.5)

    let py = y + PAY_PAD + PAY_HDR_H
    rows.forEach(row => {
      ink(pdf, P.textMuted)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7)
      pdf.text(`${row.label}:`, ML + 9, py)

      if (row.big) {
        ink(pdf, P.textDark)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        pdf.text(row.value, ML + 9, py + 5)
        py += PAY_ROW_H + 4
      } else {
        ink(pdf, P.textDark)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8.5)
        pdf.text(row.value, ML + 52, py)
        py += PAY_ROW_H
      }
    })

    y += payH
  }

  // ── VALIDITY NOTE (offerte only) ─────────────────────────────────────────────
  if (!isFac && doc.valid_until) {
    y += 4
    fill(pdf, [248, 252, 248] as RGB)
    rule(pdf, [180, 220, 180] as RGB)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(ML, y, CW, 14, 2, 2, 'FD')
    fill(pdf, [80, 180, 100] as RGB)
    pdf.rect(ML, y, 4, 14, 'F')
    ink(pdf, [50, 140, 70] as RGB)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7.5)
    pdf.text('GELDIGHEID', ML + 9, y + 5)
    ink(pdf, P.textSoft)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(
      `Deze offerte is geldig tot ${fmtDate(doc.valid_until)}. Ondertekening geldt als aanvaarding.`,
      ML + 9, y + 10
    )
    y += 18
  }

  // ── FOOTER (all pages) ────────────────────────────────────────────────────────
  const pageCount = pdf.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    pdf.setPage(p)

    // Thin orange line
    fill(pdf, P.accent)
    pdf.rect(0, 287, PW, 0.8, 'F')

    // Dark footer band
    fill(pdf, P.headerBg)
    pdf.rect(0, 287.8, PW, 9.2, 'F')

    const co  = doc.company.company_name || 'MV3D.CLOUD'
    const em  = doc.company.email ? ` · ${doc.company.email}` : ''
    const vat = doc.company.vat_number ? ` · BTW: ${doc.company.vat_number}` : ''

    ink(pdf, P.headerText)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.5)
    pdf.text(`${co}${em}${vat}`, ML, 293)
    pdf.text(`${doc.number}  ·  Pagina ${p} van ${pageCount}`, MR, 293, { align: 'right' })
  }

  pdf.setTextColor(0, 0, 0)
  return pdf
}

export async function downloadPDF(doc: DocumentData) {
  const pdf = await generatePDF(doc)
  pdf.save(`${doc.number}.pdf`)
}
