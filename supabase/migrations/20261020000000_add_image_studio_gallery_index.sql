CREATE INDEX IF NOT EXISTS image_studio_user_created_at_idx
  ON public.image_studio (user_id, created_at DESC);
