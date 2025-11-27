'use client'

import { FormEvent, MouseEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Team {
  id: number
  name: string
  total_points: number
  total_time: number
  completedCtfs?: string[]
}

interface TimerStatus {
  startedAt: string
  durationSeconds: number
  remainingSeconds: number
  isActive: boolean
}

interface Challenge {
  id: string
  name: string
  description: string
  unlocked: boolean
  progress?: {
    completed: number
    total: number
    percent: number
  }
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
  const [timer, setTimer] = useState<TimerStatus | null>(null)
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null)
  const [timerMinutes, setTimerMinutes] = useState('')
  const [timerSubmitting, setTimerSubmitting] = useState(false)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [removingTeamId, setRemovingTeamId] = useState<number | null>(null)
  const [isLeaderboardFullScreen, setIsLeaderboardFullScreen] = useState(false)
  const [refreshingLeaderboard, setRefreshingLeaderboard] = useState(false)
  const [addingTime, setAddingTime] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!timer) {
      setTimerRemaining(null)
      return
    }

    const startedAtMs = new Date(timer.startedAt).getTime()
    const initialRemaining = Math.max(
      0,
      timer.durationSeconds - Math.floor((Date.now() - startedAtMs) / 1000)
    )
    setTimerRemaining(initialRemaining)

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtMs) / 1000)
      const remaining = Math.max(0, timer.durationSeconds - elapsed)
      setTimerRemaining(remaining)
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [timer])

  useEffect(() => {
    if (isLeaderboardFullScreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isLeaderboardFullScreen])
  const handleRemoveTeam = async (teamId: number, teamName: string) => {
    if (!window.confirm(`Remove ${teamName} from the leaderboard?`)) {
      return
    }

    setRemovingTeamId(teamId)
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to remove team')
        return
      }

      await loadData()
    } catch (error) {
      console.error('Failed to remove team:', error)
      alert('Failed to remove team')
    } finally {
      setRemovingTeamId(null)
    }
  }


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

      const challengesWithProgress = await Promise.all(
        challengesData.map(async (challenge: Challenge) => {
          try {
            const res = await fetch(`/api/challenges/${challenge.id}/ctfs`)
            if (!res.ok) {
              return challenge
            }
            const ctfs = await res.json()
            const total = ctfs.length || 1
            const completed = ctfs.filter((ctf: { completed: boolean }) => ctf.completed).length
            const percent = Math.round((completed / total) * 100)

            return {
              ...challenge,
              progress: {
                completed,
                total: ctfs.length,
                percent: ctfs.length === 0 ? 0 : percent,
              },
            }
          } catch (error) {
            console.error(`Failed to load progress for challenge ${challenge.id}:`, error)
            return challenge
          }
        })
      )
      const leaderboardData = await leaderboardRes.json()
      const teamsData = Array.isArray(leaderboardData)
        ? leaderboardData
        : leaderboardData.teams || []
      const timerData = Array.isArray(leaderboardData)
        ? null
        : leaderboardData.timer || null
      const eventData = await eventRes.json()

      setTeam(teamData)
      setChallenges(challengesWithProgress)
      setLeaderboard(teamsData)
      setTimer(timerData)
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

  const handleStartTimer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const minutesValue = parseFloat(timerMinutes)

    if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
      alert('Enter a positive number of minutes')
      return
    }

    setTimerSubmitting(true)
    try {
      const res = await fetch('/api/leaderboard/timer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutes: minutesValue }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to start timer')
        return
      }

      const data = await res.json()
      setTimer(data.timer || null)
      setTimerMinutes('')
    } catch (error) {
      console.error('Failed to start timer:', error)
      alert('Failed to start timer')
    } finally {
      setTimerSubmitting(false)
    }
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isTimerActive = timerRemaining !== null && timerRemaining > 0
  const timerLabel =
    timerRemaining === null
      ? '🕒 No active countdown'
      : timerRemaining > 0
      ? `⏱️ ${formatCountdown(timerRemaining)} remaining`
      : '⌛️ Time is up'

  const handleRefreshLeaderboard = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setRefreshingLeaderboard(true)
    try {
      await loadData()
    } finally {
      setRefreshingLeaderboard(false)
    }
  }

  const handleAddFiveMinutes = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setAddingTime(true)
    try {
      const res = await fetch('/api/leaderboard/timer', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutes: 5 }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to add time')
        return
      }

      const data = await res.json()
      setTimer(data.timer || null)
    } catch (error) {
      console.error('Failed to add time:', error)
      alert('Failed to add time')
    } finally {
      setAddingTime(false)
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
  const isSuperUser = team.name.toLowerCase() === 'superuser'
  const displayName = isSuperUser ? 'Challenger' : team.name
  const teamRank = isSuperUser 
    ? null 
    : (leaderboard.findIndex((t) => t.id === team.id) + 1 || leaderboard.length + 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      {isLeaderboardFullScreen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsLeaderboardFullScreen(false)}
        />
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎯 Welcome, {displayName}!
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
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>
                              {challenge.progress
                                ? `${challenge.progress.completed}/${challenge.progress.total || 0} solved`
                                : 'Progress unavailable'}
                            </span>
                            {challenge.progress && (
                              <span className="font-semibold text-gray-700">
                                {challenge.progress.percent === 100 ? '✅ Done' : `${challenge.progress.percent}%`}
                              </span>
                            )}
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                challenge.progress?.percent === 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${challenge.progress?.percent || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Leaderboard Section */}
          <div
            className={`bg-white rounded-2xl shadow-2xl p-6 ${
              isLeaderboardFullScreen
                ? 'fixed inset-4 z-50 w-auto h-auto max-w-none overflow-y-auto'
                : ''
            }`}
          >
            <div
              className={`flex flex-col gap-3 mb-4 ${
                isLeaderboardFullScreen ? 'sticky top-0 bg-white py-2 border-b border-gray-100 z-10' : ''
              }`}
            >
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold text-gray-800">🏆 Leaderboard</span>
                  <span
                    className={`text-2xl font-bold ${
                      timerRemaining === null
                        ? 'text-gray-700'
                        : timerRemaining > 0
                        ? 'text-purple-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {timerLabel}
                  </span>
                  {isSuperUser && isTimerActive && (
                    <button
                      onClick={handleAddFiveMinutes}
                      disabled={addingTime}
                      aria-label="Add five minutes"
                      title="Add five minutes"
                      className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold transition hover:bg-green-200 disabled:opacity-50"
                    >
                      +5
                    </button>
                  )}
                </div>
                {isSuperUser && (
                  <div className="flex items-center gap-2 flex-wrap ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsLeaderboardFullScreen(!isLeaderboardFullScreen)
                      }}
                      aria-label={
                        isLeaderboardFullScreen
                          ? 'Exit fullscreen leaderboard'
                          : 'Enter fullscreen leaderboard'
                      }
                      title={
                        isLeaderboardFullScreen
                          ? 'Exit fullscreen leaderboard'
                          : 'Enter fullscreen leaderboard'
                      }
                      className="text-lg bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-full transition"
                    >
                      {isLeaderboardFullScreen ? '↩️' : '⛶'}
                    </button>
                    <button
                      onClick={handleRefreshLeaderboard}
                      disabled={refreshingLeaderboard}
                      aria-label="Refresh leaderboard"
                      title="Refresh leaderboard"
                      className="text-lg bg-purple-100 text-purple-700 px-3 py-1 rounded-full transition hover:bg-purple-200 disabled:opacity-50"
                    >
                      {refreshingLeaderboard ? '…' : '🔄'}
                    </button>
                  </div>
                )}
              </div>
              {isSuperUser && !isTimerActive && (
                <form
                  className="flex flex-wrap items-center gap-2 text-sm justify-center"
                  onSubmit={handleStartTimer}
                >
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(e.target.value)}
                    placeholder="Minutes"
                    className="border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 w-28"
                  />
                  <button
                    type="submit"
                    disabled={timerSubmitting}
                    className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full font-semibold transition hover:bg-blue-200 disabled:opacity-50"
                  >
                    {timerSubmitting ? 'Starting...' : 'Start Timer'}
                  </button>
                </form>
              )}
            </div>
            <div
              className={`space-y-2 overflow-y-auto ${
                isLeaderboardFullScreen ? 'max-h-[calc(100vh-200px)] pr-2' : 'max-h-96'
              }`}
            >
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-800">
                    {t.name}
                  </span>
                  {t.completedCtfs && t.completedCtfs.length > 0 && (
                    <span
                      className="text-xl"
                      aria-label="Solved questions"
                    >
                      {t.completedCtfs.join(' ')}
                    </span>
                  )}
                </div>
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
                        {isSuperUser && t.id !== team.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveTeam(t.id, t.name)
                            }}
                            disabled={removingTeamId === t.id}
                            aria-label={
                              removingTeamId === t.id
                                ? `Removing ${t.name}`
                                : `Remove ${t.name}`
                            }
                            className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {removingTeamId === t.id ? '…' : '🗑️'}
                          </button>
                        )}
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

