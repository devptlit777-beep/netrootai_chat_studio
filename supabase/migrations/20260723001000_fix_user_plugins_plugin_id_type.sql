/*
Fix the live user_plugins table to match the app's string plugin IDs.

Some deployments were created with plugin_id as uuid. The app uses string IDs
like "calculator" and "web-search", so this migration converts the column to text
and rebuilds the uniqueness constraint.
*/

DO $$
DECLARE
  plugin_id_attnum int;
  fk_rec record;
BEGIN
  IF to_regclass('public.user_plugins') IS NULL THEN
    RETURN;
  END IF;

  SELECT a.attnum
    INTO plugin_id_attnum
  FROM pg_attribute a
  WHERE a.attrelid = 'public.user_plugins'::regclass
    AND a.attname = 'plugin_id'
    AND NOT a.attisdropped;

  IF plugin_id_attnum IS NULL THEN
    RETURN;
  END IF;

  FOR fk_rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.user_plugins'::regclass
      AND contype = 'f'
      AND plugin_id_attnum = ANY (conkey)
  LOOP
    EXECUTE format('ALTER TABLE public.user_plugins DROP CONSTRAINT %I', fk_rec.conname);
  END LOOP;
END $$;

ALTER TABLE IF EXISTS public.user_plugins
  ALTER COLUMN plugin_id TYPE text USING plugin_id::text;

DROP INDEX IF EXISTS user_plugins_user_plugin_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS user_plugins_user_plugin_uidx
  ON public.user_plugins(user_id, plugin_id);

CREATE INDEX IF NOT EXISTS user_plugins_user_id_idx
  ON public.user_plugins(user_id);
