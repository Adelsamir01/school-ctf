import fs from 'fs'
import path from 'path'

// Use /tmp in serverless environments (Netlify, Vercel, etc.), otherwise use project root
const isServerless = process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
const dataDir = isServerless 
  ? '/tmp/data' 
  : path.join(process.cwd(), 'data')

const teamsFile = path.join(dataDir, 'teams.json')
const challengeAccessFile = path.join(dataDir, 'challenge_access.json')
const ctfAttemptsFile = path.join(dataDir, 'ctf_attempts.json')
const hintPurchasesFile = path.join(dataDir, 'hint_purchases.json')

// Ensure data directory exists
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
} catch (error) {
  // If we can't create the directory, try /tmp as fallback
  if (!isServerless) {
    const fallbackDir = '/tmp/data'
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true })
    }
    // Update paths to use fallback
    const fallbackTeamsFile = path.join(fallbackDir, 'teams.json')
    const fallbackChallengeAccessFile = path.join(fallbackDir, 'challenge_access.json')
    const fallbackCtfAttemptsFile = path.join(fallbackDir, 'ctf_attempts.json')
    const fallbackHintPurchasesFile = path.join(fallbackDir, 'hint_purchases.json')
    
    // Note: This is a workaround - in production you should use a database
    console.warn('Using /tmp for data storage - data will not persist between deployments')
  }
}

// Initialize files if they don't exist
if (!fs.existsSync(teamsFile)) {
  fs.writeFileSync(teamsFile, '[]')
}
if (!fs.existsSync(challengeAccessFile)) {
  fs.writeFileSync(challengeAccessFile, '[]')
}
if (!fs.existsSync(ctfAttemptsFile)) {
  fs.writeFileSync(ctfAttemptsFile, '[]')
}
if (!fs.existsSync(hintPurchasesFile)) {
  fs.writeFileSync(hintPurchasesFile, '[]')
}

interface Team {
  id: number
  name: string
  total_points: number
  event_id: string
  created_at: string
}

interface ChallengeAccess {
  id: number
  team_id: number
  challenge_id: string
  unlocked_at: string
}

interface CTFAttempt {
  id: number
  team_id: number
  ctf_id: string
  challenge_id: string
  start_time: string | null
  end_time: string | null
  completed: number
  points_earned: number
}

interface HintPurchase {
  id: number
  team_id: number
  ctf_id: string
  challenge_id: string
  hint_index: number
  cost: number
  purchased_at: string
}

function readTeams(): Team[] {
  return JSON.parse(fs.readFileSync(teamsFile, 'utf-8'))
}

function writeTeams(teams: Team[]) {
  fs.writeFileSync(teamsFile, JSON.stringify(teams, null, 2))
}

function readChallengeAccess(): ChallengeAccess[] {
  return JSON.parse(fs.readFileSync(challengeAccessFile, 'utf-8'))
}

function writeChallengeAccess(access: ChallengeAccess[]) {
  fs.writeFileSync(challengeAccessFile, JSON.stringify(access, null, 2))
}

function readCTFAttempts(): CTFAttempt[] {
  return JSON.parse(fs.readFileSync(ctfAttemptsFile, 'utf-8'))
}

function writeCTFAttempts(attempts: CTFAttempt[]) {
  fs.writeFileSync(ctfAttemptsFile, JSON.stringify(attempts, null, 2))
}

function readHintPurchases(): HintPurchase[] {
  return JSON.parse(fs.readFileSync(hintPurchasesFile, 'utf-8'))
}

function writeHintPurchases(purchases: HintPurchase[]) {
  fs.writeFileSync(hintPurchasesFile, JSON.stringify(purchases, null, 2))
}

