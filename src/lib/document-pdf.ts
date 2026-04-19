'use client'

import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import type { DocumentData, DocumentLine } from './document-types'
import { generateOGM } from './ogm'

// ── Page geometry ───────────────────────────────────────────────
const ML = 15
const MR = 195
const CW = MR - ML
const PW = 210

// ── MV3D.CLOUD brand defaults ───────────────────────────────────
const BRAND = {
  name:  'MV3D.CLOUD',
  email: 'facturatie@mv3d.be',
  vat:   'BE0672960066',
  web:   'www.mv3d.cloud',
}

// ── Palette (light / warm white + orange) ──────────────────────
type RGB = [number, number, number]
const P = {
  orange:     [247, 148, 29]  as RGB,   // #f7941d
  orangeLight:[255, 244, 225] as RGB,   // very light orange tint
  orangeBg:   [255, 249, 238] as RGB,   // softer warm bg
  navy:       [18,  24,  42]  as RGB,   // dark text / nav
  border:     [234, 223, 204] as RGB,   // warm border
  borderSoft: [240, 234, 220] as RGB,
  tableHdr:   [78,  90, 112]  as RGB,   // table header (licht grijs-blauw)
  rowOdd:     [251, 249, 246] as RGB,   // warm off-white
  rowEven:    [255, 255, 255] as RGB,
  textDark:   [22,  28,  46]  as RGB,
  textSoft:   [90,  100, 120] as RGB,
  textMuted:  [155, 165, 182] as RGB,
  green:      [34,  160, 80]  as RGB,
  white:      [255, 255, 255] as RGB,
}

