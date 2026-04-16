'use client'

import jsPDF from 'jspdf'
import type { DocumentData, DocumentLine } from './document-types'
import { generateOGM } from './ogm'

const MARGIN_LEFT = 20
const MARGIN_RIGHT = 190
const PAGE_WIDTH = 210
const CONTENT_WIDTH = MARGIN_RIGHT - MARGIN_LEFT

function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-BE')
}

async function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => reject()
      reader.readAsDataURL(blob)
    })
    // Get natural dimensions via Image element
    const dims: { width: number; height: number } = await new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => resolve({ width: 1, height: 1 })
      img.src = dataUrl
    })
    return { dataUrl, width: dims.width, height: dims.height }
  } catch {
    return null
  }
}

function addressBlock(c: { company_name?: string | null; full_name?: string | null; street?: string | null; house_number?: string | null; bus?: string | null; postal_code?: string | null; city?: string | null; country?: string | null; vat_number?: string | null }): string[] {
  const lines: string[] = []
  if (c.company_name) lines.push(c.company_name)
  if (c.full_name && c.full_name !== c.company_name) lines.push(c.full_name)
  const streetLine = [c.street, c.house_number, c.bus ? `bus ${c.bus}` : ''].filter(Boolean).join(' ')
  if (streetLine) lines.push(streetLine)
  const cityLine = [c.postal_code, c.city].filter(Boolean).join(' ')
  if (cityLine) lines.push(cityLine)
  if (c.country && c.country !== 'BE') lines.push(c.country)
  if (c.vat_number) lines.push(`BTW: ${c.vat_number}`)
  return lines
}

