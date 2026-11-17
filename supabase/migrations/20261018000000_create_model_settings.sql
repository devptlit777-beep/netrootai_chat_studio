CREATE TABLE IF NOT EXISTS model_settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT,
  provider TEXT,
  description TEXT,
  context_length INTEGER DEFAULT 0,
  modalities TEXT[] DEFAULT ARRAY['text']::TEXT[],
  is_free BOOLEAN DEFAULT false,
  base_pricing JSONB DEFAULT '{}'::JSONB,
  calculated_pricing JSONB DEFAULT '{}'::JSONB,
  benchmarks JSONB DEFAULT '{}'::JSONB,
  uptime_pct NUMERIC DEFAULT 99.5,
  custom_badge TEXT,
  badge_override BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  min_plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries and filtering
CREATE INDEX IF NOT EXISTS idx_model_settings_visible ON model_settings(is_visible);
CREATE INDEX IF NOT EXISTS idx_model_settings_featured ON model_settings(is_featured);
CREATE INDEX IF NOT EXISTS idx_model_settings_provider ON model_settings(provider);
CREATE INDEX IF NOT EXISTS idx_model_settings_min_plan ON model_settings(min_plan);

-- Enable RLS
ALTER TABLE model_settings ENABLE ROW LEVEL SECURITY;

-- Read policy: Anyone (authenticated & anonymous) can view visible models
DROP POLICY IF EXISTS "allow_read_visible_models" ON model_settings;
CREATE POLICY "allow_read_visible_models" ON model_settings FOR SELECT
  USING (true);

-- Admin/Service role can manage all
DROP POLICY IF EXISTS "service_role_manage_models" ON model_settings;
CREATE POLICY "service_role_manage_models" ON model_settings FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read_platform_settings" ON platform_settings;
CREATE POLICY "allow_read_platform_settings" ON platform_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "service_role_manage_settings" ON platform_settings;
CREATE POLICY "service_role_manage_settings" ON platform_settings FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Seed default global margin percentage (20%)
INSERT INTO platform_settings (key, value)
VALUES (
  'models_config',
  '{"global_margin_percentage": 20, "auto_sync": true, "last_synced_at": null}'::JSONB
)
ON CONFLICT (key) DO NOTHING;
