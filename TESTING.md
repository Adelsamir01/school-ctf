# Testing Guide

## Manual Testing Flow

### Prerequisites
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Open http://localhost:3000 in your browser

### Test Flow

#### 1. Team Registration
- Navigate to http://localhost:3000
- Should redirect to `/join`
- Enter a team name (e.g., "Team Alpha")
- Click "Join Challenge!"
- Should redirect to `/dashboard`

**Expected Result**: Team is created and you see the dashboard

#### 2. View Dashboard
- Should see:
  - Team name and points (0 initially)
  - Rank (#1 if first team)
  - List of challenges (Cryptography Challenge should be visible, locked)
  - Leaderboard showing your team

**Expected Result**: Dashboard displays correctly with locked challenge

#### 3. Unlock Challenge
- Click on "Cryptography Challenge"
- Should see password entry form
- Enter password: `crypto2024`
- Click "Unlock Challenge"

**Expected Result**: Challenge unlocks and shows list of CTFs (Caesar Cipher)

#### 4. Start CTF
- Click on "Caesar Cipher" CTF
- Timer should start automatically
- Should see:
  - CTF title and description
  - Encrypted message: "XLI WXEVXIV QEOI MR JSV QEOI"
  - Links section
  - Hints section (collapsible)
  - Flag submission form

**Expected Result**: CTF page loads, timer is running

#### 5. Test Hints
- Click on "Hint 1" to expand
- Should show hint text
- Click again to collapse

**Expected Result**: Hints expand/collapse correctly

#### 6. Submit Incorrect Flag
- Enter an incorrect flag (e.g., "FLAG{WRONG}")
- Click "Submit Flag"
- Should show error message

**Expected Result**: Error message appears, timer continues

#### 7. Solve and Submit Correct Flag
- Decode the Caesar cipher:
  - Encrypted: "XLI WXEVXIV QEOI MR JSV QEOI"
  - Shift: 4 positions backwards
  - Decrypted: "THE STUDENT WHO CAN SOLVE THIS"
- Enter flag: `FLAG{THE STUDENT WHO CAN SOLVE THIS}`
- Click "Submit Flag"

**Expected Result**: 
- Success message appears
- Points (100) are awarded
- Timer stops
- Redirects to dashboard after 2 seconds
- Dashboard shows updated points and rank

#### 8. Verify Leaderboard
- On dashboard, check leaderboard
- Your team should show 100 points
- If multiple teams exist, they should be ranked by points

**Expected Result**: Leaderboard updates correctly

#### 9. Test Completed CTF
- Navigate back to Cryptography Challenge
- Click on Caesar Cipher
- Should show "Completed" status
- Should not allow resubmission

**Expected Result**: Completed CTF shows completion status

## Verification Checklist

- [ ] Team registration works
- [ ] Dashboard displays correctly
- [ ] Challenge password protection works
- [ ] CTF timer starts automatically
- [ ] Timer displays correctly
- [ ] Hints expand/collapse
- [ ] Incorrect flag shows error
- [ ] Correct flag awards points
- [ ] Points update in database
- [ ] Leaderboard updates
- [ ] Completed CTF shows status
- [ ] Cannot resubmit completed CTF

## Database Verification

After testing, check the database:
```bash
sqlite3 ctf.db
.tables
SELECT * FROM teams;
SELECT * FROM challenge_access;
SELECT * FROM ctf_attempts;
```

Expected:
- `teams` table has your team with total_points = 100
- `challenge_access` has entry for your team and challenge
- `ctf_attempts` has entry with completed = 1, points_earned = 100

