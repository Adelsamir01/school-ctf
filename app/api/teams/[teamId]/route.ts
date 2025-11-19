import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import db from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const cookieStore = await cookies()
    const requesterId = cookieStore.get('team_id')?.value

    if (!requesterId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const requester = db.teams.findById(parseInt(requesterId))
    if (!requester || requester.name.toLowerCase() !== 'test') {
      return NextResponse.json(
        { error: 'Only the test team can remove teams' },
        { status: 403 }
      )
    }

    const targetId = parseInt(params.teamId)
    if (isNaN(targetId)) {
      return NextResponse.json(
        { error: 'Invalid team id' },
        { status: 400 }
      )
    }

    if (targetId === requester.id) {
      return NextResponse.json(
        { error: 'Cannot remove the test team itself' },
        { status: 400 }
      )
    }

    const deleted = db.teams.delete(targetId)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete team:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete team' },
      { status: 500 }
    )
  }
}

