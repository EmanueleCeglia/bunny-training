-- Bunny Training — database schema
-- Run this once in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- A single day's training session.
create table if not exists workouts (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  workout_date  date        not null default current_date,
  location      text        not null check (location in ('gym', 'home')),
  duration_min  int         not null check (duration_min between 10 and 180),
  focus         text        not null check (focus in ('full_body', 'upper', 'lower')),
  difficulty    int         not null default 3 check (difficulty between 1 and 5),
  title         text        not null,
  summary       text,
  status        text        not null default 'planned' check (status in ('planned', 'completed')),
  completed_at  timestamptz,
  notes         text
);

create index if not exists workouts_date_idx on workouts (workout_date desc, created_at desc);

create table if not exists exercises (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references workouts (id) on delete cascade,
  position    int  not null,
  name        text not null,
  sets        int,
  reps        text,
  rest_sec    int,
  kind        text check (kind in ('machine', 'free_weight', 'bodyweight', 'cardio', 'stretch')),
  coach_note  text,
  done        boolean not null default false
);

create index if not exists exercises_workout_idx on exercises (workout_id, position);

-- Chat thread used to revise a workout, plus a record of difficulty changes.
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references workouts (id) on delete cascade,
  created_at  timestamptz not null default now(),
  role        text not null check (role in ('user', 'assistant')),
  content     text not null
);

create index if not exists messages_workout_idx on messages (workout_id, created_at);

-- Encouragement pool for the mystery box.
create table if not exists phrases (
  id         uuid primary key default gen_random_uuid(),
  body       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists unlocks (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null unique references workouts (id) on delete cascade,
  phrase_id   uuid not null references phrases (id),
  unlocked_at timestamptz not null default now()
);

-- The app authenticates with a passcode, not Supabase Auth, so every query runs
-- server-side under the service role. RLS on with no policies means a leaked
-- anon key reads nothing.
alter table workouts  enable row level security;
alter table exercises enable row level security;
alter table messages  enable row level security;
alter table phrases   enable row level security;
alter table unlocks   enable row level security;
