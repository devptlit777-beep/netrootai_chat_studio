-- Migration: 20261104100000_create_workspace_members_and_settings.sql
-- Description: Adds team member management and spending caps for NetRoot AI Enterprise Workspaces

-- 1. Alter public.workspaces to add budget and enterprise settings
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS monthly_budget_usd NUMERIC(10, 2) DEFAULT 250.00,
ADD COLUMN IF NOT EXISTS budget_alert_threshold INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS service_tier TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS disable_user_keys BOOLEAN DEFAULT false;

-- 2. Create workspace_members table for team RBAC
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
    invited_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy member lookups per workspace
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_email ON public.workspace_members(email);

