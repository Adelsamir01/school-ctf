'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinPage() {
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [event, setEvent] = useState<any>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadEvent()
  }, [])

  const loadEvent = async () => {
    try {
      const res = await fetch('/api/events/current')
      if (res.status === 401) {
        router.push('/event')
        return
      }
      if (res.ok) {
        const eventData = await res.json()
        setEvent(eventData)
      }
    } catch (error) {
      console.error('Failed to load event:', error)
    } finally {
      setLoadingEvent(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/teams/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to register')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🎯 {event.name}
        </h1>
        <p className="text-center text-gray-600 mb-2">
          {event.date} • {event.location}
        </p>
        <p className="text-center text-gray-600 mb-8">
          Enter your team name to get started!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="teamName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Team Name
            </label>
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              placeholder="Enter your team name"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Challenge! 🚀'}
          </button>
        </form>
      </div>
    </div>
  )
}

