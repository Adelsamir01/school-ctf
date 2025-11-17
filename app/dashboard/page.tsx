'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Team {
  id: number
  name: string
  total_points: number
  total_time: number
}

interface Challenge {
  id: string
  name: string
  description: string
  unlocked: boolean
}

interface Event {
  id: string
  name: string
  date: string
  location: string
  description: string
}

export default function DashboardPage() {
  const [team, setTeam] = useState<Team | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [leaderboard, setLeaderboard] = useState<Team[]>([])
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [teamRes, challengesRes, leaderboardRes, eventRes] = await Promise.all([
        fetch('/api/teams/me'),
        fetch('/api/challenges'),
        fetch('/api/teams/leaderboard'),
        fetch('/api/events/current'),
      ])

      if (teamRes.status === 401) {
        router.push('/join')
        return
      }

      if (eventRes.status === 401) {
        router.push('/event')
        return
      }

      const teamData = await teamRes.json()
      const challengesData = await challengesRes.json()
      const leaderboardData = await leaderboardRes.json()
      const eventData = await eventRes.json()

      setTeam(teamData)
      setChallenges(challengesData)
      setLeaderboard(leaderboardData)
      setEvent(eventData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/teams/signout', {
        method: 'POST',
      })
      router.push('/event')
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    )
  }

  if (!team) {
    return null
  }

  // Calculate rank - test team won't be in leaderboard, so don't show rank
  const isTestTeam = team.name.toLowerCase() === 'test'
  const teamRank = isTestTeam 
    ? null 
    : (leaderboard.findIndex((t) => t.id === team.id) + 1 || leaderboard.length + 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎯 Welcome, {team.name}!
              </h1>
              {event && (
                <p className="text-gray-600 mt-1">
                  {event.name} • {event.date}
                </p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-all text-sm"
            >
              Sign Out
            </button>
          </div>
          <div className="flex items-center gap-6 mt-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg font-bold text-xl">
              🏆 {team.total_points} Points
            </div>
            {teamRank !== null && (
              <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-lg font-bold text-xl">
                📊 Rank #{teamRank}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Challenges Section */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              🎮 Challenges
            </h2>
            <div className="space-y-4">
              {challenges.length === 0 ? (
                <p className="text-gray-500">No challenges available yet.</p>
              ) : (
                challenges.map((challenge) => (
                  <Link
                    key={challenge.id}
                    href={`/challenge/${challenge.id}`}
                    className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {challenge.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {challenge.description}
                        </p>
                      </div>
                      <div className="ml-4">
                        {challenge.unlocked ? (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                            ✅ Unlocked
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              🏆 Leaderboard
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leaderboard.map((t, index) => {
                const formatTime = (seconds: number) => {
                  const hours = Math.floor(seconds / 3600)
                  const minutes = Math.floor((seconds % 3600) / 60)
                  const secs = seconds % 60

                  if (hours > 0) {
                    return `${hours}h ${minutes}m ${secs}s`
                  } else if (minutes > 0) {
                    return `${minutes}m ${secs}s`
                  } else {
                    return `${secs}s`
                  }
                }

                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-lg ${
                      t.id === team.id
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-500'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg w-8 text-center">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {t.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-blue-600">
                            {t.total_points} pts
                          </div>
                          <div className="text-xs text-gray-500">
                            ⏱️ {formatTime(t.total_time || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

