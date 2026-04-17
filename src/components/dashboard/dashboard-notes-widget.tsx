'use client'

import { useCallback, useEffect, useState } from 'react'
import { StickyNote, Plus, Trash2, Loader2 } from 'lucide-react'
import { useT } from '@/i18n/context'

type Note = {
  id: number
  content: string
  pinned: boolean
  linked_customer_id: string | null
  linked_project_id: number | null
  created_at: string
}

export default function DashboardNotesWidget() {
  const { t, locale } = useT()
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  useEffect(() => { void fetchNotes() }, [fetchNotes])

  async function addNote() {
    const content = draft.trim()
    if (!content || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotes((prev) => [data.note, ...prev])
        setDraft('')
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--border-soft)] px-3 py-2">
        <StickyNote className="h-3.5 w-3.5 text-amber-400" />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t.notesWidget.title}</h3>
        <span className="ml-auto text-[10px] text-[var(--text-muted)]">{notes.length}</span>
      </div>

      {/* Add note */}
      <div className="flex gap-1.5 border-b border-[var(--border-soft)] px-3 py-2">
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
            {notes.map((note) => (
              <div key={note.id} className="group flex items-start gap-2 px-3 py-2">
                <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/60" />
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-[11px] leading-4 text-[var(--text-main)]">{note.content}</p>
                  <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">{formatDate(note.created_at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteNote(note.id)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
