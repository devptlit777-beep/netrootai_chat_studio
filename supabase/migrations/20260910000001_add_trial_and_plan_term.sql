-- Every new account receives one calendar month of free access from signup.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS free_trial_ends_at timestamptz;

UPDATE profiles
SET free_trial_ends_at = COALESCE(created_at, now()) + interval '1 month'
WHERE free_trial_ends_at IS NULL;

ALTER TABLE profiles
  ALTER COLUMN free_trial_ends_at SET DEFAULT (now() + interval '1 month');

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS interval_months integer NOT NULL DEFAULT 1;

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_interval_months_check;
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_interval_months_check CHECK (interval_months BETWEEN 1 AND 12);
