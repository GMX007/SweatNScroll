# FormForge — Getting Started

## What is FormForge

An AI form-coaching PWA: real-time camera form checking is the engine that builds
and adapts your workout program — not just a rep counter.

- **Program engine**: equipment-aware program generation (bodyweight, dumbbells, kettlebell, bands, pull-up bar), 2–5 day splits, goal-based (strength / muscle / general)
- **Form-gated progression**: your camera form score decides when you progress, hold, or regress. Poor form swaps in easier variations; excellent form unlocks harder ones
- **Progression models**: form-gated (default), linear, undulating, autoregulated — switchable in Settings
- **Camera AI**: TensorFlow.js MoveNet pose detection with per-exercise verifiers, voice/audio cues, real form scores (clean vs flagged reps)
- **Form profile**: rolling per-exercise form history that shapes every future block
- **Gamification**: XP, levels, streaks, Supabase-backed social leaderboard
- **PWA**: installable, offline caching, service worker

## Key files

- `src/services/programEngine.js` — program generation + adaptation logic
- `src/data/programs.js` — movement patterns, splits, goals, progression models
- `src/services/exerciseVerifier.js` — per-exercise pose verification
- `src/AppContext.jsx` — app state (program, workout session, form profile)

## Quick Start (Local)

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Use Chrome DevTools mobile view.

## Deploy to Vercel (Free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com), sign in with GitHub
3. Add New → Project → import the repo — Vercel auto-detects Vite
4. (Optional, for live leaderboard) add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
5. Deploy — you'll get a `*.vercel.app` URL

## Notes

- All data is stored locally in the browser (`formforge_state`); no account needed
- The camera never uploads video — pose detection runs entirely on-device
