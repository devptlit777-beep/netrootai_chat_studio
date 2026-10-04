-- Keep the Stripe renewal preference alongside each user's plan period.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS subscriptions_current_period_end_idx
  ON subscriptions(current_period_end);
