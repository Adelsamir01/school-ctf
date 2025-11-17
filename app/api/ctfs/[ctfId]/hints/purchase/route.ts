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

    const { challengeId, hintIndex } = await request.json()

    if (hintIndex === undefined || hintIndex === null) {
      return NextResponse.json(
        { error: 'hintIndex is required' },
        { status: 400 }
      )
    }

    const team = db.teams.findById(parseInt(teamId))
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if hint already purchased
    const purchasedHints = db.hintPurchases.getByTeamAndCTF(
      parseInt(teamId),
      params.ctfId,
      challengeId
    )

    if (purchasedHints.includes(hintIndex)) {
      return NextResponse.json({
        success: true,
        alreadyPurchased: true,
      })
    }

    // Calculate cost (10 * hint number, where hint 1 = index 0)
    const cost = (hintIndex + 1) * 10

    // Check if team has enough points
    if (team.total_points < cost) {
      return NextResponse.json(
        { error: 'Insufficient points', cost, currentPoints: team.total_points },
        { status: 400 }
      )
    }

    // Deduct points
    const newTotalPoints = db.teams.deductPoints(parseInt(teamId), cost)

    // Record purchase
    db.hintPurchases.create(
      parseInt(teamId),
      params.ctfId,
      challengeId,
      hintIndex,
      cost
    )

    return NextResponse.json({
      success: true,
      cost,
      newTotalPoints,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to purchase hint' },
      { status: 500 }
    )
  }
}

