# Gym Progress Tracker

A mobile-first web app to track personal gym progress. Logs workouts (sets / reps / weight) to Google Sheets via a service account, with a React frontend and Node.js/Express backend.

## Monorepo structure

```
apps/
  client/   # React + Vite + Tailwind CSS (mobile-first)
  server/   # Node.js + Express REST API
packages/   # Shared utilities (future)
```

## Getting started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Google Cloud service account credentials (see [backend setup](apps/server/README.md))

### Install dependencies

```bash
npm install
```

### Development

```bash
# Start both client and server in watch mode
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:4000

### Environment variables

Copy `apps/server/.env.example` to `apps/server/.env` and fill in the values.

## Service account

The backend authenticates with Google Sheets using a service account JSON key.  
**Never commit `credentials.json` to git.** Store it in `apps/server/` and ensure it is covered by `.gitignore`.

Service account email: _documented after GCP setup (GYM-7)_
