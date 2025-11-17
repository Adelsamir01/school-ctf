import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { cookies } from 'next/headers'

function calculateTotalTime(teamId: number): number {
  const completedAttempts = db.ctfAttempts.getCompletedByTeam(teamId)
  let totalSeconds = 0

  for (const attempt of completedAttempts) {
    if (attempt.start_time && attempt.end_time) {
      const start = new Date(attempt.start_time).getTime()
      const end = new Date(attempt.end_time).getTime()
      totalSeconds += Math.floor((end - start) / 1000)
    }
  }

  return totalSeconds
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const eventId = cookieStore.get('event_id')?.value

    if (!eventId) {
      return NextResponse.json({ error: 'No event selected' }, { status: 401 })
    }

    const teams = db.teams.getByEvent(eventId)
    
    // Calculate total time for each team and add to team data
    const teamsWithTime = teams.map(t => ({
      ...t,
      total_time: calculateTotalTime(t.id),
    }))

    // Sort by points (descending), then by time (ascending - lower time is better)
    teamsWithTime.sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points
      }
      // If points are equal, lower time wins
      return a.total_time - b.total_time
    })

    return NextResponse.json(
      teamsWithTime.map(t => ({
        id: t.id,
        name: t.name,
        total_points: t.total_points,
        total_time: t.total_time,
      }))
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get leaderboard' },
      { status: 500 }
    )
  }
}
