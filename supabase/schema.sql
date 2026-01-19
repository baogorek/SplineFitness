-- Workout sessions table
-- Stores all completed workouts (both circuit and traditional)

create table if not exists workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  mode text not null check (mode in ('circuit', 'traditional')),
  workout_id text not null,
  variant text not null check (variant in ('A', 'B')),
  started_at timestamptz not null,
  completed_at timestamptz,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- Index for querying by user
create index if not exists workout_sessions_user_id_idx on workout_sessions(user_id);

-- Index for querying by date
create index if not exists workout_sessions_completed_at_idx on workout_sessions(completed_at);

-- Enable Row Level Security
alter table workout_sessions enable row level security;

-- Policy: Users can only see their own workouts
create policy "Users can view own workouts"
  on workout_sessions for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own workouts
create policy "Users can insert own workouts"
  on workout_sessions for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own workouts
create policy "Users can update own workouts"
  on workout_sessions for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own workouts
create policy "Users can delete own workouts"
  on workout_sessions for delete
  using (auth.uid() = user_id);

-- Exercise preferences table
-- Stores per-user exercise settings (duration, default variation)

create table if not exists exercise_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  exercise_id text not null,
  duration_seconds integer not null default 60,
  default_variation text not null default 'standard'
    check (default_variation in ('easy', 'standard', 'advanced')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, exercise_id)
);

-- Index for querying by user
create index if not exists exercise_preferences_user_id_idx on exercise_preferences(user_id);

-- Enable Row Level Security
alter table exercise_preferences enable row level security;

-- Policy: Users can only see their own preferences
create policy "Users can view own preferences"
  on exercise_preferences for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
create policy "Users can insert own preferences"
  on exercise_preferences for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own preferences
create policy "Users can update own preferences"
  on exercise_preferences for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
create policy "Users can delete own preferences"
  on exercise_preferences for delete
  using (auth.uid() = user_id);
