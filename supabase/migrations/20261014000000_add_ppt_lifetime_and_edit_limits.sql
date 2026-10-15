-- Add lifetime PPT generation counter to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS lifetime_ppt_count integer NOT NULL DEFAULT 0;

-- Add AI edits counter to user_decks (for per-deck AI edits limit)
ALTER TABLE user_decks
  ADD COLUMN IF NOT EXISTS ai_edits_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS profiles_lifetime_ppt_idx ON profiles(lifetime_ppt_count);
