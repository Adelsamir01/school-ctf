import { NextRequest, NextResponse } from 'next/server'
import { getChallenge } from '@/lib/challenges'
import db from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const teamId = cookieStore.get('team_id')?.value

    if (!teamId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { password } = await request.json()
    const challenge = getChallenge(params.id)

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    if (password !== challenge.password) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Create access if doesn't exist
    db.challengeAccess.create(parseInt(teamId), params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to unlock challenge' },
      { status: 500 }
    )
  }
}