export async function generatePDF(doc: DocumentData): Promise<jsPDF> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const typeLabel = doc.type === 'factuur' ? 'Factuur' : 'Offerte'

  // --- Logo ---
  let logoImg: { dataUrl: string; width: number; height: number } | null = null
  if (doc.company.logo_url) {
    logoImg = await loadImageAsDataUrl(doc.company.logo_url)
  }

  // --- Header ---
  let y = 20
  let logoEndX = MARGIN_LEFT
  const LOGO_MAX_H = 18 // mm
  const LOGO_MAX_W = 45 // mm

  if (logoImg) {
    try {
      const aspect = logoImg.width / logoImg.height
      let logoW = LOGO_MAX_H * aspect
      let logoH = LOGO_MAX_H
      if (logoW > LOGO_MAX_W) {
        logoW = LOGO_MAX_W
        logoH = LOGO_MAX_W / aspect
      }
      pdf.addImage(logoImg.dataUrl, 'PNG', MARGIN_LEFT, y - 2, logoW, logoH)
      logoEndX = MARGIN_LEFT + logoW + 4
    } catch { /* logo load failed, skip */ }
  }

  // Company info (left, offset if logo present)
  const textX = logoImg ? logoEndX : MARGIN_LEFT
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text(doc.company.company_name || 'VM Plan & Consult', textX, y)
  y += 6
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  const companyLines = addressBlock(doc.company)
  companyLines.forEach((line) => {
    pdf.text(line, textX, y)
    y += 3.5
  })
  if (doc.company.email) { pdf.text(doc.company.email, textX, y); y += 3.5 }
  if (doc.company.phone) { pdf.text(doc.company.phone, textX, y); y += 3.5 }
  if (doc.company.iban) { pdf.text(`IBAN: ${doc.company.iban}`, textX, y); y += 3.5 }
  if (doc.company.bic) { pdf.text(`BIC: ${doc.company.bic}`, textX, y); y += 3.5 }
  // Ensure y is below logo
  if (logoImg) y = Math.max(y, 20 + LOGO_MAX_H + 2)

  // Document title (right)
  pdf.setFontSize(22)
  pdf.setFont('helvetica', 'bold')
  pdf.text(typeLabel.toUpperCase(), MARGIN_RIGHT, 22, { align: 'right' })

  // Document number + date (right)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  let ry = 30
  pdf.text(`Nr: ${doc.number}`, MARGIN_RIGHT, ry, { align: 'right' })
  ry += 4
  pdf.text(`Datum: ${fmtDate(doc.created_at)}`, MARGIN_RIGHT, ry, { align: 'right' })
  ry += 4
  if (doc.type === 'offerte' && doc.valid_until) {
    pdf.text(`Geldig tot: ${fmtDate(doc.valid_until)}`, MARGIN_RIGHT, ry, { align: 'right' })
    ry += 4
  }
  if (doc.type === 'factuur' && doc.due_date) {
    pdf.text(`Vervaldatum: ${fmtDate(doc.due_date)}`, MARGIN_RIGHT, ry, { align: 'right' })
    ry += 4
  }

  // --- Klant ---
  y = Math.max(y, ry) + 8
  pdf.setFillColor(245, 245, 245)
  pdf.rect(MARGIN_LEFT, y - 1, CONTENT_WIDTH, 5, 'F')
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('KLANT', MARGIN_LEFT + 2, y + 2.5)
  y += 7
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  const custLines = addressBlock(doc.customer)
  custLines.forEach((line) => {
    pdf.text(line, MARGIN_LEFT + 2, y)
    y += 3.8
  })
  if (doc.customer.email) { pdf.text(doc.customer.email, MARGIN_LEFT + 2, y); y += 3.8 }

  // --- Subject ---
  if (doc.subject) {
    y += 4
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Betreft: ${doc.subject}`, MARGIN_LEFT, y)
    y += 5
  }
  if (doc.description) {
    pdf.setFontSize(8.5)
    pdf.setFont('helvetica', 'normal')
    const descLines = pdf.splitTextToSize(doc.description, CONTENT_WIDTH)
    pdf.text(descLines, MARGIN_LEFT, y)
    y += descLines.length * 3.5 + 2
  }

  // --- Line items table ---
  y += 4
  const colX = {
    desc: MARGIN_LEFT,
    qty: 105,
    unit: 118,
    price: 140,
    vat: 158,
    total: MARGIN_RIGHT,
  }

  // Table header
  pdf.setFillColor(40, 40, 45)
  pdf.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'bold')
  y += 4
  pdf.text('Omschrijving', colX.desc + 2, y)
  pdf.text('Aantal', colX.qty, y, { align: 'right' })
  pdf.text('Eenh.', colX.unit, y)
  pdf.text('Prijs', colX.price, y, { align: 'right' })
  pdf.text('BTW', colX.vat, y, { align: 'right' })
  pdf.text('Totaal', colX.total, y, { align: 'right' })
  pdf.setTextColor(0, 0, 0)
  y += 4

  // Table rows
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  doc.lines.forEach((line: DocumentLine, i: number) => {
    if (y > 265) {
      pdf.addPage()
      y = 20
    }
    if (i % 2 === 0) {
      pdf.setFillColor(250, 250, 250)
      pdf.rect(MARGIN_LEFT, y - 3, CONTENT_WIDTH, 5.5, 'F')
    }
    const descWrapped = pdf.splitTextToSize(line.description, colX.qty - colX.desc - 8)
    pdf.text(descWrapped, colX.desc + 2, y)
    pdf.text(String(line.quantity), colX.qty, y, { align: 'right' })
    pdf.text(line.unit || '', colX.unit, y)
    pdf.text(`€${fmt(line.unit_price)}`, colX.price, y, { align: 'right' })
    pdf.text(line.vat_rate || '21%', colX.vat, y, { align: 'right' })
    pdf.text(`€${fmt(line.line_total)}`, colX.total, y, { align: 'right' })
    y += Math.max(descWrapped.length * 3.5, 5.5)
  })

  // --- Totals ---
  y += 4
  pdf.setDrawColor(200, 200, 200)
  pdf.line(130, y, MARGIN_RIGHT, y)
  y += 5

  pdf.setFontSize(8.5)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Subtotaal:', 135, y)
  pdf.text(`€${fmt(doc.subtotal)}`, MARGIN_RIGHT, y, { align: 'right' })
  y += 4.5
  pdf.text('BTW:', 135, y)
  pdf.text(`€${fmt(doc.vat_amount)}`, MARGIN_RIGHT, y, { align: 'right' })
  y += 5
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('TOTAAL:', 135, y)
  pdf.text(`€${fmt(doc.total)}`, MARGIN_RIGHT, y, { align: 'right' })

  // --- Payment terms / notes ---
  y += 10
  if (doc.payment_terms) {
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Betalingsvoorwaarden: ${doc.payment_terms}`, MARGIN_LEFT, y)
    y += 5
  }
  if (doc.notes) {
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    const noteLines = pdf.splitTextToSize(`Opmerkingen: ${doc.notes}`, CONTENT_WIDTH)
    pdf.text(noteLines, MARGIN_LEFT, y)
    y += noteLines.length * 3.5 + 2
  }

  // --- Banking info (factuur only) ---
  if (doc.type === 'factuur') {
    y += 4
    const ogm = doc.id ? generateOGM(doc.id) : null
    const hasBank = !!doc.company.iban
    const hasDue = !!doc.due_date

    // Calculate box height dynamically
    let boxH = 6 // header row
    if (hasBank) boxH += 4
    if (ogm) boxH += 4
    else boxH += 4 // mededeling: doc.number
    if (hasDue) boxH += 4
    boxH += 2 // padding

    pdf.setFillColor(245, 245, 250)
    pdf.rect(MARGIN_LEFT, y - 2, CONTENT_WIDTH, boxH, 'F')
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.text('BETALINGSGEGEVENS', MARGIN_LEFT + 2, y + 2)
    pdf.setFont('helvetica', 'normal')
    let by = y + 6
    if (hasBank) {
      pdf.text(`IBAN: ${doc.company.iban}`, MARGIN_LEFT + 2, by)
      if (doc.company.bic) pdf.text(`BIC: ${doc.company.bic}`, 100, by)
      by += 4
    }
    if (ogm) {
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Gestructureerde mededeling: ${ogm}`, MARGIN_LEFT + 2, by)
      pdf.setFont('helvetica', 'normal')
    } else {
      pdf.text(`Mededeling: ${doc.number}`, MARGIN_LEFT + 2, by)
    }
    by += 4
    if (hasDue) {
      pdf.text(`Vervaldatum: ${fmtDate(doc.due_date)}`, MARGIN_LEFT + 2, by)
    }
  }

  // Footer
  const pageCount = pdf.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    pdf.setPage(p)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(150, 150, 150)
    pdf.text(`${typeLabel} ${doc.number} — Pagina ${p}/${pageCount}`, PAGE_WIDTH / 2, 290, { align: 'center' })
    pdf.setTextColor(0, 0, 0)
  }

  return pdf
}

export async function downloadPDF(doc: DocumentData) {
  const pdf = await generatePDF(doc)
  pdf.save(`${doc.number}.pdf`)
}
