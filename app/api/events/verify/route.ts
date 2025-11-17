import { NextRequest, NextResponse } from 'next/server'
import { getEventByPassword } from '@/lib/events'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const event = getEventByPassword(password)

    if (!event) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Set event cookie
    const cookieStore = await cookies()
    cookieStore.set('event_id', event.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location,
        description: event.description,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to verify event password' },
      { status: 500 }
    )
  }
}

