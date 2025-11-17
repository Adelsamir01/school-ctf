import fs from 'fs'
import path from 'path'

const eventsFile = path.join(process.cwd(), 'events.json')

export interface Event {
  id: string
  name: string
  date: string
  location: string
  password: string
  description: string
}

export function getAllEvents(): Event[] {
  if (!fs.existsSync(eventsFile)) {
    return []
  }
  return JSON.parse(fs.readFileSync(eventsFile, 'utf-8'))
}

export function getEvent(id: string): Event | null {
  const events = getAllEvents()
  return events.find(e => e.id === id) || null
}

export function getEventByPassword(password: string): Event | null {
  const events = getAllEvents()
  return events.find(e => e.password === password) || null
}

