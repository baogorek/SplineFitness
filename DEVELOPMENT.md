# Strength Tracker - Development Notes

## Overview

A workout tracking app supporting two modes:
- **Circuit Training**: Athlean-X style timed combos (3 min each, multiple rounds)
- **Traditional**: Standard sets/reps/weight tracking

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (not yet implemented)

## Project Structure

```
src/
  types/workout.ts          # Core type definitions
  data/
    circuit-workouts.ts     # Athlean-X A/B workout definitions
    traditional-workouts.ts # Traditional workout definitions
  hooks/
    use-timer.ts            # Timer with speed multiplier for test mode
    use-audio.ts            # Web Audio API beeps
    use-local-storage.ts    # localStorage hook
  lib/
    supabase.ts             # Supabase client
    storage.ts              # Data persistence (Supabase + localStorage)
  components/
    workout-logger.tsx      # Main entry, mode selection
    circuit/                # Circuit workout components
    traditional/            # Traditional workout components
    shared/                 # Shared components
```

## Key Features

- **Test Mode**: 12x speed (click "Test" button) - 3 min combo becomes 15 sec
- **Audio Cues**: Beeps at minute marks, triple beep on completion
- **Load Metrics**: Track % of each minute worked (vs rested) per sub-exercise
- **Round Timer**: Continuous timer across all combos for performance tracking
- **Flexible Rounds**: Choose to continue or finish after each round

## Database Schema

Table: `workout_sessions`
- `id`: UUID primary key
- `user_id`: UUID (null until auth implemented)
- `mode`: 'circuit' | 'traditional'
- `workout_id`: string
- `variant`: 'A' | 'B'
- `started_at`: timestamp
- `completed_at`: timestamp
- `data`: JSONB (rounds/exercises data)

See `supabase/schema.sql` for full schema.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Next Steps

1. **Google Auth**: Add Supabase Auth with Google provider
2. **Calendar UI**: View workout history by date
3. **Statistics**: Performance trends over time
