'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface CTF {
  id: string
  title: string
  description: string
  points: number
  links: string[]
  hints: string[]
}

interface CTFStatus {
  started: boolean
  completed: boolean
  startTime: string | null
  endTime: string | null
  pointsEarned: number
}

export default function CTFPage() {
  const params = useParams()
  const router = useRouter()
  const [ctf, setCtf] = useState<CTF | null>(null)
  const [status, setStatus] = useState<CTFStatus | null>(null)
  const [flag, setFlag] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showHints, setShowHints] = useState<number[]>([])
  const [purchasedHints, setPurchasedHints] = useState<number[]>([])
  const [teamPoints, setTeamPoints] = useState(0)
  const [confirmingHint, setConfirmingHint] = useState<number | null>(null)
  const [loadingHint, setLoadingHint] = useState(false)

  const challengeId = params.id as string
  const ctfId = params.ctfId as string

  useEffect(() => {
    loadCTF()
  }, [challengeId, ctfId])

  useEffect(() => {
    if (status?.started && !status.completed && status.startTime) {
      const interval = setInterval(() => {
        const start = new Date(status.startTime!).getTime()
        const now = new Date().getTime()
        setElapsedTime(Math.floor((now - start) / 1000))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [status])

  const loadPurchasedHints = async () => {
    try {
      const res = await fetch(
        `/api/ctfs/${ctfId}/hints?challengeId=${challengeId}`
      )
      if (res.ok) {
        const data = await res.json()
        setPurchasedHints(data.purchasedHints || [])
        // Auto-show purchased hints
        setShowHints(data.purchasedHints || [])
      }
    } catch (error) {
      console.error('Failed to load purchased hints:', error)
    }
  }

  const loadCTF = async () => {
    try {
      // Load CTF details from challenge CTFs list
      const ctfsRes = await fetch(`/api/challenges/${challengeId}/ctfs`)
      if (!ctfsRes.ok) {
        router.push('/dashboard')
        return
      }

      const ctfs = await ctfsRes.json()
      const found = ctfs.find((c: CTF) => c.id === ctfId)

      if (!found) {
        router.push('/dashboard')
        return
      }

      setCtf(found)

      // Load status
      const statusRes = await fetch(
        `/api/ctfs/${ctfId}/status?challengeId=${challengeId}`
      )
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setStatus(statusData)

        if (!statusData.started) {
          // Auto-start when viewing
          await startCTF()
        }
      }

      // Load purchased hints
      await loadPurchasedHints()

      // Load team points
      const teamRes = await fetch('/api/teams/me')
      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeamPoints(teamData.total_points)
      }
    } catch (error) {
      console.error('Failed to load CTF:', error)
    } finally {
      setLoading(false)
    }
  }

  const startCTF = async () => {
    try {
      const res = await fetch(`/api/ctfs/${ctfId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      })

      if (res.ok) {
        const data = await res.json()
        setStatus({
          started: true,
          completed: false,
          startTime: data.startTime,
          endTime: null,
          pointsEarned: 0,
        })
      }
    } catch (error) {
      console.error('Failed to start CTF:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/ctfs/${ctfId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, flag }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit flag')
        setSubmitting(false)
        return
      }

      if (data.correct) {
        setSuccess(
          `🎉 Correct! You earned ${data.points} points in ${formatTime(data.timeTaken)}!`
        )
        setFlag('')
        // Reload status
        const statusRes = await fetch(
          `/api/ctfs/${ctfId}/status?challengeId=${challengeId}`
        )
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          setStatus(statusData)
        }
        // Refresh dashboard data
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError(data.message || 'Incorrect flag. Keep trying!')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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

  const handleHintClick = (index: number) => {
    // If already purchased, just toggle visibility
    if (purchasedHints.includes(index)) {
      if (showHints.includes(index)) {
        setShowHints(showHints.filter((i) => i !== index))
      } else {
        setShowHints([...showHints, index])
      }
      return
    }

    // Show confirmation dialog
    setConfirmingHint(index)
  }

  const purchaseHint = async (index: number) => {
    setLoadingHint(true)
    try {
      const res = await fetch(`/api/ctfs/${ctfId}/hints/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, hintIndex: index }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'Insufficient points') {
          alert(
            `You don't have enough points! This hint costs ${data.cost} points, but you only have ${data.currentPoints} points.`
          )
        } else {
          alert(data.error || 'Failed to purchase hint')
        }
        setConfirmingHint(null)
        setLoadingHint(false)
        return
      }

      // Update purchased hints and show the hint
      setPurchasedHints([...purchasedHints, index])
      setShowHints([...showHints, index])
      setTeamPoints(data.newTotalPoints)
      setConfirmingHint(null)
    } catch (error) {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoadingHint(false)
    }
  }

  const cancelHintPurchase = () => {
    setConfirmingHint(null)
  }

  if (loading || !ctf) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <Link
            href={`/challenge/${challengeId}`}
            className="text-blue-600 hover:underline mb-4 inline-block"
          >
            ← Back to Challenge
          </Link>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {ctf.title}
          </h1>
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
              💰 {ctf.points} points
            </span>
            {status?.started && !status.completed && (
              <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-semibold">
                ⏱️ {formatTime(elapsedTime)}
              </span>
            )}
            {status?.completed && (
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold">
                ✅ Completed
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            📝 Description
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-line text-lg leading-relaxed">
              {ctf.description}
            </p>
          </div>
        </div>

        {ctf.links && ctf.links.length > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">🔗 Links</h2>
            <ul className="space-y-2">
              {ctf.links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-lg"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {ctf.hints && ctf.hints.length > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">💡 Hints</h2>
            <div className="space-y-3">
              {ctf.hints.map((hint, index) => {
                const hintNumber = index + 1
                const cost = hintNumber * 10
                const isPurchased = purchasedHints.includes(index)

                return (
                  <div
                    key={index}
                    className={`border-2 rounded-lg p-4 ${
                      isPurchased
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => handleHintClick(index)}
                      className="w-full text-left font-semibold text-lg text-gray-800 flex items-center justify-between"
                      disabled={loadingHint}
                    >
                      <div className="flex items-center gap-3">
                        <span>Hint {hintNumber}</span>
                        {!isPurchased && (
                          <span className="text-sm font-normal text-orange-600 bg-orange-100 px-2 py-1 rounded">
                            💰 {cost} points
                          </span>
                        )}
                        {isPurchased && (
                          <span className="text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded">
                            ✅ Purchased
                          </span>
                        )}
                      </div>
                      <span>
                        {showHints.includes(index) ? '▼' : '▶'}
                      </span>
                    </button>
                    {showHints.includes(index) && (
                      <p className="mt-2 text-gray-700 text-lg">{hint}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmingHint !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Purchase Hint?
              </h3>
              <p className="text-gray-700 mb-6">
                This hint will cost you{' '}
                <span className="font-bold text-orange-600">
                  {(confirmingHint + 1) * 10} points
                </span>
                . Are you sure you want to show it?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Your current points: <span className="font-bold">{teamPoints}</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={cancelHintPurchase}
                  disabled={loadingHint}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => purchaseHint(confirmingHint)}
                  disabled={loadingHint || teamPoints < (confirmingHint + 1) * 10}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingHint ? 'Purchasing...' : 'Yes, Purchase'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!status?.completed && (
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              🚩 Submit Flag
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="flag"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Flag
                </label>
                <input
                  id="flag"
                  type="text"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  placeholder="FLAG{...}"
                  required
                  disabled={submitting}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Flag 🚀'}
              </button>
            </form>
          </div>
        )}

        {status?.completed && (
          <div className="bg-green-50 border-2 border-green-500 rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-2 text-green-800">
              🎉 Challenge Completed!
            </h2>
            <p className="text-green-700 text-lg">
              You earned {status.pointsEarned} points for this CTF!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

