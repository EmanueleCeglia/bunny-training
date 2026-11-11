-- Her one-tap answer to "how did it feel?" after a workout.
-- Run once in the Supabase SQL editor. Safe to re-run.
alter table workouts
  add column if not exists feel text check (feel in ('easy', 'right', 'hard'));
