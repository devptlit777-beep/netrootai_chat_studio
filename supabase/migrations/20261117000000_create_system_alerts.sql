-- ============================================================
-- Migration: Create system_alerts table for OpenRouter & AI Infrastructure Realtime Notifications
-- ============================================================

create table if not exists system_alerts (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'OPENROUTER_ERROR', -- 'OPENROUTER_ERROR', 'RATE_LIMIT', 'LOW_BALANCE', 'MODEL_DOWN'
  severity    text not null default 'HIGH',             -- 'INFO', 'WARNING', 'HIGH', 'CRITICAL'
  status_code int,                                      -- e.g. 401, 402, 429, 503
  model       text,
  user_email  text,
  message     text not null,
  metadata    jsonb default '{}'::jsonb,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists system_alerts_created_at_idx on system_alerts (created_at desc);
create index if not exists system_alerts_is_read_idx    on system_alerts (is_read);

-- Allow service role full access
alter table system_alerts enable row level security;
create policy "service role full access to system_alerts" on system_alerts
  using (true) with check (true);

-- Enable Supabase Realtime for system_alerts so admin client gets instant push updates
alter publication supabase_realtime add table system_alerts;
