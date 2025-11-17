import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const teamId = cookieStore.get('team_id')?.value

    if (!teamId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const team = db.teams.findById(parseInt(teamId))

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: team.id,
      name: team.name,
      total_points: team.total_points,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get team info' },
      { status: 500 }
    )
  }
}
