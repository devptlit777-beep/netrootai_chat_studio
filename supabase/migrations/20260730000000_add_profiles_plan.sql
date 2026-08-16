-- Store subscription plan on the profile so the client can read it without JWT refresh.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

CREATE INDEX IF NOT EXISTS profiles_plan_idx ON profiles(plan);
