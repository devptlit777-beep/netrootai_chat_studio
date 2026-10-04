-- Admin-managed feature overrides for users whose plan access has expired.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS feature_access jsonb NOT NULL DEFAULT '{}'::jsonb;