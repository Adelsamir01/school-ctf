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

test('team deletion API restricts access to test team', () => {
  const apiPath = path.join(__dirname, '..', 'app', 'api', 'teams', '[teamId]', 'route.ts')
  const source = fs.readFileSync(apiPath, 'utf8')

  assert.ok(
    source.includes("requester.name.toLowerCase() !== 'test'"),
    'DELETE /api/teams/[teamId] should restrict access to the test team'
  )
})

test('dashboard includes remove button handler for test team', () => {
  const dashboardPath = path.join(__dirname, '..', 'app', 'dashboard', 'page.tsx')
  const source = fs.readFileSync(dashboardPath, 'utf8')

  assert.ok(
    source.includes('handleRemoveTeam'),
    'Dashboard should have a handler for removing teams'
  )
  assert.ok(
    source.includes('Remove'),
    'Dashboard should render a remove button for eligible teams'
  )
})

test('leaderboard fullscreen toggle exists for test team', () => {
  const dashboardPath = path.join(__dirname, '..', 'app', 'dashboard', 'page.tsx')
  const source = fs.readFileSync(dashboardPath, 'utf8')

  assert.ok(
    source.includes('Fullscreen'),
    'Dashboard should include a button to enter fullscreen leaderboard mode'
  )
  assert.ok(
    source.includes('Exit Fullscreen'),
    'Dashboard should include text for exiting fullscreen leaderboard mode'
  )
  assert.ok(
    source.includes('setIsLeaderboardFullScreen'),
    'Dashboard should toggle fullscreen state with setIsLeaderboardFullScreen'
  )
})
