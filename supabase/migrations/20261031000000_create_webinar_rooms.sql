CREATE TABLE IF NOT EXISTS webinar_rooms (
  room_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  room_type text NOT NULL CHECK (room_type IN ('meeting', 'webinar')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE webinar_rooms ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS webinar_rooms_host_user_id_idx
  ON webinar_rooms(host_user_id, created_at DESC);
