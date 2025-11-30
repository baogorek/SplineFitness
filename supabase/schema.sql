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
