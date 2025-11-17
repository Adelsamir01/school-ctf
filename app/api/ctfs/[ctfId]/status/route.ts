import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { ctfId: string } }
) {
  try {
    const cookieStore = await cookies()
    const teamId = cookieStore.get('team_id')?.value

    if (!teamId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const challengeId = searchParams.get('challengeId')

    if (!challengeId) {
      return NextResponse.json(
        { error: 'challengeId required' },
        { status: 400 }
      )
    }

    const attempt = db.ctfAttempts.findByTeamAndCTF(
      parseInt(teamId),
      params.ctfId,
      challengeId
    )

    if (!attempt) {
      return NextResponse.json({
        started: false,
        completed: false,
      })
    }

    return NextResponse.json({
      started: true,
      completed: attempt.completed === 1,
      startTime: attempt.start_time,
      endTime: attempt.end_time,
      pointsEarned: attempt.points_earned || 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get CTF status' },
      { status: 500 }
    )
  }
}
