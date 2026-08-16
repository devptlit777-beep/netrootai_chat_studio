/*
Create user plugin settings table.

This table stores which plugins each user has enabled plus optional per-plugin config.
It supports the calculator and web search defaults and any future plugins.
*/

CREATE TABLE IF NOT EXISTS user_plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_plugins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_plugins" ON user_plugins;
CREATE POLICY "select_own_user_plugins" ON user_plugins FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_plugins" ON user_plugins;
CREATE POLICY "insert_own_user_plugins" ON user_plugins FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_plugins" ON user_plugins;
CREATE POLICY "update_own_user_plugins" ON user_plugins FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_plugins" ON user_plugins;
CREATE POLICY "delete_own_user_plugins" ON user_plugins FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP INDEX IF EXISTS user_plugins_user_plugin_uidx;
CREATE UNIQUE INDEX user_plugins_user_plugin_uidx ON user_plugins(user_id, plugin_id);
CREATE INDEX IF NOT EXISTS user_plugins_user_id_idx ON user_plugins(user_id);
