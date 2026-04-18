'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StickyNote, Plus, Trash2, Loader2, Link2, X, Building2, FolderOpen, Construction } from 'lucide-react'
import { useT } from '@/i18n/context'

type Kind = 'customer' | 'project' | 'machine'

type Note = {
  id: number
  content: string
  pinned: boolean
  linked_customer_id: string | null
  linked_project_id: number | null
  linked_machine_id: number | null
  created_at: string
  target_kind?: Kind | null
  target_label?: string | null
}

type TargetOption = { id: string | number; label: string }

type Targets = {
  customers: TargetOption[]
  projects: TargetOption[]
  machines: TargetOption[]
}

const kindIcon: Record<Kind, typeof Building2> = {
  customer: Building2,
  project: FolderOpen,
  machine: Construction,
}

const kindClass: Record<Kind, string> = {
  customer: 'bg-purple-500/15 text-purple-400',
  project: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  machine: 'bg-orange-500/15 text-orange-400',
}

export default function DashboardNotesWidget() {
  const { t, locale } = useT()
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [targets, setTargets] = useState<Targets | null>(null)
  const [kind, setKind] = useState<Kind | null>(null)
  const [targetId, setTargetId] = useState<string | number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const pickerRef = useRef<HTMLDivElement | null>(null)

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notes')
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTargets = useCallback(async () => {
    if (targets) return
    const res = await fetch('/api/admin/notes/targets')
    if (res.ok) {
      const data = await res.json()
      setTargets({
        customers: data.customers ?? [],
        projects: data.projects ?? [],
        machines: data.machines ?? [],
      })
    }
  }, [targets])

  useEffect(() => { void fetchNotes() }, [fetchNotes])

  useEffect(() => {
    if (!pickerOpen) return
    void fetchTargets()
    function onClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [pickerOpen, fetchTargets])

  const currentList: TargetOption[] = useMemo(() => {
    if (!kind || !targets) return []
    const list = kind === 'customer' ? targets.customers : kind === 'project' ? targets.projects : targets.machines
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((o) => o.label.toLowerCase().includes(q))
  }, [kind, targets, search])

  const selectedLabel = useMemo(() => {
    if (!kind || targetId == null || !targets) return null
    const list = kind === 'customer' ? targets.customers : kind === 'project' ? targets.projects : targets.machines
    return list.find((o) => String(o.id) === String(targetId))?.label ?? null
  }, [kind, targetId, targets])

  function clearTarget() {
    setKind(null)
    setTargetId(null)
    setSearch('')
  }

  async function addNote() {
    const content = draft.trim()
    if (!content || saving) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { content }
      if (kind === 'customer' && targetId) payload.linked_customer_id = targetId
      if (kind === 'project' && targetId) payload.linked_project_id = targetId
      if (kind === 'machine' && targetId) payload.linked_machine_id = targetId

      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        setNotes((prev) => [data.note, ...prev])
        setDraft('')
        clearTarget()
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteNote(id: number) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    await fetch(`/api/admin/notes?id=${id}`, { method: 'DELETE' })
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const loc = locale === 'fr' ? 'fr-BE' : locale === 'en' ? 'en-US' : 'nl-BE'
    return d.toLocaleDateString(loc, { day: '2-digit', month: '2-digit' }) +
      ' ' + d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
  }

  const kindLabels: Record<Kind, string> = {
    customer: t.notesWidget.linkCustomer,
    project: t.notesWidget.linkProject,
    machine: t.notesWidget.linkMachine,
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--border-soft)] px-3 py-2">
        <StickyNote className="h-3.5 w-3.5 text-amber-400" />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t.notesWidget.title}</h3>
        <span className="ml-auto text-[10px] text-[var(--text-muted)]">{notes.length}</span>
      </div>

      {/* Add note */}
      <div className="space-y-1.5 border-b border-[var(--border-soft)] px-3 py-2">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addNote() } }}
            placeholder={t.notesWidget.newNotePlaceholder}
            className="input-dark flex-1 px-2 py-1 text-[11px]"
          />
          <button
            type="button"
            onClick={() => void addNote()}
            disabled={!draft.trim() || saving}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-400/15 text-amber-400 transition hover:bg-amber-400/25 disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </button>
        </div>

        {/* Target picker */}
        <div className="relative" ref={pickerRef}>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="text-[var(--text-muted)]">{t.notesWidget.linkLabel}:</span>
            {(['customer', 'project', 'machine'] as Kind[]).map((k) => {
              const Icon = kindIcon[k]
              const active = kind === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (active) {
                      clearTarget()
                      setPickerOpen(false)
                    } else {
                      setKind(k)
                      setTargetId(null)
                      setSearch('')
                      setPickerOpen(true)
                    }
                  }}
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold transition ${
                    active ? kindClass[k] : 'bg-white/5 text-[var(--text-soft)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {kindLabels[k]}
                </button>
              )
            })}
            {selectedLabel && kind && (
              <span className={`ml-1 inline-flex max-w-[60%] items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] ${kindClass[kind]}`}>
                <Link2 className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{selectedLabel}</span>
                <button type="button" onClick={clearTarget} className="ml-0.5 shrink-0 opacity-70 hover:opacity-100">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
          </div>

          {pickerOpen && kind && (
            <div className="mt-1.5 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)]/60 p-1.5">
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.notesWidget.linkSearch}
                className="input-dark mb-1 w-full px-2 py-1 text-[11px]"
              />
              <div className="max-h-32 overflow-y-auto">
                {!targets ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="h-3 w-3 animate-spin text-[var(--text-muted)]" />
                  </div>
                ) : currentList.length === 0 ? (
                  <p className="py-2 text-center text-[10px] text-[var(--text-muted)]">â€”</p>
                ) : (
                  <ul className="space-y-0.5">
                    {currentList.slice(0, 50).map((o) => (
                      <li key={o.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetId(o.id)
                            setPickerOpen(false)
                          }}
                          className="w-full truncate rounded px-2 py-1 text-left text-[11px] text-[var(--text-main)] hover:bg-[var(--bg-card-2)]"
                        >
                          {o.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : notes.length === 0 ? (
          <p className="px-3 py-4 text-center text-[11px] text-[var(--text-muted)]">{t.notesWidget.noNotes}</p>
        ) : (
          <div className="divide-y divide-[var(--border-soft)]">
            {notes.map((note) => {
              const k = note.target_kind as Kind | null | undefined
              const Icon = k ? kindIcon[k] : null
              return (
                <div key={note.id} className="group flex items-start gap-2 px-3 py-2">
                  <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/60" />
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap text-[11px] leading-4 text-[var(--text-main)]">{note.content}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <p className="text-[9px] text-[var(--text-muted)]">{formatDate(note.created_at)}</p>
                      {k && note.target_label && Icon && (
                        <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold ${kindClass[k]}`}>
                          <Icon className="h-2.5 w-2.5" />
                          <span className="max-w-[140px] truncate">{note.target_label}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteNote(note.id)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
