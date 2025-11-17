import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()
    const cookieStore = await cookies()
    const eventId = cookieStore.get('event_id')?.value

    if (!eventId) {
      return NextResponse.json(
        { error: 'No event selected. Please enter event password first.' },
        { status: 401 }
      )
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    // Check if team name already exists in this event
    const teamsInEvent = db.teams.getByEvent(eventId)
    const existing = teamsInEvent.find(t => t.name === name.trim())

    if (existing) {
      return NextResponse.json(
        { error: 'Team name already taken in this event' },
        { status: 400 }
      )
    }

    // Create team
    const teamId = db.teams.create(name.trim(), eventId)

    // Set cookie
    cookieStore.set('team_id', teamId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return NextResponse.json({
      success: true,
      teamId,
      teamName: name.trim(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to register team' },
      { status: 500 }
    )
  }
}
