'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NewProjectForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const { error } = await supabase.from('projects').insert({
      user_id: userId,
      name: title,
      address,
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setTitle('')
    setDescription('')
    setAddress('')
    setMessage('Project succesvol aangemaakt.')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4">
        <input
          type="text"
          placeholder="Projectnaam"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-dark h-13 w-full px-4 text-sm"
          required
        />

        <input
          type="text"
          placeholder="Adres / locatie"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="input-dark h-13 w-full px-4 text-sm"
        />

        <textarea
          placeholder="Beschrijving van het project"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-dark min-h-[228px] w-full resize-none px-4 py-3 text-sm"
          rows={6}
        />
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary inline-flex h-12 w-full items-center justify-center px-5 text-sm font-semibold"
        >
          {loading ? 'Bezig...' : 'Project opslaan'}
        </button>

        {message && (
          <p className="mt-3 text-sm text-[var(--text-soft)]">{message}</p>
        )}
      </div>
    </form>
  )
}