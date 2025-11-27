const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

test('dashboard challenges do not show unlocked badge', () => {
  const dashboardPath = path.join(__dirname, '..', 'app', 'dashboard', 'page.tsx')
  const source = fs.readFileSync(dashboardPath, 'utf8')

  assert.ok(
    !source.includes('Unlocked'),
    'Dashboard challenge cards should not include the unlocked label'
  )
})

test('layout footer references Adel ElZemity and adelsamir.com', () => {
  const layoutPath = path.join(__dirname, '..', 'app', 'layout.tsx')
  const source = fs.readFileSync(layoutPath, 'utf8')

  assert.ok(source.includes('Adel ElZemity'), 'Footer should credit Adel ElZemity')
  assert.ok(
    source.includes('adelsamir.com'),
    'Footer should link to adelsamir.com'
  )
})

test('web-basics-challenge and ctfs exist', () => {
  const baseDir = path.join(__dirname, '..', 'challenges', 'web-basics-challenge')
  const challengeConfigPath = path.join(baseDir, 'config.json')
  const challengeConfig = JSON.parse(fs.readFileSync(challengeConfigPath, 'utf8'))

  assert.strictEqual(challengeConfig.id, 'web-basics-challenge')
  assert.strictEqual(typeof challengeConfig.description, 'string')

  const ctfs = ['cookie-clue', 'robot-rules', 'console-secret', 'element-inspector']
  ctfs.forEach((ctfId) => {
    const ctfConfigPath = path.join(baseDir, 'ctfs', ctfId, 'config.json')
    const ctfConfig = JSON.parse(fs.readFileSync(ctfConfigPath, 'utf8'))

    assert.strictEqual(ctfConfig.id, ctfId)
    assert.ok(ctfConfig.title.length > 0, `${ctfId} should have a title`)
    assert.ok(ctfConfig.flag.startsWith('FLAG{'), `${ctfId} should define a flag`)
  })
})

test('team deletion API restricts access to superuser team', () => {
  const apiPath = path.join(__dirname, '..', 'app', 'api', 'teams', '[teamId]', 'route.ts')
  const source = fs.readFileSync(apiPath, 'utf8')

  assert.ok(
    source.includes("requester.name.toLowerCase() !== 'superuser'"),
    'DELETE /api/teams/[teamId] should restrict access to the superuser team'
  )
})

test('dashboard includes remove button handler for superuser team', () => {
  const dashboardPath = path.join(__dirname, '..', 'app', 'dashboard', 'page.tsx')
  const source = fs.readFileSync(dashboardPath, 'utf8')

  assert.ok(
    source.includes('handleRemoveTeam'),
    'Dashboard should have a handler for removing teams'
  )
  assert.ok(
    source.includes('`Remove ${t.name}`'),
    'Dashboard should render a remove control with accessible label'
  )
})

test('leaderboard fullscreen toggle exists for superuser team', () => {
  const dashboardPath = path.join(__dirname, '..', 'app', 'dashboard', 'page.tsx')
  const source = fs.readFileSync(dashboardPath, 'utf8')

  assert.ok(
    source.includes('Enter fullscreen leaderboard'),
    'Dashboard should include control to enter fullscreen leaderboard mode'
  )
  assert.ok(
    source.includes('Exit fullscreen leaderboard'),
    'Dashboard should include control to exit fullscreen leaderboard mode'
  )
  assert.ok(
    source.includes('setIsLeaderboardFullScreen'),
    'Dashboard should toggle fullscreen state with setIsLeaderboardFullScreen'
  )
})

test('leaderboard API exposes completedCtfs data', () => {
  const apiPath = path.join(
    __dirname,
    '..',
    'app',
    'api',
    'teams',
    'leaderboard',
    'route.ts'
  )
  const source = fs.readFileSync(apiPath, 'utf8')

  assert.ok(
    source.includes('completedCtfs'),
    'Leaderboard API should include completedCtfs for solved questions'
  )
  assert.ok(
    source.includes('getEmojiForKey'),
    'Leaderboard API should map solved questions to emoji order'
  )
  assert.ok(
    source.includes('timer:'),
    'Leaderboard API should include timer payload'
  )
})

test('ctf emoji mapping includes all circle colors', () => {
  const emojiPath = path.join(__dirname, '..', 'lib', 'ctfEmojis.ts')
  const source = fs.readFileSync(emojiPath, 'utf8')
  const requiredEmojis = ['🔴', '⚪️', '🔵', '🟡', '🟣', '🟢', '⚫️', '🟠']

  requiredEmojis.forEach((emoji) => {
    assert.ok(source.includes(emoji), `Emoji map should include ${emoji}`)
  })
})

test('leaderboard timer route restricts to superuser', () => {
  const timerPath = path.join(
    __dirname,
    '..',
    'app',
    'api',
    'leaderboard',
    'timer',
    'route.ts'
  )
  const source = fs.readFileSync(timerPath, 'utf8')

  assert.ok(
    source.includes('Only the superuser team can start the timer'),
    'Timer route should enforce superuser access'
  )
  assert.ok(
    source.includes('Only the superuser team can add time'),
    'Timer route should restrict add time to superuser'
  )
  assert.ok(
    source.includes('Minutes must be a positive number'),
    'Timer route should validate minutes input'
  )
  assert.ok(
    source.includes('PATCH'),
    'Timer route should support extending timer through PATCH'
  )
})

test('dashboard renders countdown UI with emojis', () => {
  const dashboardPath = path.join(__dirname, '..', 'app', 'dashboard', 'page.tsx')
  const source = fs.readFileSync(dashboardPath, 'utf8')

  assert.ok(
    source.includes('No active countdown'),
    'Dashboard should mention countdown status'
  )
  assert.ok(source.includes('⏱️'), 'Dashboard should include timer emoji display')
  assert.ok(
    source.includes('Start Timer'),
    'Dashboard should include a Start Timer control for superuser'
  )
  assert.ok(
    source.includes('aria-label="Refresh leaderboard"'),
    'Dashboard should provide a refresh control for superuser'
  )
  assert.ok(source.includes('+5'), 'Dashboard should provide a +5 time control')
  assert.ok(
    source.includes('aria-label="Add five minutes"'),
    'Dashboard should describe the add time control for accessibility'
  )
})
