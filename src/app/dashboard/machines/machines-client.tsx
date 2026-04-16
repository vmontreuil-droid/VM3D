'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MachineIcon, BRAND_COLORS, GUIDANCE_COLORS, formatTonnage } from '@/components/machines/machine-icons'
import { Plus, Construction, Search, Trash2, Pencil, X, ChevronDown, ChevronRight, Wifi, WifiOff, Upload, FileCheck, Clock, Loader2, FolderPlus, FolderOpen, Terminal, Copy, Check, Share2 } from 'lucide-react'

/** Get origin reachable from other devices (replace localhost with LAN IP) */
function getNetworkOrigin() {
  const o = window.location.origin
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return o.replace(/localhost|127\.0\.0\.1/, '192.168.0.250')
  }
  return o
}

// ── All brands with popular excavator/bulldozer models ──
const MACHINE_BRANDS: Record<string, { excavator: string[]; bulldozer: string[] }> = {
  CAT: {
    excavator: ['301.7', '302', '303.5', '305.5', '306', '308', '310', '312', '313', '315', '316', '318', '320', '323', '325', '326', '330', '335', '336', '340', '345', '349', '350', '352', '374', '390'],
    bulldozer: ['D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11'],
  },
  KOMATSU: {
    excavator: ['PC26', 'PC30', 'PC35', 'PC45', 'PC55', 'PC78', 'PC88', 'PC138', 'PC170', 'PC210', 'PC228', 'PC240', 'PC290', 'PC340', 'PC360', 'PC390', 'PC490', 'PC800', 'PC850', 'PC1250'],
    bulldozer: ['D37', 'D39', 'D51', 'D61', 'D65', 'D85', 'D155', 'D275', 'D375'],
  },
  HITACHI: {
    excavator: ['ZX17', 'ZX26', 'ZX33', 'ZX38', 'ZX48', 'ZX55', 'ZX65', 'ZX75', 'ZX85', 'ZX130', 'ZX135', 'ZX160', 'ZX210', 'ZX225', 'ZX250', 'ZX300', 'ZX350', 'ZX400', 'ZX470', 'ZX530', 'ZX670', 'ZX890'],
    bulldozer: [],
  },
  VOLVO: {
    excavator: ['EC15', 'EC18', 'EC20', 'EC27', 'EC35', 'ECR40', 'ECR50', 'EC60', 'ECR88', 'EC140', 'EC160', 'EC200', 'EC220', 'EC250', 'EC300', 'EC350', 'EC380', 'EC480', 'EC750', 'EC950'],
    bulldozer: [],
  },
  LIEBHERR: {
    excavator: ['A910', 'A914', 'A918', 'A920', 'A922', 'A924', 'R914', 'R920', 'R922', 'R924', 'R926', 'R930', 'R934', 'R936', 'R938', 'R940', 'R945', 'R950', 'R956', 'R960', 'R966', 'R970', 'R976', 'R980'],
    bulldozer: ['PR716', 'PR726', 'PR736', 'PR746', 'PR756', 'PR766', 'PR776'],
  },
  HYUNDAI: {
    excavator: ['HX85A', 'HX130A', 'HX145A', 'HX160A', 'HX220A', 'HX235A', 'HX260A', 'HX300A', 'HX330A', 'HX380A', 'HX480A', 'HX520A', 'HX900A'],
    bulldozer: [],
  },
  KOBELCO: {
    excavator: ['SK17', 'SK25', 'SK28', 'SK35', 'SK55', 'SK75', 'SK85', 'SK130', 'SK140', 'SK210', 'SK230', 'SK260', 'SK300', 'SK350', 'SK380', 'SK500', 'SK850'],
    bulldozer: [],
  },
  'DOOSAN/DEVELON': {
    excavator: ['DX17', 'DX27', 'DX35', 'DX42', 'DX55', 'DX63', 'DX80', 'DX85', 'DX140', 'DX160', 'DX180', 'DX225', 'DX235', 'DX255', 'DX300', 'DX340', 'DX380', 'DX420', 'DX480', 'DX530', 'DX800'],
    bulldozer: [],
  },
  JCB: {
    excavator: ['15C', '16C', '19C', '20C', '22C', '33C', '36C', '48Z', '55Z', '65R', '85Z', '100C', '130X', '140X', '150X', '220X', '245XR', '370X'],
    bulldozer: [],
  },
  CASE: {
    excavator: ['CX17C', 'CX18C', 'CX26C', 'CX30C', 'CX37C', 'CX57C', 'CX60C', 'CX75C', 'CX80C', 'CX130D', 'CX145D', 'CX160D', 'CX210D', 'CX225D', 'CX250D', 'CX300D', 'CX350D', 'CX370D', 'CX490D', 'CX750D', 'CX800D'],
    bulldozer: ['650M', '750M', '850M', '1150M', '1650M', '2050M'],
  },
  TAKEUCHI: {
    excavator: ['TB210R', 'TB216', 'TB217R', 'TB219', 'TB225', 'TB228', 'TB230', 'TB235-2', 'TB240', 'TB250-2', 'TB257FR', 'TB260', 'TB280FR', 'TB290', 'TB2150R', 'TB370'],
    bulldozer: [],
  },
  KUBOTA: {
    excavator: ['K008', 'U10', 'U17', 'U25', 'U27', 'U35', 'U48', 'U55', 'KX027', 'KX033', 'KX040', 'KX042', 'KX057', 'KX060', 'KX080', 'KX085'],
    bulldozer: [],
  },
  SANY: {
    excavator: ['SY16C', 'SY18C', 'SY26U', 'SY35U', 'SY50U', 'SY60C', 'SY75C', 'SY80U', 'SY135C', 'SY155U', 'SY215C', 'SY235C', 'SY265C', 'SY305C', 'SY365C', 'SY395C', 'SY500H', 'SY750H', 'SY870C'],
    bulldozer: [],
  },
  ZOOMLION: {
    excavator: ['ZE35E-10', 'ZE60E-10', 'ZE75E-10', 'ZE135E-10', 'ZE155E', 'ZE205E', 'ZE215E', 'ZE230E', 'ZE260E', 'ZE335E', 'ZE365E', 'ZE480E', 'ZE550E'],
    bulldozer: ['ZD160', 'ZD220', 'ZD320'],
  },
}

