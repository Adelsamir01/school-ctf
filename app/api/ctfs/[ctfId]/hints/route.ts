import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { ctfId: string } }
) {
  try {
    const cookieStore = await cookies()
    const teamId = cookieStore.get('team_id')?.value

    if (!teamId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const challengeId = searchParams.get('challengeId')

    if (!challengeId) {
      return NextResponse.json(
        { error: 'challengeId required' },
        { status: 400 }
      )
    }

    const purchasedHints = db.hintPurchases.getByTeamAndCTF(
      parseInt(teamId),
      params.ctfId,
      challengeId
    )

    return NextResponse.json({
      purchasedHints,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get purchased hints' },
      { status: 500 }
    )
  }
}

