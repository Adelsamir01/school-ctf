'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getEmojiForCtf } from '@/lib/ctfEmojis'

interface Challenge {
  id: string
  name: string
  description: string
  unlocked: boolean
}

interface CTF {
  id: string
  title: string
  description: string
  points: number
  completed: boolean
  pointsEarned: number
  emoji?: string
}

export default function ChallengePage() {
  const params = useParams()
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [ctfs, setCtfs] = useState<CTF[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChallenge()
  }, [params.id])

  const loadChallenge = async () => {
    try {
      const res = await fetch('/api/challenges')
      const challenges = await res.json()
      const found = challenges.find((c: Challenge) => c.id === params.id)

      if (!found) {
        router.push('/dashboard')
        return
      }

      setChallenge(found)
      await loadCTFs()
    } catch (error) {
      console.error('Failed to load challenge:', error)
      setLoading(false)
    }
  }

  const loadCTFs = async () => {
    try {
      const res = await fetch(`/api/challenges/${params.id}/ctfs`)
      if (res.ok) {
        const data = await res.json()
        const challengeId = String(params.id)
        const decorated = data.map((ctf: CTF) => ({
          ...ctf,
          emoji: getEmojiForCtf(challengeId, ctf.id),
        }))
        setCtfs(decorated)
      }
    } catch (error) {
      console.error('Failed to load CTFs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    )
  }

  if (!challenge) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:underline mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {challenge.name}
          </h1>
          <p className="text-gray-600">{challenge.description}</p>
        </div>

        <div className="space-y-4">
          {ctfs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-2xl p-6 text-center text-gray-500">
              No CTFs available in this challenge yet.
            </div>
          ) : (
            ctfs.map((ctf) => (
              <Link
                key={ctf.id}
                href={`/challenge/${params.id}/ctf/${ctf.id}`}
                className="block bg-white rounded-2xl shadow-2xl p-6 hover:shadow-3xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {ctf.emoji && (
                        <span className="mr-2" aria-hidden="true">
                          {ctf.emoji}
                        </span>
                      )}
                      {ctf.title}
                    </h2>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {ctf.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        💰 {ctf.points} points
                      </span>
                      {ctf.completed && (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          ✅ Completed ({ctf.pointsEarned} pts earned)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-2xl">→</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

