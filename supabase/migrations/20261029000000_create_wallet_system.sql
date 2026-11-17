-- 1. Add wallet_balance to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 5) NOT NULL DEFAULT 0.00000;

CREATE INDEX IF NOT EXISTS idx_profiles_wallet_balance ON profiles(wallet_balance);

-- 2. Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  type text NOT NULL, -- 'deposit' | 'usage_debit' | 'refund' | 'admin_adjustment'
  amount NUMERIC(10, 5) NOT NULL, -- positive for deposit/refund, negative for usage_debit
  balance_after NUMERIC(10, 5) NOT NULL,
  model text,
  tokens_total integer DEFAULT 0,
  base_cost NUMERIC(10, 5) DEFAULT 0,
  profit_usd NUMERIC(10, 5) DEFAULT 0,
  stripe_session_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_email ON wallet_transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

