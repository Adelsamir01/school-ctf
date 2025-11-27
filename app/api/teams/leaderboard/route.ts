import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getCtfKey, getEmojiForKey } from '@/lib/ctfEmojis'
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
    
    // Filter out superuser team from leaderboard
    const visibleTeams = teams.filter(t => t.name.toLowerCase() !== 'superuser')
    
    // Calculate total time for each team and add to team data
    const teamsWithTime = visibleTeams.map(t => {
      const total_time = calculateTotalTime(t.id)
      const completedAttempts = db.ctfAttempts
        .getCompletedByTeam(t.id)
        .filter((attempt) => attempt.completed === 1 && attempt.end_time)
        .sort((a, b) => {
          const aTime = new Date(a.end_time as string).getTime()
          const bTime = new Date(b.end_time as string).getTime()
          return aTime - bTime
        })

      const seenKeys = new Set<string>()
      const completedCtfs: string[] = []

      for (const attempt of completedAttempts) {
        const key = getCtfKey(attempt.challenge_id, attempt.ctf_id)
        if (seenKeys.has(key)) {
          continue
        }
        seenKeys.add(key)
        const emoji = getEmojiForKey(key)
        if (emoji) {
          completedCtfs.push(emoji)
        }
      }

      return {
        ...t,
        total_time,
        completedCtfs,
      }
    })

    // Sort by points (descending), then by time (ascending - lower time is better)
    teamsWithTime.sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points
      }
      // If points are equal, lower time wins
      return a.total_time - b.total_time
    })

    return NextResponse.json({
      teams: teamsWithTime.map(t => ({
        id: t.id,
        name: t.name,
        total_points: t.total_points,
        total_time: t.total_time,
        completedCtfs: t.completedCtfs,
      })),
      timer: db.leaderboardTimer.getStatus(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get leaderboard' },
      { status: 500 }
    )
  }
}
