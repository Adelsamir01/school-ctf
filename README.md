# School CTF Platform

A friendly, web-based Capture The Flag platform designed for school-age students (15+ years old) to learn cybersecurity through hands-on challenges.

## Features

- 🎯 Team registration with simple team name entry
- 🔒 Password-protected challenges containing multiple CTFs
- ⏱️ Timer tracking for each CTF attempt
- 🏆 Real-time leaderboard showing all teams
- 💰 Points system for completed CTFs
- 💡 Hint system for each CTF
- 🎨 Youth-friendly, colorful UI

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/challenges/
  /[challenge-name]/
    config.json          # Challenge configuration (name, description, password)
    /ctfs/
      /[ctf-name]/
        config.json      # CTF configuration (title, description, points, flag, hints, links)
        photo.jpg        # Optional photo for the CTF

/app/
  /api/                  # API routes
  /dashboard/            # Team dashboard
  /join/                 # Team registration
  /challenge/[id]/       # Challenge password entry and CTF listing
  /challenge/[id]/ctf/[ctfId]/  # Individual CTF page
```

## Adding Challenges

1. Create a new folder in `/challenges/` with your challenge name
2. Create `config.json` in that folder:
```json
{
  "id": "my-challenge",
  "name": "My Challenge Name",
  "description": "Description of the challenge",
  "password": "your_password_here"
}
```

3. Create a `/ctfs/` folder inside your challenge folder
4. For each CTF, create a subfolder with `config.json`:
```json
{
  "id": "my-ctf",
  "title": "My CTF Title",
  "description": "Detailed description of the CTF challenge",
  "points": 100,
  "photo": "photo.jpg",
  "links": ["https://example.com"],
  "hints": ["Hint 1", "Hint 2"],
  "flag": "FLAG{your_flag_here}"
}
```

## Example Challenge

The platform includes an example "Cryptography Challenge" with a Caesar cipher CTF:
- Challenge password: `crypto2024`
- CTF flag: `FLAG{THE STUDENT WHO CAN SOLVE THIS}`

## Database

The platform uses SQLite for data storage. The database file (`ctf.db`) is automatically created on first run.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Notes

- Teams are identified by cookies (team_id)
- Challenge passwords are hardcoded in config.json files
- CTF flags are case-sensitive
- Timer starts automatically when a team views a CTF
- Points are awarded only on first correct submission

