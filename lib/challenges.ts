import fs from 'fs'
import path from 'path'

export interface ChallengeConfig {
  id: string
  name: string
  description: string
  password: string
}

export interface CTFConfig {
  id: string
  title: string
  description: string
  points: number
  photo: string | null
  links: string[]
  hints: string[]
  flag: string
}

export function getAllChallenges(): ChallengeConfig[] {
  const challengesDir = path.join(process.cwd(), 'challenges')
  if (!fs.existsSync(challengesDir)) {
    return []
  }

  const challenges: ChallengeConfig[] = []
  const entries = fs.readdirSync(challengesDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const configPath = path.join(challengesDir, entry.name, 'config.json')
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        challenges.push(config)
      }
    }
  }

  return challenges
}

export function getChallenge(id: string): ChallengeConfig | null {
  const configPath = path.join(process.cwd(), 'challenges', id, 'config.json')
  if (!fs.existsSync(configPath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

export function getCTFsInChallenge(challengeId: string): CTFConfig[] {
  const ctfsDir = path.join(process.cwd(), 'challenges', challengeId, 'ctfs')
  if (!fs.existsSync(ctfsDir)) {
    return []
  }

  const ctfs: CTFConfig[] = []
  const entries = fs.readdirSync(ctfsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const configPath = path.join(ctfsDir, entry.name, 'config.json')
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        ctfs.push(config)
      }
    }
  }

  return ctfs
}

export function getCTF(challengeId: string, ctfId: string): CTFConfig | null {
  const configPath = path.join(
    process.cwd(),
    'challenges',
    challengeId,
    'ctfs',
    ctfId,
    'config.json'
  )
  if (!fs.existsSync(configPath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

