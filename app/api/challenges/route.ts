import { NextRequest, NextResponse } from 'next/server'
import { getAllChallenges } from '@/lib/challenges'
import db from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const teamId = cookieStore.get('team_id')?.value

    if (!teamId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const challenges = getAllChallenges()

    // In event-based system, all challenges are unlocked once you're in an event
    const challengesWithStatus = challenges.map((challenge) => ({
      ...challenge,
      unlocked: true,
      password: undefined, // Don't send password to client
    }))

    return NextResponse.json(challengesWithStatus)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get challenges' },
      { status: 500 }
    )
  }
}