const db = {
  teams: {
    create: (name: string, event_id: string): number => {
      const teams = readTeams()
      const id = teams.length > 0 ? Math.max(...teams.map(t => t.id)) + 1 : 1
      const team: Team = {
        id,
        name,
        total_points: 60,
        event_id,
        created_at: new Date().toISOString(),
      }
      teams.push(team)
      writeTeams(teams)
      return id
    },
    findById: (id: number): Team | undefined => {
      const teams = readTeams()
      return teams.find(t => t.id === id)
    },
    findByName: (name: string): Team | undefined => {
      const teams = readTeams()
      return teams.find(t => t.name === name)
    },
    getAll: (): Team[] => {
      return readTeams()
    },
    getByEvent: (event_id: string): Team[] => {
      const teams = readTeams()
      return teams.filter(t => t.event_id === event_id)
    },
    updatePoints: (id: number, points: number) => {
      const teams = readTeams()
      const team = teams.find(t => t.id === id)
      if (team) {
        team.total_points += points
        writeTeams(teams)
      }
    },
    deductPoints: (id: number, points: number) => {
      const teams = readTeams()
      const team = teams.find(t => t.id === id)
      if (team) {
        team.total_points -= points
        writeTeams(teams)
        return team.total_points
      }
      return 0
    },
  },
  challengeAccess: {
    create: (team_id: number, challenge_id: string) => {
      const access = readChallengeAccess()
      const exists = access.some(
        a => a.team_id === team_id && a.challenge_id === challenge_id
      )
      if (!exists) {
        const id =
          access.length > 0
            ? Math.max(...access.map(a => a.id)) + 1
            : 1
        access.push({
          id,
          team_id,
          challenge_id,
          unlocked_at: new Date().toISOString(),
        })
        writeChallengeAccess(access)
      }
    },
    findByTeamAndChallenge: (
      team_id: number,
      challenge_id: string
    ): ChallengeAccess | undefined => {
      const access = readChallengeAccess()
      return access.find(
        a => a.team_id === team_id && a.challenge_id === challenge_id
      )
    },
    getByTeam: (team_id: number): string[] => {
      const access = readChallengeAccess()
      return access
        .filter(a => a.team_id === team_id)
        .map(a => a.challenge_id)
    },
  },
  ctfAttempts: {
    create: (
      team_id: number,
      ctf_id: string,
      challenge_id: string,
      start_time: string
    ): number => {
      const attempts = readCTFAttempts()
      const id =
        attempts.length > 0
          ? Math.max(...attempts.map(a => a.id)) + 1
          : 1
      attempts.push({
        id,
        team_id,
        ctf_id,
        challenge_id,
        start_time,
        end_time: null,
        completed: 0,
        points_earned: 0,
      })
      writeCTFAttempts(attempts)
      return id
    },
    findByTeamAndCTF: (
      team_id: number,
      ctf_id: string,
      challenge_id: string
    ): CTFAttempt | undefined => {
      const attempts = readCTFAttempts()
      return attempts.find(
        a =>
          a.team_id === team_id &&
          a.ctf_id === ctf_id &&
          a.challenge_id === challenge_id
      )
    },
    update: (
      id: number,
      end_time: string,
      completed: number,
      points_earned: number
    ) => {
      const attempts = readCTFAttempts()
      const attempt = attempts.find(a => a.id === id)
      if (attempt) {
        attempt.end_time = end_time
        attempt.completed = completed
        attempt.points_earned = points_earned
        writeCTFAttempts(attempts)
      }
    },
    getByTeamAndChallenge: (
      team_id: number,
      challenge_id: string
    ): CTFAttempt[] => {
      const attempts = readCTFAttempts()
      return attempts.filter(
        a => a.team_id === team_id && a.challenge_id === challenge_id
      )
    },
    getCompletedByTeam: (team_id: number): CTFAttempt[] => {
      const attempts = readCTFAttempts()
      return attempts.filter(
        a => a.team_id === team_id && a.completed === 1 && a.start_time && a.end_time
      )
    },
  },
  hintPurchases: {
    create: (
      team_id: number,
      ctf_id: string,
      challenge_id: string,
      hint_index: number,
      cost: number
    ): number => {
      const purchases = readHintPurchases()
      const id =
        purchases.length > 0
          ? Math.max(...purchases.map(p => p.id)) + 1
          : 1
      purchases.push({
        id,
        team_id,
        ctf_id,
        challenge_id,
        hint_index,
        cost,
        purchased_at: new Date().toISOString(),
      })
      writeHintPurchases(purchases)
      return id
    },
    getByTeamAndCTF: (
      team_id: number,
      ctf_id: string,
      challenge_id: string
    ): number[] => {
      const purchases = readHintPurchases()
      return purchases
        .filter(
          p =>
            p.team_id === team_id &&
            p.ctf_id === ctf_id &&
            p.challenge_id === challenge_id
        )
        .map(p => p.hint_index)
    },
  },
}

export default db
