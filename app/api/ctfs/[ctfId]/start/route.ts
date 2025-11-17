import { NextRequest, NextResponse } from 'next/server'
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

    const { challengeId } = await request.json()

    // Check if already started or completed
    const existing = db.ctfAttempts.findByTeamAndCTF(
      parseInt(teamId),
      params.ctfId,
      challengeId
    )

    if (existing) {
      if (existing.completed === 1) {
        return NextResponse.json(
          { error: 'CTF already completed' },
          { status: 400 }
        )
      }
      // Already started, return existing start time
      return NextResponse.json({
        success: true,
        startTime: existing.start_time || new Date().toISOString(),
      })
    }

    // Start new attempt
    const startTime = new Date().toISOString()
    db.ctfAttempts.create(
      parseInt(teamId),
      params.ctfId,
      challengeId,
      startTime
    )

    return NextResponse.json({
      success: true,
      startTime,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to start CTF' },
      { status: 500 }
    )
  }
}
