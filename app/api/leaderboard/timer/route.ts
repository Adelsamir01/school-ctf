import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import db from '@/lib/db'

function buildTimerResponse() {
  const status = db.leaderboardTimer.getStatus()
  if (!status) {
    return null
  }

  return status
}

export async function GET() {
  try {
    return NextResponse.json({
      timer: buildTimerResponse(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load timer' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const teamId = cookieStore.get('team_id')?.value

    if (!teamId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const team = db.teams.findById(parseInt(teamId, 10))
    if (!team || team.name.toLowerCase() !== 'superuser') {
      return NextResponse.json(
        { error: 'Only the superuser team can start the timer' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const minutes = Number(body.minutes)

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return NextResponse.json(
        { error: 'Minutes must be a positive number' },
        { status: 400 }
      )
    }

    const durationSeconds = Math.round(minutes * 60)
    const startedAt = new Date().toISOString()

    db.leaderboardTimer.set({
      started_at: startedAt,
      duration_seconds: durationSeconds,
    })

    return NextResponse.json({
      timer: {
        startedAt,
        durationSeconds,
        remainingSeconds: durationSeconds,
        isActive: true,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to start timer' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const teamId = cookieStore.get('team_id')?.value

    if (!teamId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const team = db.teams.findById(parseInt(teamId, 10))
    if (!team || team.name.toLowerCase() !== 'superuser') {
      return NextResponse.json(
        { error: 'Only the superuser team can add time' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const minutes = body.minutes === undefined ? 5 : Number(body.minutes)

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return NextResponse.json(
        { error: 'Minutes must be a positive number' },
        { status: 400 }
      )
    }

    const status = db.leaderboardTimer.getStatus()
    if (!status || !status.isActive) {
      return NextResponse.json(
        { error: 'No active timer to extend' },
        { status: 400 }
      )
    }

    const updatedStatus = db.leaderboardTimer.extend(Math.round(minutes * 60))

    return NextResponse.json({
      timer: updatedStatus,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add time' },
      { status: 500 }
    )
  }
}