// ── Helpers ─────────────────────────────────────────────────────
function fmt(n: number): string {
  const [i, d] = n.toFixed(2).split('.')
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d}`
}
function fmtDate(d: string | null | undefined) {
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
          if (ctx) { ctx.scale(scale, scale); ctx.drawImage(img, 0, 0) }
          resolve({ data: cv.toDataURL('image/png'), w, h })
        } else {
          resolve({ data: rawUrl, w, h })
        }
      }
      img.onerror = () => resolve(null)
      img.src = rawUrl
    })
  } catch { return null }
}

function buildEpcString(iban: string, bic: string | null, name: string, amount: number, ref: string): string {
  return ['BCD', '002', '1', 'SCT', bic || '', name, iban.replace(/\s/g, ''), `EUR${amount.toFixed(2)}`, '', ref, ''].join('\n')
}

async function qrDataUrl(data: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(data, {
      width: 220, margin: 1,
      color: { dark: '#121826', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
  } catch { return null }
}

// ── Main ────────────────────────────────────────────────────────
export async function generatePDF(doc: DocumentData): Promise<jsPDF> {
  const pdf   = new jsPDF({ unit: 'mm', format: 'a4' })
  const isFac = doc.type === 'factuur'
  const label = isFac ? 'FACTUUR' : 'OFFERTE'

  // Always use MV3D.CLOUD brand — ignore DB company_name / logo_url
  const companyName  = BRAND.name
  const companyEmail = doc.company.email || BRAND.email
  const companyVat   = BRAND.vat

  const logo = await loadLogo('/mv3d-logo-light.svg')

  // ── HEADER (white bg, orange stripe) ────────────────────────
  const STRIPE  = 2.5
  const HDR_H   = 38

  // White header bg (full page)
  fill(pdf, P.white)
  pdf.rect(0, 0, PW, STRIPE + HDR_H, 'F')

  // Orange stripe at very top
  fill(pdf, P.orange)
  pdf.rect(0, 0, PW, STRIPE, 'F')

  // Logo (left, within white area)
  let logoEndX = ML
  const LOGO_MAX_H = 18
  const LOGO_MAX_W = 42
  if (logo) {
    try {
      const asp = logo.w / logo.h
      let lw = LOGO_MAX_H * asp, lh = LOGO_MAX_H
      if (lw > LOGO_MAX_W) { lw = LOGO_MAX_W; lh = LOGO_MAX_W / asp }
      const ly = STRIPE + (HDR_H - lh) / 2
      pdf.addImage(logo.data, 'PNG', ML, ly, lw, lh)
      logoEndX = ML + lw + 5
    } catch { /* skip */ }
  }

  // Company name: "MV3D." dark + "CLOUD" orange
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  ink(pdf, P.navy)
  pdf.text('MV3D.', logoEndX, STRIPE + 10)
  const mv3dW = pdf.getTextWidth('MV3D.')
  ink(pdf, P.orange)
  pdf.text('CLOUD', logoEndX + mv3dW, STRIPE + 10)

  // Company details
  ink(pdf, P.textSoft)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  let cy = STRIPE + 15
  const compLines = addressLines({ ...doc.company, company_name: null, full_name: null })
  if (doc.company.street || doc.company.city) {
    compLines.forEach(l => { pdf.text(l, logoEndX, cy); cy += 3.5 })
  }
  pdf.text(companyEmail, logoEndX, cy); cy += 3.5
  pdf.text(`BTW: ${companyVat}`, logoEndX, cy)

  // Document type (right, large orange)
  ink(pdf, P.orange)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(30)
  pdf.text(label, MR, STRIPE + 17, { align: 'right' })

  // Document number (dark, right)
  ink(pdf, P.navy)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9.5)
  pdf.text(doc.number, MR, STRIPE + 25, { align: 'right' })

  // Dates (soft, right)
  ink(pdf, P.textSoft)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  let ry = STRIPE + 30
  pdf.text(`Datum: ${fmtDate(doc.created_at)}`, MR, ry, { align: 'right' })
  ry += 4.5
  if (isFac && doc.due_date) {
    pdf.text(`Vervaldatum: ${fmtDate(doc.due_date)}`, MR, ry, { align: 'right' })
  } else if (!isFac && doc.valid_until) {
    pdf.text(`Geldig tot: ${fmtDate(doc.valid_until)}`, MR, ry, { align: 'right' })
  }

  // Header bottom border (warm orange line)
  fill(pdf, P.orange)
  pdf.rect(0, STRIPE + HDR_H, PW, 0.7, 'F')

  // ── BODY ────────────────────────────────────────────────────
  let y = STRIPE + HDR_H + 8

  // ── CLIENT BOX ──────────────────────────────────────────────
  const custLines = addressLines(doc.customer)
  if (doc.customer.email) custLines.push(doc.customer.email)
  if (doc.customer.phone) custLines.push(doc.customer.phone)

  const BOX_PAD = 4, BOX_LH = 4.0, BOX_HDR_H = 7, BOX_W = 80
  const clientH = BOX_PAD + BOX_HDR_H + custLines.length * BOX_LH + BOX_PAD

  fill(pdf, P.orangeBg)
  rule(pdf, P.border)
  pdf.setLineWidth(0.3)
  pdf.rect(ML, y, BOX_W, clientH, 'FD')
  fill(pdf, P.orange)
  pdf.rect(ML, y, 3.5, clientH, 'F')

  ink(pdf, P.orange)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6.5)
  pdf.text('GEFACTUREERD AAN', ML + 7, y + BOX_PAD + 2)

  let by = y + BOX_PAD + BOX_HDR_H
  if (custLines[0]) {
    ink(pdf, P.textDark)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9.5)
    pdf.text(custLines[0], ML + 7, by); by += BOX_LH + 1
  }
  ink(pdf, P.textSoft)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  custLines.slice(1).forEach(l => { pdf.text(l, ML + 7, by); by += BOX_LH })

  // Subject / description (right of client box)
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

  // Warm orange divider line
  fill(pdf, P.orange)
  pdf.rect(ML, y, CW, 0.6, 'F')
  y += 7

  // ── TABLE ────────────────────────────────────────────────────
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
    pdf.text(String(line.quantity),       C_QTY,   ty, { align: 'right' })
    pdf.text(line.unit || 'stuk',         C_UNIT,  ty)
    pdf.text(`€ ${fmt(line.unit_price)}`, C_PRICE, ty, { align: 'right' })
    pdf.text(line.vat_rate || '21%',      C_VAT,   ty, { align: 'right' })

    ink(pdf, P.textDark)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`€ ${fmt(line.line_total)}`, C_TOTAL, ty, { align: 'right' })
    pdf.setFont('helvetica', 'normal')
    y += dynH
  })

  // Table bottom border
  rule(pdf, P.border)
  pdf.setLineWidth(0.3)
  pdf.line(ML, y, MR, y)
  y += 8

  // ── TOTALS ───────────────────────────────────────────────────
  const TOT_X = 128
  const TOT_W = MR - TOT_X

  // Subtotaal + BTW box (bordered)
  fill(pdf, P.orangeBg)
  rule(pdf, P.borderSoft)
  pdf.setLineWidth(0.25)
  pdf.roundedRect(TOT_X, y, TOT_W, 14, 2, 2, 'FD')

  ink(pdf, P.textSoft)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.text('Subtotaal excl. BTW', TOT_X + 4, y + 5.5)
  ink(pdf, P.textDark)
  pdf.text(`€ ${fmt(doc.subtotal)}`, MR - 4, y + 5.5, { align: 'right' })

  ink(pdf, P.textSoft)
  pdf.text('BTW', TOT_X + 4, y + 10.5)
  ink(pdf, P.textDark)
  pdf.text(`€ ${fmt(doc.vat_amount)}`, MR - 4, y + 10.5, { align: 'right' })
  y += 17

  // TOTAAL pill — lichte stijl: warm bg + oranje rand, label oranje, bedrag donker
  fill(pdf, P.orangeLight)
  rule(pdf, P.orange)
  pdf.setLineWidth(0.5)
  pdf.roundedRect(TOT_X, y, TOT_W, 13, 6.5, 6.5, 'FD')
  ink(pdf, P.orange)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7.5)
  pdf.text('TOTAAL (incl. BTW)', TOT_X + 6, y + 8)
  ink(pdf, P.navy)
  pdf.setFontSize(13)
  pdf.text(`€ ${fmt(doc.total)}`, MR - 5, y + 8.5, { align: 'right' })
  y += 15 + 9

  // ── NOTES / PAYMENT TERMS ────────────────────────────────────
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
    pdf.text('Opmerkingen', ML, y); y += 4
    ink(pdf, P.textSoft)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    const noteLines = pdf.splitTextToSize(doc.notes, CW)
    pdf.text(noteLines, ML, y)
    y += noteLines.length * 3.8 + 5
  }

  // ── PAYMENT + QR CODE (factuur) ──────────────────────────────
  if (isFac && doc.company.iban) {
    y += 2
    const ogm = doc.id ? generateOGM(doc.id) : null
    const iban = doc.company.iban
    const bic  = doc.company.bic
    const ref  = ogm ?? doc.number

    // Generate EPC QR code
    const epc = buildEpcString(iban, bic ?? null, companyName, doc.total, ref)
    const qrImg = await qrDataUrl(epc)

    const QR_SIZE = 32  // mm
    const BOX_H   = QR_SIZE + 12
    const INFO_X  = ML + QR_SIZE + 14

    fill(pdf, P.orangeBg)
    rule(pdf, P.border)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(ML, y, CW, BOX_H, 3, 3, 'FD')
    fill(pdf, P.orange)
    pdf.rect(ML, y, 4, BOX_H, 'F')

    // Header
    ink(pdf, P.orange)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text('BETAALINSTRUCTIES', ML + 8, y + 6)

    rule(pdf, P.border)
    pdf.setLineWidth(0.2)
    pdf.line(ML + 8, y + 8, MR - 4, y + 8)

    // QR code image
    if (qrImg) {
      try {
        pdf.addImage(qrImg, 'PNG', ML + 6, y + 11, QR_SIZE, QR_SIZE)
      } catch { /* skip */ }
    }

    // QR label
    ink(pdf, P.textMuted)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.5)
    pdf.text('Scan met uw bankapp', ML + 6 + QR_SIZE / 2, y + 11 + QR_SIZE + 3.5, { align: 'center' })

    // Payment details (right of QR)
    let py = y + 14
    const payRows: Array<{ label: string; value: string; big?: boolean }> = [
      { label: 'IBAN', value: iban },
      ...(bic ? [{ label: 'BIC', value: bic }] : []),
      { label: 'Mededeling', value: ref, big: true },
      ...(doc.due_date ? [{ label: 'Te betalen voor', value: fmtDate(doc.due_date) }] : []),
    ]

    payRows.forEach(row => {
      ink(pdf, P.textMuted)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7)
      pdf.text(`${row.label}:`, INFO_X, py)

      if (row.big) {
        ink(pdf, P.navy)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.text(row.value, INFO_X + 32, py)
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'normal')
        py += 7
      } else {
        ink(pdf, P.textDark)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8.5)
        pdf.text(row.value, INFO_X + 32, py)
        py += 5
      }
    })

    y += BOX_H + 6
  }

  // ── VALIDITY NOTE (offerte) ──────────────────────────────────
  if (!isFac && doc.valid_until) {
    y += 4
    fill(pdf, [246, 252, 246] as RGB)
    rule(pdf, [190, 225, 195] as RGB)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(ML, y, CW, 14, 2, 2, 'FD')
    fill(pdf, P.green)
    pdf.rect(ML, y, 4, 14, 'F')
    ink(pdf, P.green)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7.5)
    pdf.text('GELDIGHEID', ML + 8, y + 5.5)
    ink(pdf, P.textSoft)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(
      `Geldig tot ${fmtDate(doc.valid_until)}. Ondertekening of schriftelijke bevestiging geldt als aanvaarding.`,
      ML + 8, y + 10.5
    )
    y += 18
  }

  // ── ONLINE GOEDKEURING (offerte met sign_link) ───────────────
  if (!isFac && doc.sign_link) {
    y += 4
    const signQr = await qrDataUrl(doc.sign_link)
    const SQ = 28
    const SBH = SQ + 16
    fill(pdf, P.orangeBg)
    rule(pdf, P.border)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(ML, y, CW, SBH, 3, 3, 'FD')
    fill(pdf, P.orange)
    pdf.rect(ML, y, 4, SBH, 'F')

    ink(pdf, P.orange)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text('ONLINE GOEDKEUREN', ML + 8, y + 6.5)
    rule(pdf, P.border)
    pdf.setLineWidth(0.2)
    pdf.line(ML + 8, y + 8.5, MR - 4, y + 8.5)

    if (signQr) {
      try { pdf.addImage(signQr, 'PNG', ML + 6, y + 11, SQ, SQ) } catch { /* skip */ }
    }
    ink(pdf, P.textMuted)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.5)
    pdf.text('Scan om te ondertekenen', ML + 6 + SQ / 2, y + 11 + SQ + 3.5, { align: 'center' })

    const lx = ML + SQ + 14
    ink(pdf, P.textSoft)
    pdf.setFontSize(8)
    pdf.text('Scan de QR-code met uw smartphone of klik op de link', lx, y + 14)
    pdf.text('om de offerte online te lezen en digitaal te ondertekenen.', lx, y + 19)
    ink(pdf, P.orange)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7.5)
    const shortUrl = doc.sign_link.replace(/^https?:\/\//, '')
    pdf.text(shortUrl, lx, y + 26)

    y += SBH + 6
  }

  // ── FOOTER (all pages) ───────────────────────────────────────
  const pageCount = pdf.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    pdf.setPage(p)
    fill(pdf, P.orange)
    pdf.rect(0, 286, PW, 0.7, 'F')
    fill(pdf, [250, 248, 244] as RGB)
    pdf.rect(0, 286.7, PW, 10.3, 'F')

    const footerLeft  = `${BRAND.name}  ·  ${companyEmail}  ·  BTW: ${companyVat}`
    const footerRight = `${doc.number}  ·  Pagina ${p} van ${pageCount}`

    ink(pdf, P.textMuted)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.5)
    pdf.text(footerLeft,  ML, 292.5)
    pdf.text(footerRight, MR, 292.5, { align: 'right' })
  }

  pdf.setTextColor(0, 0, 0)
  return pdf
}

export async function downloadPDF(doc: DocumentData) {
  const pdf = await generatePDF(doc)
  pdf.save(`${doc.number}.pdf`)
}
