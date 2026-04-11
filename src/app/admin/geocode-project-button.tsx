'use client'

import { useState } from 'react'
import { MapPin, Loader } from 'lucide-react'

type Props = {
  projectId: number
  address: string | null
  hasCoordinates?: boolean
}

type MessageType = 'success' | 'error' | ''

export default function GeocodeProjectButton({
  projectId,
  address,
  hasCoordinates = false,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('')

  async function handleGeocode() {
    if (!address) {
      setMessage('Geen adres beschikbaar.')
      setMessageType('error')
      return
    }

    try {
      setLoading(true)
      setMessage('')
      setMessageType('')

      const geoResponse = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })

      const geoData = await geoResponse.json()

      if (!geoResponse.ok) {
        setMessage(geoData.error || 'Geocoding mislukt.')
        setMessageType('error')
        return
      }

      const saveResponse = await fetch('/api/projects/update-coordinates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
        }),
      })

      const saveData = await saveResponse.json()

      if (!saveResponse.ok) {
        setMessage(saveData.error || 'Opslaan mislukt.')
        setMessageType('error')
        return
      }

      setMessage('Coördinaten opgeslagen.')
      setMessageType('success')
      window.location.reload()
    } catch (error) {
      console.error(error)
      setMessage('Er liep iets fout.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleGeocode}
        disabled={loading || !address}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        {loading
          ? 'Ophalen...'
          : hasCoordinates
            ? 'Coördinaten vernieuwen'
            : 'Coördinaten ophalen'}
      </button>

      {message ? (
        <p
          className={`text-xs ${
            messageType === 'success'
              ? 'text-green-600'
              : messageType === 'error'
                ? 'text-red-600'
                : 'text-gray-600'
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}