const GUIDANCE_SYSTEMS = [
  { value: '', label: 'Geen machinebesturing' },
  { value: 'UNICONTROL', label: 'Unicontrol' },
  { value: 'TRIMBLE', label: 'Trimble' },
  { value: 'TOPCON', label: 'Topcon' },
  { value: 'LEICA', label: 'Leica Geosystems' },
  { value: 'CHCNAV', label: 'CHC Navigation' },
]

type Machine = {
  id: number
  project_id: number | null
  name: string
  machine_type: string
  brand: string
  model: string
  tonnage: number
  year?: number
  guidance_system?: string
  serial_number?: string
  connection_code: string
  is_online: boolean
  rustdesk_id?: string | null
  project?: { name: string }
  created_at: string
}

type Project = { id: number; name: string }

type Props = {
  machines: Machine[]
  projects: Project[]
  userId: string
}

function generateConnectionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function generatePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let pw = ''
  for (let i = 0; i < 12; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)]
  }
  return pw
}

export default function MachinesClient({ machines: initialMachines, projects, userId }: Props) {
  const [machines, setMachines] = useState(initialMachines)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)
  const [expandedMachine, setExpandedMachine] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ uploaded: number; errors: string[] } | null>(null)
  const [transfers, setTransfers] = useState<{ id: number; file_name: string; status: string; created_at: string; synced_at: string | null }[]>([])
  const [loadingTransfers, setLoadingTransfers] = useState(false)
  const [newWerfName, setNewWerfName] = useState('')
  const [creatingWerf, setCreatingWerf] = useState(false)
  const [selectedWerf, setSelectedWerf] = useState('')
  const [machineWerven, setMachineWerven] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Poll online status elke 30 seconden
  const refreshOnlineStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/machines/heartbeat')
      if (!res.ok) return
      const { machines: statusList } = await res.json()
      if (!Array.isArray(statusList)) return
      setMachines(prev => prev.map(m => {
        const status = statusList.find((s: { id: number }) => s.id === m.id)
        if (status) return { ...m, is_online: status.is_online, last_seen_at: status.last_seen_at }
        return m
      }))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    refreshOnlineStatus()
    const interval = setInterval(refreshOnlineStatus, 30_000)
    return () => clearInterval(interval)
  }, [refreshOnlineStatus])

  // Form state
  const [machineType, setMachineType] = useState<'excavator' | 'bulldozer'>('excavator')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [tonnage, setTonnage] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [guidanceSystem, setGuidanceSystem] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [projectId, setProjectId] = useState('')

  // Get models for selected brand + type
  const availableModels = brand && MACHINE_BRANDS[brand]
    ? MACHINE_BRANDS[brand][machineType] || []
    : []

  // Filter machines
  const filtered = machines.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q) ||
      m.model.toLowerCase().includes(q) ||
      m.guidance_system?.toLowerCase().includes(q) ||
      m.project?.name?.toLowerCase().includes(q)
    )
  })

  // Load transfers for expanded machine
  const loadTransfers = useCallback(async (machineId: number) => {
    setLoadingTransfers(true)
    try {
      const res = await fetch(`/api/machines/${machineId}/transfer`)
      if (res.ok) {
        const { transfers: data, werven: wData } = await res.json()
        setTransfers(data || [])
        setMachineWerven(wData || [])
      }
    } catch { /* ignore */ }
    setLoadingTransfers(false)
  }, [])

  // Create new werf on machine
  const handleCreateWerf = useCallback(async (machineId: number) => {
    if (!newWerfName.trim()) return
    setCreatingWerf(true)
    try {
      const res = await fetch(`/api/machines/${machineId}/werf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWerfName.trim() }),
      })
      if (res.ok) {
        const { werf } = await res.json()
        setMachineWerven(prev => [...prev, werf])
        setSelectedWerf(werf)
        setNewWerfName('')
      } else {
        const data = await res.json()
        setError(data.error || 'Werf aanmaken mislukt')
      }
    } catch {
      setError('Werf aanmaken mislukt')
    }
    setCreatingWerf(false)
  }, [newWerfName])

  // Upload files to machine (with werf subfolder)
  const handleFileUpload = useCallback(async (machineId: number, files: FileList) => {
    setUploading(true)
    setUploadResult(null)
    const formData = new FormData()
    for (const file of Array.from(files)) {
      formData.append('files', file)
    }
    if (selectedWerf) {
      formData.append('subfolder', selectedWerf)
    }

    try {
      const res = await fetch(`/api/machines/${machineId}/transfer`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      setUploadResult({ uploaded: data.uploaded || 0, errors: data.errors || [] })
      loadTransfers(machineId)
    } catch {
      setUploadResult({ uploaded: 0, errors: ['Upload mislukt'] })
    }
    setUploading(false)
  }, [loadTransfers, selectedWerf])

  // Toggle expanded machine
  const toggleExpand = useCallback((machineId: number) => {
    if (expandedMachine === machineId) {
      setExpandedMachine(null)
      setTransfers([])
      setUploadResult(null)
    } else {
      setExpandedMachine(machineId)
      setUploadResult(null)
      loadTransfers(machineId)
    }
  }, [expandedMachine, loadTransfers])

  const resetForm = () => {
    setMachineType('excavator')
    setBrand('')
    setModel('')
    setCustomModel('')
    setTonnage('')
    setYear(new Date().getFullYear().toString())
    setGuidanceSystem('')
    setSerialNumber('')
    setProjectId('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const finalModel = model === '__custom__' ? customModel.trim() : model
    if (!brand || !finalModel || !tonnage) {
      setError('Vul merk, model en tonnage in.')
      return
    }

    const tonnageNum = parseFloat(tonnage)
    if (isNaN(tonnageNum) || tonnageNum <= 0) {
      setError('Ongeldig tonnage.')
      return
    }

    setSaving(true)

    const machineName = `${brand} ${finalModel}`
    const connectionCode = generateConnectionCode()
    const connectionPassword = generatePassword()

    const res = await fetch('/api/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: machineName,
        machine_type: machineType,
        brand: brand.toUpperCase().replace('DOOSAN/DEVELON', 'DEVELON'),
        model: finalModel,
        tonnage: tonnageNum,
        year: year ? parseInt(year) : null,
        guidance_system: guidanceSystem || null,
        serial_number: serialNumber || null,
        connection_code: connectionCode,
        connection_password: connectionPassword,
        project_id: projectId ? parseInt(projectId) : null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error || 'Opslaan mislukt')
      return
    }

    setMachines(prev => [data, ...prev])
    resetForm()
    setShowForm(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Machine verwijderen? Dit kan niet ongedaan worden.')) return
    setDeleting(id)

    const res = await fetch('/api/machines', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    setDeleting(null)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Verwijderen mislukt')
      return
    }

    setMachines(prev => prev.filter(m => m.id !== id))
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  // Stats
  const excavatorCount = machines.filter(m => m.machine_type === 'excavator').length
  const bulldozerCount = machines.filter(m => m.machine_type === 'bulldozer').length
  const withGuidance = machines.filter(m => m.guidance_system).length

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Totaal</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{machines.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Kranen</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-main)]">{excavatorCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Bulldozers</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-main)]">{bulldozerCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Met GPS-sturing</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-main)]">{withGuidance}</p>
        </div>
      </div>

      {/* Add machine + search */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}
          className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 transition border border-emerald-500/20"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Annuleren' : 'Machine toevoegen'}
        </button>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek op merk, model, werf..."
            className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] pl-10 pr-4 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Add machine form */}
      {showForm && (
        <section className="overflow-hidden rounded-xl border border-emerald-500/20 bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-emerald-500/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-[var(--text-main)]">Nieuwe machine toevoegen</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-soft)] mb-2">Type machine</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setMachineType('excavator'); setBrand(''); setModel(''); }}
                  className={`flex flex-1 items-center gap-3 rounded-xl border p-3 transition ${
                    machineType === 'excavator'
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-[var(--border-soft)] bg-[var(--bg-card-2)] hover:border-[var(--accent)]/30'
                  }`}
                >
                  <MachineIcon type="excavator" size={32} className={machineType === 'excavator' ? 'text-emerald-400' : 'text-[var(--text-muted)]'} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${machineType === 'excavator' ? 'text-emerald-400' : 'text-[var(--text-main)]'}`}>Kraan</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Rupsgraafkraan / bandenkraan</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setMachineType('bulldozer'); setBrand(''); setModel(''); }}
                  className={`flex flex-1 items-center gap-3 rounded-xl border p-3 transition ${
                    machineType === 'bulldozer'
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-[var(--border-soft)] bg-[var(--bg-card-2)] hover:border-[var(--accent)]/30'
                  }`}
                >
                  <MachineIcon type="bulldozer" size={32} className={machineType === 'bulldozer' ? 'text-emerald-400' : 'text-[var(--text-muted)]'} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${machineType === 'bulldozer' ? 'text-emerald-400' : 'text-[var(--text-main)]'}`}>Bulldozer</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Dozer / rupstrekker</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Brand + Model row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-soft)] mb-1.5">Merk *</label>
                <select
                  value={brand}
                  onChange={e => { setBrand(e.target.value); setModel(''); setCustomModel(''); }}
                  required
                  className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-main)]"
                >
                  <option value="">Kies een merk...</option>
                  {Object.keys(MACHINE_BRANDS)
                    .filter(b => MACHINE_BRANDS[b][machineType].length > 0 || machineType === 'excavator')
                    .sort()
                    .map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-soft)] mb-1.5">Model *</label>
                {availableModels.length > 0 ? (
                  <select
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-main)]"
                  >
                    <option value="">Kies een model...</option>
                    {availableModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="__custom__">Ander model...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customModel}
                    onChange={e => { setCustomModel(e.target.value); setModel('__custom__'); }}
                    placeholder={brand ? 'Typ het model...' : 'Kies eerst een merk'}
                    disabled={!brand}
                    required
                    className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] disabled:opacity-40"
                  />
                )}
                {model === '__custom__' && availableModels.length > 0 && (
                  <input
                    type="text"
                    value={customModel}
                    onChange={e => setCustomModel(e.target.value)}
                    placeholder="Typ het model..."
                    required
                    className="mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                    autoFocus
                  />
                )}
              </div>
            </div>

            {/* Tonnage + Year row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-soft)] mb-1.5">Tonnage (ton) *</label>
                <input
                  type="number"
                  value={tonnage}
                  onChange={e => setTonnage(e.target.value)}
                  placeholder="bv. 8, 22.5, 35"
                  required
                  min="0.1"
                  step="0.1"
                  className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-soft)] mb-1.5">Bouwjaar</label>
                <select
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-main)]"
                >
                  <option value="">Onbekend</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-soft)] mb-1.5">Serienummer</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  placeholder="Optioneel"
                  className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            {/* Guidance system */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-soft)] mb-1.5">GPS-Machinebesturing</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GUIDANCE_SYSTEMS.map(gs => {
                  const colors = gs.value ? GUIDANCE_COLORS[gs.value] : null
                  const isSelected = guidanceSystem === gs.value
                  return (
                    <button
                      key={gs.value}
                      type="button"
                      onClick={() => setGuidanceSystem(gs.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        isSelected
                          ? colors
                            ? `${colors.bg} ${colors.text} border-current/30`
                            : 'border-[var(--border-soft)] bg-[var(--bg-card-2)] text-[var(--text-main)]'
                          : 'border-[var(--border-soft)] bg-[var(--bg-main)] text-[var(--text-soft)] hover:bg-[var(--bg-card-2)]'
                      }`}
                    >
                      {gs.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Project link */}
            {projects.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-soft)] mb-1.5">Koppel aan werf (optioneel)</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-main)]"
                >
                  <option value="">Geen werf</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Preview */}
            {brand && (model || customModel) && (
              <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: (BRAND_COLORS[brand.toUpperCase().replace('DOOSAN/DEVELON', 'DEVELON')] || '#888') + '1A' }}
                >
                  <MachineIcon
                    type={machineType}
                    size={24}
                    className="drop-shadow-sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    {brand} {model === '__custom__' ? customModel : model}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {tonnage && `${tonnage}T`} {year && `· ${year}`} {guidanceSystem && `· ${guidanceSystem}`}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 transition border border-emerald-500/20 disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : 'Machine opslaan'}
            </button>
          </form>
        </section>
      )}

      {/* Machine list */}
      <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Construction className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-[var(--text-main)]">Machinepark</span>
            <span className="ml-auto text-[10px] text-[var(--text-muted)]">{filtered.length} machines</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <MachineIcon type="excavator" size={48} className="text-[var(--text-muted)] opacity-20" />
            <p className="text-sm text-[var(--text-soft)]">
              {machines.length === 0 ? 'Nog geen machines toegevoegd' : 'Geen machines gevonden'}
            </p>
            {machines.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Eerste machine toevoegen
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-soft)]">
            {filtered.map(machine => {
              const brandColor = BRAND_COLORS[machine.brand.toUpperCase()] || '#888'
              const guidance = machine.guidance_system ? GUIDANCE_COLORS[machine.guidance_system.toUpperCase()] : null
              const isExpanded = expandedMachine === machine.id

              return (
                <div key={machine.id}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${isExpanded ? 'bg-emerald-500/5' : 'hover:bg-[var(--bg-card-2)]'}`}
                    onClick={() => toggleExpand(machine.id)}
                  >
                    {/* Expand arrow */}
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-emerald-400 shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                    }

                    {/* Machine icon */}
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: brandColor + '1A' }}
                    >
                      <MachineIcon type={machine.machine_type} size={26} className="drop-shadow-sm" />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: brandColor + '25', color: brandColor }}
                        >
                          {machine.brand}
                        </span>
                        {guidance && machine.guidance_system && (
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${guidance.bg} ${guidance.text}`}>
                            {machine.guidance_system}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-semibold text-[var(--text-main)] truncate">
                        {machine.name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                        <span>{formatTonnage(machine.tonnage)}</span>
                        <span>·</span>
                        <span>{machine.machine_type === 'bulldozer' ? 'Bulldozer' : 'Kraan'}</span>
                        {machine.year && <><span>·</span><span>{machine.year}</span></>}
                        {machine.project?.name && (
                          <><span>·</span><span>📍 {machine.project.name}</span></>
                        )}
                      </div>
                    </div>

                    {/* Online status */}
                    <span className={`flex items-center gap-1 text-[10px] shrink-0 ${machine.is_online ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                      {machine.is_online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      {machine.is_online ? 'Online' : 'Offline'}
                    </span>

                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(machine.id); }}
                      disabled={deleting === machine.id}
                      className="rounded-lg p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
                      title="Verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Expanded: file transfer panel */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border-soft)] bg-[var(--bg-card-2)]/50 px-4 py-4 space-y-4">

                      {/* ── Werven (project folders) ── */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Werven op machine
                        </p>

                        {/* Existing werven */}
                        {machineWerven.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {machineWerven.map(w => (
                              <button
                                key={w}
                                onClick={() => setSelectedWerf(selectedWerf === w ? '' : w)}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                  selectedWerf === w
                                    ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
                                    : 'bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--bg-main)]/80'
                                }`}
                              >
                                <FolderOpen className="h-3.5 w-3.5" />
                                {w}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Create new werf */}
                        {machine.guidance_system === 'UNICONTROL' && (
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-xs">
                              <FolderPlus className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                              <input
                                type="text"
                                placeholder="Nieuwe werf aanmaken..."
                                value={newWerfName}
                                onChange={(e) => setNewWerfName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newWerfName.trim()) {
                                    handleCreateWerf(machine.id)
                                  }
                                }}
                                className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                              />
                            </div>
                            <button
                              onClick={() => handleCreateWerf(machine.id)}
                              disabled={creatingWerf || !newWerfName.trim()}
                              className="flex items-center gap-1.5 rounded-lg bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/25 transition disabled:opacity-40"
                            >
                              {creatingWerf ? <Loader2 className="h-3 w-3 animate-spin" /> : <FolderPlus className="h-3 w-3" />}
                              Aanmaken
                            </button>
                          </div>
                        )}

                        {machine.guidance_system === 'UNICONTROL' && (
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Maakt projectmap aan met Project.yml (Lambert 72 België)
                          </p>
                        )}
                      </div>

                      {/* ── Upload section ── */}
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 rounded-lg bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition disabled:opacity-50"
                        >
                          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          {uploading ? 'Uploaden...' : 'Bestanden versturen naar machine'}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".xml,.dxf,.dwg,.csv,.cfg,.ini,.txt,.pdf,.zip,.rar,.gc3,.tp3,.svd,.dsz,.cal,.man,.dc,.prj,.ttm,.vcl"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.length) {
                              handleFileUpload(machine.id, e.target.files)
                              e.target.value = ''
                            }
                          }}
                        />
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {selectedWerf
                            ? `→ Naar werf: ${selectedWerf}`
                            : machine.guidance_system
                              ? `→ Wordt geplaatst in de ${machine.guidance_system} projectmap`
                              : ''}
                        </span>
                      </div>

                      {/* Upload result */}
                      {uploadResult && (
                        <div className={`rounded-lg border p-2.5 text-xs ${uploadResult.errors.length > 0 ? 'border-red-500/20 bg-red-500/5 text-red-400' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'}`}>
                          {uploadResult.uploaded > 0 && <p>✓ {uploadResult.uploaded} bestand(en) verstuurd</p>}
                          {uploadResult.errors.map((err, i) => <p key={i}>✗ {err}</p>)}
                        </div>
                      )}

                      {/* ── Tablet instellen ── */}
                      {machine.connection_code && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            <Terminal className="inline h-3 w-3 mr-1" />
                            Tablet instellen
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                const url = `${getNetworkOrigin()}/machines/setup/${machine.connection_code}`
                                if (navigator.share) {
                                  navigator.share({
                                    title: `${machine.brand} ${machine.model} instellen`,
                                    text: `Open deze link op de tablet om de sync te installeren voor ${machine.name}`,
                                    url,
                                  }).catch(() => {})
                                } else {
                                  navigator.clipboard.writeText(url)
                                  setCopied(true)
                                  setTimeout(() => setCopied(false), 2000)
                                }
                              }}
                              className="flex items-center gap-2 rounded-lg bg-blue-500/15 px-4 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/25 transition"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              {copied ? 'Link gekopieerd!' : 'Deel installatielink'}
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `yes | pkg upgrade -y && pkg i curl jq -y && curl -s ${getNetworkOrigin()}/api/machines/install?code=${machine.connection_code}|bash`
                                )
                                setCopied(true)
                                setTimeout(() => setCopied(false), 2000)
                              }}
                              className="flex items-center gap-2 rounded-lg bg-[var(--bg-main)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                            >
                              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                              Kopieer Termux-commando
                            </button>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Stuur de link naar de machinist via WhatsApp. Hij volgt de stappen op zijn scherm.
                          </p>
                        </div>
                      )}

                      {/* Recent transfers */}
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                          Recente overdrachten
                        </p>
                        {loadingTransfers ? (
                          <div className="flex items-center gap-2 py-3">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--text-muted)]" />
                            <span className="text-xs text-[var(--text-muted)]">Laden...</span>
                          </div>
                        ) : transfers.length === 0 ? (
                          <p className="text-xs text-[var(--text-muted)] py-2">Nog geen bestanden verstuurd naar deze machine</p>
                        ) : (
                          <div className="space-y-1">
                            {transfers.slice(0, 10).map(t => (
                              <div key={t.id} className="flex items-center gap-2 rounded-lg bg-[var(--bg-main)] px-3 py-1.5">
                                {t.status === 'synced'
                                  ? <FileCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                  : <Clock className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                                }
                                <span className="text-xs text-[var(--text-main)] truncate flex-1">{t.file_name}</span>
                                <span className={`text-[10px] shrink-0 ${t.status === 'synced' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                  {t.status === 'synced' ? 'Ontvangen' : 'Wacht op sync'}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                                  {new Date(t.created_at).toLocaleString('nl-BE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
