import { NextRequest, NextResponse } from 'next/server'
import { getEvent } from '@/lib/events'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const eventId = cookieStore.get('event_id')?.value

    if (!eventId) {
      return NextResponse.json({ error: 'No event selected' }, { status: 401 })
    }

    const event = getEvent(eventId)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: event.id,
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get event' },
      { status: 500 }
    )
  }
}

