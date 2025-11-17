import { NextRequest, NextResponse } from 'next/server'
import { getCTFsInChallenge } from '@/lib/challenges'
import db from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const teamId = cookieStore.get('team_id')?.value

    if (!teamId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // In event-based system, challenges are automatically unlocked
    // No need to check challenge access

    const ctfs = getCTFsInChallenge(params.id)

    // Get completion status for each CTF
    const attempts = db.ctfAttempts.getByTeamAndChallenge(
      parseInt(teamId),
      params.id
    )

    const attemptsMap = new Map(
      attempts.map((a) => [
        a.ctf_id,
        { completed: a.completed === 1, points: a.points_earned },
      ])
    )

    const ctfsWithStatus = ctfs.map((ctf) => {
      const attempt = attemptsMap.get(ctf.id)
      return {
        ...ctf,
        flag: undefined, // Don't send flag to client
        completed: attempt?.completed || false,
        pointsEarned: attempt?.points || 0,
      }
    })

    return NextResponse.json(ctfsWithStatus)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get CTFs' },
      { status: 500 }
    )
  }
}
