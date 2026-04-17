import { useEffect, useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { useT } from '@/i18n/context'

export type Customer = {
  id: string
  company_name?: string | null
  full_name?: string | null
  email?: string | null
}

type Props = {
  value?: string
  onChange: (customerId: string | null, customer?: Customer) => void
  onCreateNew?: () => void
  label?: string
  placeholder?: string
  autoFocus?: boolean
}

export default function CustomerSelect({ value, onChange, onCreateNew, label, placeholder, autoFocus }: Props) {
  const { t } = useT()
  const tt = t.sharedUI
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    setLoading(true)
    const url = query
      ? `/api/admin/customers?search=${encodeURIComponent(query)}`
      : `/api/admin/customers?all=1`
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setResults(Array.isArray(data.customers) ? data.customers : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [query])

  useEffect(() => {
    if (!value) {
      setSelected(null)
      return
    }
    // Fetch selected customer details
    fetch(`/api/admin/customers/${value}`)
      .then((res) => res.json())
      .then((data) => {
        setSelected(data.customer || null)
      })
      .catch(() => setSelected(null))
  }, [value])

  return (
    <div className="w-full max-w-xl">
      {label && <label className="block mb-1 text-xs font-semibold text-[var(--text-muted)]">{label}</label>}
      <div className="relative flex items-center gap-2">
        <input
          type="text"
          className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 pr-10 text-sm focus:border-[var(--accent)] focus:outline-none"
          placeholder={placeholder || tt.customerSearchPlaceholder}
          value={selected ? (selected.company_name || selected.full_name || selected.email || '') : query}
          onChange={e => {
            setQuery(e.target.value)
            setShowDropdown(true)
            setSelected(null)
            onChange(null)
          }}
          onFocus={() => setShowDropdown(true)}
          autoFocus={autoFocus}
        />
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
        {onCreateNew && (
          <button
            type="button"
            className="ml-2 flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
            onClick={onCreateNew}
            tabIndex={-1}
          >
            <Plus className="h-4 w-4" /> {tt.newCustomer}
          </button>
        )}
      </div>
      {showDropdown && !selected && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-lg max-h-60 overflow-auto">
          {results.map((customer) => (
            <div
              key={customer.id}
              className="px-3 py-2 cursor-pointer hover:bg-[var(--bg-card-2)]"
              onClick={() => {
                setSelected(customer)
                setShowDropdown(false)
                setQuery('')
                onChange(customer.id, customer)
              }}
            >
              <div className="font-semibold">{customer.company_name || customer.full_name || customer.email}</div>
              <div className="text-xs text-[var(--text-muted)]">{customer.email}</div>
            </div>
          ))}
        </div>
      )}
      {selected && (
        <div className="mt-2 p-2 rounded bg-[var(--bg-card-2)] border border-[var(--border-soft)]">
          <div className="font-semibold">{selected.company_name || selected.full_name || selected.email}</div>
          <div className="text-xs text-[var(--text-muted)]">{selected.email}</div>
        </div>
      )}
    </div>
  )
}
