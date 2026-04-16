import type { DocumentData } from './document-types'

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return new Date().toISOString().split('T')[0]
  return new Date(d).toISOString().split('T')[0]
}

function vatPercent(rate: string): number {
  const n = parseFloat(rate)
  return isNaN(n) ? 21 : n
}

/**
 * UBL 2.1 Invoice / CreditNote XML
 * Peppol BIS 3.0 compatible
 */
export function generateUBL(doc: DocumentData): string {
  const isFactuur = doc.type === 'factuur'
  const rootTag = isFactuur ? 'Invoice' : 'Invoice' // Offerte uses same schema mapped as proforma
  const typeCode = isFactuur ? '380' : '325' // 380 = Commercial Invoice, 325 = Proforma Invoice

  const c = doc.company
  const cust = doc.customer
  const curr = doc.currency || 'EUR'

  // Group lines by VAT rate for TaxTotal
  const vatGroups: Record<number, { taxable: number; tax: number }> = {}
  doc.lines.forEach((line) => {
    const pct = vatPercent(line.vat_rate)
    if (!vatGroups[pct]) vatGroups[pct] = { taxable: 0, tax: 0 }
    vatGroups[pct].taxable += line.line_total
    vatGroups[pct].tax += line.line_total * (pct / 100)
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<${rootTag} xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${esc(doc.number)}</cbc:ID>
  <cbc:IssueDate>${fmtDate(doc.created_at)}</cbc:IssueDate>${isFactuur && doc.due_date ? `
  <cbc:DueDate>${fmtDate(doc.due_date)}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode>${typeCode}</cbc:InvoiceTypeCode>${doc.notes ? `
  <cbc:Note>${esc(doc.notes)}</cbc:Note>` : ''}
  <cbc:DocumentCurrencyCode>${curr}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>${c.vat_number ? `
      <cbc:EndpointID schemeID="0208">${esc(c.vat_number)}</cbc:EndpointID>` : ''}
      <cac:PartyName>
        <cbc:Name>${esc(c.company_name || 'VM Plan & Consult')}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${esc([c.street, c.house_number].filter(Boolean).join(' '))}</cbc:StreetName>
        <cbc:CityName>${esc(c.city)}</cbc:CityName>
        <cbc:PostalZone>${esc(c.postal_code)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${esc(c.country || 'BE')}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>${c.vat_number ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${esc(c.vat_number)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(c.company_name || c.full_name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>${c.email ? `
      <cac:Contact>
        <cbc:ElectronicMail>${esc(c.email)}</cbc:ElectronicMail>${c.phone ? `
        <cbc:Telephone>${esc(c.phone)}</cbc:Telephone>` : ''}
      </cac:Contact>` : ''}
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>${cust.vat_number ? `
      <cbc:EndpointID schemeID="0208">${esc(cust.vat_number)}</cbc:EndpointID>` : ''}
      <cac:PartyName>
        <cbc:Name>${esc(cust.company_name || cust.full_name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${esc([cust.street, cust.house_number].filter(Boolean).join(' '))}</cbc:StreetName>
        <cbc:CityName>${esc(cust.city)}</cbc:CityName>
        <cbc:PostalZone>${esc(cust.postal_code)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${esc(cust.country || 'BE')}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>${cust.vat_number ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${esc(cust.vat_number)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(cust.company_name || cust.full_name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>${cust.email ? `
      <cac:Contact>
        <cbc:ElectronicMail>${esc(cust.email)}</cbc:ElectronicMail>
      </cac:Contact>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>${isFactuur && c.iban ? `
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cbc:PaymentID>${esc(doc.number)}</cbc:PaymentID>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${esc(c.iban)}</cbc:ID>${c.bic ? `
      <cac:FinancialInstitutionBranch>
        <cbc:ID>${esc(c.bic)}</cbc:ID>
      </cac:FinancialInstitutionBranch>` : ''}
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>` : ''}${doc.payment_terms ? `
  <cac:PaymentTerms>
    <cbc:Note>${esc(doc.payment_terms)}</cbc:Note>
  </cac:PaymentTerms>` : ''}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${curr}">${doc.vat_amount.toFixed(2)}</cbc:TaxAmount>${Object.entries(vatGroups).map(([pct, g]) => `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${curr}">${g.taxable.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${curr}">${g.tax.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${pct}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`).join('')}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${curr}">${doc.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${curr}">${doc.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${curr}">${doc.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${curr}">${doc.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${doc.lines.map((line, i) => `
  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${line.unit === 'stuk' ? 'C62' : line.unit === 'uur' ? 'HUR' : line.unit === 'm²' ? 'MTK' : line.unit === 'm' ? 'MTR' : 'C62'}">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${curr}">${line.line_total.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${esc(line.description)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${vatPercent(line.vat_rate)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${curr}">${line.unit_price.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join('')}
</${rootTag}>`

  return xml
}

export function downloadUBL(doc: DocumentData) {
  const xml = generateUBL(doc)
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${doc.number}.xml`
  a.click()
  URL.revokeObjectURL(url)
}
