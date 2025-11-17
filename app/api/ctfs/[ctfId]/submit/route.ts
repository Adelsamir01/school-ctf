import { NextRequest, NextResponse } from 'next/server'
import { getCTF } from '@/lib/challenges'
import db from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { ctfId: string } }
) {
  try {
    const cookieStore = await cookies()
    const teamId = cookieStore.get('team_id')?.value

    if (!teamId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { challengeId, flag } = await request.json()

    const ctf = getCTF(challengeId, params.ctfId)

    if (!ctf) {
      return NextResponse.json({ error: 'CTF not found' }, { status: 404 })
    }

    // Get or create attempt
    let attempt = db.ctfAttempts.findByTeamAndCTF(
      parseInt(teamId),
      params.ctfId,
      challengeId
    )

    if (!attempt) {
      // Create attempt with start time
      const startTime = new Date().toISOString()
      db.ctfAttempts.create(
        parseInt(teamId),
        params.ctfId,
        challengeId,
        startTime
      )
      attempt = db.ctfAttempts.findByTeamAndCTF(
        parseInt(teamId),
        params.ctfId,
        challengeId
      )!
    }

    if (attempt.completed === 1) {
      return NextResponse.json(
        { error: 'CTF already completed' },
        { status: 400 }
      )
    }

    // Check flag
    const isCorrect = flag.trim() === ctf.flag.trim()

    if (isCorrect) {
      // Calculate time taken (in seconds)
      const startTime = new Date(attempt.start_time!).getTime()
      const endTime = new Date().getTime()
      const timeTaken = Math.floor((endTime - startTime) / 1000)

      // Award points
      const endTimeStr = new Date().toISOString()
      db.ctfAttempts.update(attempt.id, endTimeStr, 1, ctf.points)

      // Update team total points
      db.teams.updatePoints(parseInt(teamId), ctf.points)

      return NextResponse.json({
        success: true,
        correct: true,
        points: ctf.points,
        timeTaken,
      })
    } else {
      return NextResponse.json({
        success: true,
        correct: false,
        message: 'Incorrect flag. Keep trying!',
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit flag' },
      { status: 500 }
    )
  }
}
