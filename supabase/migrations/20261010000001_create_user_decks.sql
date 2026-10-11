CREATE TABLE IF NOT EXISTS user_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Presentation',
  slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme text NOT NULL DEFAULT 'midnight',
  seed_color text NOT NULL DEFAULT '#0EA5E9',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_decks" ON user_decks;
CREATE POLICY "select_own_user_decks" ON user_decks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_decks" ON user_decks;
CREATE POLICY "insert_own_user_decks" ON user_decks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_decks" ON user_decks;
CREATE POLICY "update_own_user_decks" ON user_decks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_decks" ON user_decks;
CREATE POLICY "delete_own_user_decks" ON user_decks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_decks_user_id_idx ON user_decks(user_id);
