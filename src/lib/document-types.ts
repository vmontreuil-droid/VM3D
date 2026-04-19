// Shared types for offerte/factuur documents

export type DocumentLine = {
  position: number
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: string
  line_total: number
}

export type CompanyInfo = {
  company_name: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  vat_number: string | null
  street: string | null
  house_number: string | null
  bus: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  iban: string | null
  bic: string | null
  logo_url: string | null
}

export type DocumentData = {
  id?: number
  type: 'offerte' | 'factuur'
  number: string
  status: string
  subject: string | null
  description: string | null
  created_at: string
  valid_until?: string | null    // offerte
  due_date?: string | null       // factuur
  sign_link?: string | null      // offerte online handtekening
  payment_terms: string | null
  notes: string | null
  currency: string
  subtotal: number
  vat_amount: number
  total: number
  lines: DocumentLine[]
  customer: CompanyInfo
  company: CompanyInfo           // jouw bedrijf
}
